
import React from 'react';
import { X, BrainCircuit, Sparkles, Zap, Activity } from 'lucide-react';

interface Props {
  symbol: string;
  analysis: string;
  onClose: () => void;
}

const OracleModal: React.FC<Props> = ({ symbol, analysis, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700 rounded-lg shadow-lg shadow-red-900/20">
                <BrainCircuit className="text-white" size={24} />
            </div>
            <div>
                <h3 className="font-black text-white text-lg leading-none uppercase tracking-tighter flex items-center gap-2">
                    ORÁCULO INTELIGENTE
                    <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Análisis de Mercado: {symbol}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 bg-white overflow-y-auto max-h-[75vh]">
           <div className="relative">
                <div className="absolute -top-4 -left-4 opacity-5">
                    <Activity size={80} />
                </div>
                
                <div className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-loose border-l-2 border-red-700 pl-6 py-2">
                    {analysis}
                </div>
           </div>

           <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-red-700" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precisión</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 uppercase">Basado en datos de red real</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-gray-700" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contexto</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 uppercase">Análisis Multi-Timeframe</p>
                </div>
           </div>

           <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                    Generado por Gemini AI Engine para CriptoGO Matrix
                </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OracleModal;
