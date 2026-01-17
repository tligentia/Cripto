import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUp, ArrowDown, Loader2, Star, Trash2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Asset, CurrencyCode, TimeRange } from '../types';
import { fetchHistoricalSeries } from '../services/market';
import { CURRENCIES, TOP_STOCKS } from '../constants';

interface Props {
  asset: Asset;
  currency: CurrencyCode;
  rate: number;
  range: TimeRange;
  refreshTrigger?: number;
  index: number;
  total: number;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  onClick?: (asset: Asset) => void;
}

const DashboardWidget: React.FC<Props> = ({ asset, currency, rate, range, refreshTrigger = 0, index, total, onDelete, onToggleFavorite, onMove, onClick }) => {
  // Added 'diff' to the state interface to store absolute change
  const [data, setData] = useState<{ price: number, change: number, diff: number, history: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if it is a fixed stock (Top Stock) to prevent deletion
  const isTopStock = TOP_STOCKS.some(s => s.symbol === asset.symbol);

  useEffect(() => {
    let isMounted = true;
    
    // Only show loading spinner on initial load or range change, NOT on auto-refresh heartbeat
    if(refreshTrigger === 0) setLoading(true);
    
    const load = async () => {
      try {
        const type = asset.type === 'STOCK' ? 'STOCK' : 'CRYPTO';
        // Now fetching based on specific TimeRange prop
        const history = await fetchHistoricalSeries(asset.symbol, type, range);
        
        if (isMounted) {
            if (history.length > 0) {
              const startPrice = history[0].close;
              const currentPrice = history[history.length - 1].close;
              const change = ((currentPrice - startPrice) / startPrice) * 100;
              const diff = currentPrice - startPrice; // Calculate absolute difference
              
              setData({
                price: currentPrice,
                change,
                diff,
                history: history.map(h => ({ value: h.close }))
              });
            } else {
                setData(null); // No data for range
            }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [asset, range, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-32 flex items-center justify-center animate-pulse">
        <Loader2 className="animate-spin text-gray-300" size={20} />
      </div>
    );
  }

  // Graceful empty state
  if (!data) return (
     <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 opacity-70 relative group">
         <div className="flex justify-between">
            <h3 className="font-black text-gray-900 text-sm tracking-tight">{asset.symbol}</h3>
            <button onClick={() => onDelete(asset.symbol)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
         </div>
         <p className="text-[10px] text-gray-400 mt-2">Sin datos ({range})</p>
     </div>
  );

  const isPositive = data.change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444'; // Emerald-500 or Red-500
  const curConf = CURRENCIES[currency];
  
  // Formato de precio y diferencia
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  
  const convertedPrice = data.price * rate;
  const priceStr = convertedPrice.toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const convertedDiff = data.diff * rate;
  const diffStr = Math.abs(convertedDiff).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = isPositive ? '+' : '-';

  return (
    <div 
      onClick={() => onClick?.(asset)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer"
    >
      
      {/* HEADER: Symbol + Star + % Change */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-start gap-1">
          <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.symbol); }}
                className={`pt-0.5 transition-colors ${asset.isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-gray-200 hover:text-amber-300'}`}
          >
             <Star size={12} fill={asset.isFavorite ? "currentColor" : "none"} />
          </button>
          <div>
            <h3 className="font-black text-gray-900 text-sm tracking-tight leading-none">{asset.symbol}</h3>
            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[80px] mt-0.5">{asset.name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
           {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
           {Math.abs(data.change).toFixed(2)} %
        </div>
      </div>

      {/* PRICE & ABSOLUTE DIFFERENCE */}
      <div className="flex flex-col items-start relative z-10 mt-2">
         <span className="text-xl font-bold text-gray-900 font-mono tracking-tighter leading-none">
            {curConf.symbol} {priceStr}
         </span>
         <span className={`text-[10px] font-mono font-bold mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {sign}{diffStr}
         </span>
      </div>

      {/* Sparkline Chart */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-40 transition-opacity z-0 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history}>
            <defs>
              <linearGradient id={`grad_${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2} 
                fill={`url(#grad_${asset.symbol})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER CONTROLS (Visible on Group Hover) */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm">
          
          {/* Move Buttons */}
          <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200">
             <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'left'); }} disabled={index === 0} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all text-gray-600">
                 <ChevronLeft size={10} />
             </button>
             <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'right'); }} disabled={index === total - 1} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all text-gray-600">
                 <ChevronRight size={10} />
             </button>
          </div>

          {/* Delete Button (Lock if Top Stock) */}
          {isTopStock ? (
             <div className="p-1.5 text-gray-300" title="Activo fijo">
                <Lock size={10} />
             </div>
          ) : (
             <button onClick={(e) => { e.stopPropagation(); onDelete(asset.symbol); }} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar">
                <Trash2 size={10} />
             </button>
          )}
      </div>
    </div>
  );
};

export default DashboardWidget;