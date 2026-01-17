
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, Calendar, CalendarDays, CalendarRange, Sparkles, Users, LineChart, Loader2, Zap, ArrowUpToLine, ArrowDownToLine, ChevronLeft, ChevronRight, X, Building2, Lock, Star, Activity, Waves, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Asset, MarketData, TimeframeAnalysis, CurrencyCode, Pivots, FibonacciLevels, AssetType } from '../types';
import { CURRENCIES } from '../constants';
import { fetchAssetData } from '../services/market';
import { generateGeminiContent } from '../services/gemini';
import FundamentalModal from './FundamentalModal';
import ProfilesModal from './ProfilesModal';
import ChartModal from './ChartModal';
import MA20Modal from './MA20Modal';
import RSIModal from './RSIModal';
import PivotsModal from './PivotsModal';
import FibonacciModal from './FibonacciModal';

interface Props {
  asset: Asset;
  index: number;
  total: number;
  refreshTrigger: number;
  currency: CurrencyCode;
  rate: number;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  onAddToPortfolio: (symbol: string, type: AssetType) => void;
  isFixed?: boolean;
  apiKey: string;
  onRequireKey: () => void;
}

const PhaseBadge: React.FC<{ 
    label: string; 
    analysis: TimeframeAnalysis | null; 
    icon: React.ElementType; 
    currency: CurrencyCode; 
    rate: number;
    onRsiClick: (val: number, label: string) => void;
    onPivotsClick: (pivots: Pivots, label: string) => void;
    onFibClick: (levels: FibonacciLevels, label: string) => void;
    isLarge?: boolean;
}> = ({ label, analysis, icon: Icon, currency, rate, onRsiClick, onPivotsClick, onFibClick, isLarge }) => {
    if (!analysis) return <div className={`flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-100 min-h-[145px] ${isLarge ? 'h-full' : 'w-full'}`}><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</span><div className="text-gray-200 mt-2 font-mono text-[10px]">N/A</div></div>;
    
    const S = analysis.stage;
    if (!S || !S.icon) return <div className="text-xs text-gray-400">Err</div>;

    const StatusIcon = S.icon;
    const { pivots, rsi, fibonacci, price } = analysis;
    const curConf = CURRENCIES[currency];
    const isAboveGolden = price >= fibonacci.f618;

    const formatPrice = (val: number) => {
       const converted = val * rate;
       const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
       return converted.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    if (isLarge) {
        return (
            <div className={`flex flex-col p-5 md:p-8 rounded-[32px] border-4 ${S.bg} flex-1 transition-all shadow-xl`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Icon size={20} className="text-gray-400" />
                        <span className="text-lg font-black uppercase tracking-tighter text-gray-500">{label}</span>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-black/5">
                        <span className={`text-lg font-black ${S.color}`}>{S.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-1 mb-1">
                    <StatusIcon size={28} className={S.color} />
                    <span className={`text-2xl font-black ${S.color}`}>{S.name}</span>
                </div>
                <div className={`text-sm font-bold mb-4 ${S.color} opacity-80 uppercase tracking-widest`}>{S.action}</div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div 
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${rsi >= 70 || rsi <= 30 ? (rsi >= 70 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100') : 'bg-gray-50 border-gray-100'} cursor-pointer transition-transform hover:scale-105`}
                        onClick={(e) => { e.stopPropagation(); onRsiClick(rsi, label); }}
                    >
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={12}/> RSI</span>
                        <span className={`text-xl font-black ${rsi >= 70 ? 'text-red-600' : (rsi <= 30 ? 'text-emerald-600' : 'text-gray-500')}`}>{rsi.toFixed(1)}</span>
                    </div>
                    <div 
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border bg-indigo-50 border-indigo-100 cursor-pointer transition-transform hover:scale-105 relative overflow-hidden`}
                        onClick={(e) => { e.stopPropagation(); onFibClick(fibonacci, label); }}
                    >
                        <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Waves size={12}/> Golden</span>
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${isAboveGolden ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                {isAboveGolden ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                                {isAboveGolden ? 'Sop' : 'Res'}
                            </div>
                        </div>
                        <span className={`text-xl font-black text-indigo-700`}>{fibonacci.f618.toLocaleString(undefined, { maximumFractionDigits: curConf.isCrypto ? 4 : 2 })}</span>
                    </div>
                </div>

                <div className="pt-4 border-t-2 border-black/5 space-y-2 cursor-help hover:bg-black/5 rounded-2xl p-2 transition-colors" onClick={(e) => { e.stopPropagation(); onPivotsClick(pivots, label); }}>
                     <div className="flex justify-between items-center">
                        <span className="text-red-700 font-bold flex items-center gap-2 text-xs"><ArrowUpToLine size={14}/> R1</span>
                        <span className="font-mono font-black text-gray-900 text-lg">{formatPrice(pivots.r1)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-bold flex items-center gap-2 text-xs"><ArrowDownToLine size={14}/> S1</span>
                        <span className="font-mono font-black text-gray-900 text-lg">{formatPrice(pivots.s1)}</span>
                     </div>
                </div>
            </div>
        );
    }

    return (
      <div className={`flex flex-col p-2 rounded-xl border ${S.bg} w-full transition-all hover:scale-[1.02] cursor-default hover:shadow-md group relative min-h-[145px] overflow-hidden`}>
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1"><Icon size={12} className="text-gray-400" /><span className="text-[9px] font-bold uppercase text-gray-400 truncate">{label}</span></div>
            <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm border border-black/5 shrink-0`}><span className={`text-[10px] font-black ${S.color}`}>{S.id}</span></div>
        </div>
        <div className="flex items-center gap-1 mt-0.5 mb-0.5"><StatusIcon size={14} className={S.color} /><span className={`text-xs font-black ${S.color} truncate`}>{S.name}</span></div>
        <div className={`text-[9px] font-bold mb-1 ${S.color} opacity-80 uppercase tracking-tight`}>{S.action}</div>
        
        <div className="flex gap-1 mb-1.5">
            <div 
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg border ${rsi >= 70 || rsi <= 30 ? (rsi >= 70 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100') : 'bg-gray-50 border-gray-100'} cursor-pointer transition-colors group/rsi`}
                onClick={(e) => { e.stopPropagation(); onRsiClick(rsi, label); }}
            >
                <span className="text-[8px] font-black text-gray-400 group-hover/rsi:text-gray-600 leading-none">RSI</span>
                <span className={`text-[10px] font-black ${rsi >= 70 ? 'text-red-600' : (rsi <= 30 ? 'text-emerald-600' : 'text-gray-500')}`}>{rsi.toFixed(1)}</span>
            </div>
            <div 
                className={`flex-1 flex items-center justify-center p-1 rounded-lg border bg-indigo-50 border-indigo-100 cursor-pointer group/fib relative`}
                onClick={(e) => { e.stopPropagation(); onFibClick(fibonacci, label); }}
            >
                <div className="relative">
                    <Waves size={10} className="text-indigo-400 group-hover/fib:text-indigo-600" />
                    <div className={`absolute -top-1 -right-2 transition-transform duration-500 ${isAboveGolden ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isAboveGolden ? <TrendingUp size={8} strokeWidth={4} /> : <TrendingDown size={8} strokeWidth={4} />}
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-1 border-t border-black/5 space-y-0.5 cursor-help hover:bg-black/5 rounded-lg p-1 transition-colors" onClick={(e) => { e.stopPropagation(); onPivotsClick(pivots, label); }}>
             <div className="flex justify-between items-center text-[8px]">
                <span className="text-red-700 font-bold flex items-center gap-0.5"><ArrowUpToLine size={8}/> R1</span>
                <span className="font-mono font-black text-gray-900 truncate ml-1">{formatPrice(pivots.r1)}</span>
             </div>
             <div className="flex justify-between items-center text-[8px]">
                <span className="text-gray-400 font-bold flex items-center gap-0.5"><ArrowDownToLine size={8}/> S1</span>
                <span className="font-mono font-black text-gray-900 truncate ml-1">{formatPrice(pivots.s1)}</span>
             </div>
        </div>
      </div>
    );
};

const AssetCard: React.FC<Props> = ({ asset, onDelete, onToggleFavorite, refreshTrigger, onMove, index, total, currency, rate, onAddToPortfolio, isFixed = false, apiKey, onRequireKey }) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [matrixInsight, setMatrixInsight] = useState<string | null>(null); 
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showFundamental, setShowFundamental] = useState(false); 
  const [showMA20, setShowMA20] = useState(false);
  const [rsiModalData, setRsiModalData] = useState<{value: number, timeframe: string} | null>(null);
  const [pivotsModalData, setPivotsModalData] = useState<{pivots: Pivots, timeframe: string} | null>(null);
  const [fibModalData, setFibModalData] = useState<{levels: FibonacciLevels, timeframe: string} | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async (useCache: boolean) => {
    setLoading(true); setError(null);
    try {
        const marketData = await fetchAssetData(asset.symbol, asset.type);
        if (isMounted.current) setData(marketData);
    } catch (err) { 
        if (isMounted.current) setError('Error de datos'); 
    } finally { 
        if (isMounted.current) setLoading(false); 
    }
  };

  useEffect(() => { fetchData(true); }, [asset.symbol, asset.type]);
  useEffect(() => { if (refreshTrigger > 0) fetchData(false); }, [refreshTrigger]);

  const callGeminiOracle = async () => { 
    if (!apiKey) { onRequireKey(); return; }
    if (!data) return;
    setAiLoading(true);
    try {
        const prompt = `Analiza ${asset.symbol}. Datos: P:${data.daily.price}, RSI:${data.daily.rsi.toFixed(1)}. Max 50 palabras. Sin Markdown.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) {
            setAiAnalysis(text);
        }
    } finally { if (isMounted.current) setAiLoading(false); }
  };

  const getMatrixInsight = async () => {
    if (!apiKey) { onRequireKey(); return; }
    if (!data) return;
    setMatrixLoading(true);
    try {
        const prompt = `Resume riesgo/oportunidad para ${asset.symbol} en una frase.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setMatrixInsight(text);
    } finally { if (isMounted.current) setMatrixLoading(false); }
  };

  const handleOpenFundamental = () => {
      if (!apiKey) { onRequireKey(); return; }
      setShowFundamental(true);
  };

  const handleOpenProfiles = () => {
      if (!apiKey) { onRequireKey(); return; }
      setShowProfiles(true);
  };

  const handleRsiClick = (val: number | undefined, label: string) => {
      if (val !== undefined) setRsiModalData({ value: val, timeframe: label });
  };

  const handlePivotsClick = (pivots: Pivots, label: string) => {
      setPivotsModalData({ pivots, timeframe: label });
  };

  const handleFibClick = (levels: FibonacciLevels, label: string) => {
      setFibModalData({ levels, timeframe: label });
  };

  if (loading) return <div id={`asset-card-${asset.symbol}`} className="p-6 rounded-lg border border-gray-200 bg-white animate-pulse h-64" />;
  if (error || !data) return <div id={`asset-card-${asset.symbol}`} className="p-4 rounded-lg border border-red-200 bg-red-50 flex justify-between items-center"><span className="font-bold text-red-900">{asset.symbol} - Error de datos</span><button onClick={() => onDelete(asset.symbol)} className="text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button></div>;

  const { daily, weekly, monthly } = data;
  const dist = daily.ma20 ? ((daily.price - daily.ma20) / daily.ma20) * 100 : 0;
  const curConf = CURRENCIES[currency];
  const convertedPrice = daily.price * rate;
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  const formatPriceFull = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits });

  const ticker = asset.symbol;
  const aiPrompt = encodeURIComponent(`Analiza de forma experta el activo ${asset.symbol} (${asset.name}). Proporciona un diagnóstico técnico y fundamental detallado.`);

  const cmcUrl = asset.type === 'STOCK' 
    ? `https://coinmarketcap.com/search/?q=${ticker}` 
    : `https://coinmarketcap.com/currencies/${asset.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}/`;

  const cardContent = (isLarge: boolean) => (
    <div 
      id={`asset-card-${asset.symbol}`}
      className={`${isLarge ? 'p-8 md:p-12' : 'p-5'} rounded-[2rem] border ${asset.isFavorite ? 'border-gray-900 ring-1 ring-gray-100' : 'border-gray-200'} bg-white shadow-sm transition-all relative overflow-hidden h-full flex flex-col scroll-mt-32`}
    >
      <div className={`flex justify-between items-start ${isLarge ? 'mb-8' : 'mb-4'}`}>
        <div className="cursor-pointer group" onClick={() => setIsZoomed(isLarge ? false : true)}>
          <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.symbol); }} className={`transition-colors ${asset.isFavorite ? 'text-gray-900' : 'text-gray-200'} ${isLarge ? 'scale-125 mr-4' : ''}`}><Star size={isLarge ? 24 : 18} fill={asset.isFavorite ? "currentColor" : "none"} /></button>
              <div className="flex items-center gap-2">
                <h3 className={`${isLarge ? 'text-3xl md:text-5xl' : 'text-xl'} font-black text-gray-900 group-hover:underline`}>{asset.symbol}</h3>
                <span className={`${isLarge ? 'text-sm md:text-base px-3 py-1' : 'text-[9px] px-1.5 py-0.5'} bg-gray-50 text-gray-400 border border-gray-100 rounded font-mono uppercase tracking-tighter`}>{asset.type === 'STOCK' ? 'YAHOO' : 'BINANCE'}</span>
              </div>
          </div>
          <p className={`${isLarge ? 'text-xl mt-2 ml-10 md:ml-12' : 'text-[10px] mt-1 ml-6'} font-black text-gray-400 uppercase tracking-widest`}>{asset.name}</p>
        </div>
        <div className="text-right">
          <p className={`${isLarge ? 'text-3xl md:text-5xl' : 'text-xl'} font-mono font-black text-gray-900 tracking-tighter`}>{formatPriceFull(convertedPrice)}</p>
          <p onClick={() => setShowMA20(true)} className={`${isLarge ? 'text-lg mt-2' : 'text-[10px] mt-1'} font-black ${dist >= 0 ? 'text-red-700' : 'text-emerald-700'} cursor-help hover:underline uppercase tracking-widest`}>{dist > 0 ? '▲' : '▼'} {Math.abs(dist).toFixed(2)}% vs MA20</p>
        </div>
      </div>

      <div className={`${isLarge ? 'mb-6' : 'mb-3'} flex-1 flex flex-col`}>
        <div className={`flex justify-between items-end ${isLarge ? 'mb-4' : 'mb-2'}`}>
           <p className={`${isLarge ? 'text-base md:text-lg' : 'text-[10px]'} font-black text-gray-400 uppercase tracking-[0.2em]`}>Multi-Timeframe</p>
           {!isLarge && (
             <button onClick={(e) => { e.stopPropagation(); setShowChart(true); }} className="text-[10px] flex items-center gap-1 text-gray-900 hover:text-black font-black bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200 shadow-sm transition-all active:scale-95">
                <LineChart size={10} className="text-red-700"/> GRÁFICO
             </button>
           )}
        </div>
        
        <div className="w-full space-y-4">
            <div className={`grid ${isLarge ? 'grid-cols-3 gap-4 md:gap-6' : 'grid-cols-3 gap-2'}`}>
                <PhaseBadge label="Diario" isLarge={isLarge} analysis={daily} icon={Calendar} currency={currency} rate={rate} onRsiClick={handleRsiClick} onPivotsClick={handlePivotsClick} onFibClick={handleFibClick} />
                <PhaseBadge label="Semanal" isLarge={isLarge} analysis={weekly} icon={CalendarDays} currency={currency} rate={rate} onRsiClick={handleRsiClick} onPivotsClick={handlePivotsClick} onFibClick={handleFibClick} />
                <PhaseBadge label="Mensual" isLarge={isLarge} analysis={monthly} icon={CalendarRange} currency={currency} rate={rate} onRsiClick={handleRsiClick} onPivotsClick={handlePivotsClick} onFibClick={handleFibClick} />
            </div>
            
            {!isLarge && (
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={callGeminiOracle} disabled={aiLoading} className="py-2.5 rounded-xl bg-slate-950 text-white text-[9px] font-black flex justify-center items-center gap-1.5 uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Oráculo
                  </button>
                  <button onClick={getMatrixInsight} disabled={matrixLoading} className="py-2.5 rounded-xl bg-red-950 text-white text-[9px] font-black flex justify-center items-center gap-1.5 uppercase tracking-widest hover:bg-red-800 transition-all shadow-md active:scale-95">
                      {matrixLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill={matrixInsight ? "currentColor" : "none"} />} Insight
                  </button>
                  <button onClick={handleOpenFundamental} className="py-2.5 rounded-xl bg-blue-950 text-white text-[9px] font-black flex justify-center items-center gap-1.5 uppercase tracking-widest hover:bg-blue-800 transition-all shadow-md active:scale-95">
                      <Building2 size={12} /> Fundamental
                  </button>
                  <button onClick={handleOpenProfiles} className="py-2.5 rounded-xl bg-emerald-950 text-white text-[9px] font-black flex justify-center items-center gap-1.5 uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md active:scale-95">
                      <Users size={12} /> Estrategias
                  </button>
              </div>
            )}
        </div>

        {matrixInsight && !isLarge && (
          <div className="mt-3 p-3 text-[11px] bg-red-50/50 border-l-4 border-red-900 rounded-r-xl text-gray-900 font-bold flex justify-between items-start animate-in slide-in-from-left duration-300">
            <div className="flex-1 pr-2">
              <span className="block text-[8px] font-black text-red-900 uppercase mb-1 tracking-widest">Insight de Mercado:</span>
              <div className="leading-relaxed italic">"{matrixInsight}"</div>
            </div>
            <button onClick={() => setMatrixInsight(null)} className="text-gray-300 hover:text-red-900 pt-0.5"><X size={12}/></button>
          </div>
        )}

        {aiAnalysis && !isLarge && (
          <div className="mt-3 p-3 text-[11px] bg-gray-50 border-l-4 border-slate-950 rounded-r-xl text-gray-900 font-bold flex justify-between items-start animate-in slide-in-from-left duration-300">
            <div className="flex-1 pr-2">
              <span className="block text-[8px] font-black text-slate-950 uppercase mb-1 tracking-widest">Análisis del Oráculo:</span>
              <div className="leading-relaxed italic">"{aiAnalysis}"</div>
            </div>
            <button onClick={() => setAiAnalysis(null)} className="text-gray-300 hover:text-gray-600 pt-0.5"><X size={12}/></button>
          </div>
        )}
      </div>
      
      {!isLarge && (
        <div className="mt-4 border-t border-gray-100 pt-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddToPortfolio(asset.symbol, asset.type || 'CRYPTO'); }}
                    className="text-blue-900 hover:text-red-700 transition-all hover:scale-125 p-1"
                    title="Añadir a Cartera Abierta"
                  >
                    <Wallet size={13} />
                  </button>
                  <div className="w-px h-3 bg-gray-100"></div>
                  <a href={`https://www.tradingview.com/chart/?symbol=${ticker}`} target="_blank" rel="noreferrer" title="TradingView" className="text-blue-900 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-solid fa-chart-line text-[12px]"></i>
                  </a>
                  <a href={`https://finance.yahoo.com/quote/${ticker}`} target="_blank" rel="noreferrer" title="Yahoo Finanzas" className="text-blue-900 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-brands fa-yahoo text-[12px]"></i>
                  </a>
                  <a href={cmcUrl} target="_blank" rel="noreferrer" title="CoinMarketCap" className="text-blue-900 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-solid fa-coins text-[12px]"></i>
                  </a>
              </div>
              
              <div className="w-px h-3 bg-gray-100"></div>

              <div className="flex items-center gap-3">
                  <a href={`https://chat.openai.com/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar ChatGPT" className="text-gray-400 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-solid fa-robot text-[12px]"></i>
                  </a>
                  <a href={`https://grok.com/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar Grok" className="text-gray-400 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-solid fa-bolt text-[12px]"></i>
                  </a>
                  <a href={`https://www.perplexity.ai/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar Perplexity" className="text-gray-400 hover:text-red-700 transition-all hover:scale-125">
                      <i className="fa-solid fa-infinity text-[12px]"></i>
                  </a>
              </div>
          </div>

          <div className="flex gap-2 items-center">
              {!isFixed && (
                  <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-200 shadow-inner mr-1">
                    <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'left'); }} disabled={index === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30 text-gray-400 hover:text-gray-900 transition-all"><ChevronLeft size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'right'); }} disabled={index === total - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30 text-gray-400 hover:text-gray-900 transition-all"><ChevronRight size={12} /></button>
                  </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); fetchData(false); }} className="text-gray-400 hover:text-gray-900 p-1.5 transition-all active:rotate-180" title="Refrescar"><RefreshCw size={14} /></button>
              {isFixed ? <div className="p-1.5 text-gray-200"><Lock size={14} /></div> : <button onClick={(e) => { e.stopPropagation(); onDelete(asset.symbol); }} className="text-gray-400 hover:text-red-700 p-1.5 transition-colors" title="Borrar"><Trash2 size={14} /></button>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="h-full animate-in fade-in zoom-in-95 duration-500">
        {cardContent(false)}
      </div>

      {isZoomed && (
          <div className="fixed inset-0 z-[110] bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in duration-300 flex flex-col overflow-y-auto">
              <button 
                  onClick={() => setIsZoomed(false)} 
                  className="absolute top-6 right-6 md:top-10 md:right-10 p-4 hover:bg-red-50 rounded-full transition-all text-red-600 border-2 border-red-100 z-[120] bg-white shadow-xl hover:scale-110 active:scale-95"
              >
                  <X size={32} strokeWidth={3} />
              </button>
              <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-12 lg:p-16">
                  {cardContent(true)}
              </div>
          </div>
      )}

      {showFundamental && <FundamentalModal asset={asset} apiKey={apiKey} onClose={() => setShowFundamental(false)} />}
      {showProfiles && <ProfilesModal symbol={asset.symbol} apiKey={apiKey} rsiValue={daily?.rsi} onClose={() => setShowProfiles(false)} />}
      {showChart && <ChartModal symbol={asset.symbol} type={asset.type || 'CRYPTO'} onClose={() => setShowChart(false)} />}
      {showMA20 && <MA20Modal symbol={asset.symbol} price={daily.price} ma20={daily.ma20} onClose={() => setShowMA20(false)} />}
      {rsiModalData && <RSIModal symbol={asset.symbol} value={rsiModalData.value} timeframe={rsiModalData.timeframe} onClose={() => setRsiModalData(null)} />}
      {pivotsModalData && <PivotsModal symbol={asset.symbol} timeframe={pivotsModalData.timeframe} pivots={pivotsModalData.pivots} price={daily.price} onClose={() => setPivotsModalData(null)} />}
      {fibModalData && <FibonacciModal symbol={asset.symbol} timeframe={fibModalData.timeframe} levels={fibModalData.levels} price={daily.price} onClose={() => setFibModalData(null)} />}
    </>
  );
};

export default AssetCard;
