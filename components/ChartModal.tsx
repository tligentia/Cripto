import React, { useEffect } from 'react';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { AssetType } from '../types';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface Props {
  symbol: string;
  type?: AssetType;
  onClose: () => void;
}

const ChartModal: React.FC<Props> = ({ symbol, type = 'CRYPTO', onClose }) => {
  const containerId = `tv_chart_container_${symbol}`;
  
  // Lógica para determinar el símbolo correcto en TradingView
  // Para Crypto: BINANCE:BTCUSDT
  // Para Stock: NASDAQ:AAPL o NYSE:GE, pero a menudo basta con el Ticker solo para que TV lo busque.
  // Intentamos pasar solo el Ticker para Stock si no es común, o podríamos prefixar si tuviéramos el exchange.
  // Por defecto para stocks usamos el símbolo tal cual, TradingView suele resolverlo bien (ej: SPY, NVDA).
  const tvSymbol = type === 'STOCK' ? symbol : `BINANCE:${symbol}USDT`;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "width": "100%", 
          "height": "100%", 
          "symbol": tvSymbol, 
          "interval": "D", 
          "timezone": "Europe/Madrid", 
          "theme": "light", 
          "style": "1", 
          "locale": "es", 
          "toolbar_bg": "#f1f3f6", 
          "enable_publishing": false, 
          "hide_top_toolbar": false, 
          "hide_side_toolbar": false, 
          "allow_symbol_change": true, // Permitir cambio por si el usuario quiere buscar otro mercado
          "container_id": containerId,
          "studies": [{ "id": "MASimple@tv-basicstudies", "inputs": { "length": 20 } }, { "id": "MASimple@tv-basicstudies", "inputs": { "length": 50 } }]
        });
      }
    };
    document.head.appendChild(script);
    return () => {
        // Cleanup script if needed, though usually safe to leave for cached access
    }
  }, [symbol, tvSymbol, containerId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full h-[85vh] max-w-6xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-300">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2"><BarChart3 className="text-red-700" size={20} /><h3 className="font-bold text-gray-900 text-lg">Gráfico Técnico: {symbol} ({type})</h3></div>
          <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500"><X size={24} /></button>
        </div>
        <div className="flex-1 bg-white relative" id={containerId}><div className="absolute inset-0 flex items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={32} /></div></div>
      </div>
    </div>
  );
};

export default ChartModal;