import React, { useState, useEffect, useRef } from 'react';
import { Property, ChatMessage } from '../types';
import { smartReplies } from '../data';
import { Send, Check, ShieldAlert, MessageCircle, Clock, Home } from 'lucide-react';

interface ChatSystemProps {
  properties: Property[];
  activePropertyId: string | null;
  chatMessages: ChatMessage[];
  onSendMessage: (propertyId: string, text: string) => void;
  onSelectPropertyChat: (id: string) => void;
}

export default function ChatSystem({ 
  properties, 
  activePropertyId, 
  chatMessages, 
  onSendMessage,
  onSelectPropertyChat
}: ChatSystemProps) {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMessages = chatMessages.filter(m => m.propertyId === activePropertyId);
  const activeProperty = properties.find(p => p.id === activePropertyId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, isTyping]);

  useEffect(() => {
    if (!activePropertyId || currentMessages.length === 0) return;
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (lastMessage.sender === 'tenant') {
      setIsTyping(true);
      const delayTimer = setTimeout(() => {
        setIsTyping(false);
        const replies = smartReplies[activePropertyId] || smartReplies.default;
        const tenantMsgsCount = currentMessages.filter(m => m.sender === 'tenant').length;
        const selectedReply = replies[(tenantMsgsCount - 1) % replies.length];
        onSendMessage(activePropertyId, selectedReply);
      }, 2000);
      return () => clearTimeout(delayTimer);
    }
  }, [chatMessages, activePropertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim() || !activePropertyId) return;
    onSendMessage(activePropertyId, typedText.trim());
    setTypedText('');
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex h-full" id="chat-system-root">
      {/* Sidebar - active conversations lists */}
      <div className="w-80 border-r border-slate-100 bg-white flex flex-col hidden lg:flex" id="chat-users-list">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-xl text-slate-900 tracking-tight">Messages</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {properties.map((p, idx) => {
            const hasMsgs = chatMessages.some(m => m.propertyId === p.id);
            const isSelected = activePropertyId === p.id;
            
            return (
              <button
                key={idx}
                onClick={() => onSelectPropertyChat(p.id)}
                className={`w-full text-left p-4 rounded-3xl transition-all cursor-pointer flex items-center gap-4 ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="relative">
                  <img referrerPolicy="no-referrer" src={p.ownerAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100/10" />
                  {hasMsgs && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{p.ownerName}</p>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>12:45</span>
                  </div>
                  <p className={`text-xs truncate font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{p.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat details viewport container */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/30" id="chat-main-view">
        {activeProperty ? (
          <>
            {/* Header info bar */}
            <div className="bg-white/80 backdrop-blur-xl p-6 border-b border-slate-100 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    referrerPolicy="no-referrer"
                    src={activeProperty.ownerAvatar} 
                    alt={activeProperty.ownerName} 
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-slate-900 tracking-tight">{activeProperty.ownerName}</h4>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      Verified Owner
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">
                    Discussing: {activeProperty.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">₹{activeProperty.price.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Broker Fee</p>
                </div>
                <div className="h-10 w-px bg-slate-100 hidden sm:block" />
                <button className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat message bubbles list scroller */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide" ref={scrollRef} id="chat-messages-container">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center" id="chat-empty-state">
                  <div className="w-20 h-20 bg-white shadow-2xl shadow-slate-200/50 rounded-[2rem] flex items-center justify-center mb-6">
                    <MessageCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">Start the Handover</h4>
                  <p className="text-sm text-slate-400 mt-2 max-w-[280px] font-medium leading-relaxed">
                    Say hello to {activeProperty.ownerName} to begin your direct rental negotiation.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-8">
                    <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Today
                    </div>
                  </div>
                  {currentMessages.map((msg, idx) => {
                    const isTenant = msg.sender === 'tenant';
                    return (
                      <div 
                        key={idx} 
                        className={`flex ${isTenant ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] space-y-1 ${isTenant ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-3xl px-6 py-4 text-sm font-medium shadow-sm transition-all hover:shadow-md ${
                            isTenant 
                              ? 'bg-slate-900 text-white rounded-br-none' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] font-bold text-slate-300 ${isTenant ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.timestamp}</span>
                            {isTenant && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-3xl px-6 py-4 rounded-bl-none text-slate-400 flex items-center gap-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Typing input footer */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSubmit} className="relative flex items-center gap-4">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder={`Message ${activeProperty.ownerName}...`}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!typedText.trim()}
                  className="bg-slate-900 hover:bg-black text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none cursor-pointer"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-white shadow-2xl shadow-slate-200/50 rounded-[3rem] flex items-center justify-center mb-8">
              <MessageCircle className="w-12 h-12 text-slate-200" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Direct Negotiation Panel</h4>
            <p className="text-sm text-slate-400 mt-2 max-w-[280px] font-medium leading-relaxed">
              Select an owner to start a secure, direct-to-landlord conversation without broker overhead.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
