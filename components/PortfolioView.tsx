
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Plus, Trash2, TrendingUp, TrendingDown, 
  ChevronRight, Wallet, PieChart, LineChart, 
  ArrowUpRight, ArrowDownRight, Loader2, Calendar, 
  DollarSign, RefreshCw, AlertCircle, Layers, X, Edit3, Search, Zap, Globe, Info, Activity, AlertTriangle,
  List, LayoutGrid, MessageSquare, ArrowRightLeft, ArrowRight, Check, Download, SortAsc, SortDesc
} from 'lucide-react';
import { Portfolio, PortfolioAsset, CurrencyCode, AssetType } from '../types';
import { fetchAssetData, resolveAsset, fetchPriceAtDate } from '../services/market';
import { CURRENCIES } from '../constants';

interface Props {
  currency: CurrencyCode;
  rate: number;
  initialAssetData?: {symbol: string, type: AssetType} | null;
  onHandledInitialSymbol?: () => void;
}

const TOTAL_PORTFOLIO_ID = 'virtual_total';

type SortKey = 'date' | 'symbol' | 'value' | 'pnl' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function PortfolioView({ currency, rate, initialAssetData, onHandledInitialSymbol }: Props) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const saved = localStorage.getItem('criptogo_portfolios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [assetListView, setAssetListView] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('criptogo_portfolio_view_mode');
    return (saved as 'list' | 'grid') || 'list';
  });

  const [sortConfig, setSortConfig] = useState<{key: SortKey, order: SortOrder}>(() => {
    const saved = localStorage.getItem('criptogo_portfolio_sort');
    return saved ? JSON.parse(saved) : { key: 'date', order: 'desc' };
  });

  useEffect(() => {
    localStorage.setItem('criptogo_portfolio_view_mode', assetListView);
  }, [assetListView]);

  useEffect(() => {
    localStorage.setItem('criptogo_portfolio_sort', JSON.stringify(sortConfig));
  }, [sortConfig]);

  const allPortfolios = useMemo(() => {
    if (portfolios.length === 0) return [];
    const allAssets = portfolios.flatMap(p => p.assets);
    const totalP: Portfolio = {
      id: TOTAL_PORTFOLIO_ID,
      name: 'TOTAL',
      description: 'Vista consolidada de todas tus posiciones abiertas en diferentes carteras.',
      assets: allAssets,
      createdAt: 0
    };
    return [totalP, ...portfolios];
  }, [portfolios]);

  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(() => {
    if (portfolios.length > 0) return TOTAL_PORTFOLIO_ID;
    return portfolios[0]?.id || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistorical, setIsFetchingHistorical] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [targetPortfolioId, setTargetPortfolioId] = useState<string>('');

  const [newAsset, setNewAsset] = useState({ 
    symbol: '', 
    amount: '', 
    price: '', 
    expenses: '', 
    date: new Date().toISOString().split('T')[0], 
    type: 'CRYPTO' as AssetType,
    comments: ''
  });
  const [newPortfolio, setNewPortfolio] = useState({ name: '', desc: '' });

  const [valuationData, setValuationData] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (initialAssetData && portfolios.length > 0) {
      if (activePortfolioId === TOTAL_PORTFOLIO_ID) {
          setActivePortfolioId(portfolios[0].id);
      }
      setNewAsset(prev => ({ 
        ...prev, 
        symbol: initialAssetData.symbol, 
        type: initialAssetData.type 
      }));
      setEditingAssetId(null);
      setIsAddingAsset(true);
      onHandledInitialSymbol?.();
    }
  }, [initialAssetData, portfolios, activePortfolioId, onHandledInitialSymbol]);

  const activePortfolioRaw = useMemo(() => 
    allPortfolios.find(p => p.id === activePortfolioId), 
  [allPortfolios, activePortfolioId]);

  const activePortfolio = useMemo(() => {
    if (!activePortfolioRaw) return null;
    const sortedAssets = [...activePortfolioRaw.assets].sort((a, b) => {
        let valA: any, valB: any;
        switch (sortConfig.key) {
            case 'date':
                valA = new Date(a.purchaseDate).getTime();
                valB = new Date(b.purchaseDate).getTime();
                break;
            case 'symbol':
                valA = a.symbol;
                valB = b.symbol;
                break;
            case 'amount':
                valA = a.amount;
                valB = b.amount;
                break;
            case 'value':
                valA = a.amount * (valuationData[a.id] || a.purchasePrice);
                valB = b.amount * (valuationData[b.id] || b.purchasePrice);
                break;
            case 'pnl':
                const priceA = valuationData[a.id] || a.purchasePrice;
                const costA = a.amount * a.purchasePrice + a.expenses;
                valA = (a.amount * priceA) - costA;
                const priceB = valuationData[b.id] || b.purchasePrice;
                const costB = b.amount * b.purchasePrice + b.expenses;
                valB = (b.amount * priceB) - costB;
                break;
            default:
                valA = 0; valB = 0;
        }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
    });
    return { ...activePortfolioRaw, assets: sortedAssets };
  }, [activePortfolioRaw, sortConfig, valuationData]);

  const isTotalView = activePortfolioId === TOTAL_PORTFOLIO_ID;

  useEffect(() => {
    localStorage.setItem('criptogo_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  useEffect(() => {
    const refreshPrices = async () => {
      if (!activePortfolio || activePortfolio.assets.length === 0) return;
      setIsLoading(true);
      const prices: Record<string, number> = { ...valuationData };
      try {
        await Promise.all(activePortfolio.assets.map(async (asset) => {
          try {
            const data = await fetchAssetData(asset.symbol, asset.type);
            prices[asset.id] = data.daily.price;
          } catch (err) {
            console.warn(`No price for ${asset.symbol}`);
          }
        }));
        setValuationData(prices);
      } catch (e) {
        console.error("Valuation Error", e);
      } finally {
        setIsLoading(false);
      }
    };
    refreshPrices();
  }, [activePortfolioId, activePortfolioRaw?.assets.length]);

  const metrics = useMemo(() => {
    if (!activePortfolio) return { total: 0, cost: 0, pnl: 0, pnlPct: 0, expenses: 0 };
    let totalValue = 0;
    let totalCost = 0;
    let totalExpenses = 0;
    activePortfolio.assets.forEach(asset => {
      const currentPrice = valuationData[asset.id] || asset.purchasePrice;
      totalValue += asset.amount * currentPrice;
      totalCost += asset.amount * asset.purchasePrice;
      totalExpenses += asset.expenses || 0;
    });
    const pnl = totalValue - (totalCost + totalExpenses);
    const pnlPct = (totalCost + totalExpenses) > 0 ? (pnl / (totalCost + totalExpenses)) * 100 : 0;
    return { total: totalValue, cost: totalCost, pnl, pnlPct, expenses: totalExpenses };
  }, [activePortfolio, valuationData]);

  const formatInputNumber = (val: string) => {
    const isNegative = val.startsWith('-');
    const digitsOnly = val.replace(/[^\d,]/g, '');
    if (!digitsOnly && isNegative) return '-';
    if (!digitsOnly) return '';
    const parts = digitsOnly.split(',');
    if (parts.length > 2) return val;
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (isNegative ? '-' : '') + parts.join(',');
  };

  const parseToNumber = (val: string): number => {
    if (!val || val === '-') return 0;
    const isNegative = val.startsWith('-');
    const clean = val.replace(/-/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNegative ? -num : num;
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolio.name) return;
    const p: Portfolio = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPortfolio.name,
      description: newPortfolio.desc,
      assets: [],
      createdAt: Date.now()
    };
    setPortfolios([...portfolios, p]);
    setActivePortfolioId(p.id);
    setIsAddingPortfolio(false);
    setNewPortfolio({ name: '', desc: '' });
  };

  const handleExportCSV = () => {
    if (!activePortfolio) return;
    const headers = ["Simbolo", "Nombre", "Tipo", "Cantidad", "Precio Compra", "Gastos", "Fecha", "Precio Actual", "Valor Actual", "PnL Neto", "Comentarios"];
    const rows = activePortfolio.assets.map(asset => {
        const currentPrice = valuationData[asset.id] || 0;
        const value = asset.amount * currentPrice;
        const cost = asset.amount * asset.purchasePrice + (asset.expenses || 0);
        const pnl = value - cost;
        return [asset.symbol, asset.name, asset.type || 'CRYPTO', asset.amount, asset.purchasePrice, asset.expenses || 0, asset.purchaseDate, currentPrice, value, pnl, asset.comments || ""];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CriptoGO_${activePortfolio.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.symbol || !newAsset.amount || !activePortfolioId || isTotalView) return;
    
    if (isTransferMode && !targetPortfolioId) {
        alert("Por favor, selecciona una cartera de destino para el traspaso.");
        return;
    }

    setIsLoading(true);
    const resolved = await resolveAsset(newAsset.symbol);
    if (resolved) {
        const amountNum = parseToNumber(newAsset.amount);
        const priceNum = parseToNumber(newAsset.price);
        const expensesNum = parseToNumber(newAsset.expenses);

        if (isTransferMode) {
          const exitAsset: PortfolioAsset = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: resolved.symbol,
            name: resolved.name,
            type: resolved.type || 'CRYPTO',
            amount: -Math.abs(amountNum),
            purchasePrice: priceNum,
            expenses: expensesNum,
            purchaseDate: newAsset.date,
            comments: `Traspaso (Salida) hacia ${portfolios.find(p => p.id === targetPortfolioId)?.name}. ${newAsset.comments}`
          };
          const entryAsset: PortfolioAsset = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: resolved.symbol,
            name: resolved.name,
            type: resolved.type || 'CRYPTO',
            amount: Math.abs(amountNum),
            purchasePrice: priceNum,
            expenses: 0,
            purchaseDate: newAsset.date,
            comments: `Traspaso (Entrada) desde ${portfolios.find(p => p.id === activePortfolioId)?.name}. ${newAsset.comments}`
          };
          setPortfolios(portfolios.map(p => {
            if (p.id === activePortfolioId) return { ...p, assets: [exitAsset, ...p.assets] };
            if (p.id === targetPortfolioId) return { ...p, assets: [entryAsset, ...p.assets] };
            return p;
          }));
        } else if (editingAssetId) {
            setPortfolios(portfolios.map(p => {
                if (p.assets.some(a => a.id === editingAssetId)) {
                    return {
                        ...p,
                        assets: p.assets.map(a => a.id === editingAssetId ? { ...a, symbol: resolved.symbol, name: resolved.name, type: resolved.type || 'CRYPTO', amount: amountNum, purchasePrice: priceNum, expenses: expensesNum, purchaseDate: newAsset.date, comments: newAsset.comments } : a)
                    };
                }
                return p;
            }));
        } else {
            const asset: PortfolioAsset = { id: Math.random().toString(36).substr(2, 9), symbol: resolved.symbol, name: resolved.name, type: resolved.type || 'CRYPTO', amount: amountNum, purchasePrice: priceNum, expenses: expensesNum, purchaseDate: newAsset.date, comments: newAsset.comments };
            setPortfolios(portfolios.map(p => p.id === activePortfolioId ? { ...p, assets: [asset, ...p.assets] } : p));
        }
        setIsAddingAsset(false);
        setEditingAssetId(null);
        setIsTransferMode(false);
        setTargetPortfolioId('');
        setNewAsset({ symbol: '', amount: '', price: '', expenses: '', date: new Date().toISOString().split('T')[0], type: 'CRYPTO', comments: '' });
    }
    setIsLoading(false);
  };

  const handleEditAsset = (asset: PortfolioAsset) => {
    setEditingAssetId(asset.id);
    setNewAsset({
        symbol: asset.symbol,
        amount: new Intl.NumberFormat('es-ES').format(asset.amount),
        price: new Intl.NumberFormat('es-ES').format(asset.purchasePrice),
        expenses: asset.expenses ? new Intl.NumberFormat('es-ES').format(asset.expenses) : '',
        date: asset.purchaseDate,
        type: asset.type || 'CRYPTO',
        comments: asset.comments || ''
    });
    setIsTransferMode(false);
    setIsAddingAsset(true);
  };

  const handleGetHistoricalPrice = async () => {
    if (!newAsset.symbol || !newAsset.date) return;
    setIsFetchingHistorical(true);
    try {
      const price = await fetchPriceAtDate(newAsset.symbol, newAsset.type, newAsset.date);
      if (price !== null) {
        setNewAsset(prev => ({ ...prev, price: new Intl.NumberFormat('es-ES').format(price) }));
      }
    } catch (e) {
      console.error("Historical Price Error", e);
    } finally {
      setIsFetchingHistorical(false);
    }
  };

  const curSym = CURRENCIES[currency].symbol;
  const formatPrice = (val: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val * rate);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white pb-20">
      
      {/* Portfolio Header & Selectors */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full scrollbar-hide">
            {allPortfolios.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setActivePortfolioId(p.id)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activePortfolioId === p.id ? 'bg-white text-red-700 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {p.id === TOTAL_PORTFOLIO_ID ? <Globe size={14} /> : <Wallet size={14} />} {p.name}
                </button>
            ))}
            <button onClick={() => setIsAddingPortfolio(true)} className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-red-700 hover:bg-white transition-all flex items-center justify-center"><Plus size={18} /></button>
        </div>

        <div className="flex items-center gap-2">
            {activePortfolio && (
                <button onClick={handleExportCSV} className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-all flex items-center gap-2 border border-gray-200">
                    <Download size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">CSV</span>
                </button>
            )}
            {activePortfolio && !isTotalView && (
                <button onClick={() => { if(confirm("¿Eliminar cartera?")) setPortfolios(portfolios.filter(p => p.id !== activePortfolio.id)); setActivePortfolioId(TOTAL_PORTFOLIO_ID); }} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
            )}
        </div>
      </div>

      {!activePortfolio ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] text-center space-y-6">
              <div className="p-6 bg-gray-50 rounded-full text-gray-300"><Briefcase size={64} /></div>
              <h3 className="text-xl font-black text-gray-900 uppercase">Sin carteras activas</h3>
              <button onClick={() => setIsAddingPortfolio(true)} className="bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">Crear Cartera</button>
          </div>
      ) : (
          <div className="space-y-8">
              {/* Summary Card */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 min-h-[220px]">
                  <div className="absolute -right-8 -top-8 text-gray-50 opacity-10">{isTotalView ? <Globe size={180} /> : <Wallet size={180} />}</div>
                  <div className="relative z-10 flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                         {isTotalView ? <Globe size={14} className="text-red-700" /> : <Briefcase size={14} className="text-red-700" />} 
                         VALOR TOTAL {activePortfolio.name.toUpperCase()}
                      </span>
                      <div className="text-5xl md:text-7xl font-mono font-black text-gray-900 tracking-tighter leading-none py-1">
                          {curSym}{formatPrice(metrics.total)}
                      </div>
                      <div className="flex items-center gap-4 pt-1">
                         <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase ${metrics.pnl >= 0 ? 'bg-gray-50 text-gray-900 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {metrics.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {metrics.pnlPct.toFixed(2)}%
                         </div>
                         <span className={`text-sm font-bold ${metrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metrics.pnl >= 0 ? '+' : ''}{formatPrice(metrics.pnl)} {currency} (Neto)
                         </span>
                      </div>
                  </div>
                  <div className="relative z-10 w-full md:w-80 space-y-6 pt-6 md:pt-0 md:border-l md:border-gray-50 md:pl-10">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Coste Bruto</span>
                              <div className="font-mono font-black text-gray-900 text-base tracking-tight">{curSym}{formatPrice(metrics.cost)}</div>
                          </div>
                          <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Gastos</span>
                              <div className="font-mono font-black text-red-700 text-base tracking-tight">{curSym}{formatPrice(metrics.expenses)}</div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Assets Section Control */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                      <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                              <Activity size={20} className="text-gray-900" />
                              <h2 className="font-black text-gray-900 text-sm uppercase tracking-tight">Posiciones</h2>
                          </div>
                          
                          {/* Sorter Component */}
                          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                              <select 
                                value={sortConfig.key} 
                                onChange={(e) => setSortConfig({...sortConfig, key: e.target.value as SortKey})}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none px-2 cursor-pointer text-gray-500 hover:text-gray-900"
                              >
                                <option value="date">Fecha</option>
                                <option value="symbol">Ticker</option>
                                <option value="value">Valor</option>
                                <option value="pnl">Beneficio</option>
                                <option value="amount">Cant.</option>
                              </select>
                              <button 
                                onClick={() => setSortConfig({...sortConfig, order: sortConfig.order === 'asc' ? 'desc' : 'asc'})}
                                className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-700 transition-all"
                              >
                                {sortConfig.order === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                              </button>
                          </div>

                          {!isTotalView && (
                            <button onClick={() => { setEditingAssetId(null); setIsTransferMode(false); setIsAddingAsset(true); }} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95">
                                <Plus size={16} /> Añadir Activo
                            </button>
                          )}
                      </div>

                      <div className="flex items-center gap-4">
                          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                              <button onClick={() => setAssetListView('list')} className={`p-1.5 rounded-lg transition-all ${assetListView === 'list' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List size={16} /></button>
                              <button onClick={() => setAssetListView('grid')} className={`p-1.5 rounded-lg transition-all ${assetListView === 'grid' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={16} /></button>
                          </div>
                      </div>
                  </div>

                  {assetListView === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Activo</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantidad</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">P&L Neto (%)</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Coste + Gastos</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                    {!isTotalView && <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activePortfolio.assets.map(asset => {
                                    const currentPrice = valuationData[asset.id] || 0;
                                    const value = asset.amount * currentPrice;
                                    const cost = asset.amount * asset.purchasePrice + (asset.expenses || 0);
                                    const pnl = value - cost;
                                    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                                    const isPos = pnl >= 0;
                                    return (
                                        <tr key={asset.id} onClick={() => !isTotalView && handleEditAsset(asset)} className="hover:bg-gray-50/30 transition-colors group cursor-pointer">
                                            <td className="px-4 py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[8px] text-gray-400 uppercase">{asset.symbol.slice(0, 2)}</div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                          <div className="font-black text-gray-900 text-[12px]">{asset.symbol}</div>
                                                          {asset.comments && <MessageSquare size={10} className="text-gray-300" />}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5 leading-none">{asset.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-4 py-1.5 font-mono font-bold text-[11px] ${asset.amount < 0 ? 'text-red-600' : 'text-gray-700'}`}>{asset.amount.toLocaleString('es-ES')}</td>
                                            <td className="px-4 py-1.5"><span className="font-mono font-black text-gray-900 text-xs">{curSym}{formatPrice(value)}</span></td>
                                            <td className="px-4 py-1.5">
                                                <div className={`inline-flex items-center gap-1 font-black text-[11px] ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {Math.abs(pnlPct).toFixed(2)}%
                                                </div>
                                                <div className={`text-[8px] font-bold ${isPos ? 'text-green-600' : 'text-red-400'} uppercase leading-none`}>{isPos ? '+' : ''}{formatPrice(pnl)}</div>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <div className="font-mono font-bold text-gray-500 text-[11px]">{curSym}{formatPrice(cost)}</div>
                                                {asset.expenses > 0 && <div className="text-[8px] text-red-400 font-bold uppercase">Incl. {curSym}{formatPrice(asset.expenses)} gastos</div>}
                                            </td>
                                            <td className="px-4 py-1.5 font-mono font-bold text-gray-500 text-[10px] uppercase tracking-tighter">
                                                {new Date(asset.purchaseDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </td>
                                            {!isTotalView && (
                                              <td className="px-4 py-1.5 text-right">
                                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                      <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="p-1 text-gray-300 hover:text-gray-900 transition-all"><Edit3 size={13} /></button>
                                                      <button onClick={(e) => { e.stopPropagation(); if(confirm("¿Borrar?")) setPortfolios(portfolios.map(p => ({...p, assets: p.assets.filter(a => a.id !== asset.id)}))); }} className="p-1 text-gray-300 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                                                  </div>
                                              </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 bg-gray-50/20">
                        {activePortfolio.assets.map(asset => {
                            const currentPrice = valuationData[asset.id] || 0;
                            const value = asset.amount * currentPrice;
                            const cost = asset.amount * asset.purchasePrice + (asset.expenses || 0);
                            const pnl = value - cost;
                            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                            const isPos = pnl >= 0;
                            return (
                                <div key={asset.id} onClick={() => !isTotalView && handleEditAsset(asset)} className="bg-white border border-gray-100 p-4 rounded-[2rem] shadow-sm hover:shadow-md hover:border-red-100 transition-all group cursor-pointer relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-gray-950 text-white flex items-center justify-center font-black text-[9px] uppercase">{asset.symbol.slice(0, 2)}</div>
                                            <div>
                                                <div className="font-black text-gray-900 text-[12px]">{asset.symbol}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[80px]">{asset.name}</div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {isPos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {Math.abs(pnlPct).toFixed(2)}%
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">Valor Nivel</div>
                                            <div className="font-mono font-black text-gray-900 text-sm">{curSym}{formatPrice(value)}</div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">PnL Neto</div>
                                            <div className={`font-mono font-black text-xs ${isPos ? 'text-green-600' : 'text-red-600'}`}>{isPos ? '+' : ''}{formatPrice(pnl)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  )}
              </div>
          </div>
      )}

      {/* NEW PORTFOLIO MODAL */}
      {isAddingPortfolio && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-900 text-white rounded-xl shadow-lg"><Briefcase size={18} /></div>
                          <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tight">Nueva Cartera</h3>
                      </div>
                      <button onClick={() => setIsAddingPortfolio(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleAddPortfolio} className="p-8 space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                          <input required type="text" value={newPortfolio.name} onChange={(e) => setNewPortfolio({...newPortfolio, name: e.target.value})} placeholder="Ej: Trading Activo" className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                          <textarea value={newPortfolio.desc} onChange={(e) => setNewPortfolio({...newPortfolio, desc: e.target.value})} placeholder="Estrategia..." className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all min-h-[80px]" />
                      </div>
                      <button type="submit" className="w-full bg-red-700 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-900/10 active:scale-95 mt-4">Crear Cartera</button>
                  </form>
              </div>
          </div>
      )}

      {/* ADD/EDIT ASSET MODAL - UPDATED WITH DESTINATION PORTFOLIO */}
      {isAddingAsset && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-white">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-red-700 text-white rounded-xl shadow-lg">
                            {isTransferMode ? <ArrowRightLeft size={18} strokeWidth={3} /> : editingAssetId ? <Edit3 size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-base uppercase tracking-tighter leading-none">{isTransferMode ? 'Traspaso de Activos' : editingAssetId ? 'Editar Posición' : 'Nueva Posición'}</h3>
                            <p className="text-[8px] text-gray-400 font-black uppercase mt-1 tracking-widest">Cartera Origen: <span className="text-gray-900">{activePortfolio?.name}</span></p>
                          </div>
                      </div>
                      <button onClick={() => { setIsAddingAsset(false); setEditingAssetId(null); setIsTransferMode(false); }} className="p-2 hover:bg-gray-50 rounded-full text-gray-300 hover:text-red-700 transition-all"><X size={18} /></button>
                  </div>
                  <form onSubmit={handleAddAsset} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ticker</label>
                              <div className="relative group">
                                  <input required type="text" value={newAsset.symbol} onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})} placeholder="BTC, NVDA..." className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-8 rounded-xl text-xs font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 outline-none transition-all uppercase" />
                                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad</label>
                              <input required type="text" inputMode="decimal" value={newAsset.amount} onChange={(e) => setNewAsset({...newAsset, amount: formatInputNumber(e.target.value)})} placeholder="Ej: 0.5" className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 outline-none transition-all" />
                          </div>
                      </div>

                      {isTransferMode && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                            <label className="text-[9px] font-black text-red-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <ArrowRight size={12} /> Cartera de Destino
                            </label>
                            <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {portfolios.filter(p => p.id !== activePortfolioId).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setTargetPortfolioId(p.id)}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group ${targetPortfolioId === p.id ? 'bg-white border-red-700 shadow-sm ring-1 ring-red-700/20' : 'bg-white border-gray-100 hover:border-red-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${targetPortfolioId === p.id ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Wallet size={12} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${targetPortfolioId === p.id ? 'text-red-900' : 'text-gray-900'}`}>{p.name}</span>
                                        </div>
                                        {targetPortfolioId === p.id && <Check size={14} className="text-red-700" strokeWidth={3} />}
                                    </button>
                                ))}
                                {portfolios.length <= 1 && (
                                    <div className="py-4 text-center">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase italic">Debes crear otra cartera para realizar traspasos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio USD</label>
                              <div className="relative flex items-center gap-1.5">
                                <div className="relative flex-1">
                                    <input required type="text" inputMode="decimal" value={newAsset.price} onChange={(e) => setNewAsset({...newAsset, price: formatInputNumber(e.target.value)})} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 outline-none transition-all" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 font-black text-[8px] uppercase">USD</div>
                                </div>
                                <button type="button" onClick={handleGetHistoricalPrice} disabled={isFetchingHistorical} className="p-2.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-all text-red-700 shadow-sm">{isFetchingHistorical ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}</button>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Gastos / Comis.</label>
                              <div className="relative">
                                  <input type="text" inputMode="decimal" value={newAsset.expenses} onChange={(e) => setNewAsset({...newAsset, expenses: formatInputNumber(e.target.value)})} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-black text-red-700 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 outline-none transition-all shadow-sm" />
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 font-black text-[8px] uppercase">USD</div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Operación</label>
                          <input required type="date" value={newAsset.date} onChange={(e) => setNewAsset({...newAsset, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 outline-none transition-all" />
                      </div>

                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Comentarios</label>
                          <textarea value={newAsset.comments} onChange={(e) => setNewAsset({...newAsset, comments: e.target.value})} placeholder="Notas..." className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-[10px] font-bold focus:ring-4 focus:ring-red-700/5 outline-none transition-all min-h-[50px] resize-none" />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button type="button" onClick={() => setIsTransferMode(!isTransferMode)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${isTransferMode ? 'bg-red-700 border-red-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 shadow-sm'}`}>
                            <ArrowRightLeft size={14} /> {isTransferMode ? 'Modo Alta' : 'Traspaso'}
                        </button>
                        <button disabled={isLoading || (isTransferMode && !targetPortfolioId)} type="submit" className="flex-1 bg-gray-900 hover:bg-black text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-30">
                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : (
                                <>{isTransferMode ? 'Ejecutar Traspaso' : editingAssetId ? 'Guardar Cambios' : 'Registrar Posición'}</>
                            )}
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
