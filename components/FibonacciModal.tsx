
import React from 'react';
import { X, Info, Shield, Target, Zap, Waves, Calculator } from 'lucide-react';
import { FibonacciLevels } from '../types';

interface Props {
  symbol: string;
  timeframe: string;
  levels: FibonacciLevels;
  price: number;
  onClose: () => void;
}

const FibonacciModal: React.FC<Props> = ({ symbol, timeframe, levels, price, onClose }) => {
  const fibs = [
    { label: '23.6%', val: levels.f236, desc: 'Primer Soporte/Resistencia débil' },
    { label: '38.2%', val: levels.f382, desc: 'Nivel crítico de retroceso' },
    { label: '50.0%', val: levels.f500, desc: 'Nivel psicológico clave (no es Fibonacci puro)' },
    { label: '61.8%', val: levels.f618, desc: 'GOLDEN RATIO: Zona de máxima probabilidad', highlight: true },
    { label: '78.6%', val: levels.f786, desc: 'Última defensa antes del 100%' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-indigo-200">
        
        {/* Header */}
        <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <Waves className="text-indigo-600" size={24} />
            <div>
                <h3 className="font-black text-indigo-900 text-lg leading-none uppercase tracking-tight">Niveles de Fibonacci</h3>
                <p className="text-xs text-indigo-500 font-medium mt-1">{symbol} • Periodo {timeframe}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-200 rounded-lg text-indigo-400 hover:text-indigo-900 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-6">
            
            {/* Value Grid */}
            <div className="space-y-2">
                {fibs.map((f, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${f.highlight ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`font-mono font-black w-12 ${f.highlight ? 'text-indigo-700' : 'text-gray-400'}`}>{f.label}</span>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-bold uppercase ${f.highlight ? 'text-indigo-900' : 'text-gray-400'}`}>{f.desc}</span>
                            </div>
                        </div>
                        <span className={`font-mono font-black text-lg ${f.highlight ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {f.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </span>
                    </div>
                ))}
            </div>

            {/* Explanation */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 uppercase text-xs tracking-widest"><Info size={16} className="text-indigo-500"/> ¿Qué son estos niveles?</h4>
                <p className="leading-relaxed text-xs text-justify text-gray-500">
                    Los retrocesos de Fibonacci se basan en la secuencia numérica descubierta por Leonardo de Pisa. En el trading, proyectan niveles donde el precio suele frenarse o rebotar después de un movimiento fuerte.
                </p>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <h5 className="font-bold text-indigo-900 text-xs mb-1 flex items-center gap-1 uppercase"><Target size={14}/> El Golden Pocket (61.8%)</h5>
                    <p className="text-[11px] text-indigo-800 leading-relaxed italic">
                        Es el nivel más observado por los algoritmos. Si el precio retrocede hasta el 61.8% y rebota, la tendencia alcista original se considera muy saludable. Si lo pierde, es señal de debilidad estructural.
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                 <Calculator size={14} className="text-gray-300"/>
                 <p className="text-[10px] text-gray-400 italic">
                    Cálculo automatizado basado en el High/Low del periodo anterior.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FibonacciModal;
