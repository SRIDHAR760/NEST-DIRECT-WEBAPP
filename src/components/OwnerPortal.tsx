import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, DirectInquiry, PropertyType } from '../types';
import { 
  PlusCircle, LayoutDashboard, FileText, Check, X, 
  MapPin, CheckCircle, Home, Hammer, Calendar, 
  Clock, Mail, DollarSign, UserCheck, ShieldAlert,
  UploadCloud, Image as ImageIcon, Trash2, Phone,
  AlertCircle
} from 'lucide-react';

const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    return false;
  }
  const lowerUrl = cleanUrl.toLowerCase();
  
  // Extract path to ignore search params
  const pathPart = lowerUrl.split('?')[0];
  
  // Match standard image file extensions at the end of path
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|heic)$/i.test(pathPart);
  
  // Also support typical trusted CDNs / image hosts that don't enforce file extension in URL paths
  const isTrustedImageHost = lowerUrl.includes('images.unsplash.com') ||
                             lowerUrl.includes('picsum.photos') ||
                             lowerUrl.includes('raw.githubusercontent.com') ||
                             lowerUrl.includes('imgur.com') ||
                             lowerUrl.includes('cloudinary.com') ||
                             /\.(format|auto=format|fit=|w=\d+|h=\d+)/i.test(lowerUrl);
                             
  return hasImageExtension || isTrustedImageHost;
};

interface OwnerPortalProps {
  myProperties: Property[];
  inquiries: DirectInquiry[];
  onAddProperty: (property: Property) => void;
  onUpdateInquiryStatus: (id: string, status: 'accepted' | 'declined') => void;
  currentUser?: any;
}

export default function OwnerPortal({ myProperties, inquiries, onAddProperty, onUpdateInquiryStatus, currentUser }: OwnerPortalProps) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'add'>('dashboard');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('25000');
  const [deposit, setDeposit] = useState('50000');
  const [type, setType] = useState<PropertyType>('apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Adyar');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [area, setArea] = useState('850');
  const [amenitiesText, setAmenitiesText] = useState('High-Speed Wifi, Private Parking, Pet Friendly, Central Heating');
  const [description, setDescription] = useState('');
  
  // Custom Photos / presets
  const [photoPreset, setPhotoPreset] = useState<string>('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200');
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [photoUrlInputs, setPhotoUrlInputs] = useState<string[]>(['']);
  const [dragActive, setDragActive] = useState(false);

  // Landlord profile override
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+91 99405 88223');

  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setOwnerName(currentUser.displayName || '');
      setOwnerEmail(currentUser.email || '');
    } else {
      setOwnerName('Guest Landlord');
      setOwnerEmail('guest.landlord@nestdirect.in');
    }
  }, [currentUser]);

  const photoPresets = [
    { label: 'Modern Loft', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Brick Cottage', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Timber Industrial', url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Bohemian Studio', url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200' }
  ];

  // FileReader multi-upload conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            setCustomPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      filesArray.forEach((file: File) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              setCustomPhotos((prev) => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeCustomPhoto = (indexToRem: number) => {
    setCustomPhotos((prev) => prev.filter((_, idx) => idx !== indexToRem));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title || !address || !description) {
      setFormError('Please fill out all required fields.');
      return;
    }

    // Identify non-blank URL inputs & validate them
    const nonBlankUrls = photoUrlInputs.map(url => url.trim()).filter(url => url.length > 0);
    const invalidUrls = nonBlankUrls.filter(url => !isValidImageUrl(url));
    if (invalidUrls.length > 0) {
      setFormError(`We found ${invalidUrls.length} invalid image link(s). Image URLs must start with http:// or https:// and have standard image extensions (.jpg, .png, .webp, etc.) or point to public images.`);
      
      const scrollContainer = document.getElementById('owner-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const amenities = amenitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
    const priceNum = parseFloat(price) || 1000;
    const depositNum = parseFloat(deposit) || priceNum;
    const brokerSavings = Math.round(priceNum);

    // If custom photos or URL inputs are provided, combine them; otherwise use preset
    const finalPhotos = [...customPhotos, ...nonBlankUrls];
    const propertyPhotos = finalPhotos.length > 0 ? finalPhotos : [photoPreset];

    const newProp: Property = {
      id: `my-prop-${Date.now()}`,
      title,
      description,
      price: priceNum,
      securityDeposit: depositNum,
      type,
      address,
      city,
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseFloat(bathrooms) || 1,
      areaSqFt: parseInt(area) || 500,
      amenities,
      photos: propertyPhotos,
      ownerName: ownerName ? `${ownerName} (You)` : 'Direct Owner (You)',
      ownerPhone: ownerPhone || '+91 99405 88223',
      ownerEmail: ownerEmail || 'owner@nestdirect-verified.in',
      ownerAvatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      ownerVerified: true,
      createdAt: new Date().toISOString(),
      brokerSavings
    };

    onAddProperty(newProp);
    setFormSuccess(true);
    setTitle('');
    setDescription('');
    setAddress('');
    setCustomPhotos([]);
    setPhotoUrlInputs(['']);
    
    setTimeout(() => {
      setFormSuccess(false);
      setViewMode('dashboard');
    }, 2500);
  };

  return (
    <div className="bg-slate-50/30 flex flex-col h-full rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden" id="owner-portal-root">
      {/* Sub header */}
      <div className="bg-white px-10 py-8 border-b border-slate-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Owner Hub</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Inventory Management</p>
          </div>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('add')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'add' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Add Unit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide" id="owner-scroll-container">
        {viewMode === 'dashboard' ? (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Listings', val: myProperties.length, sub: 'Direct active inventory', icon: Home, color: 'bg-blue-50 text-blue-500' },
                { label: 'Inquiries', val: inquiries.length, sub: 'Tenant tour requests', icon: Clock, color: 'bg-orange-50 text-orange-500' },
                { label: 'Bypassed Fee', val: `₹${myProperties.reduce((sum, p) => sum + p.brokerSavings, 0).toLocaleString('en-IN')}`, sub: 'Retained earnings', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                  <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{stat.val}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Inquiries */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">
                Active Tenant Applications
              </h3>
              {inquiries.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 text-slate-400 flex flex-col items-center">
                  <ShieldAlert className="w-16 h-16 text-slate-100 mb-6" />
                  <p className="text-lg font-bold text-slate-900">Waiting for first lead</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto font-medium">Your listings are direct-only, bypassing broker friction. Leads will appear here once requested.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {inquiries.map((inq, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group hover:shadow-xl hover:shadow-slate-200/40 transition-all"
                    >
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                          <UserCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-bold text-slate-900">{inq.tenantName}</h4>
                            <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                              Unit: {inq.propertyId.split('-').pop()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-300" />
                              {new Date(inq.visitDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-300" />
                              {inq.visitTime}
                            </span>
                            <span className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-300" />
                              {inq.tenantEmail}
                            </span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-600 leading-relaxed max-w-xl">
                            "{inq.message}"
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full lg:w-auto gap-3">
                        {inq.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => onUpdateInquiryStatus(inq.id, 'accepted')}
                              className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => onUpdateInquiryStatus(inq.id, 'declined')}
                              className="flex-1 lg:flex-none bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className={`px-8 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                            inq.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {inq.status === 'accepted' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            {inq.status === 'accepted' ? 'Handshake Confirmed' : 'Request Terminated'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* My Listings */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">
                Inventory Portfolio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <img referrerPolicy="no-referrer" src={p.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 border border-slate-200">
                        {p.type}
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 tracking-tight line-clamp-1">{p.title}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{p.city}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-lg font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}/mo</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                          <Check className="w-3.5 h-3.5" />
                          0% Fee
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Add Property */
          <div className="max-w-3xl mx-auto">
            {formSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] p-20 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Direct Unit Published!</h3>
                  <p className="text-slate-600 font-medium max-w-sm mx-auto mt-2">
                    Your rental unit has been successfully generated & mapped to the NestDirect P2P engine.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <PlusCircle className="w-8 h-8 text-indigo-500" />
                    New Direct Listing
                  </h3>
                  <p className="text-sm font-medium text-slate-400">Complete details to bypass traditional brokerage brokers and find direct tenants instantly.</p>
                </div>

                <AnimatePresence>
                  {formError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 text-rose-800 flex items-start gap-4 overflow-hidden"
                    >
                      <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-black tracking-tight">Form Validation Blocked</h4>
                        <p className="text-xs font-semibold leading-relaxed text-rose-600">{formError}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormError(null)} 
                        className="text-xs font-bold text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Listing Reference Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Minimalist Zen Penthouse in Mylapore"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
			<label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Address Line</label>
			<input
			  type="text"
			  required
			  placeholder="e.g. 12, Bishop Wallers Avenue West"
			  value={address}
			  onChange={(e) => setAddress(e.target.value)}
			  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300"
			/>
		    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Security Deposit (₹)</label>
                      <input
                        type="number"
                        required
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Prop Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as PropertyType)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus:outline-none font-bold text-slate-700 text-xs appearance-none"
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="studio">Studio</option>
                        <option value="room">Room</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Zone</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus:outline-none font-bold text-slate-700 text-xs appearance-none"
                      >
                        <option value="Adyar">Adyar</option>
                        <option value="OMR">OMR</option>
                        <option value="Mylapore">Mylapore</option>
                        <option value="Nungambakkam">Nungambakkam</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Beds</label>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus:outline-none font-bold text-slate-700 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Area</label>
                      <input
                        type="number"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus:outline-none font-bold text-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Property Amenities (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="High-Speed Wifi, Private Parking, Pet Friendly..."
                      value={amenitiesText}
                      onChange={(e) => setAmenitiesText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                    />
                  </div>

                  {/* Real-time Custom Image File and Drag-and-Drop Uploader */}
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Property Photos (Upload & Live Preview)</label>
                      <p className="text-xs text-slate-400 font-medium px-4">Upload property photos directly from your device, paste picture URLs, or select one from our preset aesthetics.</p>
                    </div>

                    {/* Drag and Drop Box */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all ${
                        dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 bg-slate-50/20 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Drag & drop your property photos here or</p>
                          <label className="text-sm text-indigo-500 hover:text-indigo-600 font-extrabold cursor-pointer mt-1 inline-block">
                            browse files
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Photo URL Array Inputs */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image URLs</span>
                        <button
                          type="button"
                          onClick={() => setPhotoUrlInputs((prev) => [...prev, ''])}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-1 transition-all"
                        >
                          + Add Another URL
                        </button>
                      </div>

                      <div className="space-y-4">
                        {photoUrlInputs.map((url, index) => {
                          const hasText = url.trim().length > 0;
                          const isValid = hasText && isValidImageUrl(url);
                          
                          let borderClass = 'border-slate-100 focus:ring-indigo-500/10 focus:border-indigo-500';
                          if (hasText) {
                            borderClass = isValid 
                              ? 'border-emerald-200 bg-emerald-50/10 focus:border-emerald-500 focus:ring-emerald-500/10' 
                              : 'border-rose-200 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/10';
                          }

                          return (
                            <div key={index} className="space-y-1 bg-slate-50/30 p-3 rounded-3xl border border-slate-100">
                              <div className="flex gap-3 items-center">
                                <span className="text-xs font-black text-slate-400 w-8 text-center bg-slate-100 py-2.5 rounded-xl shrink-0">#{index + 1}</span>
                                <input 
                                  type="text" 
                                  placeholder="https://images.unsplash.com/photo-..." 
                                  value={url}
                                  onChange={(e) => {
                                    const newInputs = [...photoUrlInputs];
                                    newInputs[index] = e.target.value;
                                    setPhotoUrlInputs(newInputs);
                                    setFormError(null);
                                  }}
                                  className={`flex-1 bg-white border rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none placeholder:text-slate-300 transition-all ${borderClass}`}
                                />
                                {photoUrlInputs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhotoUrlInputs((prev) => prev.filter((_, idx) => idx !== index));
                                      setFormError(null);
                                    }}
                                    className="p-3.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl border border-red-100 transition-all cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              {hasText && (
                                <div className="text-[10px] font-bold px-4 pt-1 flex items-center gap-1.5">
                                  {isValid ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Valid public image URL
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Invalid link. Must start with http(s):// and use standard image formats (e.g., .jpg, .png, .webp).
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live URL Image Previews */}
                    {photoUrlInputs.some(url => url.trim().startsWith('http')) && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase px-4 tracking-wider">Live URL Previews</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {photoUrlInputs.map((url, idx) => {
                            if (!url.trim().startsWith('http')) return null;
                            return (
                              <div key={idx} className="relative h-24 rounded-3xl overflow-hidden group border border-slate-100 shadow-sm bg-slate-50">
                                <img src={url.trim()} alt="" className="w-full h-full object-cover" onError={(e) => {
                                  // Fallback indicator
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400';
                                }} />
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded-lg text-[8px] font-black uppercase">
                                  URL #{idx + 1}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Display uploaded photos if any */}
                    {customPhotos.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase px-4 tracking-wider">Uploaded Photos ({customPhotos.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {customPhotos.map((photo, idx) => (
                            <div key={idx} className="relative h-24 rounded-3xl overflow-hidden group border border-slate-100">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeCustomPhoto(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Presets Grid */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">
                        {customPhotos.length > 0 ? "Or override using presets" : "Or pick architectural styled presets:"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {photoPresets.map((pic, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setPhotoPreset(pic.url);
                              // Clear custom upload if user explicitly clicks preset to keep clean state
                              setCustomPhotos([]);
                            }}
                            className={`relative h-24 rounded-3xl overflow-hidden border-4 transition-all cursor-pointer ${
                              photoPreset === pic.url && customPhotos.length === 0 ? 'border-indigo-500 shadow-xl scale-105' : 'border-transparent opacity-60'
                            }`}
                          >
                            <img referrerPolicy="no-referrer" src={pic.url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 py-1 bg-black/40 text-center text-[10px] font-extrabold text-white">
                              {pic.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Owner Contact Information */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/80">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-indigo-500" />
                        Landlord Identity Settings
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">Bypass fees by confirming your registered workspace credentials.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase px-2">Landlord Name</label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none text-xs font-extrabold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase px-2">Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none text-xs font-extrabold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase px-2">Registered Email</label>
                        <input
                          type="email"
                          required
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none text-xs font-extrabold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-4 italic tracking-widest">Property Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Explain direct rental benefits and space specifications..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold placeholder:text-slate-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-6 px-4 rounded-[2.5rem] text-sm transition-all shadow-2xl shadow-indigo-500/10 active:scale-95 cursor-pointer"
                  >
                    Deploy Direct Listing Agent
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
