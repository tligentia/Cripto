import React from 'react';
import { X, Layers, ShieldCheck, Zap, TrendingDown, Target, MousePointerClick, ExternalLink, ArrowUpRight } from 'lucide-react';

interface Props {
  type: 'conservative' | 'aggressive' | 'accumulation';
  assetA: string; // Base Token (e.g., BTC)
  assetB: string; // Quote Token (e.g., USDT)
  minPrice?: number;
  maxPrice?: number;
  onClose: () => void;
}

// Minimal mapping for major assets on Ethereum Mainnet to improve deep-linking
const COMMON_ADDRESSES: Record<string, string> = {
    'ETH': 'NATIVE',
    'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    'BTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
    'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
    'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    'MATIC': '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
};

const getAddressOrSymbol = (symbol: string) => {
    if (!symbol) return "";
    const clean = symbol.toUpperCase().replace('USDT', 'USDT').trim(); // Ensure standardization
    return COMMON_ADDRESSES[clean] || clean; // Return address if known, else symbol
};

const StrategyModal: React.FC<Props> = ({ type, assetA, assetB, minPrice, maxPrice, onClose }) => {
  
  // --- CONFIGURATION ---
  let config = {
    title: "",
    subtitle: "",
    color: "",
    bg: "",
    icon: Layers,
    desc: "",
    math: "",
    pros: "",
    cons: ""
  };

  switch (type) {
    case 'conservative':
      config = {
        title: "Rango Conservador (Wide)",
        subtitle: "Estrategia de Cobertura Total",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-100",
        icon: ShieldCheck,
        desc: "Este rango cubre la totalidad del movimiento histórico detectado en el periodo seleccionado, añadiendo un margen de seguridad extra del 5%.",
        math: "Mínimo Histórico (-5%) ↔ Máximo Histórico (+5%)",
        pros: "Mínimo mantenimiento. Muy bajo riesgo de que el precio se salga del rango (Impermanent Loss bajo). Ideal para dejar la posición abierta semanas o meses.",
        cons: "Menor rentabilidad (APR) porque la liquidez está muy dispersa. Se capturan menos comisiones."
      };
      break;
    case 'aggressive':
      config = {
        title: "Rango Agresivo (Narrow)",
        subtitle: "Estrategia de Rendimiento Máximo",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-100",
        icon: Zap,
        desc: "Este rango se centra exclusivamente en la zona de mayor probabilidad estadística actual, ignorando los extremos históricos.",
        math: "Precio Actual ± 1 Desviación Estándar (Volatilidad)",
        pros: "Rentabilidad (APR) explosiva. Al concentrar el capital donde está el precio ahora, capturas muchas más comisiones.",
        cons: "Alto mantenimiento. Si el precio se mueve con fuerza, se saldrá del rango rápidamente, dejando de generar comisiones y aumentando el Impermanent Loss."
      };
      break;
    case 'accumulation':
      config = {
        title: "Rango Captación (Compra de B con A)",
        subtitle: "Estrategia de Conversión de Activo",
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
        icon: TrendingDown,
        desc: "Operación diseñada para adquirir Activo B utilizando tu liquidez actual de Activo A. El rango se sitúa POR ENCIMA del precio actual.",
        math: "Precio Actual (+0.25%) ↔ Objetivo Superior (+2σ)",
        pros: "Depositas 100% de tu Activo A. Al fijar el rango arriba, estás programando órdenes de venta de A para comprar B conforme el precio sube. Es una forma eficiente de rotar capital o tomar beneficios (Take Profit) hacia una moneda estable.",
        cons: "Si el precio baja, mantienes tu posesión original del Activo A y no se ejecuta la compra de B."
      };
      break;
  }

  const Icon = config.icon;

  // --- URL CONSTRUCTION ---
  
  const tokenA = getAddressOrSymbol(assetA);
  const tokenB = getAddressOrSymbol(assetB);

  // 1. UNISWAP V3 DEEP LINK
  // Structure: priceRangeState encoded JSON
  const uniPriceState = JSON.stringify({
      minPrice: minPrice?.toString(),
      maxPrice: maxPrice?.toString(),
      inputMode: "price" 
  });
  
  const uniswapUrl = `https://app.uniswap.org/positions/create/v3?currencyA=${tokenA}&currencyB=${tokenB}&chain=ethereum&priceRangeState=${encodeURIComponent(uniPriceState)}`;
  
  // 2. REVERT FINANCE DEEP LINK (Network: BASE)
  const revertUrl = `https://revert.finance/#/initiator?network=base&exchange=uniswapv3&token0=${tokenA}&token1=${tokenB}`;
  
  // 3. HYPERLIQUID (Trading Pair)
  const hlUrl = `https://app.hyperliquid.xyz/trade/${assetA}`; 

  // 4. KRYSTAL DEFI (Swap / Pool)
  // Utiliza srcAddress y destAddress para pre-cargar los tokens en la interfaz de Swap/Pool
  const crystalUrl = `https://defi.krystal.app/swap?srcAddress=${tokenA}&destAddress=${tokenB}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      {/* Changed max-w-lg to max-w-4xl for wider layout */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${config.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/60 ${config.color}`}>
                <Icon size={28} />
            </div>
            <div>
                <h3 className={`font-black text-xl leading-none ${config.color}`}>{config.title}</h3>
                <p className={`text-sm font-medium mt-1 opacity-80 ${config.color}`}>{config.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-lg text-gray-500 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8 bg-white overflow-y-auto text-sm text-gray-700 flex flex-col gap-6">
            
            {/* Main Grid: Info + Params */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Description & Pros/Cons */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <Target size={14} className="text-gray-400"/> Objetivo Estratégico
                        </h4>
                        <p className="leading-relaxed text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 text-justify">
                            {config.desc}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="border border-green-100 bg-green-50/50 p-4 rounded-lg">
                            <span className="font-bold text-green-800 text-xs uppercase block mb-1">Ventajas (Pros)</span>
                            <p className="text-xs text-green-900 leading-relaxed">{config.pros}</p>
                        </div>
                        <div className="border border-red-100 bg-red-50/50 p-4 rounded-lg">
                            <span className="font-bold text-red-800 text-xs uppercase block mb-1">Riesgos (Cons)</span>
                            <p className="text-xs text-red-900 leading-relaxed">{config.cons}</p>
                        </div>
                    </div>
                </div>

                {/* Right: Math & Execution */}
                <div className="flex flex-col h-full">
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <Layers size={14} className="text-gray-400"/> Fórmula de Cálculo
                        </h4>
                        <div className="font-mono text-xs bg-gray-900 text-gray-200 p-4 rounded-lg shadow-inner border border-gray-800">
                            {config.math}
                        </div>
                    </div>

                    <div className="mt-auto border-t border-gray-100 pt-6">
                        <h4 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wide flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-indigo-600"/> Ejecutar Estrategia en DeFi
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <a 
                                href={uniswapUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-pink-50 text-pink-700 font-bold text-xs border border-pink-100 hover:bg-pink-100 hover:border-pink-200 transition-all shadow-sm hover:shadow-md group"
                                title="Crear posición V3 en Uniswap con rangos predefinidos"
                            >
                                <div className="flex items-center gap-1 text-sm">Uniswap <ExternalLink size={12} className="opacity-50 group-hover:opacity-100"/></div>
                                <span className="text-[10px] opacity-70 font-normal">Crear Pool V3</span>
                            </a>
                            
                            <a 
                                href={revertUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all shadow-sm hover:shadow-md group"
                                title="Gestionar y analizar posición en Revert Finance (Base Network)"
                            >
                                <div className="flex items-center gap-1 text-sm">Revert <ExternalLink size={12} className="opacity-50 group-hover:opacity-100"/></div>
                                <span className="text-[10px] opacity-70 font-normal">Initiator (Base)</span>
                            </a>

                            <a 
                                href={crystalUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs border border-sky-100 hover:bg-sky-100 hover:border-sky-200 transition-all shadow-sm hover:shadow-md group"
                                title="Buscar Pools y Swap en Krystal DeFi"
                            >
                                <div className="flex items-center gap-1 text-sm">Krystal <ExternalLink size={12} className="opacity-50 group-hover:opacity-100"/></div>
                                <span className="text-[10px] opacity-70 font-normal">Swap / Pool</span>
                            </a>

                            <a 
                                href={hlUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group"
                                title="Trading de Futuros/Perpetuos en Hyperliquid"
                            >
                                <div className="flex items-center gap-1 text-sm">Hyperliquid <ExternalLink size={12} className="opacity-50 group-hover:opacity-100"/></div>
                                <span className="text-[10px] opacity-70 font-normal">Perp Trading</span>
                            </a>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 text-center italic">
                            * Uniswap (Ethereum) • Revert (Base) • Krystal (Multi). Verifica redes antes de operar.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="text-center pt-2 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 italic flex items-center justify-center gap-1">
                    <MousePointerClick size={12}/> Pulsa fuera o en la X para cerrar
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;