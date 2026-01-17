
import { STAGES } from '../constants';
import { MarketData, TimeframeAnalysis, Asset, CurrencyCode, AssetType, TimeRange, FibonacciLevels } from '../types';

// --- CONFIGURATION ---

const BINANCE_HOSTS = [
  'https://data-api.binance.vision/api/v3', // Primary: Reliable, public data
  'https://api.binance.com/api/v3'          // Fallback: Standard endpoint
];

const YAHOO_BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart';
const YAHOO_SEARCH_URL = 'https://query2.finance.yahoo.com/v1/finance/search';
const SHEET_ID = '1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII';

// Dictionary of common crypto names to avoid symbol repetition
const CRYPTO_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'BNB': 'Binance Coin',
  'SOL': 'Solana',
  'XRP': 'Ripple',
  'ADA': 'Cardano',
  'AVAX': 'Avalanche',
  'DOGE': 'Dogecoin',
  'DOT': 'Polkadot',
  'MATIC': 'Polygon',
  'SHIB': 'Shiba Inu',
  'TRX': 'TRON',
  'LTC': 'Litecoin',
  'BCH': 'Bitcoin Cash',
  'UNI': 'Uniswap',
  'LINK': 'Chainlink',
  'ATOM': 'Cosmos',
  'XMR': 'Monero',
  'ETC': 'Ethereum Classic',
  'XLM': 'Stellar',
  'AAVE': 'Aave',
  'JUP': 'Jupiter',
  'ZEC': 'ZCash',
};

// --- CACHING SYSTEM ---

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 1 minute cache
const historyCache = new Map<string, CacheItem<HistoryPoint[]>>();
const marketDataCache = new Map<string, CacheItem<MarketData>>();

// --- PROXY UTILS ---

/**
 * Tries to fetch a URL using multiple CORS proxies to ensure reliability.
 */
const fetchWithProxy = async (targetUrl: string): Promise<any> => {
    const proxies = [
        {
            name: 'CorsProxy',
            url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            extract: (json: any) => json
        },
        {
            name: 'CodeTabs',
            url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
            extract: (json: any) => json
        },
        {
            name: 'AllOrigins',
            url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
            extract: (json: any) => {
                if (json.contents) {
                    try { return JSON.parse(json.contents); } catch(e) { return null; }
                }
                return null;
            }
        }
    ];

    for (const p of proxies) {
        try {
            const res = await fetch(p.url(targetUrl), { cache: 'no-store' });
            if (!res.ok) continue;
            
            const rawJson = await res.json();
            const data = p.extract(rawJson);
            
            // Check if it's chart data or search data
            if (data?.chart?.result?.[0]?.timestamp?.length > 0 || data?.quotes?.length >= 0 || data?.feed) {
                return data;
            }
            // For Google Sheets CSV response handled elsewhere or specific json
            if (targetUrl.includes('google') && data) return data;

        } catch (e) {
            console.warn(`Proxy ${p.name} failed or returned invalid data, trying next...`);
        }
    }
    throw new Error('Unable to fetch valid data via any proxy.');
};

// --- TECHNICAL ANALYSIS UTILS ---

const calculateMA = (closes: number[], period = 20): number | null => {
  if (closes.length < period) return null;
  const slice = closes.slice(closes.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

const calculateRSI = (closes: number[], period = 14): number => {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

const determineCriptoGoStage = (price: number, ma20: number, prevMa20: number): number => {
  const slope = ma20 - prevMa20;
  const slopeThreshold = ma20 * 0.0005;
  if (slope > slopeThreshold && price > ma20) return 2;
  if (slope < -slopeThreshold && price < ma20) return 4;
  if (Math.abs(slope) < slopeThreshold) return 1;
  return 3;
};

const calculatePivots = (high: number, low: number, close: number) => {
  const pp = (high + low + close) / 3;
  const s1 = (2 * pp) - high;
  const r1 = (2 * pp) - low;
  return { s1, r1 };
};

const calculateFibonacci = (high: number, low: number): FibonacciLevels => {
    const diff = high - low;
    return {
        f236: high - (diff * 0.236),
        f382: high - (diff * 0.382),
        f500: high - (diff * 0.500),
        f618: high - (diff * 0.618),
        f786: high - (diff * 0.786)
    };
};

const analyzeTimeframeSeries = (candlesData: any[]): TimeframeAnalysis | null => {
  if (!Array.isArray(candlesData) || candlesData.length < 25) return null;
  const closes = candlesData.map(c => parseFloat(c[4]));
  const currentPrice = parseFloat(candlesData[candlesData.length - 1][4]);
  const ma20 = calculateMA(closes, 20);
  const prevMa20 = calculateMA(closes.slice(0, closes.length - 1), 20);
  const rsi = calculateRSI(closes, 14);
  if (ma20 === null || prevMa20 === null) return null;
  const stageId = determineCriptoGoStage(currentPrice, ma20, prevMa20);
  
  // Previous candle for Pivots and Fibonacci
  const prevCandle = candlesData[candlesData.length - 2];
  const pHigh = parseFloat(prevCandle[2]);
  const pLow = parseFloat(prevCandle[3]);
  const pClose = parseFloat(prevCandle[4]);
  
  const pivots = calculatePivots(pHigh, pLow, pClose);
  const fibonacci = calculateFibonacci(pHigh, pLow);

  return { 
    price: currentPrice, 
    ma20, 
    rsi, 
    stage: STAGES[stageId], 
    pivots,
    fibonacci 
  };
};

// --- DATA FETCHING ---

const fetchWithFallback = async (endpoint: string, params: string) => {
    for (const host of BINANCE_HOSTS) {
        try {
            const url = `${host}${endpoint}?${params}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) return await res.json();
            if (res.status === 400 || res.status === 404) throw new Error('Symbol not found');
        } catch (e) {
            console.warn(`Failed to fetch from ${host}`);
            continue;
        }
    }
    throw new Error('All Binance endpoints failed');
};

const fetchCryptoData = async (symbol: string): Promise<MarketData> => {
    const symbolPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
    const [dData, wData, mData] = await Promise.all([
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&limit=60`),
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1w&limit=60`),
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1M&limit=60`)
    ]);
    const daily = analyzeTimeframeSeries(dData);
    const weekly = analyzeTimeframeSeries(wData);
    const monthly = analyzeTimeframeSeries(mData);
    if (!daily) throw new Error('Datos insuficientes (Crypto)');
    return { daily, weekly, monthly };
};

const fetchYahooData = async (symbol: string): Promise<MarketData> => {
    const fetchYahooFrame = async (interval: string, range: string) => {
        const cacheBuster = Math.floor(Date.now() / 30000);
        const targetUrl = `${YAHOO_BASE_URL}/${symbol}?interval=${interval}&range=${range}&events=history&includeAdjustedClose=true&_=${cacheBuster}`;
        try {
            const json = await fetchWithProxy(targetUrl);
            const result = json?.chart?.result?.[0];
            if (!result) return [];
            const quotes = result.indicators?.quote?.[0];
            const timestamps = result.timestamp;
            if (!quotes || !timestamps || !quotes.close || quotes.close.length === 0) return [];
            const cleanData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (timestamps[i] && quotes.open[i] != null && quotes.high[i] != null && quotes.low[i] != null && quotes.close[i] != null) {
                    cleanData.push([timestamps[i] * 1000, quotes.open[i], quotes.high[i], quotes.low[i], quotes.close[i], quotes.volume?.[i] || 0]);
                }
            }
            return cleanData;
        } catch (e) {
            console.error(`Error fetching Yahoo frame ${interval}:`, e);
            return [];
        }
    };
    const [dData, wData, mData] = await Promise.all([
        fetchYahooFrame('1d', '6mo'), 
        fetchYahooFrame('1wk', '2y'),
        fetchYahooFrame('1mo', '5y')
    ]);
    const daily = analyzeTimeframeSeries(dData);
    const weekly = analyzeTimeframeSeries(wData);
    const monthly = analyzeTimeframeSeries(mData);
    if (!daily) throw new Error('Datos insuficientes (Stock)');
    return { daily, weekly, monthly };
};

// --- PUBLIC FACING METHODS ---

export const fetchAssetData = async (symbol: string, type: AssetType = 'CRYPTO'): Promise<MarketData> => {
    const cacheKey = `${symbol}-${type}-market`;
    const cached = marketDataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    const data = (type === 'STOCK') ? await fetchYahooData(symbol) : await fetchCryptoData(symbol);
    
    marketDataCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
};

export interface HistoryPoint {
  time: number;
  close: number;
}

export const fetchHistoricalSeries = async (symbol: string, type: AssetType, range: TimeRange | number): Promise<HistoryPoint[]> => {
    const cacheKey = `${symbol}-${type}-history-${range}`;
    const cached = historyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    try {
        let data: HistoryPoint[] = [];
        let yRange = '1mo', yInterval = '1d', bInterval = '1d', bLimit = 30;
        if (typeof range === 'number') {
            if (range <= 7) { yRange = '5d'; yInterval='15m'; bInterval='1h'; bLimit = range * 24; }
            else if (range <= 31) { yRange = '1mo'; yInterval='1d'; bInterval='1d'; bLimit = range; }
            else { yRange = '1y'; yInterval='1d'; bInterval='1d'; bLimit = Math.min(range, 1000); }
        } else {
            switch(range) {
                case '1H': yRange = '1d'; yInterval = '2m'; bInterval = '5m'; bLimit = 12; break;
                case '1D': yRange = '1d'; yInterval = '15m'; bInterval = '30m'; bLimit = 48; break;
                case '1W': yRange = '5d'; yInterval = '1h'; bInterval = '4h'; bLimit = 42; break;
                case '1M': yRange = '1mo'; yInterval = '1d'; bInterval = '1d'; bLimit = 30; break;
                case '3M': yRange = '3mo'; yInterval = '1d'; bInterval = '1d'; bLimit = 90; break;
                case 'YTD': 
                    yRange = 'ytd'; yInterval = '1d';
                    const diffDays = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
                    bInterval = '1d'; bLimit = diffDays;
                    break;
                case '1Y': yRange = '1y'; yInterval = '1d'; bInterval = '1d'; bLimit = 365; break;
                case 'MAX': yRange = 'max'; yInterval = '1mo'; bInterval = '1M'; bLimit = 60; break;
                default: yRange = '1mo'; yInterval = '1d'; bInterval = '1d'; bLimit = 30;
            }
        }
        if (type === 'STOCK') {
            const cacheBuster = Math.floor(Date.now() / 30000);
            const targetUrl = `${YAHOO_BASE_URL}/${symbol}?interval=${yInterval}&range=${yRange}&events=history&includeAdjustedClose=true&_=${cacheBuster}`;
            const json = await fetchWithProxy(targetUrl);
            const result = json?.chart?.result?.[0];
            if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) return [];
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;
            const oneHourAgo = (Date.now() / 1000) - 3600;
            for(let i=0; i<timestamps.length; i++) {
                if(timestamps[i] && closes[i] !== null) {
                    if (range === '1H' && timestamps[i] < oneHourAgo) continue;
                    data.push({ time: timestamps[i] * 1000, close: closes[i] });
                }
            }
        } else {
            const symbolPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
            // SE CORRIGE: interval=${bInterval} en lugar de 1bInterval
            const rawData = await fetchWithFallback('/klines', `symbol=${symbolPair}&interval=${bInterval}&limit=${bLimit}`);
            data = rawData.map((c: any) => ({ time: c[0], close: parseFloat(c[4]) }));
        }

        historyCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;

    } catch (e) {
        console.warn(`Failed to fetch history for ${symbol}`, e);
        return [];
    }
};

/**
 * Fetches real verified historical price at a specific date.
 */
export const fetchPriceAtDate = async (symbol: string, type: AssetType, date: string): Promise<number | null> => {
    try {
        const timestamp = new Date(date).getTime();
        if (isNaN(timestamp)) return null;

        if (type === 'STOCK') {
            const period1 = Math.floor(timestamp / 1000);
            const period2 = period1 + 86400; // 24 hours later
            const url = `${YAHOO_BASE_URL}/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
            const json = await fetchWithProxy(url);
            const close = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];
            return close || null;
        } else {
            const symbolPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
            // Binance /klines uses ms. We seek the first daily candle after the timestamp.
            const rawData = await fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&startTime=${timestamp}&limit=1`);
            if (rawData && rawData.length > 0) {
                return parseFloat(rawData[0][4]); // Daily close
            }
        }
    } catch (e) {
        console.error("Error fetching historical price", e);
    }
    return null;
};

const checkBinance = async (cleanInput: string): Promise<Asset | null> => {
    try {
        const symbolPair = `${cleanInput}USDT`;
        await fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&limit=1`);
        // Use dictionary for common names, fallback to ticker
        return { symbol: cleanInput, name: CRYPTO_NAMES[cleanInput] || cleanInput, type: 'CRYPTO' };
    } catch (e) { return null; }
};

const checkYahoo = async (cleanInput: string): Promise<Asset | null> => {
    try {
        const cacheBuster = Math.floor(Date.now() / 60000);
        const targetUrl = `${YAHOO_BASE_URL}/${cleanInput}?interval=1d&range=1d&_=${cacheBuster}`;
        const json = await fetchWithProxy(targetUrl);
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta) {
            const shortName = meta.shortName || meta.longName || cleanInput;
            const displayName = shortName.replace(/, Inc\.| Inc\.| Corporation| Corp\.|, L.P.| Limited/gi, '');
            return { symbol: cleanInput, name: displayName, type: 'STOCK' };
        }
    } catch (e) { /* ignore */ }
    return null;
};

/**
 * Searches for an asset by name or symbol using Yahoo Search API.
 */
const searchGlobalAsset = async (query: string): Promise<Asset | null> => {
    try {
        const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
        const json = await fetchWithProxy(url);
        const quotes = json?.quotes;
        
        if (quotes && quotes.length > 0) {
            // Pick the most relevant quote
            const best = quotes[0];
            const symbol = best.symbol;
            const name = best.shortname || best.longname || symbol;
            const cleanName = name.replace(/, Inc\.| Inc\.| Corporation| Corp\.|, L.P.| Limited/gi, '');

            // Determine type
            if (best.quoteType === 'CRYPTO') {
                // For crypto found in Yahoo, try to get the base ticker for Binance (e.g., BTC-USD -> BTC)
                const baseTicker = symbol.split('-')[0].toUpperCase();
                const binanceValid = await checkBinance(baseTicker);
                if (binanceValid) return binanceValid;
                
                // If not in binance, keep yahoo data as STOCK/INDEX for now or try to fetch it
                return { symbol: symbol, name: cleanName, type: 'STOCK' };
            }

            return { symbol: symbol, name: cleanName, type: 'STOCK' };
        }
    } catch (e) {
        console.warn("Global search failed", e);
    }
    return null;
};

/**
 * NEW: Smart Resolver.
 * First tries direct Ticker lookup, then semantic Search.
 */
export const resolveAsset = async (input: string): Promise<Asset | null> => {
  if (!input) return null;
  const cleanInput = input.toUpperCase().trim();
  
  // 1. Try Direct Crypto Ticker (Binance)
  const crypto = await checkBinance(cleanInput);
  if (crypto) return crypto;

  // 2. Try Direct Stock Ticker (Yahoo)
  const stock = await checkYahoo(cleanInput);
  if (stock) return stock;

  // 3. Fallback: Search by Name/Query (Yahoo Search API)
  const searchResult = await searchGlobalAsset(input);
  if (searchResult) return searchResult;

  return null;
};

export const fetchExchangeRates = async (): Promise<Record<CurrencyCode, number>> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur,jpy,btc,eth');
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data || !data.tether) throw new Error('Invalid rate format');
    const rates = data.tether;
    return { USD: 1, EUR: rates.eur || 0.92, JPY: rates.jpy || 150, BTC: rates.btc || 0.000015, ETH: rates.eth || 0.00035 };
  } catch (e) {
    console.warn("Error fetching rates", e);
    return { USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 };
  }
};

/**
 * Fetches initial asset list from Google Sheet (Acciones Tab)
 */
export const fetchAssetsFromSheet = async (): Promise<Asset[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Acciones`;
        const res = await fetch(url);
        if(!res.ok) {
            // Fallback via proxy
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const proxyRes = await fetch(proxyUrl);
            if(!proxyRes.ok) throw new Error("Sheet unreachable");
            return parseCsvAssets(await proxyRes.text());
        }
        return parseCsvAssets(await res.text());
    } catch (e) {
        console.warn("Failed to fetch assets from sheet", e);
        return [];
    }
};

const parseCsvAssets = (csvText: string): Asset[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    const assets: Asset[] = [];
    
    // Simple CSV parser assuming columns: Symbol, Name, Type (optional)
    // Skipping header if present (detection by checking common headers)
    const startIndex = (lines[0].toLowerCase().includes('symbol') || lines[0].toLowerCase().includes('simbolo')) ? 1 : 0;

    for(let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if(parts.length >= 2) {
            const symbol = parts[0];
            const name = parts[1];
            const rawType = parts[2] ? parts[2].toUpperCase() : 'CRYPTO';
            const type: AssetType = (rawType.includes('STOCK') || rawType.includes('BOLSA')) ? 'STOCK' : 'CRYPTO';
            
            if(symbol && name) {
                assets.push({ symbol, name, type });
            }
        }
    }
    return assets;
}
