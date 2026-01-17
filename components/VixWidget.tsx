
import React, { useState, useEffect } from 'react';
import { Loader2, Gauge, Activity } from 'lucide-react';
import { fetchAssetData } from '../services/market';

const VixWidget: React.FC = () => {
  const [vixValue, setVixValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getVix = async () => {
      try {
        // Fetch ^VIX data using the existing Stock service
        const data = await fetchAssetData('^VIX', 'STOCK');
        if (data && data.daily) {
            setVixValue(data.daily.price);
        }
      } catch (e) { 
        console.error("Failed to fetch VIX", e); 
      } finally { 
        setLoading(false); 
      }
    };
    getVix();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={24}/></div>;
  if (vixValue === null) return <div className="h-full flex items-center justify-center text-xs text-gray-400">VIX No Disp.</div>;

  // --- LOGIC FOR VIX GAUGE ---
  // VIX Range logic:
  // Low (<15): Complacency (Green/Right)
  // Normal (15-20): Neutral
  // High (20-30): Fear (Orange/Left)
  // Extreme (>30): Panic (Red/Far Left)
  
  // We map VIX to the -90 (Red/Left) to +90 (Green/Right) rotation.
  // Let's assume a scale of 10 (Max Green) to 50 (Max Red).
  // Formula: High VIX -> Negative Angle. Low VIX -> Positive Angle.
  
  const MIN_VIX_SCALE = 10;
  const MAX_VIX_SCALE = 50;
  
  // Clamp value
  const clampedVix = Math.max(MIN_VIX_SCALE, Math.min(MAX_VIX_SCALE, vixValue));
  
  // Calculate percentage (0 = Low Vix/Green, 1 = High Vix/Red)
  const pct = (clampedVix - MIN_VIX_SCALE) / (MAX_VIX_SCALE - MIN_VIX_SCALE);
  
  // Rotation: 0 pct -> 90deg (Right), 1 pct -> -90deg (Left)
  const needleRotation = 90 - (pct * 180);

  // Text & Colors
  let labelEs = "";
  let colorClass = "";

  if (vixValue < 15) { labelEs = "Complacencia"; colorClass = "text-emerald-600"; }
  else if (vixValue < 21) { labelEs = "Normal"; colorClass = "text-gray-500"; }
  else if (vixValue < 28) { labelEs = "Miedo"; colorClass = "text-orange-500"; }
  else { labelEs = "Pánico Extremo"; colorClass = "text-red-700"; }

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden p-2">
        <div className="flex items-center justify-center gap-1.5 mb-1 absolute top-1 inset-x-0">
            <Activity size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bolsa</span>
        </div>
        
        {/* Gauge Visual */}
        <div className="relative w-40 h-20 mt-8 mb-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gray-100 rounded-t-full overflow-hidden">
                {/* Gradient: Red (Left/Fear) -> Yellow -> Green (Right/Calm) */}
                <div className="w-full h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 opacity-30"></div>
            </div>
            {/* Needle */}
            <div 
                className="absolute bottom-0 left-1/2 w-1.5 h-[4.5rem] bg-gray-800 origin-bottom rounded-full transition-all duration-1000 ease-out"
                style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white"></div>
        </div>

        <div className={`text-4xl font-black ${colorClass} leading-none tracking-tight`}>{vixValue.toFixed(2)}</div>
        <div className={`text-sm font-bold ${colorClass} uppercase mt-1`}>{labelEs}</div>
        
        <div className="absolute bottom-2 right-4 text-[9px] text-gray-300 font-mono">Market Risk</div>
    </div>
  );
};

export default VixWidget;
