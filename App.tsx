
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Asset, CurrencyCode, AssetType, CurrencyConfig } from './types';
import { COLORS, DEFAULT_ASSETS, TOP_STOCKS, CURRENCIES, getAllowedIps, validateKey } from './Plantilla/Parameters';
import { resolveAsset, fetchExchangeRates, fetchAssetsFromSheet } from './services/market';
import { getSmartRecommendation } from './services/gemini';
import AssetCard from './components/AssetCard';
import FearGreedWidget from './components/FearGreedWidget';
import VixWidget from './components/VixWidget';
import { Security } from './Plantilla/Seguridad';
import { Shell } from './Plantilla/Shell';
import CryptoCorrelationPro from './components/CryptoCorrelationPro';
import AiSuggestionModal from './components/AiSuggestionModal';
import GeneralDashboard from './components/GeneralDashboard';
import PortfolioView from './components/PortfolioView';
import { Guia } from './components/Guia';
import { 
  Loader2, Search, Plus, BrainCircuit, Sparkles, 
  AlertCircle, LayoutGrid, Briefcase, LucideIcon,
  CheckCircle2, ArrowRight, X, Info
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('app_is_auth_v2') === 'true');
  const [userIp, setUserIp] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  
  const [view, setView] = useState<'overview' | 'dashboard' | 'correlation' | 'portfolio' | 'guia'>(() => {
    const savedView = localStorage.getItem('app_current_view');
    return (savedView as any) || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('app_current_view', view);
  }, [view]);

  const [scrollToSymbol, setScrollToSymbol] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [apiKey, setApiKey] = useState<string>(() => {
      const stored = localStorage.getItem('app_apikey');
      return (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('criptogo_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  const [marketMode, setMarketMode] = useState<AssetType>(() => {
    const saved = localStorage.getItem('criptogo_market_mode');
    return (saved as AssetType) || 'CRYPTO';
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  const [pendingPortfolioAsset, setPendingPortfolioAsset] = useState<{symbol: string, type: AssetType} | null>(null);

  useEffect(() => {
    const initAssets = async () => {
        const saved = localStorage.getItem('criptogo_real_assets');
        if (saved) {
            setAssets(JSON.parse(saved));
        } else {
            const sheetAssets = await fetchAssetsFromSheet();
            if (sheetAssets && sheetAssets.length > 0) {
                setAssets(sheetAssets);
            } else {
                setAssets(DEFAULT_ASSETS);
            }
        }
        setIsAssetsLoaded(true);
    };
    initAssets();
  }, []);

  useEffect(() => {
      if (isAssetsLoaded) {
          localStorage.setItem('criptogo_real_assets', JSON.stringify(assets));
      }
  }, [assets, isAssetsLoaded]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('criptogo_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 });
  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [aiSuggestionData, setAiSuggestionData] = useState<{symbol: string, reason: string, label: string} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [foundAssetPreview, setFoundAssetPreview] = useState<Asset | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const getRates = async () => {
          const freshRates = await fetchExchangeRates();
          setRates(freshRates);
      };
      getRates();
  }, [refreshTrigger]);

  useEffect(() => {
    if (view === 'dashboard' && scrollToSymbol) {
        let attempts = 0;
        const intervalId = setInterval(() => {
            const element = document.getElementById(`asset-card-${scrollToSymbol}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                element.classList.add('ring-4', 'ring-red-500/30', 'transition-all', 'duration-700');
                setTimeout(() => { element.classList.remove('ring-4', 'ring-red-500/30'); }, 2000);
                setScrollToSymbol(null);
                clearInterval(intervalId);
            } else {
                attempts++;
                if (attempts >= 20) {
                    clearInterval(intervalId);
                    setScrollToSymbol(null);
                }
            }
        }, 100);
        return () => clearInterval(intervalId);
    }
  }, [view, scrollToSymbol]);

  useEffect(() => {
    if (view === 'dashboard' && !scrollToSymbol && inputRef.current) {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (!autoRefresh || view === 'dashboard' || view === 'correlation' || view === 'portfolio') return;
    
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      setLastUpdate(new Date());
    }, 60000); 
    return () => clearInterval(interval);
  }, [autoRefresh, view]);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        if (getAllowedIps().includes(data.ip)) {
          handleLoginSuccess();
        }
      })
      .catch(e => console.error("IP check failed", e));
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!apiKey) {
        setIsKeyValid(false);
        return;
      }
      const valid = await validateKey(apiKey);
      setIsKeyValid(valid);
    };
    check();
  }, [apiKey]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('app_is_auth_v2', 'true');
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey', key);
    handleManualRefresh();
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
  };

  useEffect(() => { localStorage.setItem('criptogo_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('criptogo_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('criptogo_market_mode', marketMode); }, [marketMode]);

  const visibleAssets = useMemo(() => {
    let list: Asset[] = [];
    if (view === 'dashboard' || view === 'overview') {
        const userStocks = assets.filter(a => a.type === 'STOCK');
        const userCryptos = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
        const topStocks = TOP_STOCKS.filter(t => !userStocks.some(u => u.symbol === t.symbol));
        list = [...userCryptos, ...userStocks, ...topStocks];
    } else {
        if (marketMode === 'CRYPTO') {
            list = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
        } else {
            const userStocks = assets.filter(a => a.type === 'STOCK');
            const topStocks = TOP_STOCKS.filter(t => !userStocks.some(u => u.symbol === t.symbol));
            list = [...userStocks, ...topStocks];
        }
    }
    return list.map(asset => ({ ...asset, isFavorite: favorites.includes(asset.symbol) }))
               .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
  }, [assets, marketMode, favorites, view]);

  const handleSearchAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || isSearching) return;
    setIsSearching(true);
    setAddError(null);
    setFoundAssetPreview(null);
    
    let targetSymbol = newSymbol.trim();
    if (['?', '?+', '?++', '?-'].includes(targetSymbol)) {
        if (!isKeyValid) {
            setAddError("Configura una API Key válida en Ajustes.");
            setIsSearching(false);
            return;
        }
        try {
            let cmd: 'BEST' | 'SHORT' | 'MID' | 'RISK' = 'BEST';
            let label = 'Mejor Valor';
            if (targetSymbol === '?+') { cmd = 'SHORT'; label = 'Crecimiento Corto'; }
            else if (targetSymbol === '?++') { cmd = 'MID'; label = 'Crecimiento Medio'; }
            else if (targetSymbol === '?-') { cmd = 'RISK'; label = 'Especulativo'; }
            const suggestion = await getSmartRecommendation(cmd, marketMode, apiKey, visibleAssets.map(a => a.symbol));
            if (!suggestion) throw new Error();
            targetSymbol = suggestion.symbol;
            setAiSuggestionData({ ...suggestion, label });
        } catch {
            setAddError("Error en la Búsqueda Inteligente.");
            setIsSearching(false);
            return;
        }
    }

    const foundAsset = await resolveAsset(targetSymbol);
    if (foundAsset) {
        setFoundAssetPreview(foundAsset);
    } else {
        setAddError(`No se encontró "${targetSymbol}".`);
    }
    setIsSearching(false);
  };

  const handleConfirmAdd = () => {
    if (!foundAssetPreview) return;
    
    const isAlreadyInList = assets.some(a => a.symbol === foundAssetPreview.symbol);
    
    if (isAlreadyInList) {
        setScrollToSymbol(foundAssetPreview.symbol);
        if (view !== 'dashboard') setView('dashboard');
    } else {
        setAssets(prev => [foundAssetPreview, ...prev]);
        setScrollToSymbol(foundAssetPreview.symbol);
        if (view !== 'dashboard') setView('dashboard');
    }
    
    setNewSymbol('');
    setFoundAssetPreview(null);
  };

  const [showAjustes, setShowAjustes] = useState(false);

  if (!isAuthenticated) return <Security onLogin={handleLoginSuccess} />;

  return (
    <Shell 
      apiKey={apiKey} 
      onApiKeySave={handleApiKeySave} 
      userIp={userIp} 
      isKeyValid={isKeyValid}
      currency={currency}
      onCurrencyChange={setCurrency}
      rates={rates}
    >
      <div className="space-y-8 pb-20">
        
        {/* Navegación Global */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-10">
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit shadow-inner border border-gray-200/50">
                {[
                    { id: 'overview', label: 'Resumen', short: 'Res.', icon: LayoutGrid },
                    { id: 'dashboard', label: 'Análisis', short: 'Anál.', icon: BrainCircuit },
                    { id: 'correlation', label: 'Correlación', short: 'Corr.', icon: Sparkles },
                    { id: 'portfolio', label: 'Cartera', short: 'Cart.', icon: Briefcase },
                    { id: 'guia', label: 'Guía', short: 'Guía', icon: BrainCircuit }
                ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setView(tab.id as any)}
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-5 py-2.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-tight md:tracking-widest transition-all ${view === tab.id ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <tab.icon size={14} className="flex-shrink-0" /> 
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="inline md:hidden">{tab.short}</span>
                    </button>
                ))}
            </div>
        </div>

        {view === 'overview' && (
            <GeneralDashboard 
                userAssets={visibleAssets} 
                currency={currency} 
                rate={rates[currency]} 
                onAddClick={() => setView('dashboard')}
                onDelete={(s) => setAssets(assets.filter(a => a.symbol !== s))}
                onToggleFavorite={(s) => setFavorites(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s])}
                onMove={(s, d) => {
                    const idx = assets.findIndex(a => a.symbol === s);
                    if (idx === -1) return;
                    const newArr = [...assets];
                    const target = d === 'left' ? idx - 1 : idx + 1;
                    if (target >= 0 && target < newArr.length) {
                        [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
                        setAssets(newArr);
                    }
                }}
                onWidgetClick={(asset) => {
                    setScrollToSymbol(asset.symbol);
                    setView('dashboard');
                }}
                refreshTrigger={refreshTrigger}
                lastUpdate={lastUpdate}
                autoRefresh={autoRefresh}
                onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
                onManualRefresh={handleManualRefresh}
            />
        )}

        {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-[180px]">
                        <div className="grid grid-cols-2 h-full divide-x divide-gray-50">
                            <FearGreedWidget />
                            <VixWidget />
                        </div>
                    </div>
                    <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center min-h-[180px]">
                        <div className="space-y-2 mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terminal de Búsqueda</label>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div className="flex-1 w-full flex flex-col gap-2">
                                <form onSubmit={handleSearchAsset} className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input 
                                                ref={inputRef}
                                                type="text" 
                                                value={newSymbol} 
                                                onChange={(e) => {
                                                    setNewSymbol(e.target.value);
                                                    if (!e.target.value) setFoundAssetPreview(null);
                                                }}
                                                placeholder="Símbolo o '?', '?+', '?++', '?-' para IA"
                                                className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all"
                                            />
                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            {newSymbol && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => {setNewSymbol(''); setFoundAssetPreview(null);}}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-700 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isSearching || !newSymbol} className="bg-gray-900 hover:bg-black text-white px-8 h-[52px] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                        {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                    </button>
                                </form>
                                
                                {/* PREVISUALIZACIÓN DE ACTIVO IDENTIFICADO */}
                                {foundAssetPreview && (
                                    <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-2xl shadow-xl border-l-4 border-red-700">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs text-red-500">
                                                    {foundAssetPreview.symbol.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black uppercase tracking-tight">{foundAssetPreview.name}</span>
                                                        <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{foundAssetPreview.symbol}</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                        <Info size={10} />
                                                        Identificado en {foundAssetPreview.type === 'STOCK' ? 'Yahoo Finance (Bolsa)' : 'Binance (Cripto)'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleConfirmAdd}
                                                className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                                            >
                                                {assets.some(a => a.symbol === foundAssetPreview.symbol) ? (
                                                    <><ArrowRight size={14} strokeWidth={3} /> Ir al Activo</>
                                                ) : (
                                                    <><CheckCircle2 size={14} strokeWidth={3} /> Confirmar y Añadir</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex bg-gray-900 p-1.5 rounded-2xl h-fit ml-0 md:ml-4">
                                <button onClick={() => setMarketMode('CRYPTO')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${marketMode === 'CRYPTO' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}>Cripto</button>
                                <button onClick={() => setMarketMode('STOCK')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${marketMode === 'STOCK' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}>Bolsa</button>
                            </div>
                        </div>
                        {addError && <div className="mt-3 text-red-600 text-[10px] font-black uppercase flex items-center gap-1"><AlertCircle size={12} /> {addError}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {visibleAssets.map((asset, index) => (
                        <AssetCard 
                            key={`${asset.symbol}-${asset.type}`}
                            asset={asset}
                            index={index}
                            total={visibleAssets.length}
                            refreshTrigger={refreshTrigger}
                            currency={currency}
                            rate={rates[currency]}
                            apiKey={apiKey}
                            onDelete={(s) => setAssets(assets.filter(a => a.symbol !== s))}
                            onToggleFavorite={(s) => setFavorites(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s])}
                            onMove={(s, d) => {
                                const idx = assets.findIndex(a => a.symbol === s);
                                if (idx !== -1) {
                                    const newArr = [...assets];
                                    const target = d === 'left' ? idx - 1 : idx + 1;
                                    if (target >= 0 && target < newArr.length) {
                                        [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
                                        setAssets(newArr);
                                    }
                                }
                            }}
                            onAddToPortfolio={(symbol, type) => {
                                setPendingPortfolioAsset({ symbol, type });
                                setView('portfolio');
                            }}
                            onRequireKey={() => setShowAjustes(true)} 
                        />
                    ))}
                </div>
            </div>
        )}

        {view === 'correlation' && (
            <CryptoCorrelationPro 
              apiKey={apiKey} 
              onRequireKey={() => setShowAjustes(true)} 
              currency={currency} 
              rate={rates[currency]} 
              availableAssets={assets} 
            />
        )}

        {view === 'portfolio' && (
            <PortfolioView 
              currency={currency}
              rate={rates[currency]}
              initialAssetData={pendingPortfolioAsset}
              onHandledInitialSymbol={() => setPendingPortfolioAsset(null)}
            />
        )}

        {view === 'guia' && <Guia />}
      </div>
      
      {aiSuggestionData && (
          <AiSuggestionModal 
            symbol={aiSuggestionData.symbol} 
            reason={aiSuggestionData.reason} 
            criteriaLabel={aiSuggestionData.label} 
            onClose={() => setAiSuggestionData(null)} 
          />
      )}
    </Shell>
  );
}
