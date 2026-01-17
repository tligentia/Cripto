import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Asset, CurrencyCode, TimeRange } from '../types';
import DashboardWidget from './DashboardWidget';

interface Props {
  userAssets: Asset[];
  currency: CurrencyCode;
  rate: number;
  onAddClick: () => void;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  onWidgetClick?: (asset: Asset) => void;
  refreshTrigger?: number;
  lastUpdate?: Date;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  onManualRefresh?: () => void;
}

const GeneralDashboard: React.FC<Props> = ({ 
  userAssets, 
  currency, 
  rate, 
  onAddClick, 
  onDelete, 
  onToggleFavorite, 
  onMove, 
  onWidgetClick, 
  refreshTrigger = 0,
  lastUpdate,
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(() => {
    const saved = localStorage.getItem('criptogo_dashboard_range');
    return (saved as TimeRange) || '1D';
  });
  
  useEffect(() => {
    localStorage.setItem('criptogo_dashboard_range', selectedRange);
  }, [selectedRange]);

  const ranges: TimeRange[] = ['1H', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'MAX'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
         <div className="flex items-center">
            {lastUpdate && (
              <div className="flex items-center gap-5 animate-in fade-in slide-in-from-top-1 duration-300 bg-white/50 py-1 px-3 rounded-full border border-gray-100 shadow-sm w-fit">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        {autoRefresh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    </span>
                    {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={autoRefresh} 
                        onChange={onToggleAutoRefresh}
                        className="sr-only" 
                      />
                      <div className={`w-4 h-4 border-2 rounded-md transition-all flex items-center justify-center ${autoRefresh ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'bg-white border-gray-300 group-hover:border-gray-900'}`}>
                        {autoRefresh && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${autoRefresh ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                      Auto
                    </span>
                  </label>

                  <div className="w-px h-3 bg-gray-200"></div>

                  <button 
                      onClick={onManualRefresh}
                      className="p-1 text-gray-400 hover:text-red-700 transition-all active:rotate-180 flex items-center justify-center"
                      title="Refrescar datos ahora"
                  >
                      <RefreshCw size={14} className={autoRefresh ? 'animate-spin-slow' : ''} />
                  </button>
                </div>
              </div>
            )}
         </div>
         <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1.5 rounded-[1.2rem] gap-1 overflow-x-auto shadow-inner border border-gray-200/50 scrollbar-hide">
                {ranges.map((range) => (
                    <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            selectedRange === range 
                            ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5' 
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
         {userAssets.map((asset, index) => (
            <DashboardWidget 
                key={`${asset.symbol}-${asset.type}`} 
                asset={asset} 
                currency={currency} 
                rate={rate}
                range={selectedRange}
                refreshTrigger={refreshTrigger}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onMove={onMove}
                onClick={onWidgetClick}
                index={index}
                total={userAssets.length}
            />
         ))}
         <button onClick={onAddClick} className="rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50 flex flex-col items-center justify-center min-h-[160px] cursor-pointer transition-all group gap-4 animate-in fade-in shadow-sm hover:shadow-lg">
             <div className="w-14 h-14 rounded-full bg-white shadow-xl border border-gray-100 group-hover:scale-110 flex items-center justify-center text-gray-300 group-hover:text-red-700 transition-all">
                <Plus size={32} strokeWidth={3} />
             </div>
             <span className="text-[11px] font-black text-gray-400 group-hover:text-gray-900 uppercase tracking-[0.2em]">Añadir Activo</span>
         </button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      ` }} />
    </div>
  );
};

export default GeneralDashboard;