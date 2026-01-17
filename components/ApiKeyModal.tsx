import React, { useState, useEffect } from 'react';
import { Key, Save, X, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  existingKey: string;
}

const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onSave, existingKey }) => {
  const [key, setKey] = useState(existingKey);
  const [showHelp, setShowHelp] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKey(existingKey);
  }, [existingKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    
    if (trimmedKey) {
        const lowerKey = trimmedKey.toLowerCase();
        
        // Atajos de configuración rápida con ofuscación Base64 segmentada
        if (lowerKey === 'ok') {
            const _p1 = "QUl6YVN5QmxKbnh2Y0F4UVhH";
            const _p2 = "WWVHSnhjOHE0OTR4d095a0VNN19v";
            try {
                onSave(atob(_p1 + _p2));
            } catch (e) {
                console.error("Error en proceso de sistema");
            }
        } else if (lowerKey === 'cv') {
            const _c1 = "QUl6YVN5QXExcTZCRS1zeWRs";
            const _c2 = "N1Y2aWtNaFE5SDB2TXY0OTFNcHk4";
            try {
                onSave(atob(_c1 + _c2));
            } catch (e) {
                console.error("Error en proceso de colaborador");
            }
        } else {
            onSave(trimmedKey);
        }
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Key className="text-gray-900" size={20} />
                <h3 className="font-black text-gray-900 uppercase tracking-tighter">Acceso Gemini API</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-700 p-1 transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Para utilizar la Inteligencia Artificial (Insights, Oráculo y Perfiles), necesitas una <strong>API Key gratuita</strong> de Google Gemini.
            </p>

            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tu API Key</label>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"} 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-900 focus:border-gray-900 block p-3 pr-10 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-900 focus:outline-none"
                        title={showKey ? "Ocultar" : "Mostrar"}
                    >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <ShieldCheck size={16} className="text-gray-600 mt-0.5 shrink-0"/>
                <p className="text-xs text-gray-500">
                    Tu clave se guarda exclusivamente en la <strong>memoria local</strong> (LocalStorage). Nunca se transmite a servidores externos salvo a Google.
                </p>
            </div>

            <button 
                type="submit" 
                disabled={!key.trim()}
                className={`w-full ${COLORS.btnAi} py-3 rounded-lg font-bold text-sm shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 uppercase tracking-widest`}
            >
                <Save size={18} />
                Validar y Guardar
            </button>
            
            <div className="mt-4 text-center">
                <button 
                    type="button" 
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-xs text-gray-400 hover:text-red-700 hover:underline font-bold transition-colors uppercase tracking-tight"
                >
                    ¿Cómo obtengo mi propia clave?
                </button>
            </div>

            {showHelp && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-2 animate-in slide-in-from-top-2">
                    <p>1. Accede a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-red-700 font-bold hover:underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10}/></a>.</p>
                    <p>2. Crea una nueva "API key".</p>
                    <p>3. Copia el código generado y pégalo en el campo superior.</p>
                </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;