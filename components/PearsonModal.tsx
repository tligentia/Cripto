import React from 'react';
import { X, Calculator, ArrowRightLeft, ShieldAlert, Zap, Scale } from 'lucide-react';

interface Props {
  value: number;
  assetA: string;
  assetB: string;
  onClose: () => void;
}

const PearsonModal: React.FC<Props> = ({ value, assetA, assetB, onClose }) => {
  
  // Lógica de interpretación
  let title = "Correlación Neutra / Aleatoria";
  let desc = "Los activos se mueven de forma independiente. No existe un patrón claro de seguimiento entre ellos.";
  let color = "text-gray-600";
  let bg = "bg-gray-50 border-gray-100";
  let advice = "Ideal para diversificar riesgo puro, pero impredecible para estrategias de pares.";
  let Icon = Scale;

  if (value >= 0.7) {
      title = "Correlación POSITIVA FUERTE";
      desc = "Los activos son 'gemelos'. Cuando uno sube, el otro sube con mucha fiabilidad.";
      color = "text-emerald-600";
      bg = "bg-emerald-50 border-emerald-100";
      advice = "Excelente para Grid Trading y Liquidity Pools (bajo Impermanent Loss). Malo para diversificar (si cae uno, caen los dos).";
      Icon = Zap;
  } else if (value >= 0.3) {
      title = "Correlación POSITIVA MODERADA";
      desc = "Existe tendencia a moverse juntos, pero con ruido. A veces se desacoplan.";
      color = "text-emerald-500";
      bg = "bg-emerald-50/50 border-emerald-100";
      advice = "Aceptable para estrategias de tendencia conjunta. Precaución en rangos estrechos.";
      Icon = ArrowRightLeft;
  } else if (value <= -0.7) {
      title = "Correlación NEGATIVA FUERTE";
      desc = "Movimiento espejo. Cuando uno sube, el otro baja matemáticamente.";
      color = "text-red-600";
      bg = "bg-red-50 border-red-100";
      advice = "La mejor cobertura (Hedge) posible. Ideal para neutralizar exposición al mercado, pero terrible para Liquidity Pools.";
      Icon = ShieldAlert;
  } else if (value <= -0.3) {
      title = "Correlación NEGATIVA MODERADA";
      desc = "Tendencia opuesta visible, pero no perfecta.";
      color = "text-red-500";
      bg = "bg-red-50/50 border-red-100";
      advice = "Sirve como cobertura parcial (soft hedge) en portafolios balanceados.";
      Icon = ShieldAlert;
  }

  // Posición en la barra (-1 a 1 se mapea a 0% a 100%)
  // -1 -> 0%
  // 0 -> 50%
  // 1 -> 100%
  const gaugePos = ((value + 1) / 2) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-indigo-200">
        
        {/* Header */}
        <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <Calculator className="text-indigo-600" size={24} />
            <div>
                <h3 className="font-black text-indigo-900 text-lg leading-none">Coeficiente Pearson</h3>
                <p className="text-xs text-indigo-500 font-medium mt-1">{assetA} vs {assetB}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400"><X size={24} /></button>
        </div>
        
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-6">
            
            {/* Current Value Display */}
            <div className={`p-5 rounded-lg border ${bg} flex flex-col items-center text-center relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-2 opacity-10 ${color}`}><Icon size={80}/></div>
                <span className="text-xs font-bold uppercase text-gray-400 mb-1">Resultado del Cálculo</span>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <span className={`text-5xl font-black ${color} tracking-tighter`}>{value.toFixed(4)}</span>
                </div>
                <h4 className={`font-bold ${color} text-lg relative z-10`}>{title}</h4>
                <p className="text-xs mt-2 opacity-90 max-w-xs relative z-10">{desc}</p>
            </div>

            {/* Visual Bar */}
            <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 px-1">
                    <span className="text-red-600">-1 (Inversa)</span>
                    <span className="text-gray-400">0 (Nula)</span>
                    <span className="text-emerald-600">+1 (Directa)</span>
                </div>
                <div className="h-6 w-full bg-gradient-to-r from-red-500 via-gray-100 to-emerald-500 rounded-full relative shadow-inner border border-gray-100">
                    {/* Center Marker */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
                    
                    {/* Indicator */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gray-900 border border-white ring-1 ring-black/20 rounded-full shadow-lg transition-all duration-500 z-10"
                        style={{ left: `calc(${gaugePos}% - 3px)` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-2 px-1">
                     <span className="text-red-500 font-medium w-1/3 text-left">Hedge / Cobertura</span>
                     <span className="text-gray-400 font-medium w-1/3 text-center">Aleatorio</span>
                     <span className="text-emerald-500 font-medium w-1/3 text-right">Liquidez / Pares</span>
                </div>
            </div>

            {/* Educational Content */}
            <div className="grid grid-cols-1 gap-4 pt-2">
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h5 className="font-bold text-blue-900 text-xs uppercase mb-1 flex items-center gap-1">
                        <Zap size={12}/> Estrategia Sugerida
                    </h5>
                    <p className="text-xs text-blue-800 leading-relaxed">
                        {advice}
                    </p>
                 </div>

                 <div className="text-xs text-gray-500 space-y-2 text-justify">
                     <p>
                        <strong>¿Qué es?</strong> Es una medida estadística entre -1 y +1 que indica la fuerza y dirección de la relación lineal entre dos variables (precios).
                     </p>
                     <ul className="list-disc pl-4 space-y-1">
                        <li><strong>1.0:</strong> Sincronización perfecta.</li>
                        <li><strong>0.0:</strong> Sin relación alguna.</li>
                        <li><strong>-1.0:</strong> Movimiento perfectamente opuesto.</li>
                     </ul>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PearsonModal;