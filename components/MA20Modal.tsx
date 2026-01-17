import React from 'react';
import { X, TrendingUp, Activity } from 'lucide-react';

interface Props {
  symbol: string;
  price: number;
  ma20: number | null;
  onClose: () => void;
}

const MA20Modal: React.FC<Props> = ({ symbol, price, ma20, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-emerald-200">
        <div className="p-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={24} />
            <div>
                <h3 className="font-black text-emerald-900 text-lg leading-none">MEDIA MÓVIL 20 (MA20)</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">El corazón del Método CriptoGO</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-500"><X size={24} /></button>
        </div>
        
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-4">
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">{symbol} Precio Actual:</span>
                    <span className="font-mono">{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                     <span className="font-bold text-gray-900">Nivel MA20:</span>
                     <span className="font-mono">{ma20 ? ma20.toLocaleString() : 'N/A'}</span>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Activity size={16}/> ¿Qué es la MA20?</h4>
                <p className="leading-relaxed text-justify">
                    La Media Móvil Simple de 20 periodos (MA20) representa el precio promedio de cierre de las últimas 20 velas (días, semanas o meses). En el método CriptoGO, actúa como la <strong>línea vital</strong> del activo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                    <h5 className="font-bold text-emerald-800 mb-1 text-xs uppercase">Zona de Compra</h5>
                    <p className="text-xs text-emerald-900">
                        Cuando el precio está <strong>por encima</strong> de la MA20 y esta apunta hacia arriba, estamos en tendencia alcista. La MA20 actúa como soporte dinámico.
                    </p>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-100">
                    <h5 className="font-bold text-red-800 mb-1 text-xs uppercase">Zona de Venta</h5>
                    <p className="text-xs text-red-900">
                        Cuando el precio cae <strong>por debajo</strong> de la MA20, pasamos a terreno bajista o de defensa. La MA20 se convierte en resistencia.
                    </p>
                </div>
            </div>

            <div>
                 <h4 className="font-bold text-gray-900 mb-2">La Regla de Oro</h4>
                 <ul className="list-disc pl-5 space-y-1 text-xs marker:text-emerald-500">
                    <li>Nunca comprar si el precio está muy alejado (extendido) de la MA20 (Riesgo de regresión a la media).</li>
                    <li>La mejor entrada es el rebote o ruptura cerca de la MA20.</li>
                    <li>La distancia porcentual que ves en la tarjeta indica cuán "caliente" (lejos) o "frío" (cerca) está el precio respecto a su media.</li>
                 </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MA20Modal;