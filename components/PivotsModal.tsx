
import React from 'react';
import { X, ArrowUpToLine, ArrowDownToLine, Calculator, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Pivots } from '../types';

interface Props {
  symbol: string;
  timeframe: string;
  pivots: Pivots;
  price: number;
  onClose: () => void;
}

const PivotsModal: React.FC<Props> = ({ symbol, timeframe, pivots, price, onClose }) => {
  const { r1, s1 } = pivots;
  const pp = (r1 + s1) / 2; // Approximated for explanation
  
  const isBreakout = price > r1;
  const isBreakdown = price < s1;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Calculator className="text-gray-700" size={24} />
            <div>
                <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tight">Lógica de Pivotes</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">{symbol} • Periodo {timeframe}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-6">
            
            {/* Status Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isBreakout ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowUpToLine size={16} className={isBreakout ? 'text-emerald-600' : 'text-gray-400'}/>
                        <span className="text-[10px] font-black uppercase text-gray-500">Resistencia (R1)</span>
                    </div>
                    <div className="text-xl font-mono font-black text-gray-900">{r1.toLocaleString()}</div>
                    {isBreakout && <span className="text-[9px] font-bold text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-emerald-100 mt-1 inline-block">¡ROTA! (Breakout)</span>}
                </div>
                <div className={`p-4 rounded-xl border ${isBreakdown ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowDownToLine size={16} className={isBreakdown ? 'text-red-600' : 'text-gray-400'}/>
                        <span className="text-[10px] font-black uppercase text-gray-500">Soporte (S1)</span>
                    </div>
                    <div className="text-xl font-mono font-black text-gray-900">{s1.toLocaleString()}</div>
                    {isBreakdown && <span className="text-[9px] font-bold text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-100 mt-1 inline-block">¡ROTO! (Breakdown)</span>}
                </div>
            </div>

            {/* Explanation */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><Info size={16}/> ¿Cómo se calculan?</h4>
                <p className="leading-relaxed text-xs text-justify">
                    Los Puntos Pivote son niveles proyectados basados en la acción del precio del <strong>periodo anterior</strong>. Actúan como imanes o barreras psicológicas.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-[10px] font-mono text-gray-500">
                    Formula: R1 = (2 * PP) - Low anterior<br/>
                    S1 = (2 * PP) - High anterior
                </div>
            </div>

            {/* The Specific Question Answer */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                 <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2 text-xs uppercase tracking-wide">
                    <AlertTriangle size={14}/> La Paradoja Temporal
                 </h4>
                 <p className="text-[11px] text-amber-900/80 leading-relaxed text-justify">
                    <strong>¿Por qué el R1 Mensual puede ser más bajo que el Diario?</strong><br/>
                    En tendencias explosivas, el R1 Mensual se calcula con precios del mes pasado (mucho más bajos). Si el precio actual está por encima de su R1 Mensual, significa que el activo ha entrado en <strong>fase de descubrimiento de precio</strong>, superando sus barreras estructurales de largo plazo.
                 </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
                 <p className="text-[10px] text-gray-400 italic">
                    * Si el precio está sobre el R1, este nivel deja de ser un techo y se convierte en un soporte crítico.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PivotsModal;
