
import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Loader2, RefreshCw, HelpCircle, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Asset } from '../types';
import { generateGeminiContent } from '../services/gemini';

interface Props {
  asset: Asset;
  apiKey: string;
  onClose: () => void;
}

type ViewMode = 'STANDARD' | 'SIMPLE' | 'DETAILED';

const FundamentalModal: React.FC<Props> = ({ asset, apiKey, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'NONE' | 'KEY' | 'CONN'>('NONE');
  const [viewMode, setViewMode] = useState<ViewMode>('STANDARD');
  const [showExtended, setShowExtended] = useState(false);

  const fetchFundamental = useCallback(async (mode: ViewMode) => {
    if (!apiKey) {
      setErrorType('KEY');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorType('NONE');

    try {
      let prompt = "";
      
      if (mode === 'SIMPLE') {
        prompt = `Explica de qué trata ${asset.name} (${asset.symbol}) de forma extremadamente sencilla. Usa analogías. Máximo 60 palabras. Sin markdown.`;
      } else if (mode === 'DETAILED') {
        prompt = `Genera un informe forense detallado sobre ${asset.name} (${asset.symbol}). Incluye: 1. Origen técnico. 2. Gobernanza. 3. Riesgos. Usa un tono muy técnico. Máximo 150 palabras. Sin markdown.`;
      } else {
        prompt = `
          Actúa como analista financiero senior. Genera un informe fundamental para: ${asset.name} (${asset.symbol}).
          FORMATO: Usa fuentes UNICODE para negritas (ej: 𝐇𝐈𝐒𝐓𝐎𝐑𝐈𝐀). 
          ESTRUCTURA: Separa claramente por párrafos: 1. IDENTIDAD, 2. VALOR, 3. UTILIDAD.
          Máx 80 palabras. Sin Markdown ni Emojis.
        `;
      }

      const text = await generateGeminiContent(prompt, apiKey);
      setAnalysis(text);
    } catch (e) { 
      console.error(e);
      setErrorType(String(e).includes('API_MISSING') ? 'KEY' : 'CONN');
    } finally { 
      setLoading(false); 
    }
  }, [asset, apiKey]);

  useEffect(() => {
    fetchFundamental('STANDARD');
  }, [fetchFundamental]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
                <FileText size={20} />
            </div>
            <div>
                <h3 className="font-black text-gray-900 text-lg leading-none uppercase tracking-tighter">ANÁLISIS FUNDAMENTAL</h3>
                <p className="text-[10px] text-red-700 font-black uppercase mt-1 tracking-widest">{asset.symbol} • MODO {viewMode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => { setViewMode('SIMPLE'); fetchFundamental('SIMPLE'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'SIMPLE' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`} title="Modo Fácil"><HelpCircle size={18} /></button>
             <button onClick={() => { setViewMode('DETAILED'); fetchFundamental('DETAILED'); }} className={`p-2 rounded-lg transition-all ${viewMode === 'DETAILED' ? 'bg-red-700 text-white' : 'text-gray-400 hover:bg-gray-100'}`} title="Modo Pro"><Maximize2 size={18} /></button>
             <button onClick={() => { setViewMode('STANDARD'); fetchFundamental('STANDARD'); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Regenerar"><RefreshCw size={18} /></button>
             <button onClick={onClose} className="ml-2 p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-700 transition-colors"><X size={22} /></button>
          </div>
        </div>

        <div className="p-8 bg-white overflow-y-auto max-h-[70vh]">
           {loading ? (
             <div className="flex flex-col items-center justify-center p-12 gap-5">
                <Loader2 className="animate-spin text-red-700" size={40} />
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.2em] animate-pulse">Consultando Fundamental...</p>
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
                        onClick={() => setShowExtended(!showExtended)}
                        className="flex items-center justify-between w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                    >
                        <span>NOTAS DE ANALISTA</span>
                        {showExtended ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showExtended && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 leading-relaxed italic animate-in slide-in-from-top-2">
                           Análisis basado en métricas on-chain y documentación oficial del activo. Los datos fundamentales ayudan a validar la fuerza de la tendencia técnica.
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

export default FundamentalModal;
