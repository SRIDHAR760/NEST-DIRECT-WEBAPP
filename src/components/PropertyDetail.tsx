import React, { useState } from 'react';
import { Property, DirectInquiry } from '../types';
import { 
  X, BedDouble, Bath, Square, MapPin, DollarSign, 
  Calendar, Clock, CheckCircle, Shield, Phone, Mail, 
  MessageSquare, UserCheck, Percent, Info, ArrowRight, Sparkles,
  Compass, Briefcase, Car, Train, Bike
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onStartChat: (propertyId: string) => void;
  onBookVisit: (inquiry: DirectInquiry) => void;
  allProperties?: Property[];
  onSelectProperty?: (id: string) => void;
  selectedWorkplace?: string;
  commuteTransitMode?: 'metro' | 'auto' | 'bike';
}

export default function PropertyDetail({ 
  property, 
  onClose, 
  onStartChat, 
  onBookVisit, 
  allProperties = [], 
  onSelectProperty,
  selectedWorkplace = 'iitm',
  commuteTransitMode = 'auto'
}: PropertyDetailProps) {
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [visitTime, setVisitTime] = useState<string>('');
  const [introduction, setIntroduction] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);

  const similarProperties = allProperties
    .filter(p => p.id !== property.id)
    .filter(p => p.city === property.city || p.type === property.type)
    .slice(0, 3);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !visitDate || !visitTime) return;

    const inquiry: DirectInquiry = {
      id: `inq-${Date.now()}`,
      propertyId: property.id,
      tenantName,
      tenantEmail: tenantEmail || 'anonymous@nestdirect.com',
      tenantPhone: tenantPhone || '+91 99405 11223',
      visitDate,
      visitTime,
      message: introduction || `Hi ${property.ownerName}, I would love to schedule a direct walkthrough of your property!`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onBookVisit(inquiry);
    setIsScheduled(true);
    setTimeout(() => {
      setIsScheduled(false);
    }, 4000);
  };

  const upcomingDates = [
    { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 2 days', value: new Date(Date.now() + 172800000).toISOString().split('T')[0] },
    { label: 'Saturday', value: new Date(Date.now() + 345600000).toISOString().split('T')[0] },
    { label: 'Sunday', value: new Date(Date.now() + 432000000).toISOString().split('T')[0] }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-end" 
      id="detail-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-2xl h-full flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] relative overflow-hidden" 
        id="detail-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md text-slate-900 flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 border border-slate-200 cursor-pointer"
            id="close-detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable listing detail Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" id="detail-scroller">
          {/* Gallery Carousel */}
          <div className="h-96 bg-slate-100 relative group overflow-hidden" id="detail-carousel">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activePhoto}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                referrerPolicy="no-referrer"
                src={property.photos[activePhoto]} 
                alt={property.title} 
                className="w-full h-full object-cover" 
              />
            </AnimatePresence>
            
            {/* Gallery Indicator pills */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              {property.photos.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActivePhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activePhoto === i ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
            
            {/* Savings Badge */}
            <div className="absolute top-6 right-6 bg-emerald-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Save ₹{property.brokerSavings.toLocaleString('en-IN')} Broker Fee
            </div>
          </div>

          {/* Main content */}
          <div className="p-10 space-y-10 pb-32">
            {/* Title & Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Direct Listing
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {property.type}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                </div>
                <span>{property.address}, {property.city}</span>
              </div>
            </div>

            {/* Price Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</span>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900 font-display">₹{property.price.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-medium text-slate-500 ml-1">/mo</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Deposit</span>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900 font-display">₹{property.securityDeposit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                  <BedDouble className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-lg font-bold text-slate-900">{property.bedrooms}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bedrooms</p>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-2">
                  <Bath className="w-6 h-6 text-cyan-500" />
                </div>
                <p className="text-lg font-bold text-slate-900">{property.bathrooms}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bathrooms</p>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                  <Square className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-lg font-bold text-slate-900">{property.areaSqFt}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sq.Ft Area</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">About this property</h2>
              <p className="text-slate-600 leading-relaxed text-lg font-medium">
                {property.description}
              </p>
            </div>

            {/* Commute Mini Profile & Styled Map Preview */}
            {(() => {
              const workplaceMapped = (selectedWorkplace === 'iitm' || selectedWorkplace === 'tidel' || selectedWorkplace === 'spencer' || selectedWorkplace === 'kapaleeshwarar') ? selectedWorkplace : 'iitm';
              const finalCity = ['Nungambakkam', 'Mylapore', 'Adyar', 'OMR'].includes(property.city) ? property.city : 'Adyar';
              
              const commuteTimesLocal: Record<string, Record<string, Record<'metro' | 'auto' | 'bike', number>>> = {
                'iitm': {
                  'Nungambakkam': { metro: 25, auto: 35, bike: 20 },
                  'Adyar': { metro: 5, auto: 8, bike: 4 },
                  'OMR': { metro: 20, auto: 15, bike: 12 },
                  'Mylapore': { metro: 12, auto: 18, bike: 10 }
                },
                'tidel': {
                  'Nungambakkam': { metro: 35, auto: 45, bike: 30 },
                  'Adyar': { metro: 18, auto: 15, bike: 10 },
                  'OMR': { metro: 5, auto: 6, bike: 5 },
                  'Mylapore': { metro: 22, auto: 25, bike: 18 }
                },
                'spencer': {
                  'Nungambakkam': { metro: 4, auto: 6, bike: 5 },
                  'Adyar': { metro: 25, auto: 30, bike: 20 },
                  'OMR': { metro: 35, auto: 40, bike: 28 },
                  'Mylapore': { metro: 12, auto: 15, bike: 10 }
                },
                'kapaleeshwarar': {
                  'Nungambakkam': { metro: 15, auto: 20, bike: 12 },
                  'Adyar': { metro: 12, auto: 15, bike: 10 },
                  'OMR': { metro: 22, auto: 25, bike: 18 },
                  'Mylapore': { metro: 4, auto: 5, bike: 3 }
                }
              };

              const currentDuration = commuteTimesLocal[workplaceMapped]?.[finalCity]?.[commuteTransitMode] || 15;
              const currentGrade = currentDuration <= 10 ? 'A+ Ultra' : currentDuration <= 20 ? 'A Excellent' : currentDuration <= 30 ? 'B Efficient' : 'C Standard';
              
              const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
                'A+ Ultra': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
                'A Excellent': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
                'B Efficient': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
                'C Standard': { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600' }
              };
              
              const modeIcons = {
                auto: <Car className="w-5 h-5" />,
                metro: <Train className="w-5 h-5" />,
                bike: <Bike className="w-5 h-5" />
              };
              
              const areasMap: Record<string, { name: string; x: number; y: number; color: string }> = {
                'Nungambakkam': { name: 'Nungambakkam', x: 80, y: 60, color: '#3b82f6' },
                'Mylapore': { name: 'Mylapore', x: 160, y: 120, color: '#10b981' },
                'Adyar': { name: 'Adyar', x: 240, y: 180, color: '#8b5cf6' },
                'OMR': { name: 'OMR Corridor', x: 320, y: 200, color: '#f59e0b' }
              };

              const workplacesMap: Record<string, { name: string; zone: string; x: number; y: number }> = {
                'iitm': { name: 'IIT Madras Research', zone: 'Adyar', x: 250, y: 175 },
                'tidel': { name: 'TIDEL Park IT Hwy', zone: 'OMR', x: 325, y: 195 },
                'spencer': { name: 'Spencer Plaza', zone: 'Nungambakkam', x: 75, y: 65 },
                'kapaleeshwarar': { name: 'Mylapore Gateway', zone: 'Mylapore', x: 155, y: 125 }
              };

              const currentOrg = areasMap[finalCity] || areasMap['Adyar'];
              const currentDest = workplacesMap[workplaceMapped] || workplacesMap['iitm'];
              
              const midX = (currentOrg.x + currentDest.x) / 2;
              const midY = (currentOrg.y + currentDest.y) / 2 - 25; // Pull curve upwards for nice arc

              const modeColor = commuteTransitMode === 'metro' ? '#3b82f6' : commuteTransitMode === 'auto' ? '#fbbf24' : '#10b981';

              return (
                <div className="space-y-6 pt-6 border-t border-slate-100" id="property-commute-pulse">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Commute & Geographic Pulse</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Commute Node Mapping</p>
                  </div>

                  {/* Visual Map Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                    {/* Tiny Map SVG */}
                    <div className="md:col-span-3 relative h-56 bg-slate-50 border border-slate-200/60 rounded-[2rem] overflow-hidden group shadow-inner">
                      <svg viewBox="0 0 400 240" className="w-full h-full">
                        <defs>
                          <pattern id="miniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                          </pattern>
                        </defs>
                        {/* Grid */}
                        <rect width="100%" height="100%" fill="url(#miniGrid)" />

                        {/* Coastline */}
                        <path d="M 370 0 Q 355 40 370 80 Q 360 120 375 160 Q 355 200 370 240 L 400 240 L 400 0 Z" fill="#e0f2fe" fillOpacity="0.6" />
                        <text x="382" y="120" fill="#0284c7" fillOpacity="0.4" fontSize="7" fontWeight="black" transform="rotate(90, 382, 120)" letterSpacing="1">BAY OF BENGAL</text>

                        {/* Adyar River */}
                        <path d="M 0 165 Q 160 160 250 182 T 363 175" fill="none" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.7" />

                        {/* Faint Area Zones */}
                        {Object.entries(areasMap).map(([id, area]) => (
                          <g key={id}>
                            <circle cx={area.x} cy={area.y} r="24" fill={area.color} fillOpacity="0.04" stroke={area.color} strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3" />
                            <text x={area.x} y={area.y + 4} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest opacity-45">{area.name}</text>
                          </g>
                        ))}

                        {/* Connection Commute Route Dash */}
                        {finalCity !== currentDest.zone && (
                          <motion.path 
                            d={`M ${currentOrg.x} ${currentOrg.y} Q ${midX} ${midY} ${currentDest.x} ${currentDest.y}`}
                            fill="none" 
                            stroke={modeColor} 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeDasharray="5 5"
                            className="pointer-events-none"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                          />
                        )}

                        {/* Active connection line when in same neighborhood */}
                        {finalCity === currentDest.zone && (
                          <line 
                            x1={currentOrg.x} 
                            y1={currentOrg.y} 
                            x2={currentDest.x} 
                            y2={currentDest.y} 
                            stroke={modeColor} 
                            strokeWidth="2.5" 
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Property Pin */}
                        <g transform={`translate(${currentOrg.x}, ${currentOrg.y})`}>
                          <circle r="12" fill={areasMap[finalCity]?.color || '#8b5cf6'} fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '3s' }} />
                          <circle r="7" fill={areasMap[finalCity]?.color || '#8b5cf6'} stroke="#ffffff" strokeWidth="2.5" className="shadow-lg" />
                          <circle r="2" fill="#ffffff" />
                        </g>

                        {/* Workplace Destination Marker */}
                        <g transform={`translate(${currentDest.x}, ${currentDest.y})`}>
                          <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                          <circle r="2" fill="#38bdf8" />
                        </g>

                        {/* Labels */}
                        {/* Property Pin Label */}
                        <g transform={`translate(${currentOrg.x}, ${currentOrg.y - 14})`}>
                          <rect x="-35" y="-10" width="70" height="14" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" className="shadow-sm" />
                          <text x="0" y="0" fill="#0f172a" fontSize="7" fontWeight="extrabold" textAnchor="middle" className="uppercase">Property Pin</text>
                        </g>

                        {/* Workplace Label */}
                        <g transform={`translate(${currentDest.x}, ${currentDest.y + 20})`}>
                          <rect x="-40" y="-10" width="80" height="14" rx="4" fill="#0f172a" className="shadow-sm" />
                          <text x="0" y="0" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" className="uppercase">{currentDest.name.slice(0, 14)}...</text>
                        </g>
                      </svg>

                      {/* Mini Map Info Overlay */}
                      <div className="absolute top-4 left-4 bg-[#1a1d1f]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                        <Compass className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
                        <span className="text-[8px] font-black uppercase text-slate-100 tracking-wider">Spatial HUD active</span>
                      </div>
                    </div>

                    {/* Right-side commute data columns */}
                    <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                      {/* Metric Card */}
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] space-y-3.5 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm shadow-slate-100">
                            {modeIcons[commuteTransitMode]}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">COMMUTE DURATION</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{currentDuration} Mins</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${gradeColors[currentGrade]?.bg} ${gradeColors[currentGrade]?.text} border ${gradeColors[currentGrade]?.border}/20 flex items-center gap-1.5 shadow-md`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {currentGrade}
                          </span>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Zone Index</span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {currentGrade.includes('A+') 
                            ? 'Ultra proximity. Perfect for walking, running, or quick bike commutes.' 
                            : currentGrade.includes('A') 
                            ? 'Excellent reach. Under 20 mins travel time with swift access.' 
                            : currentGrade.includes('B') 
                            ? 'Very efficient. Seamless daily transit and negligible transit overhead.' 
                            : 'Standard commute. Highly reliable routes with predictable timings.'}
                        </p>
                      </div>

                      {/* Distance Info Footer */}
                      <div className="bg-blue-50/60 border border-blue-100/50 p-4 rounded-2xl text-slate-700 space-y-1">
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {finalCity} • direct handshake
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold leading-snug">
                          No brokers. Your keys directly from the owner in {finalCity} with guaranteed 0% broker commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Amenities */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Included Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 p-4 rounded-3xl border border-slate-100 transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Card */}
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <UserCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                <img 
                  referrerPolicy="no-referrer"
                  src={property.ownerAvatar} 
                  alt={property.ownerName} 
                  className="w-20 h-20 rounded-3xl object-cover border-2 border-white/20 shadow-2xl"
                />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-2xl font-bold">{property.ownerName}</h3>
                    {property.ownerVerified && (
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-blue-200 text-sm font-medium">Verified Property Owner • Instant Response</p>
                </div>
                <button
                  onClick={() => onStartChat(property.id)}
                  className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
                  id={`chat-owner-${property.id}`}
                >
                  Direct Message
                </button>
              </div>
            </div>

            {/* Visit Scheduler */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule a Visit</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <Clock className="w-3.5 h-3.5" />
                  Free Direct Walkthrough
                </div>
              </div>

              {isScheduled ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] p-12 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-slate-900">Appointment Requested!</h4>
                    <p className="text-slate-600 font-medium max-w-sm mx-auto">
                      {property.ownerName} will confirm your slot shortly via Direct Message.
                    </p>
                  </div>
                  <div className="p-6 bg-white border border-emerald-200 rounded-[2rem] shadow-sm flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                      <p className="text-sm font-bold text-slate-900">{visitDate}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time</p>
                      <p className="text-sm font-bold text-slate-900">{visitTime}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {upcomingDates.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVisitDate(d.value)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer text-left ${
                          visitDate === d.value
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <p className={`text-[10px] font-bold uppercase mb-1 ${visitDate === d.value ? 'text-blue-300' : 'text-slate-400'}`}>
                          {d.label}
                        </p>
                        <p className="text-xs font-bold">
                          {new Date(d.value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {['10:00 AM', '02:00 PM', '06:00 PM'].map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVisitTime(slot)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          visitTime === slot
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${visitTime === slot ? 'text-blue-300' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">{slot}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Direct Contact</label>
                        <input
                          type="tel"
                          placeholder="+91 99405 11223"
                          value={tenantPhone}
                          onChange={(e) => setTenantPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Quick Intro</label>
                      <textarea
                        rows={3}
                        placeholder="Say hello to the owner..."
                        value={introduction}
                        onChange={(e) => setIntroduction(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold placeholder:text-slate-300 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 px-4 rounded-[2rem] text-sm transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Request Handover Visit</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {similarProperties.length > 0 && (
                <div className="pt-10 border-t border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Similar Handpicked Listings</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct-to-Owner Matches</p>
                    </div>
                    <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                      {similarProperties.length} Matches Found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {similarProperties.map((simProp) => (
                      <div 
                        key={simProp.id}
                        onClick={() => {
                          onSelectProperty?.(simProp.id);
                          setActivePhoto(0);
                        }}
                        className="group bg-slate-50 hover:bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-100 p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between space-y-4"
                      >
                        <div className="relative h-40 rounded-2xl overflow-hidden">
                          <img referrerPolicy="no-referrer" src={simProp.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <span className="bg-emerald-500 text-white px-2.5 py-1.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1 border border-emerald-400/20">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-100" />
                              Similar
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 bg-[#1A1D1F]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white text-xs font-black border border-white/10">
                            ₹{simProp.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            {simProp.city}
                          </p>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate leading-snug group-hover:text-blue-600 transition-colors">{simProp.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
