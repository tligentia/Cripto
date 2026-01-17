import React from 'react';
import { X, Sparkles, Target, Lightbulb } from 'lucide-react';

interface Props {
  symbol: string;
  reason: string;
  criteriaLabel: string;
  onClose: () => void;
}

const AiSuggestionModal: React.FC<Props> = ({ symbol, reason, criteriaLabel, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden border border-indigo-200">
        
        {/* Header */}
        <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={24} />
            <div>
                <h3 className="font-black text-indigo-900 text-lg leading-none">IA INSIGHT</h3>
                <p className="text-xs text-indigo-500 font-medium mt-1">Lógica de Selección</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400"><X size={24} /></button>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-white space-y-5">
            
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Activo Sugerido</span>
                    <span className="text-2xl font-black text-gray-900">{symbol}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estrategia</span>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded mt-1 border border-indigo-200">
                        {criteriaLabel}
                    </span>
                </div>
            </div>

            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                    <Lightbulb size={16} className="text-yellow-500"/>
                    ¿Por qué este activo?
                </h4>
                <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 text-gray-700 text-sm leading-relaxed italic">
                    "{reason}"
                </div>
            </div>

            <div className="flex gap-2 items-start bg-yellow-50 p-3 rounded border border-yellow-100">
                <Target size={16} className="text-yellow-700 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800">
                    <strong>Nota:</strong> Esta sugerencia se basa en análisis técnico y fundamental algorítmico actual. Comprueba el gráfico antes de operar.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AiSuggestionModal;