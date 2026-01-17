import React from 'react';
import { X, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  symbol: string;
  value: number;
  timeframe: string; // 'Diario', 'Semanal', etc.
  onClose: () => void;
}

const RSIModal: React.FC<Props> = ({ symbol, value, timeframe, onClose }) => {
  
  // Logic to determine status text and colors
  let statusTitle = "NEUTRAL";
  let statusDesc = "El precio se mueve dentro de parámetros normales. No hay excesos de compra ni de venta.";
  let statusColor = "text-gray-600";
  let statusBg = "bg-gray-50 border-gray-100";
  let Icon = Minus;

  if (value >= 70) {
      statusTitle = "SOBRECOMPRA (Overbought)";
      statusDesc = "El activo ha subido muy rápido en poco tiempo. Existe una alta probabilidad de una corrección (bajada) a corto plazo o una pausa lateral.";
      statusColor = "text-red-600";
      statusBg = "bg-red-50 border-red-100";
      Icon = TrendingUp;
  } else if (value <= 30) {
      statusTitle = "SOBREVENTA (Oversold)";
      statusDesc = "El activo ha caído muy agresivamente. Podría estar infravalorado, aumentando la probabilidad de un rebote técnico (subida).";
      statusColor = "text-emerald-600";
      statusBg = "bg-emerald-50 border-emerald-100";
      Icon = TrendingDown;
  } else if (value > 60) {
      statusTitle = "FUERZA ALCISTA";
      statusDesc = "El precio muestra fortaleza, acercándose a zona caliente.";
      statusColor = "text-orange-600";
      Icon = TrendingUp;
  } else if (value < 40) {
      statusTitle = "DEBILIDAD";
      statusDesc = "El precio muestra debilidad, acercándose a zona fría.";
      statusColor = "text-blue-600";
      Icon = TrendingDown;
  }

  // Calculate position for the visual gauge (0 to 100%)
  const gaugePos = Math.max(0, Math.min(100, value));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-blue-200">
        
        {/* Header */}
        <div className="p-4 border-b border-blue-100 flex justify-between items-center bg-blue-50">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            <div>
                <h3 className="font-black text-blue-900 text-lg leading-none">RSI (Relative Strength Index)</h3>
                <p className="text-xs text-blue-600 font-medium mt-1">{symbol} • Periodo {timeframe}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500"><X size={24} /></button>
        </div>
        
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-6">
            
            {/* Current Value Display */}
            <div className={`p-4 rounded-lg border ${statusBg} flex flex-col items-center text-center`}>
                <span className="text-xs font-bold uppercase text-gray-400 mb-1">Valor Actual ({timeframe})</span>
                <div className="flex items-center gap-2 mb-2">
                    <Icon size={24} className={statusColor}/>
                    <span className={`text-4xl font-black ${statusColor}`}>{value.toFixed(1)}</span>
                </div>
                <h4 className={`font-bold ${statusColor}`}>{statusTitle}</h4>
                <p className="text-xs mt-2 opacity-90 max-w-xs">{statusDesc}</p>
            </div>

            {/* Visual Bar */}
            <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 px-1">
                    <span className="text-emerald-600">0 (Oversold)</span>
                    <span className="text-gray-400">50</span>
                    <span className="text-red-600">100 (Overbought)</span>
                </div>
                <div className="h-4 w-full bg-gradient-to-r from-emerald-500 via-gray-200 to-red-500 rounded-full relative shadow-inner">
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-gray-800 rounded shadow-md transition-all duration-500"
                        style={{ left: `calc(${gaugePos}% - 8px)` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-8">
                     <span className="text-emerald-600 font-bold">Buy Zone (&lt;30)</span>
                     <span className="text-red-600 font-bold">Sell Zone (&gt;70)</span>
                </div>
            </div>

            {/* Educational Content */}
            <div className="border-t border-gray-100 pt-4">
                 <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">¿Qué es el RSI?</h4>
                 <p className="leading-relaxed text-justify text-xs mb-3">
                    El Índice de Fuerza Relativa mide la <strong>velocidad y el cambio</strong> de los movimientos de precios. Oscila entre 0 y 100.
                 </p>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div className="bg-gray-50 p-2 rounded border border-gray-100">
                         <strong className="block text-red-700 text-xs mb-1">RSI &gt; 70</strong>
                         <p className="text-[10px]">El activo está "caro" o sobre-extendido. Los traders suelen buscar señales de venta o toman beneficios.</p>
                     </div>
                     <div className="bg-gray-50 p-2 rounded border border-gray-100">
                         <strong className="block text-emerald-700 text-xs mb-1">RSI &lt; 30</strong>
                         <p className="text-[10px]">El activo está "barato" o sobre-castigado. Los traders buscan señales de compra o rebote.</p>
                     </div>
                 </div>

                 <p className="text-[10px] text-gray-400 mt-3 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                    <strong>⚠️ Ojo:</strong> En tendencias muy fuertes (como un Bull Run de Bitcoin), el RSI puede mantenerse en "Sobrecompra" (&gt;70) durante mucho tiempo mientras el precio sigue subiendo. No operes solo por el RSI.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RSIModal;