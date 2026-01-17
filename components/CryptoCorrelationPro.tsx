
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Search, RefreshCw, ArrowRightLeft, Info, BarChart3, Loader2, AlertCircle, Layers, ChevronDown, ChevronUp, Droplets, Target, Calculator, MousePointerClick, ArrowUpDown, ShieldCheck, Zap, AlertTriangle, Flame, ExternalLink, Scale, HelpCircle, ChevronRight, Check, Activity, X, Trophy, ListFilter, ArrowUp, FileText, Sigma } from 'lucide-react';
import { fetchHistoricalSeries, HistoryPoint } from '../services/market';
import { CURRENCIES, TOP_STOCKS } from '../constants';
import { Asset, CurrencyCode } from '../types';
import PearsonModal from './PearsonModal';
import StrategyModal from './StrategyModal';
import { GoogleGenAI } from "@google/genai";

interface Props {
  apiKey: string;
  onRequireKey: () => void;
  currency: CurrencyCode;
  rate: number;
  availableAssets: Asset[];
}

const STABLE_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', type: 'stable', category: 'Stablecoin' },
  { symbol: 'USDT', name: 'Tether', type: 'stable', category: 'Stablecoin' },
];

const TIMEFRAMES = [
  { label: '1S', fullLabel: '1 Semana', days: 7 },
  { label: '1M', fullLabel: '1 Mes', days: 30 },
  { label: '3M', fullLabel: '3 Meses', days: 90 },
  { label: '1A', fullLabel: '1 Año', days: 365 },
];

const getDateKey = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const calculatePearsonCorrelation = (arrX: number[], arrY: number[]) => {
  const n = arrX.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = arrX[i]; const y = arrY[i];
    sumX += x; sumY += y; sumXY += x * y;
    sumX2 += x * x; sumY2 += y * y;
  }
  const numerator = (n * sumXY) - (sumX) * (sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return 0;
  return numerator / denominator;
};

// --- SUB-COMPONENT: VOLATILITY MODAL ---
const VolatilityModal = ({ value, onClose }: { value: number; onClose: () => void }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-indigo-100">
      <div className="p-6 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-indigo-600" />
          <div>
            <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tight">Análisis de Volatilidad</h3>
            <p className="text-xs text-indigo-600 font-bold mt-1">Métrica del Par (Sigma-Adjusted)</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-gray-400 transition-colors"><X size={24} /></button>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desviación del Par</span>
            <span className={`text-4xl font-black ${value > 15 ? 'text-red-600' : (value > 8 ? 'text-amber-600' : 'text-emerald-600')}`}>
              {value.toFixed(2)}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nivel de Riesgo</span>
            <div className={`mt-1 font-black text-sm uppercase ${value > 15 ? 'text-red-700' : (value > 8 ? 'text-amber-700' : 'text-emerald-700')}`}>
              {value > 15 ? 'Crítico / High' : (value > 8 ? 'Moderado / Mid' : 'Bajo / Optimized')}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
            <Info size={14} className="text-indigo-600" /> ¿Qué significa este valor?
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed text-justify">
            Esta métrica calcula la <strong>volatilidad relativa</strong> entre los dos activos seleccionados. A diferencia de la volatilidad individual, esta mide cuánto "baila" el ratio entre ellos.
          </p>
          <ul className="space-y-3 text-xs text-gray-500">
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" /> <span><strong>Impacto en LP:</strong> Una volatilidad alta requiere rangos más anchos para evitar el <em>Impermanent Loss</em> (IL).</span></li>
            <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" /> <span><strong>Consistencia:</strong> Si la volatilidad es baja y la correlación alta, el par es ideal para estrategias de acumulación agresiva.</span></li>
          </ul>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 leading-relaxed italic">
            <strong>Nota Operativa:</strong> En periodos de alta volatilidad (&gt;15%), los algoritmos de CriptoGO recomiendan la estrategia <strong>CONSERVADORA</strong> para capturar el spread sin ser liquidado por el rango.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// --- SUB-COMPONENT: TOP 20 MODAL ---
interface ScanResult {
    assetA: any;
    assetB: any;
    pearson: number;
    volatility: number;
}

const TopCorrelationsModal = ({ 
    results, 
    onClose, 
    onSelect 
}: { 
    results: ScanResult[], 
    onClose: () => void, 
    onSelect: (a: any, b: any) => void 
}) => {
    const [sortBy, setSortBy] = useState<'pearson_desc' | 'pearson_asc' | 'volatility_asc'>('pearson_desc');

    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            if (sortBy === 'pearson_desc') return b.pearson - a.pearson;
            if (sortBy === 'pearson_asc') return a.pearson - b.pearson; // Best Hedge (Negative)
            if (sortBy === 'volatility_asc') return a.volatility - b.volatility;
            return 0;
        }).slice(0, 20); // Top 20
    }, [results, sortBy]);

    return (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-700 text-white rounded-xl shadow-lg shadow-red-900/20">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tight">Top Oportunidades</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Scanner de Mercado ({results.length} Pares)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
                </div>

                {/* Filters */}
                <div className="p-2 bg-gray-50 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setSortBy('pearson_desc')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'pearson_desc' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-gray-400 hover:text-gray-900'}`}>
                        <Scale size={12}/> Mayor Sincronía
                    </button>
                    <button onClick={() => setSortBy('pearson_asc')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'pearson_asc' ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100' : 'text-gray-400 hover:text-gray-900'}`}>
                        <ShieldCheck size={12}/> Mejor Hedge (Inversa)
                    </button>
                    <button onClick={() => setSortBy('volatility_asc')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'volatility_asc' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}>
                        <Zap size={12}/> Menor Volatilidad
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-gray-50/30">
                    <div className="grid grid-cols-1 gap-2">
                        {sortedResults.map((res, idx) => (
                            <button 
                                key={`${res.assetA.symbol}-${res.assetB.symbol}`}
                                onClick={() => { onSelect(res.assetA, res.assetB); onClose(); }}
                                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:shadow-md transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-black text-gray-200 w-6">{idx + 1}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 text-sm">{res.assetA.symbol}</span>
                                            <span className="text-gray-300 text-xs">/</span>
                                            <span className="font-black text-gray-900 text-sm">{res.assetB.symbol}</span>
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                            {res.assetA.name} vs {res.assetB.name}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pearson</div>
                                        <div className={`text-sm font-black font-mono ${res.pearson >= 0.7 ? 'text-emerald-600' : (res.pearson <= -0.7 ? 'text-red-600' : 'text-gray-600')}`}>
                                            {res.pearson.toFixed(3)}
                                        </div>
                                    </div>
                                    <div className="text-right w-16">
                                        <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Volat.</div>
                                        <div className={`text-sm font-black font-mono ${res.volatility < 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {res.volatility.toFixed(1)}%
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-200 group-hover:text-red-700 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AssetSelect = ({ label, selected, onSelect, cryptoList, stockList, stableList }: any) => (
  <div className="flex flex-col gap-0.5 w-full">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <select 
        className="w-full py-2.5 pl-3 pr-8 border border-gray-200 rounded-xl bg-white text-[11px] font-black text-gray-900 uppercase tracking-widest focus:border-red-700 focus:ring-2 focus:ring-red-700/10 outline-none shadow-sm appearance-none transition-all cursor-pointer"
        value={selected.symbol}
        onChange={(e) => {
           const all = [...stableList, ...cryptoList, ...stockList];
           const found = all.find(a => a.symbol === e.target.value);
           if (found) onSelect(found);
        }}
      >
        <optgroup label="Stables">
          {stableList.map((s: any) => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
        </optgroup>
        <optgroup label="Cripto">
          {cryptoList.map((c: any) => <option key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</option>)}
        </optgroup>
        <optgroup label="Bolsa">
          {stockList.map((s: any) => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
        </optgroup>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-hover:text-red-700 transition-colors">
          <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

export default function CryptoCorrelationPro({ apiKey, onRequireKey, currency, rate, availableAssets }: Props) {
  const unifiedAssets = useMemo(() => {
      const stables = STABLE_ASSETS.map(s => ({...s, type: 'stable'}));
      const cryptos: any[] = [];
      const stocks: any[] = [];
      TOP_STOCKS.forEach(s => stocks.push({ symbol: s.symbol, name: s.name, type: 'stock', category: 'Top Stock' }));
      availableAssets.forEach(asset => {
          if (stables.some(s => s.symbol === asset.symbol)) return;
          const item = { symbol: asset.symbol, name: asset.name, type: (asset.type === 'STOCK' ? 'stock' : 'crypto'), category: (asset.type === 'STOCK' ? 'User Stock' : 'User Crypto') };
          if (asset.type === 'STOCK') { if (!stocks.some(s => s.symbol === item.symbol)) stocks.push(item); } else { cryptos.push(item); }
      });
      return { stables, cryptos: Array.from(new Map(cryptos.map(item => [item.symbol, item])).values()), stocks: Array.from(new Map(stocks.map(item => [item.symbol, item])).values()), all: [...stables, ...cryptos, ...stocks] };
  }, [availableAssets]);

  const [assetA, setAssetA] = useState(unifiedAssets.cryptos[0] || unifiedAssets.stables[0]);
  const [assetB, setAssetB] = useState(unifiedAssets.cryptos[1] || (unifiedAssets.stocks[0] || unifiedAssets.stables[1]));
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [correlation, setCorrelation] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lpMetrics, setLpMetrics] = useState<any>(null);
  const [invertLp, setInvertLp] = useState(true);
  const [showPearsonModal, setShowPearsonModal] = useState(false);
  const [showVolatilityModal, setShowVolatilityModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'conservative' | 'aggressive' | 'accumulation' | null>(null);
  const [isInterpretationOpen, setIsInterpretationOpen] = useState(false);

  // --- SCANNER STATE ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    // Reset AI Analysis when changing assets or timeframe
    setAiAnalysis('');
    if (!assetA || !assetB) return;
    
    const loadRealData = async () => {
        setIsLoadingData(true);
        try {
            const typeA = (assetA.type === 'stock') ? 'STOCK' : 'CRYPTO';
            const typeB = (assetB.type === 'stock') ? 'STOCK' : 'CRYPTO';
            const [rawA, rawB] = await Promise.all([
                fetchHistoricalSeries(assetA.symbol, typeA, timeframe.days),
                fetchHistoricalSeries(assetB.symbol, typeB, timeframe.days)
            ]);
            if (!rawA.length || !rawB.length) { setChartData([]); setIsLoadingData(false); return; }
            const mapB = new Map<string, number>();
            rawB.forEach(p => mapB.set(getDateKey(p.time), p.close));
            const alignedData: any[] = []; const alignedPricesA: number[] = []; const alignedPricesB: number[] = []; const ratios: number[] = [];
            let firstPriceA = 0, firstPriceB = 0;
            for (const pA of rawA) {
                const dateKey = getDateKey(pA.time);
                if (mapB.has(dateKey)) {
                    const priceB = mapB.get(dateKey)!;
                    if (alignedData.length === 0) { firstPriceA = pA.close; firstPriceB = priceB; }
                    alignedPricesA.push(pA.close); alignedPricesB.push(priceB);
                    const r = pA.close / priceB; ratios.push(r);
                    alignedData.push({ date: dateKey, normA: (pA.close / firstPriceA) * 100, normB: (priceB / firstPriceB) * 100 });
                }
            }
            setChartData(alignedData);
            const pearson = calculatePearsonCorrelation(alignedPricesA, alignedPricesB);
            setCorrelation(pearson);
            if (ratios.length > 0) {
                const currentRatio = ratios[ratios.length - 1];
                const minHist = Math.min(...ratios), maxHist = Math.max(...ratios);
                const lastPriceB = alignedPricesB[alignedPricesB.length - 1];
                const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
                const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratios.length;
                const stdDev = Math.sqrt(variance);
                setLpMetrics({ current: currentRatio, priceB: lastPriceB, conservative: { min: minHist * 0.95, max: maxHist * 1.05 }, aggressive: { min: currentRatio - stdDev, max: currentRatio + stdDev }, acquisition: { min: currentRatio * 0.97, max: currentRatio * 1.03 }, volatility: (stdDev / mean) * 100 });
            }
        } catch (e) { console.error(e); } finally { setIsLoadingData(false); }
    };
    loadRealData();
  }, [assetA, assetB, timeframe]);

  const runMarketScan = async () => {
      setIsScanning(true);
      try {
          // 1. Get Assets (Limit to 30 to avoid API blocks)
          const assetsToScan = unifiedAssets.all.slice(0, 30);
          
          // 2. Fetch Histories
          const histories = new Map<string, HistoryPoint[]>();
          await Promise.all(assetsToScan.map(async (a: any) => {
              const type = (a.type === 'stock') ? 'STOCK' : 'CRYPTO';
              const data = await fetchHistoricalSeries(a.symbol, type, timeframe.days);
              if (data && data.length > 10) histories.set(a.symbol, data);
          }));

          // 3. Compare Pairs
          const results: ScanResult[] = [];
          
          for (let i = 0; i < assetsToScan.length; i++) {
              for (let j = i + 1; j < assetsToScan.length; j++) {
                  const a = assetsToScan[i];
                  const b = assetsToScan[j];
                  
                  const rawA = histories.get(a.symbol);
                  const rawB = histories.get(b.symbol);
                  
                  if (!rawA || !rawB) continue;

                  // Align
                  const mapB = new Map<string, number>();
                  rawB.forEach(p => mapB.set(getDateKey(p.time), p.close));
                  
                  const alignedPricesA: number[] = [];
                  const alignedPricesB: number[] = [];
                  const ratios: number[] = [];

                  for (const pA of rawA) {
                      const dateKey = getDateKey(pA.time);
                      if (mapB.has(dateKey)) {
                          const priceB = mapB.get(dateKey)!;
                          alignedPricesA.push(pA.close);
                          alignedPricesB.push(priceB);
                          ratios.push(pA.close / priceB);
                      }
                  }

                  if (alignedPricesA.length < 10) continue;

                  const pearson = calculatePearsonCorrelation(alignedPricesA, alignedPricesB);
                  
                  // Volatility Calc
                  const mean = ratios.reduce((x, y) => x + y, 0) / ratios.length;
                  const variance = ratios.reduce((x, y) => x + Math.pow(y - mean, 2), 0) / ratios.length;
                  const stdDev = Math.sqrt(variance);
                  const volatility = (stdDev / mean) * 100;

                  results.push({ assetA: a, assetB: b, pearson, volatility });
              }
          }
          setScanResults(results);
          setShowScanModal(true);

      } catch (e) {
          console.error("Scan error", e);
      } finally {
          setIsScanning(false);
      }
  };

  const analyzeWithGemini = async () => {
    if (!apiKey) { onRequireKey(); return; }
    
    // VALIDACIÓN PREVIA: Asegurar que hay datos antes de consumir API
    if (!lpMetrics || correlation === null) {
        setAiAnalysis("⚠️ Faltan datos de mercado para generar un diagnóstico fiable. Espera a que cargue la gráfica.");
        return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(''); // Limpiar anterior

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Eres un experto en Matemáticas Financieras y DeFi.
        Analiza el par ${assetA.symbol} vs ${assetB.symbol} en temporalidad ${timeframe.fullLabel}.
        
        INPUTS DEL MOTOR MATRIX:
        1. Correlación Pearson: ${correlation.toFixed(4)}. (1=Idénticos, 0=Ruido, -1=Espejo).
        2. Volatilidad del Ratio (Riesgo IL): ${lpMetrics.volatility.toFixed(2)}%.
        3. Rango de Estabilidad (Conservador): ${lpMetrics.conservative.min.toFixed(4)} a ${lpMetrics.conservative.max.toFixed(4)}.

        TU MISIÓN:
        Genera un informe ejecutivo estructurado.
        
        FORMATO DE SALIDA (ESTRICTO):
        Usa encabezados en mayúsculas seguidos de dos puntos. Usa guiones para listas.
        
        DIAGNÓSTICO: [Texto breve sobre la correlación y sincronía]
        
        RIESGO MATEMÁTICO: [Análisis de la volatilidad y riesgo de IL]
        
        ACCIÓN RECOMENDADA: [Sugerencia directa: LP, Hedge o Esperar]
      `;

      const response = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: prompt 
      });
      
      const text = response.text;
      if (text) {
          setAiAnalysis(text);
      } else {
          setAiAnalysis("El modelo no generó respuesta (Posible filtro de seguridad o sobrecarga). Intenta de nuevo.");
      }

    } catch (error: any) { 
        console.error("Gemini Error:", error);
        setAiAnalysis(`Error de conexión: ${error.message || "Verifica tu API Key"}`); 
    } finally { 
        setIsAnalyzing(false); 
    }
  };

  const getPearsonContext = (val: number) => {
      if (val >= 0.7) return { label: "SINCRONÍA TOTAL", color: "text-emerald-700 bg-emerald-50 border-emerald-100", desc: "Activos gemelos. Ideal para Liquidez V3 con bajo IL." };
      if (val >= 0.3) return { label: "TENDENCIA COMÚN", color: "text-emerald-500 bg-emerald-50/50 border-emerald-100", desc: "Movimiento similar con ruido. Aceptable para diversificar." };
      if (val <= -0.7) return { label: "COBERTURA PURA", color: "text-red-700 bg-red-50 border-red-100", desc: "Movimiento espejo inverso. La mejor protección de riesgo." };
      if (val <= -0.3) return { label: "DIVERSIFICACIÓN", color: "text-red-500 bg-red-50/50 border-red-100", desc: "Tendencia opuesta moderada. Bueno para balancear." };
      return { label: "INDETERMINACIÓN", color: "text-gray-500 bg-gray-50 border-gray-100", desc: "Sin relación matemática clara. Ruido de mercado." };
  };

  const formatCrypto = (val: number) => val < 0.0001 ? val.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 9 }) : val.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });

  return (
    <div className="font-sans text-gray-900 flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header & Selectors */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-8">
            <div className="flex-shrink-0 flex items-center gap-4">
                <div className="p-3 bg-red-700 rounded-2xl text-white shadow-xl shadow-red-900/10"><BarChart3 size={28} /></div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none uppercase">Motor de <span className="text-red-700">Correlación</span></h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1.5">Real-Data Matrix Engine</p>
                </div>
            </div>
            
            <div className="flex flex-1 flex-col md:flex-row items-end gap-3 w-full xl:max-w-3xl">
                <div className="flex-1 w-full"><AssetSelect label="Activo Principal" selected={assetA} onSelect={setAssetA} cryptoList={unifiedAssets.cryptos} stockList={unifiedAssets.stocks} stableList={unifiedAssets.stables} /></div>
                <button onClick={() => { const t = assetA; setAssetA(assetB); setAssetB(t); }} className="mb-1 p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-red-700 border border-gray-200 shadow-inner transition-all hover:scale-110 active:rotate-180 flex-shrink-0"><ArrowRightLeft size={18} /></button>
                <div className="flex-1 w-full"><AssetSelect label="Activo Comparativo" selected={assetB} onSelect={setAssetB} cryptoList={unifiedAssets.cryptos} stockList={unifiedAssets.stocks} stableList={unifiedAssets.stables} /></div>
                
                {/* SCANNER BUTTON */}
                <button 
                    onClick={runMarketScan} 
                    disabled={isScanning}
                    className="mb-1 h-[46px] px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-gray-200 active:scale-95 transition-all flex-shrink-0"
                >
                    {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ListFilter size={16} />}
                    <span className="hidden md:inline">Top 20</span>
                </button>
            </div>
        </div>
      </div>

      {/* ESTRATEGIA DE LIQUIDEZ (LP / GRID) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                  <Layers size={20} className="text-indigo-600" />
                  <h2 className="font-black text-gray-800 text-sm uppercase tracking-tight">Estrategia de Liquidez (LP / Grid)</h2>
              </div>
              
              <div className="flex items-center gap-4">
                  {/* Selector temporal movido aquí */}
                  <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/50">
                      {TIMEFRAMES.map(tf => (
                          <button 
                            key={tf.label} 
                            onClick={() => setTimeframe(tf)} 
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeframe.label === tf.label ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-900'}`}
                          >
                              {tf.label}
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={() => setInvertLp(!invertLp)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${invertLp ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-400'}`}
                  >
                      <ArrowUpDown size={12} /> {invertLp ? '↑ INVERTIDO' : '↑ NORMAL'}
                  </button>
              </div>
          </div>

          <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-50 pb-5 gap-4">
                  <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Precio Actual (1 {invertLp ? assetB.symbol : assetA.symbol}):</div>
                      <div className="text-3xl font-mono font-black text-gray-900 tracking-tighter">
                          {lpMetrics ? formatCrypto(invertLp ? 1/lpMetrics.current : lpMetrics.current) : '---'} <span className="text-sm text-gray-400 ml-1">{invertLp ? assetA.symbol : assetB.symbol}</span>
                      </div>
                  </div>
                  
                  <div className="flex gap-3">
                      {/* PEARSON BOX */}
                      <div 
                        onClick={() => correlation !== null && setShowPearsonModal(true)}
                        className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-4 shadow-inner cursor-help hover:bg-emerald-50 transition-all hover:border-emerald-100 group"
                      >
                          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                            <Calculator size={18} />
                          </div>
                          <div className="pr-2">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 group-hover:text-emerald-600 transition-colors">Pearson (Sincronía):</div>
                            <div className={`text-xl font-black tracking-tight leading-none ${correlation && correlation > 0.7 ? 'text-emerald-600' : (correlation && correlation < -0.3 ? 'text-red-600' : 'text-amber-600')}`}>
                                {correlation !== null ? correlation.toFixed(3) : '--.---'}
                            </div>
                          </div>
                      </div>

                      {/* VOLATILITY BOX */}
                      <div 
                        onClick={() => lpMetrics && setShowVolatilityModal(true)}
                        className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-4 shadow-inner cursor-help hover:bg-indigo-50 transition-all hover:border-indigo-100 group"
                      >
                          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                            <Activity size={18} />
                          </div>
                          <div className="pr-2">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 group-hover:text-indigo-600 transition-colors">Volatilidad del Par:</div>
                            <div className={`text-xl font-black tracking-tight leading-none ${lpMetrics?.volatility > 15 ? 'text-red-600' : (lpMetrics?.volatility > 8 ? 'text-amber-600' : 'text-emerald-600')}`}>
                                {lpMetrics ? lpMetrics.volatility.toFixed(2) : '--.--'} %
                            </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Grid de Tarjetas de Estrategia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { id: 'conservative', label: 'CONSERVATIVE', color: 'text-emerald-700', bg: 'bg-emerald-50/30', border: 'border-emerald-100', metrics: lpMetrics?.conservative },
                      { id: 'aggressive', label: 'AGGRESSIVE', color: 'text-amber-700', bg: 'bg-amber-50/30', border: 'border-amber-100', metrics: lpMetrics?.aggressive },
                      { id: 'accumulation', label: 'ACCUMULATION', color: 'text-blue-700', bg: 'bg-blue-50/30', border: 'border-blue-100', metrics: lpMetrics?.acquisition }
                  ].map((strat) => (
                      <button 
                        key={strat.id} 
                        onClick={() => setSelectedStrategy(strat.id as any)}
                        className={`p-5 rounded-2xl border ${strat.bg} ${strat.border} text-left transition-all hover:shadow-md hover:scale-[1.02] group relative`}
                      >
                          <div className="flex justify-between items-start mb-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${strat.color}`}>{strat.label}</span>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-tighter ${strat.color} ${strat.border} bg-white shadow-sm`}>
                                  <ShieldCheck size={10} /> RIESGO BAJO
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${strat.color} opacity-60`}>MIN</span>
                                  <div className="text-xl font-mono font-black text-gray-900 leading-none mt-1">
                                      {strat.metrics ? formatCrypto(invertLp ? 1/strat.metrics.max : strat.metrics.min) : '---'}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${strat.color} opacity-60`}>MAX</span>
                                  <div className="text-xl font-mono font-black text-gray-900 leading-none mt-1">
                                      {strat.metrics ? formatCrypto(invertLp ? 1/strat.metrics.min : strat.metrics.max) : '---'}
                                  </div>
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>

          <div className="border-t border-gray-50">
              <button 
                onClick={() => setIsInterpretationOpen(!isInterpretationOpen)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
              >
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                      <RefreshCw size={12} className={isLoadingData ? 'animate-spin' : ''} /> Interpretación Algorítmica de Rangos
                  </div>
                  <ChevronDown size={14} className={`text-gray-300 transition-transform duration-300 ${isInterpretationOpen ? 'rotate-180' : ''}`} />
              </button>
              {isInterpretationOpen && (
                  <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-900 tracking-widest mb-3">
                              <Sigma size={14} className="text-gray-400" /> Modelo Matemático
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed font-medium text-justify">
                              Los rangos se calculan utilizando una <strong>Desviación Estándar Dinámica</strong> sobre la volatilidad histórica del periodo {timeframe.fullLabel}. Esto adapta la "anchura" de la rejilla a la realidad actual del mercado, no a una predicción.
                          </p>
                      </div>
                      
                      <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 bg-emerald-50/30 rounded-xl border border-emerald-50">
                              <ShieldCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                              <div>
                                  <span className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Rango Conservador</span>
                                  <p className="text-[10px] text-emerald-700/80 leading-relaxed">
                                      Diseñado para cubrir "colas de evento" (picos extremos). Minimiza el riesgo de Impermanent Loss (IL) al 95%.
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-amber-50/30 rounded-xl border border-amber-50">
                              <Zap size={16} className="text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                  <span className="block text-[10px] font-black uppercase text-amber-800 mb-1">Rango Agresivo</span>
                                  <p className="text-[10px] text-amber-700/80 leading-relaxed">
                                      Concentra la liquidez en 1 Sigma. Maximiza APR por comisiones pero aumenta el riesgo de salida de rango.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-gray-950"></div> {assetA.symbol}</span>
                          <span className="text-gray-200 font-mono text-xs">/</span>
                          <span className="flex items-center gap-2 text-sm font-black text-red-700 uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-red-700"></div> {assetB.symbol}</span>
                      </div>
                  </div>
                  <div className="h-[350px] w-full relative">
                      {isLoadingData && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-red-700" size={40} /></div>}
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" hide />
                              <YAxis domain={['auto', 'auto']} hide />
                              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                              <ReferenceLine y={100} stroke="#e2e8f0" strokeDasharray="5 5" />
                              <Line type="monotone" dataKey="normA" stroke="#0f172a" strokeWidth={3} dot={false} animationDuration={1000} />
                              <Line type="monotone" dataKey="normB" stroke="#b91c1c" strokeWidth={3} dot={false} animationDuration={1000} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col min-h-[160px]`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><Brain size={16} className="text-red-700" /> Diagnóstico IA</h3>
                      <button onClick={analyzeWithGemini} disabled={isAnalyzing} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-red-700 transition-all">{isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}</button>
                  </div>
                  {isAnalyzing ? (
                    <div className="space-y-3 animate-pulse p-2">
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        <div className="text-[11px] leading-relaxed font-medium text-gray-600 space-y-4 font-mono">
                            {aiAnalysis.split('\n').map((line, i) => {
                                // Formatting trick: Detect Headers (UPPERCASE with :) and List items
                                if (line.trim().endsWith(':')) {
                                    return <div key={i} className="font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-1 mt-4 mb-2 text-[10px]">{line}</div>;
                                }
                                if (line.trim().startsWith('-')) {
                                    return <div key={i} className="pl-2 flex gap-2"><span className="text-red-700">•</span> <span>{line.replace('-','').trim()}</span></div>;
                                }
                                return <div key={i}>{line}</div>;
                            })}
                        </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <button onClick={analyzeWithGemini} className="text-[10px] font-black text-gray-400 uppercase border-2 border-dashed border-gray-100 p-4 rounded-2xl hover:border-red-200 hover:text-red-700 hover:bg-red-50/50 transition-all w-full text-center">
                            Solicitar Análisis Experto
                        </button>
                    </div>
                  )}
              </div>
          </div>
      </div>
      
      {showPearsonModal && correlation !== null && <PearsonModal value={correlation} assetA={assetA.symbol} assetB={assetB.symbol} onClose={() => setShowPearsonModal(false)}/>}
      {showVolatilityModal && lpMetrics && <VolatilityModal value={lpMetrics.volatility} onClose={() => setShowVolatilityModal(false)} />}
      {selectedStrategy && lpMetrics && <StrategyModal type={selectedStrategy} assetA={invertLp ? assetB.symbol : assetA.symbol} assetB={invertLp ? assetA.symbol : assetB.symbol} minPrice={selectedStrategy === 'conservative' ? (invertLp ? 1/lpMetrics.conservative.max : lpMetrics.conservative.min) : selectedStrategy === 'aggressive' ? (invertLp ? 1/lpMetrics.aggressive.max : lpMetrics.aggressive.min) : (invertLp ? 1/lpMetrics.acquisition.max : lpMetrics.acquisition.min)} maxPrice={selectedStrategy === 'conservative' ? (invertLp ? 1/lpMetrics.conservative.min : lpMetrics.conservative.max) : selectedStrategy === 'aggressive' ? (invertLp ? 1/lpMetrics.aggressive.min : lpMetrics.aggressive.max) : (invertLp ? 1/lpMetrics.acquisition.min : lpMetrics.acquisition.max)} onClose={() => setSelectedStrategy(null)} />}
      
      {showScanModal && (
          <TopCorrelationsModal 
            results={scanResults} 
            onClose={() => setShowScanModal(false)} 
            onSelect={(a, b) => { setAssetA(a); setAssetB(b); }}
          />
      )}
    </div>
  );
}
