import React from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { getAllowedIps } from './Parameters';
import { APP_VERSION } from './Version';

interface FooterProps {
    assetCount: number;
    userIp: string | null;
    onManageCookies: () => void;
    onManageApiKey: () => void;
    hasApiKey: boolean;
}

const Footer: React.FC<FooterProps> = ({ userIp, onManageCookies, onManageApiKey, hasApiKey }) => {
    const allowed = getAllowedIps();
    const isDevIp = userIp ? allowed.includes(userIp) : false;

    return (
        <footer className="mt-12 border-t border-gray-200 pt-8 pb-4 print:hidden">
            {/* Aviso Legal Banner */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center mb-8 flex items-center justify-center gap-3 text-xs text-gray-500">
                <AlertTriangle size={16} className="text-red-700" />
                <span className="font-medium uppercase tracking-tight">
                    Aviso Legal: El contenido es meramente informativo y educativo. No es asesoramiento financiero.
                </span>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {/* Lado izquierdo: Versión e IP */}
                <div className="flex items-center gap-4">
                    <span className="text-red-700 font-black px-2 py-1 bg-red-50 rounded border border-red-100">
                        {APP_VERSION}
                    </span>
                    {userIp && (
                        <span className={`font-mono px-2 py-1 rounded border transition-colors ${
                            isDevIp 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                            {userIp}
                        </span>
                    )}
                </div>
                
                {/* Lado derecho: Acciones y Créditos */}
                <div className="flex items-center gap-8">
                    <button 
                        type="button" 
                        onClick={onManageCookies} 
                        className="hover:text-gray-900 hover:underline transition uppercase"
                    >
                        Cookies y Privacidad
                    </button>

                    <button 
                        type="button" 
                        onClick={onManageApiKey} 
                        className={`flex items-center gap-1.5 transition-all group ${hasApiKey ? 'text-indigo-600 font-black' : 'text-gray-900 hover:text-red-700'}`}
                    >
                        <Settings size={14} className="group-hover:rotate-45 transition-transform" />
                        <span className="uppercase">Ajustes / API Key {hasApiKey && '✓'}</span>
                    </button>
                    
                    <span className="text-gray-200 select-none">/</span>
                    
                    <div className="flex gap-3 text-gray-900">
                        <a href="https://jesus.depablos.es" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 transition-colors">
                            Jesús de Pablos
                        </a>
                        <span className="text-gray-200">/</span>
                        <a href="https://www.tligent.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-700 transition-colors">
                            Tligent
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;