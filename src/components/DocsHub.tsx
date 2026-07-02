import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { documentationData } from '../data';
import { BookOpen, FileText, Server, MessageSquare, Shield, Code, ChevronRight, CheckCircle, Upload, Eye, UserCheck, DollarSign, Loader2 } from 'lucide-react';

interface DocsHubProps {
  isKycVerified: boolean;
  onVerifyKyc: () => void;
  onSeedDummyData: () => Promise<boolean>;
}

export default function DocsHub({ isKycVerified, onVerifyKyc, onSeedDummyData }: DocsHubProps) {
  const [activeTab, setActiveTab] = useState<'system'|'db'|'api'|'contract'|'vault'>('system');
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onVerifyKyc();
    }, 2500);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden h-full flex flex-col" id="docs-hub-root">
      {/* Docs Header */}
      <div className="bg-slate-900 px-10 py-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">System Core v1.0</h2>
          </div>
          {isKycVerified && (
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/30 backdrop-blur-md">
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Identity</span>
            </div>
          )}
        </div>
        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
          Technical specifications, neural routing schemas, and direct legal templates engineered for the Chennai rental ecosystem.
        </p>
      </div>

      {/* Docs Mode Toggles */}
      <div className="flex bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide px-6">
        {[
          { id: 'system', label: 'Architecture', icon: Server },
          { id: 'vault', label: 'My Vault', icon: Shield },
          { id: 'db', label: 'Neural DB', icon: Code },
          { id: 'contract', label: 'Direct Draft', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-5 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'text-slate-900 bg-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="docsTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Docs Panel Body */}
      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide" id="docs-content-area">
        {activeTab === 'vault' && (
          <div className="space-y-10 animate-fadeIn" id="panel-vault">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Vault</h3>
              <p className="text-slate-500 font-medium text-sm">
                Securely store and verify your KYC documents to enable 1-click rental applications and direct handshake eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Aadhaar Card', status: isKycVerified ? 'Verified' : 'Pending', icon: Shield },
                { label: 'PAN Card', status: isKycVerified ? 'Verified' : 'Required', icon: FileText },
                { label: 'Employment Proof', status: isKycVerified ? 'Verified' : 'Optional', icon: UserCheck },
                { label: 'Bank Statement', status: isKycVerified ? 'Verified' : 'Required', icon: DollarSign }
              ].map((doc, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
                      <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{doc.label}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${doc.status === 'Verified' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {doc.status}
                      </p>
                    </div>
                  </div>
                  {doc.status === 'Verified' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline cursor-pointer">Update</button>
                  )}
                </div>
              ))}
            </div>

            {!isKycVerified ? (
              <div className="bg-[#1A1D1F] rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 backdrop-blur-md">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white">Neural Identity Verification</h4>
                    <p className="text-white/40 text-sm font-medium max-w-sm mx-auto">
                      Instantly verify your legal standing in the Chennai rental market to bypass broker friction permanently.
                    </p>
                  </div>
                  <button 
                    onClick={simulateUpload}
                    disabled={isUploading}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white font-black px-12 py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3 mx-auto cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Analyzing Payload...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Synchronize Digital Identity
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] p-12 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <UserCheck className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900">Digital Handshake Enabled</h4>
                  <p className="text-slate-500 text-sm font-medium max-w-sm">
                    Your profile is fully verified. You can now establish direct rental links with any property owner in Chennai.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-10 animate-fadeIn" id="panel-system">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Middleware Elimination Logic</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                The NestDirect protocol utilizes a peer-to-peer verification mechanism that maps owner-verified assets directly to tenant interest queues, bypassing the 8% - 12% brokerage surcharge typical in the Tamil Nadu market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
                <div className="flex items-center gap-3 text-indigo-900 font-bold text-sm mb-4">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  P2P Security Escrow
                </div>
                <p className="text-indigo-900/60 text-xs leading-relaxed font-medium">
                  Security deposits are locked in a dual-signature escrow wallet. Release is triggered only upon mutual digital handshake or verified lease termination.
                </p>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm mb-4">
                  <Server className="w-6 h-6 text-slate-500" />
                  Anti-Broker Neural Filter
                </div>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Autonomous pattern recognition analyzes listing descriptions for agent markers, routing suspicious entries to automatic ownership audit queues.
                </p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-[2.5rem] p-8 bg-white shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 underline decoration-indigo-500/30 underline-offset-4 uppercase tracking-[0.2em] mb-8">Onboarding Sequence</h4>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Asset Digitization', desc: 'Landlords register unit GPS coordinates and verified floor plans.' },
                  { step: '02', title: 'Ownership Audit', desc: 'System Cross-references tax records for live title verification.' },
                  { step: '03', title: 'Direct Handshake', desc: 'Tenant/Owner connect via private channel bypassing agency gatekeeping.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-6 relative">
                    <span className="text-2xl font-black text-slate-100 italic select-none">{item.step}</span>
                    <div className="space-y-1 pt-1.5 min-w-0">
                      <p className="font-bold text-base text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'db' && (
          <div className="space-y-8 animate-fadeIn" id="panel-db">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Neural DB Schema</h3>
              <p className="text-slate-500 font-medium text-sm">
                Optimized structures for standard mapping of direct rental entities in Chennai.
              </p>
            </div>

            {/* Cloud Firestore Seeder Control Card */}
            <div className="bg-slate-950 text-white rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Cloud Connection Active</span>
                  </div>
                  <h4 className="text-2xl font-bold tracking-tight text-white">Direct-to-Cloud Seeding Tool</h4>
                  <p className="text-sm font-medium text-slate-400 max-w-xl">
                    Force-synchronize the backend Firestore collections with the default 12 verified property listings, starter messages, and scheduling data to instantly construct an immersive sandbox.
                  </p>
                </div>
                <div>
                  <button
                    onClick={async () => {
                      setIsSeeding(true);
                      await onSeedDummyData();
                      setIsSeeding(false);
                    }}
                    disabled={isSeeding}
                    className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white font-black px-10 py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
                  >
                    {isSeeding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Seeding Cloud...
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        Seed Default Dataset
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {documentationData.map((sec, idx) => (
              <div key={idx} className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8 space-y-6">
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">{sec.title}</h4>
                <div className="grid gap-6">
                  {sec.points.map((pt, pIdx) => (
                    <div key={pIdx}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">field: {pt.title}</span>
                      <code className="block bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-xs leading-relaxed shadow-lg">
                        {pt.desc}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-8 animate-fadeIn" id="panel-api">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">RESTful Interfaces</h3>
              <p className="text-slate-500 font-medium text-sm">
                Structured endpoint responses returning real-time state profiles.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { method: 'GET', url: '/api/v1/properties/unit-id', desc: 'Retrieve direct listing metadata' },
                { method: 'POST', url: '/api/v1/applications/apply', desc: 'Dispatch peer application payload' }
              ].map((api, i) => (
                <div key={i} className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="bg-slate-800 px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${api.method === 'GET' ? 'bg-blue-500' : 'bg-orange-500'} text-white`}>
                        {api.method}
                      </span>
                      <code className="text-xs font-bold text-slate-300">{api.url}</code>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{api.desc}</span>
                  </div>
                  <pre className="p-8 text-xs font-mono text-slate-400 overflow-x-auto scrollbar-hide">
                    {i === 0 ? 
                      `{
  "status": "success",
  "data": {
    "id": "prop-1",
    "title": "Skylit Penthouse",
    "price": 35000,
    "brokerBypass": true
  }
}` : 
                      `{
  "property_id": "unit-442",
  "applicant_id": "usr-990",
  "handshake_intent": true
}`
                    }
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-8 animate-fadeIn" id="panel-contract">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Residential Lease Draft</h3>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                0% Agency Commission Model
              </span>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 font-serif text-sm text-slate-600 leading-loose shadow-sm max-h-[450px] overflow-y-auto space-y-6 scrollbar-hide">
              <p className="text-center font-black text-slate-900 text-lg uppercase tracking-tight mb-10 border-b border-slate-50 pb-6">Peer-to-Peer Lease Instrument</p>
              
              <div className="space-y-8">
                <section className="space-y-2">
                  <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">01. Protocol</h5>
                  <p>This agreement is established directly by the Lessor and Lessee. No brokerage intermediary has participated. No finders fees are due to any third party agent or agency.</p>
                </section>
                
                <section className="space-y-2">
                  <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">02. Direct Settlement</h5>
                  <p>Monthly rent payloads shall be dispatched directly to the Lessor account verified on the NestDirect platform. Zero platform markups or agency administration fees are included.</p>
                </section>
                
                <section className="space-y-2">
                  <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">03. Neural Escrow</h5>
                  <p>Security deposit remains in the P2P Escrow Vault until mutual handshake confirmation of unit handover at lease termination.</p>
                </section>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center italic">
              Digital Signatures active upon visit confirmation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
