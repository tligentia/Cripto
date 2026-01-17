
import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, RefreshCw, HelpCircle, Maximize2, Loader2, ChevronDown, ChevronUp, ShieldCheck, Target, Zap } from 'lucide-react';
import { generateGeminiContent } from '../services/gemini';

interface Props {
  symbol: string;
  apiKey: string;
  rsiValue?: number;
  onClose: () => void;
}

type ViewMode = 'STANDARD' | 'SIMPLE' | 'DETAILED';

const ProfilesModal: React.FC<Props> = ({ symbol, apiKey, rsiValue, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('STANDARD');
  const [showExplanation, setShowExplanation] = useState(false);

  const fetchProfiles = useCallback(async (mode: ViewMode) => {
    if (!apiKey) return;
    setLoading(true);
    try {
      let prompt = "";
      const context = rsiValue ? `El RSI actual es ${rsiValue.toFixed(1)}.` : "";
      
      if (mode === 'SIMPLE') {
        prompt = `Explica cómo invertir en ${symbol} para un perfil Conservador, Moderado y Agresivo. Usa analogías de la vida real. Sin tecnicismos. ${context} Máximo 80 palabras. Sin markdown.`;
      } else if (mode === 'DETAILED') {
        prompt = `Estrategia avanzada de 3 perfiles para ${symbol}. ${context} Incluye niveles de invalidación y gestión de capital. Tono institucional. Máximo 150 palabras. Sin markdown.`;
      } else {
        prompt = `Crea una estrategia para perfiles CONSERVADOR, MODERADO y AGRESIVO para ${symbol}. Usa fuentes UNICODE para resaltar los perfiles (ej: 𝐂𝐎𝐍𝐒𝐄𝐑𝐕𝐀𝐃𝐎𝐑). ${context} Sé muy directo. Máximo 100 palabras. Sin markdown.`;
      }

      const text = await generateGeminiContent(prompt, apiKey);
      setAnalysis(text);
    } catch (e) {
      setAnalysis("Error al generar la estrategia.");
    } finally {
      setLoading(false);
    }
  }, [symbol, apiKey, rsiValue]);

  useEffect(() => {
    fetchProfiles('STANDARD');
  }, [fetchProfiles]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
                <Users size={20} />
            </div>
            <div>
                <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tighter">ESTRATEGIA POR PERFIL</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{symbol} • MODO {viewMode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => { setViewMode('SIMPLE'); fetchProfiles('SIMPLE'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'SIMPLE' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-gray-100'}`} title="Modo Fácil"><HelpCircle size={18} /></button>
             <button onClick={() => { setViewMode('DETAILED'); fetchProfiles('DETAILED'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'DETAILED' ? 'bg-red-700 text-white' : 'text-gray-400 hover:bg-gray-100'}`} title="Modo Pro"><Maximize2 size={18} /></button>
             <button onClick={() => { setViewMode('STANDARD'); fetchProfiles('STANDARD'); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Regenerar"><RefreshCw size={18} /></button>
             <button onClick={onClose} className="ml-2 p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-700 transition-colors"><X size={22} /></button>
          </div>
        </div>

        <div className="p-8 bg-white overflow-y-auto max-h-[70vh]">
           {loading ? (
             <div className="flex flex-col items-center justify-center p-12 gap-5">
                <Loader2 className="animate-spin text-gray-900" size={40} />
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] animate-pulse">Calculando Estrategias...</p>
             </div>
           ) : (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-gray-900 font-sans text-[15px] leading-relaxed space-y-4 p-7 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    {analysis?.split('\n').map((line, i) => (
                        <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{line}</p>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center justify-between w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                    >
                        <span>GLOSARIO DE RIESGO</span>
                        {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showExplanation && (
                        <div className="mt-4 grid grid-cols-1 gap-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-900">
                                <ShieldCheck size={14} /> <span><strong>CONSERVADOR:</strong> Compras escalonadas, bajo apalancamiento.</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-700">
                                <Target size={14} /> <span><strong>MODERADO:</strong> Mix entre HOLD y Swing trading.</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-900">
                                <Zap size={14} /> <span><strong>AGRESIVO:</strong> Aprovechamiento de volatilidad extrema.</span>
                            </div>
                        </div>
                    )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProfilesModal;
