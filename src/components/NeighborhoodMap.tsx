import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Sparkles, TrendingUp } from 'lucide-react';

interface NeighborhoodProps {
  selectedZone: string;
  onZoneSelect: (zone: string) => void;
  neighborhoodData: Record<string, { desc: string; avgRent: number; directCount: number }>;
  transitMode: 'auto' | 'metro' | 'bike';
}

const NeighborhoodMap: React.FC<NeighborhoodProps> = ({ selectedZone, onZoneSelect, neighborhoodData, transitMode }) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [showRadius, setShowRadius] = useState(false);

  const radiusSettings = {
    auto: { r: 60, color: 'rgba(245, 158, 11, 0.15)', stroke: '#f59e0b' },
    metro: { r: 100, color: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6' },
    bike: { r: 40, color: 'rgba(16, 185, 129, 0.15)', stroke: '#10b981' },
  };

  const getZoneCenter = (id: string) => {
    if (id === 'Nungambakkam') return { x: 60, y: 60 };
    if (id === 'Mylapore') return { x: 110, y: 110 };
    if (id === 'Adyar') return { x: 160, y: 160 };
    return { x: 140, y: 250 };
  };

  // Stylized coordinates for Chennai Neighborhoods
  // Adyar (South/Central Beach), OMR (South Peripheral), Mylapore (Central Heritage), Nungambakkam (Central Heart)
  const zones = [
    { id: 'Nungambakkam', name: 'Nungambakkam', path: 'M 40 40 Q 60 20 80 40 Q 100 60 80 80 Q 60 100 40 80 Q 20 60 40 40', color: '#3b82f6' },
    { id: 'Mylapore', name: 'Mylapore', path: 'M 90 90 Q 110 70 130 90 Q 150 110 130 130 Q 110 150 90 130 Q 70 110 90 90', color: '#10b981' },
    { id: 'Adyar', name: 'Adyar', path: 'M 140 140 Q 160 120 180 140 Q 200 160 180 180 Q 160 200 140 180 Q 120 160 140 140', color: '#8b5cf6' },
    { id: 'OMR', name: 'Old Mahabalipuram Rd', path: 'M 160 200 Q 180 220 160 260 Q 140 300 120 260 Q 100 220 120 200 Q 140 180 160 200', color: '#f59e0b' },
  ];

  const currentZone = neighborhoodData[selectedZone] || neighborhoodData['Adyar'];

  return (
    <div className="space-y-6" id="neighborhood-explorer-root">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-tight text-[#1A1D1F]">Local Area Pulse</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chennai Ward Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRadius(!showRadius)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${showRadius ? 'bg-indigo-500 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
          >
            {showRadius ? 'Radius Active' : 'Show Reach'}
          </button>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SVG Stylized Map */}
      <div className="relative aspect-square bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden group">
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
          {/* Commute Radius Overlay */}
          <AnimatePresence>
            {showRadius && (
              <motion.circle
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                cx={getZoneCenter(selectedZone).x}
                cy={getZoneCenter(selectedZone).y}
                r={radiusSettings[transitMode].r}
                fill={radiusSettings[transitMode].color}
                stroke={radiusSettings[transitMode].stroke}
                strokeWidth="1"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
            )}
          </AnimatePresence>
          {zones.map((zone) => {
            const isActive = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;
            
            return (
              <motion.path
                key={zone.id}
                d={zone.path}
                fill={isActive ? zone.color : '#cbd5e1'}
                fillOpacity={isActive ? 0.2 : 0.4}
                stroke={isActive ? zone.color : 'transparent'}
                strokeWidth={isActive ? 3 : 0}
                initial={false}
                animate={{
                  fillOpacity: isActive || isHovered ? 0.3 : 0.1,
                  scale: isActive || isHovered ? 1.05 : 1,
                }}
                whileHover={{ scale: 1.05, fillOpacity: 0.3 }}
                onClick={() => onZoneSelect(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer transition-all duration-500"
              />
            );
          })}

          {/* Dots for centers */}
          {zones.map((zone) => {
            const center = getZoneCenter(zone.id);
            return (
              <circle
                key={`dot-${zone.id}`}
                cx={center.x}
                cy={center.y}
                r="4"
                fill={selectedZone === zone.id ? zone.color : '#94a3b8'}
                className="pointer-events-none"
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        <div className="absolute inset-x-4 bottom-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-[#1A1D1F] uppercase tracking-tight">{hoveredZone || selectedZone}</span>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2">
              {neighborhoodData[hoveredZone || selectedZone]?.desc}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Rent</p>
          <p className="text-sm font-black text-[#1A1D1F]">₹{currentZone.avgRent.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Direct Links</p>
          <p className="text-sm font-black text-blue-600">{currentZone.directCount} Active</p>
        </div>
      </div>

      <div className="p-5 bg-[#1A1D1F] rounded-2xl text-white flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-tight">Demand Protocol</p>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">Status: High Intensity</p>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodMap;
