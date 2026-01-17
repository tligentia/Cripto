
import React, { useState, useEffect } from 'react';
import { Loader2, Gauge } from 'lucide-react';

const FearGreedWidget: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            setData(json.data[0]);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={24}/></div>;
  if (!data) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Sin datos</div>;

  const value = parseInt(data.value);
  let labelEs = data.value_classification;
  let colorClass = "text-gray-500";
  let needleRotation = -90 + (value * 1.8);

  if (value < 25) { labelEs = "Miedo Extremo"; colorClass = "text-red-600"; }
  else if (value < 45) { labelEs = "Miedo"; colorClass = "text-orange-500"; }
  else if (value < 55) { labelEs = "Neutral"; colorClass = "text-gray-500"; }
  else if (value < 75) { labelEs = "Codicia"; colorClass = "text-emerald-500"; }
  else { labelEs = "Codicia Extrema"; colorClass = "text-emerald-700"; }

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden p-2">
        <div className="flex items-center justify-center gap-1.5 mb-1 absolute top-1 inset-x-0">
            <Gauge size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cripto</span>
        </div>
        
        {/* Gauge Visual */}
        <div className="relative w-40 h-20 mt-8 mb-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gray-100 rounded-t-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 opacity-30"></div>
            </div>
            {/* Aguja */}
            <div 
                className="absolute bottom-0 left-1/2 w-1.5 h-[4.5rem] bg-gray-800 origin-bottom rounded-full transition-all duration-1000 ease-out"
                style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white"></div>
        </div>

        <div className={`text-4xl font-black ${colorClass} leading-none tracking-tight`}>{value}</div>
        <div className={`text-sm font-bold ${colorClass} uppercase mt-1`}>{labelEs}</div>
        
        <div className="absolute bottom-2 right-4 text-[9px] text-gray-300 font-mono">Actualizado: {new Date(data.timestamp * 1000).toLocaleDateString()}</div>
    </div>
  );
};

export default FearGreedWidget;
