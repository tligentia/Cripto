
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Plus, Trash2, TrendingUp, TrendingDown, 
  ChevronRight, Wallet, PieChart, LineChart, 
  ArrowUpRight, ArrowDownRight, Loader2, Calendar, 
  DollarSign, RefreshCw, AlertCircle, Layers, X, Edit3, Search, Zap, Globe, Info, Activity, AlertTriangle,
  List, LayoutGrid, MessageSquare
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

export default function PortfolioView({ currency, rate, initialAssetData, onHandledInitialSymbol }: Props) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const saved = localStorage.getItem('criptogo_portfolios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [assetListView, setAssetListView] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('criptogo_portfolio_view_mode');
    return (saved as 'list' | 'grid') || 'list';
  });

  useEffect(() => {
    localStorage.setItem('criptogo_portfolio_view_mode', assetListView);
  }, [assetListView]);

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

  const [newAsset, setNewAsset] = useState({ 
    symbol: '', 
    amount: '', 
    price: '', 
    date: new Date().toISOString().split('T')[0], 
    type: 'CRYPTO' as AssetType,
    comments: ''
  });
  const [newPortfolio, setNewPortfolio] = useState({ name: '', desc: '' });

  // Handle initial redirection from Analysis
  useEffect(() => {
    if (initialAssetData && portfolios.length > 0) {
      // If we are in "TOTAL" view, switch to the first real portfolio
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

  const activePortfolio = useMemo(() => 
    allPortfolios.find(p => p.id === activePortfolioId), 
  [allPortfolios, activePortfolioId]);

  const isTotalView = activePortfolioId === TOTAL_PORTFOLIO_ID;

  useEffect(() => {
    localStorage.setItem('criptogo_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  const [valuationData, setValuationData] = useState<Record<string, number>>({});
  
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
  }, [activePortfolioId, activePortfolio?.assets.length]);

  const metrics = useMemo(() => {
    if (!activePortfolio) return { total: 0, cost: 0, pnl: 0, pnlPct: 0 };
    
    let totalValue = 0;
    let totalCost = 0;

    activePortfolio.assets.forEach(asset => {
      const currentPrice = valuationData[asset.id] || asset.purchasePrice;
      totalValue += asset.amount * currentPrice;
      totalCost += asset.amount * asset.purchasePrice;
    });

    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    return { total: totalValue, cost: totalCost, pnl, pnlPct };
  }, [activePortfolio, valuationData]);

  const formatInputNumber = (val: string) => {
    const cleanValue = val.replace(/[^\d,]/g, '');
    const parts = cleanValue.split(',');
    if (parts.length > 2) return val;
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
  };

  const parseToNumber = (val: string): number => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.'));
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

  const handleDeletePortfolio = (id: string) => {
    if (id === TOTAL_PORTFOLIO_ID) return;
    if (!confirm("¿Eliminar esta cartera y todos sus activos?")) return;
    const filtered = portfolios.filter(p => p.id !== id);
    setPortfolios(filtered);
    if (activePortfolioId === id) {
      setActivePortfolioId(filtered.length > 0 ? TOTAL_PORTFOLIO_ID : null);
    }
  };

  const handleGetHistoricalPrice = async () => {
      if (!newAsset.symbol || !newAsset.date) return;
      setIsFetchingHistorical(true);
      try {
          const resolved = await resolveAsset(newAsset.symbol);
          if (resolved) {
              const histPrice = await fetchPriceAtDate(resolved.symbol, resolved.type || 'CRYPTO', newAsset.date);
              if (histPrice) {
                  const formatted = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 }).format(histPrice);
                  setNewAsset(prev => ({ ...prev, price: formatted }));
              }
          }
      } catch (e) { console.error(e); } finally { setIsFetchingHistorical(false); }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.symbol || !newAsset.amount || !activePortfolioId || isTotalView) return;
    setIsLoading(true);
    const resolved = await resolveAsset(newAsset.symbol);
    if (resolved) {
        if (editingAssetId) {
            setPortfolios(portfolios.map(p => {
                if (p.assets.some(a => a.id === editingAssetId)) {
                    return {
                        ...p,
                        assets: p.assets.map(a => a.id === editingAssetId ? {
                            ...a,
                            symbol: resolved.symbol,
                            name: resolved.name,
                            type: resolved.type || 'CRYPTO',
                            amount: parseToNumber(newAsset.amount),
                            purchasePrice: parseToNumber(newAsset.price),
                            purchaseDate: newAsset.date,
                            comments: newAsset.comments
                        } : a)
                    };
                }
                return p;
            }));
        } else {
            const asset: PortfolioAsset = {
                id: Math.random().toString(36).substr(2, 9),
                symbol: resolved.symbol,
                name: resolved.name,
                type: resolved.type || 'CRYPTO',
                amount: parseToNumber(newAsset.amount),
                purchasePrice: parseToNumber(newAsset.price),
                purchaseDate: newAsset.date,
                comments: newAsset.comments
            };
            setPortfolios(portfolios.map(p => p.id === activePortfolioId ? { ...p, assets: [asset, ...p.assets] } : p));
        }
        setIsAddingAsset(false);
        setEditingAssetId(null);
        setNewAsset({ symbol: '', amount: '', price: '', date: new Date().toISOString().split('T')[0], type: 'CRYPTO', comments: '' });
    }
    setIsLoading(false);
  };

  const handleEditAsset = (asset: PortfolioAsset) => {
    setEditingAssetId(asset.id);
    setNewAsset({
        symbol: asset.symbol,
        amount: new Intl.NumberFormat('es-ES').format(asset.amount),
        price: new Intl.NumberFormat('es-ES').format(asset.purchasePrice),
        date: asset.purchaseDate,
        type: asset.type || 'CRYPTO',
        comments: asset.comments || ''
    });
    setIsAddingAsset(true);
  };

  const removeAsset = (assetId: string) => {
    if (isTotalView) return;
    if (!confirm("¿Eliminar este registro?")) return;
    setPortfolios(portfolios.map(p => ({
        ...p,
        assets: p.assets.filter(a => a.id !== assetId)
    })));
    setIsAddingAsset(false);
    setEditingAssetId(null);
  };

  const curSym = CURRENCIES[currency].symbol;
  const formatPrice = (val: number) => {
    const formatted = new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val * rate);
    return formatted;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white">
      
      {/* Portfolio Selector */}
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
            <button 
              onClick={() => setIsAddingPortfolio(true)}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-red-700 hover:bg-white transition-all flex items-center justify-center"
            >
                <Plus size={18} />
            </button>
        </div>

        {activePortfolio && !isTotalView && (
            <button 
              onClick={() => handleDeletePortfolio(activePortfolio.id)}
              className="p-2 text-gray-300 hover:text-red-600 transition-colors"
              title="Eliminar Cartera"
            >
                <Trash2 size={18} />
            </button>
        )}
      </div>

      {!activePortfolio ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] text-center space-y-6">
              <div className="p-6 bg-gray-50 rounded-full text-gray-300"><Briefcase size={64} /></div>
              <h3 className="text-xl font-black text-gray-900 uppercase">Sin carteras activas</h3>
              <button onClick={() => setIsAddingPortfolio(true)} className="bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">Crear Cartera</button>
          </div>
      ) : (
          <div className="space-y-8">
              {/* Resumen Reestructurado - COMPACTO Y UNIFICADO */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 min-h-[220px]">
                  <div className="absolute -right-8 -top-8 text-gray-50 opacity-10">
                    {isTotalView ? <Globe size={180} /> : <Wallet size={180} />}
                  </div>
                  
                  {/* Lado Izquierdo: Valor Principal */}
                  <div className="relative z-10 flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                         {isTotalView ? <Globe size={14} className="text-red-700" /> : <Briefcase size={14} className="text-red-700" />} 
                         VALOR TOTAL {isTotalView ? 'GLOBAL' : activePortfolio.name.toUpperCase()}
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
                            {metrics.pnl >= 0 ? '+' : ''}{formatPrice(metrics.pnl)} {currency}
                         </span>
                      </div>
                  </div>

                  {/* Lado Derecho: Metadatos Compactos */}
                  <div className="relative z-10 w-full md:w-80 space-y-6 pt-6 md:pt-0 md:border-l md:border-gray-50 md:pl-10">
                      <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <Info size={12} className="text-red-700" /> Descripción
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic line-clamp-2">
                              "{activePortfolio.description || 'Sin descripción para esta cartera.'}"
                          </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Posiciones</span>
                              <div className="flex items-center gap-2 font-black text-gray-900 text-lg">
                                  <Layers size={14} className="text-red-700" /> {activePortfolio.assets.length}
                              </div>
                          </div>
                          <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Coste Total</span>
                              <div className="font-mono font-black text-gray-900 text-base tracking-tight">
                                  {curSym}{formatPrice(metrics.cost)}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Lista de Activos */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                              <Activity size={20} className="text-gray-900" />
                              <h2 className="font-black text-gray-900 text-sm uppercase tracking-tight">
                                {isTotalView ? 'Consolidado de Activos' : 'Activos en Cartera'}
                              </h2>
                          </div>
                          
                          {/* Toggle de Vista */}
                          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                              <button 
                                onClick={() => setAssetListView('list')}
                                className={`p-1.5 rounded-lg transition-all ${assetListView === 'list' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Vista de Lista"
                              >
                                  <List size={16} />
                              </button>
                              <button 
                                onClick={() => setAssetListView('grid')}
                                className={`p-1.5 rounded-lg transition-all ${assetListView === 'grid' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Vista de Cajitas"
                              >
                                  <LayoutGrid size={16} />
                              </button>
                          </div>
                      </div>

                      {!isTotalView && (
                        <button 
                          onClick={() => { setEditingAssetId(null); setIsAddingAsset(true); }}
                          className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                            <Plus size={16} /> Añadir Activo
                        </button>
                      )}
                  </div>

                  {assetListView === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Activo</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantidad</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">P&L (%)</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Coste compra</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio Compra</th>
                                    <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio Actual</th>
                                    {!isTotalView && <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activePortfolio.assets.map(asset => {
                                    const currentPrice = valuationData[asset.id] || 0;
                                    const value = asset.amount * currentPrice;
                                    const cost = asset.amount * asset.purchasePrice;
                                    const pnl = value - cost;
                                    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                                    const isPos = pnl >= 0;

                                    return (
                                        <tr 
                                          key={asset.id} 
                                          onClick={() => !isTotalView && handleEditAsset(asset)}
                                          title={asset.comments || 'Sin comentarios'}
                                          className="hover:bg-gray-50/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-4 py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[8px] text-gray-400">
                                                        {asset.symbol.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                          <div className="font-black text-gray-900 text-[12px]">{asset.symbol}</div>
                                                          {asset.comments && <MessageSquare size={10} className="text-gray-300" />}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5 leading-none">{asset.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 font-mono font-bold text-gray-700 text-[11px]">{asset.amount.toLocaleString('es-ES')}</td>
                                            <td className="px-4 py-1.5"><span className="font-mono font-black text-gray-900 text-xs">{curSym}{formatPrice(value)}</span></td>
                                            <td className="px-4 py-1.5">
                                                <div className={`inline-flex items-center gap-1 font-black text-[11px] ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {Math.abs(pnlPct).toFixed(2)}%
                                                </div>
                                                <div className={`text-[8px] font-bold ${isPos ? 'text-green-600' : 'text-red-400'} uppercase leading-none`}>
                                                    {isPos ? '+' : ''}{formatPrice(pnl)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 font-mono font-bold text-gray-500 text-[11px]">{curSym}{formatPrice(cost)}</td>
                                            <td className="px-4 py-1.5 font-mono font-bold text-gray-500 text-[10px] uppercase tracking-tighter">
                                                {new Date(asset.purchaseDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-1.5 font-mono font-bold text-gray-500 text-[11px]">{curSym}{formatPrice(asset.purchasePrice)}</td>
                                            <td className="px-4 py-1.5">
                                                {isLoading && !currentPrice ? <Loader2 size={12} className="animate-spin text-gray-200" /> : <span className="font-mono font-black text-gray-900 text-[11px]">{curSym}{formatPrice(currentPrice)}</span>}
                                            </td>
                                            {!isTotalView && (
                                              <td className="px-4 py-1.5 text-right">
                                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                      <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="p-1 text-gray-300 hover:text-gray-900 transition-all"><Edit3 size={13} /></button>
                                                      <button onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }} className="p-1 text-gray-300 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
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
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 bg-gray-50/20">
                        {activePortfolio.assets.map(asset => {
                            const currentPrice = valuationData[asset.id] || 0;
                            const value = asset.amount * currentPrice;
                            const cost = asset.amount * asset.purchasePrice;
                            const pnl = value - cost;
                            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                            const isPos = pnl >= 0;

                            return (
                                <div 
                                  key={asset.id} 
                                  onClick={() => !isTotalView && handleEditAsset(asset)}
                                  className="bg-white border border-gray-100 p-3 rounded-[2rem] shadow-sm hover:shadow-md hover:border-red-100 transition-all group cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-xl bg-gray-950 text-white flex items-center justify-center font-black text-[9px]">
                                                {asset.symbol.slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                  <div className="font-black text-gray-900 text-[11px] leading-none">{asset.symbol}</div>
                                                  {asset.comments && <MessageSquare size={8} className="text-gray-300" />}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5 truncate max-w-[80px]">{asset.name}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            {!isTotalView && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-0.5 bg-gray-50/80 backdrop-blur-sm p-0.5 rounded-lg border border-gray-100">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="p-1 text-gray-400 hover:text-gray-900 transition-colors"><Edit3 size={10} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }} className="p-1 text-gray-400 hover:text-red-700 transition-colors"><Trash2 size={10} /></button>
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${isPos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {isPos ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                                                {Math.abs(pnlPct).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {/* Metadatos subidos para compactar */}
                                        <div className="grid grid-cols-2 gap-1.5 py-0.5 border-b border-gray-50">
                                            <div className="flex flex-col">
                                                <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Cantidad</div>
                                                <div className="font-mono font-bold text-gray-700 text-[9px] truncate leading-none">
                                                    {asset.amount.toLocaleString('es-ES')}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col space-y-1">
                                                <div>
                                                  <div className="text-[6px] font-black text-gray-300 uppercase tracking-widest leading-none">Fecha</div>
                                                  <div className="font-mono font-bold text-gray-400 text-[7px] uppercase leading-none">
                                                      {new Date(asset.purchaseDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-[6px] font-black text-gray-400 uppercase tracking-widest zone">Precio</div>
                                                  <div className="font-mono font-bold text-gray-500 text-[8px] truncate leading-none">
                                                      {curSym}{formatPrice(asset.purchasePrice)}
                                                  </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end pt-0.5">
                                            <div className="space-y-0.5">
                                                <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">Valor actual</div>
                                                <div className="font-mono font-black text-gray-900 text-lg tracking-tighter leading-none">
                                                    {curSym}{formatPrice(value)}
                                                </div>
                                                <div className={`text-[8px] font-bold leading-none mt-0.5 ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPos ? '+' : ''}{formatPrice(pnl)}
                                                </div>
                                            </div>
                                            {asset.comments && (
                                                <div className="max-w-[70px] mb-0.5">
                                                    <p className="text-[7px] text-gray-400 italic font-bold leading-tight text-right break-words line-clamp-2">
                                                        {asset.comments.slice(0, 40)}{asset.comments.length > 40 ? '...' : ''}
                                                    </p>
                                                </div>
                                            )}
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

      {/* MODAL NUEVA CARTERA */}
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
                          <input required type="text" value={newPortfolio.name} onChange={(e) => setNewPortfolio({...newPortfolio, name: e.target.value})} placeholder="Ej: Inversión Largo Plazo" className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                          <textarea value={newPortfolio.desc} onChange={(e) => setNewPortfolio({...newPortfolio, desc: e.target.value})} placeholder="Estrategia u objetivo..." className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all min-h-[80px]" />
                      </div>
                      <button type="submit" className="w-full bg-red-700 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-900/10 active:scale-95 mt-4">Crear Cartera</button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL AÑADIR ACTIVO (EDITABLE) */}
      {isAddingAsset && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-white">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-red-700 text-white rounded-2xl shadow-xl shadow-red-700/20">
                            {editingAssetId ? <Edit3 size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tighter leading-none">{editingAssetId ? 'Editar Activo' : 'Añadir Activo'}</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase mt-2 tracking-widest">Cartera: <span className="text-gray-900">{activePortfolio?.name}</span></p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingAssetId && (
                            <button 
                                onClick={() => removeAsset(editingAssetId)} 
                                className="p-2 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-700 transition-all group"
                                title="Eliminar este activo"
                            >
                                <Trash2 size={28} />
                            </button>
                        )}
                        <button onClick={() => { setIsAddingAsset(false); setEditingAssetId(null); }} className="p-2 hover:bg-gray-50 rounded-full text-gray-300 hover:text-red-700 transition-all"><X size={28} /></button>
                      </div>
                  </div>
                  <form onSubmit={handleAddAsset} className="p-8 md:p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ticker</label>
                              <div className="relative group">
                                  <input required type="text" value={newAsset.symbol} onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})} placeholder="BTC, NVDA..." className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-2xl text-base font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 focus:bg-white outline-none transition-all uppercase shadow-sm" />
                                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-700 transition-colors" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad</label>
                              <input required type="text" inputMode="decimal" value={newAsset.amount} onChange={(e) => setNewAsset({...newAsset, amount: formatInputNumber(e.target.value)})} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-base font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 focus:bg-white outline-none transition-all shadow-sm" />
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Operación</label>
                              <input required type="date" value={newAsset.date} onChange={(e) => setNewAsset({...newAsset, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-base font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 focus:bg-white outline-none transition-all shadow-sm" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Compra (USD)</label>
                              <div className="relative flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input required type="text" inputMode="decimal" value={newAsset.price} onChange={(e) => setNewAsset({...newAsset, price: formatInputNumber(e.target.value)})} placeholder="0,00" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-base font-black text-gray-900 focus:ring-4 focus:ring-red-700/5 focus:border-red-700 focus:bg-white outline-none transition-all shadow-sm" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs uppercase">USD</div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleGetHistoricalPrice} 
                                    disabled={isFetchingHistorical} 
                                    className={`p-4 rounded-2xl border transition-all ${isFetchingHistorical ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-100 hover:bg-red-100 hover:scale-105 active:scale-95 group shadow-sm'}`}
                                    title="Auto-Check Precio Histórico"
                                >
                                    {isFetchingHistorical ? <Loader2 size={24} className="animate-spin text-red-700" /> : <Zap size={24} className="text-red-700 group-hover:fill-current" />}
                                </button>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comentarios / Notas Libres</label>
                          <textarea 
                              value={newAsset.comments} 
                              onChange={(e) => setNewAsset({...newAsset, comments: e.target.value})} 
                              placeholder="Notas sobre esta operación, estrategia, recordatorios..." 
                              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-700/5 focus:border-red-700 focus:bg-white outline-none transition-all shadow-sm min-h-[100px] resize-none"
                          />
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <button disabled={isLoading} type="submit" className="flex-1 bg-gray-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-[0.98] mt-4 flex items-center justify-center gap-4 group">
                            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>{editingAssetId ? 'Actualizar Registro' : 'Registrar Posición'}</>}
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
