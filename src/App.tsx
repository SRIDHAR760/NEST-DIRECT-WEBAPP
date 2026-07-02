import React, { useState, useEffect } from 'react';
import { Property, ChatMessage, DirectInquiry, PropertyType } from './types';
import { initialProperties } from './data';
import DocsHub from './components/DocsHub';
import PropertyDetail from './components/PropertyDetail';
import OwnerPortal from './components/OwnerPortal';
import ChatSystem from './components/ChatSystem';
import GuruChatBot from './components/GuruChatBot';
import NeighborhoodMap from './components/NeighborhoodMap';
import PropertyCardImageCarousel from './components/PropertyCardImageCarousel';
import { motion, AnimatePresence } from 'motion/react';

// Firebase Integrations & auth listeners
import { auth, db, signInWithGoogle, logoutUser, syncFavoritesToCloud, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

import { 
  Home, Search, Filter, MessageSquare, BookOpen, Heart, 
  MapPin, DollarSign, Building, Sparkles, User, Percent, 
  ChevronRight, Compass, Shield, Info, Plus,
  Grid, Bell, Check, Loader2, ArrowUpRight, Share2, ClipboardList,
  Map, Bus, Car, Bike, Zap, X, UserCheck, Wifi, Dumbbell
} from 'lucide-react';

export interface Workplace {
  id: string;
  name: string;
  zone: string;
  gridX: number;
  gridY: number;
  commuteTimes: Record<string, { metro: number; auto: number; bike: number }>;
}

export const workplacesData: Workplace[] = [
  { 
    id: 'iitm', 
    name: 'IIT Madras Research Park', 
    zone: 'Adyar', 
    gridX: 53,
    gridY: 56,
    commuteTimes: {
      'Nungambakkam': { metro: 25, auto: 35, bike: 20 },
      'Adyar': { metro: 5, auto: 8, bike: 4 },
      'OMR': { metro: 20, auto: 15, bike: 12 },
      'Mylapore': { metro: 12, auto: 18, bike: 10 }
    }
  },
  { 
    id: 'tidel', 
    name: 'TIDEL Park IT Expressway', 
    zone: 'OMR', 
    gridX: 123,
    gridY: 36,
    commuteTimes: {
      'Nungambakkam': { metro: 35, auto: 45, bike: 30 },
      'Adyar': { metro: 18, auto: 15, bike: 10 },
      'OMR': { metro: 5, auto: 6, bike: 5 },
      'Mylapore': { metro: 22, auto: 25, bike: 18 }
    }
  },
  { 
    id: 'spencer', 
    name: 'Spencer Plaza Commercial', 
    zone: 'Nungambakkam', 
    gridX: 90,
    gridY: 100,
    commuteTimes: {
      'Nungambakkam': { metro: 4, auto: 6, bike: 5 },
      'Adyar': { metro: 25, auto: 30, bike: 20 },
      'OMR': { metro: 35, auto: 40, bike: 28 },
      'Mylapore': { metro: 12, auto: 15, bike: 10 }
    }
  },
  { 
    id: 'kapaleeshwarar', 
    name: 'Mylapore Temple Gateway', 
    zone: 'Mylapore', 
    gridX: 36,
    gridY: 126,
    commuteTimes: {
      'Nungambakkam': { metro: 15, auto: 20, bike: 12 },
      'Adyar': { metro: 12, auto: 15, bike: 10 },
      'OMR': { metro: 22, auto: 25, bike: 18 },
      'Mylapore': { metro: 4, auto: 5, bike: 3 }
    }
  }
];

export const neighborhoodCenters: Record<string, { x: number; y: number }> = {
  'Adyar': { x: 53, y: 56 },
  'OMR': { x: 123, y: 36 },
  'Mylapore': { x: 36, y: 126 },
  'Nungambakkam': { x: 90, y: 100 }
};

export default function App() {
  // --- Real-Time Firebase Authentication and Storage States ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);

  // --- Real-Time Persistence State ---
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('nestdirect_properties_chennai_v4');
    return saved ? JSON.parse(saved) : initialProperties;
  });

  const [inquiries, setInquiries] = useState<DirectInquiry[]>(() => {
    const saved = localStorage.getItem('nestdirect_inquiries_chennai_v4');
    if (saved) return JSON.parse(saved);
    // Starter inquiries to demonstrate state density immediately
    return [
      {
        id: 'inq-starter-1',
        propertyId: 'prop-1',
        tenantName: 'Alex Mercer (You)',
        tenantEmail: 'bennymax@gmail.com',
        tenantPhone: '+91 99405 11223',
        visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        visitTime: '02:00 PM',
        message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nestdirect_messages_chennai_v4');
    if (saved) return JSON.parse(saved);
    // Starter messages
    return [
      {
        id: 'msg-start-1',
        propertyId: 'prop-1',
        sender: 'owner',
        text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
        timestamp: '10:14 AM'
      },
      {
        id: 'msg-start-2',
        propertyId: 'prop-1',
        sender: 'tenant',
        text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
        timestamp: '10:20 AM'
      }
    ];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('nestdirect_favorites_chennai_v4');
    return saved ? JSON.parse(saved) : ['prop-1', 'prop-5'];
  });

  // --- Search & Filtering States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [priceLimit, setPriceLimit] = useState<number>(100000);
  const [minBedrooms, setMinBedrooms] = useState<string>('any');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // --- Commuter & Proximity States ---
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('iitm');
  const [commuteTransitMode, setCommuteTransitMode] = useState<'metro' | 'auto' | 'bike'>('auto');
  const [maxCommuteTime, setMaxCommuteTime] = useState<number>(45);
  const [hoveredWorkplace, setHoveredWorkplace] = useState<string | null>(null);

  // --- View Control States ---
  // For Web Layout view selection: 'browse' | 'docs' | 'owner' | 'chats' | 'guru'
  const [webActiveSection, setWebActiveSection] = useState<'browse' | 'docs' | 'owner' | 'chats' | 'guru'>('browse');

  // --- Active elements state ---
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activePropertyChatId, setActivePropertyChatId] = useState<string | null>('prop-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Map Simulator active spot ---
  const [selectedMapNeighborhood, setSelectedMapNeighborhood] = useState<string>('Adyar');
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapContainerWidth, setMapContainerWidth] = useState<number>(280);
  const [activePriceTiers, setActivePriceTiers] = useState<string[]>(['budget', 'mid', 'premium']);
  const [mapScale, setMapScale] = useState<number>(1.0);

  // --- Compare Basket & Route Hoover states ---
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // --- Onboarding & Identity States ---
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('nestdirect_onboarding_v4_done') === 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isKycVerified, setIsKycVerified] = useState<boolean>(() => {
    return localStorage.getItem('nestdirect_kyc_verified_v4') === 'true';
  });

  const getPropertyTier = (price: number): 'budget' | 'mid' | 'premium' => {
    if (price < 22000) return 'budget';
    if (price <= 30000) return 'mid';
    return 'premium';
  };

  const getCommuteGrade = (time: number): string => {
    if (time <= 10) return 'A+';
    if (time <= 20) return 'A';
    if (time <= 30) return 'B';
    if (time <= 45) return 'C';
    return 'D';
  };

  const togglePriceTier = (tier: string) => {
    setActivePriceTiers(prev => {
      const next = prev.includes(tier) 
        ? prev.filter(t => t !== tier) 
        : [...prev, tier];
      showToast(`${tier.charAt(0).toUpperCase() + tier.slice(1)} price tier ${prev.includes(tier) ? 'deactivated' : 'activated'}`);
      return next;
    });
  };

  // Auto-shift selected neighborhood if its tier is toggled off
  useEffect(() => {
    if (activePriceTiers.length > 0) {
      const activeWards = ['Adyar', 'OMR', 'Mylapore'].filter(ward => {
        const tier = ward === 'Adyar' ? 'premium' : ward === 'Mylapore' ? 'mid' : 'budget';
        return activePriceTiers.includes(tier);
      });
      if (activeWards.length > 0 && !activeWards.includes(selectedMapNeighborhood)) {
        setSelectedMapNeighborhood(activeWards[0]);
        setSelectedCity(activeWards[0]);
      }
    }
  }, [activePriceTiers, selectedMapNeighborhood]);

  // 🔄 1. Listen to Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsFirebaseLoading(false);
      if (user) {
        // Retrieve cloud favorites if they exist in Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data && Array.isArray(data.favorites)) {
              setFavorites(data.favorites);
            }
          }
        } catch (err: any) {
          console.warn("Could not retrieve cloud favorites (offline or cache fallback):", err.message || err);
          // Safe fallback from local storage
          const savedFavorites = localStorage.getItem('nestdirect_favorites_v4');
          if (savedFavorites) {
            try {
              setFavorites(JSON.parse(savedFavorites));
            } catch (jsonErr) {}
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔄 2. Listen to Properties in Firestore (Seeds if Firestore is brand new)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), async (snapshot) => {
      if (snapshot.empty) {
        // State initializer: write standard starters to cloud
        try {
          for (const prop of initialProperties) {
            await setDoc(doc(db, 'properties', prop.id), prop);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'properties');
        }
      } else {
        const cloudProps: Property[] = [];
        snapshot.forEach((doc) => {
          cloudProps.push(doc.data() as Property);
        });
        cloudProps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setProperties(cloudProps);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'properties');
    });
    return () => unsubscribe();
  }, []);

  // 🔄 3. Listen to Inquiries in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inquiries'), async (snapshot) => {
      if (snapshot.empty) {
        // Seed starter inquiries
        try {
          const starterInquiries = [
            {
              id: 'inq-starter-1',
              propertyId: 'prop-1',
              tenantName: 'Alex Mercer (You)',
              tenantEmail: 'bennymax@gmail.com',
              tenantPhone: '+91 99405 11223',
              visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              visitTime: '02:00 PM',
              message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
              status: 'pending',
              createdAt: new Date().toISOString()
            }
          ];
          for (const inq of starterInquiries) {
            await setDoc(doc(db, 'inquiries', inq.id), inq);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'inquiries');
        }
      } else {
        const cloudInqs: DirectInquiry[] = [];
        snapshot.forEach((doc) => {
          cloudInqs.push(doc.data() as DirectInquiry);
        });
        setInquiries(cloudInqs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inquiries');
    });
    return () => unsubscribe();
  }, []);

  // 🔄 4. Listen to Chat Messages in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'chat_messages'), async (snapshot) => {
      if (snapshot.empty) {
        try {
          const starterMessages = [
            {
              id: 'msg-start-1',
              propertyId: 'prop-1',
              sender: 'owner',
              text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
              timestamp: '10:14 AM'
            },
            {
              id: 'msg-start-2',
              propertyId: 'prop-1',
              sender: 'tenant',
              text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
              timestamp: '10:20 AM'
            }
          ];
          for (const msg of starterMessages) {
            await setDoc(doc(db, 'chat_messages', msg.id), msg);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'chat_messages');
        }
      } else {
        const cloudMsgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          cloudMsgs.push(doc.data() as ChatMessage);
        });
        // Sort by ID is usually perfect for keeping chat messages serial
        cloudMsgs.sort((a, b) => a.id.localeCompare(b.id));
        setChatMessages(cloudMsgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });
    return () => unsubscribe();
  }, []);

  // 🔄 5. Sync Local Favorites to user document when logged in
  useEffect(() => {
    if (currentUser && favorites.length > 0) {
      syncFavoritesToCloud(currentUser.uid, favorites);
    }
  }, [favorites, currentUser]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nestdirect_properties_chennai_v4', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('nestdirect_inquiries_chennai_v4', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('nestdirect_messages_chennai_v4', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('nestdirect_favorites_chennai_v4', JSON.stringify(favorites));
  }, [favorites]);

  // 🔄 6. Parse deep-linked comparedPropertyIds from URL parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const compareParam = searchParams.get('comparedPropertyIds') || searchParams.get('compare');
    if (compareParam) {
      const ids = compareParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        setComparedPropertyIds(ids);
        setIsCompareOpen(true);
        setTimeout(() => {
          showToast(`Loaded ${ids.length} shared properties for comparison!`);
        }, 800);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareCompare = async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const idsString = comparedPropertyIds.join(',');
    const link = `${baseUrl}?comparedPropertyIds=${encodeURIComponent(idsString)}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Comparison link copied! Send it to your roommates.");
    } catch (err) {
      // Fallback copy
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showToast("Comparison link copied! Send it to your roommates.");
        } else {
          showToast("Failed to copy link automatically.");
        }
      } catch (e) {
        console.error("Failed to copy link:", e);
        showToast("Failed to copy link automatically.");
      }
      document.body.removeChild(textArea);
    }
  };

  // --- Listing manipulations ---
  const handleAddProperty = async (newProperty: Property) => {
    try {
      await setDoc(doc(db, 'properties', newProperty.id), newProperty);
      showToast(`Property "${newProperty.title}" successfully listed directly by owner!`);
    } catch (e) {
      setProperties(prev => [newProperty, ...prev]);
      handleFirestoreError(e, OperationType.WRITE, `properties/${newProperty.id}`);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await setDoc(doc(db, 'inquiries', id), { status }, { merge: true });
      showToast(`Tour schedule request has been ${status === 'accepted' ? 'accepted' : 'declined'} successfully.`);
      
      // Auto-message coordination in chat
      const targetInq = inquiries.find(i => i.id === id);
      if (targetInq) {
        const confirmText = status === 'accepted' 
          ? `Hello! I have confirmed your request to tour the property on ${targetInq.visitDate} at ${targetInq.visitTime}. See you then!`
          : `Hi there, unfortunately that specific time slot is unavailable. Please choose another date or message me here!`;
        
        const newMsg: ChatMessage = {
          id: `msg-auto-${Date.now()}`,
          propertyId: targetInq.propertyId,
          sender: 'owner',
          text: confirmText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await setDoc(doc(db, 'chat_messages', newMsg.id), newMsg);
      }
    } catch (e) {
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));
      handleFirestoreError(e, OperationType.WRITE, `inquiries/${id}`);
    }
  };

  const handleStartChat = (propertyId: string) => {
    setActivePropertyChatId(propertyId);
    setSelectedPropertyId(null); // Close drawer
    setWebActiveSection('chats');
    showToast("Direct Chat Session Opened!");
  };

  const handleBookVisit = async (newInquiry: DirectInquiry) => {
    try {
      await setDoc(doc(db, 'inquiries', newInquiry.id), newInquiry);
      showToast(`Walkthrough tour requested with Host directly!`);
    } catch (e) {
      setInquiries(prev => [newInquiry, ...prev]);
      handleFirestoreError(e, OperationType.WRITE, `inquiries/${newInquiry.id}`);
    }
  };

  const handleSendMessage = async (propertyId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      propertyId,
      sender: 'tenant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Check if the user is replying as tenant or landlord
    const property = properties.find(p => p.id === propertyId);
    const isUserOwner = property?.ownerName.includes('(You)');
    if (isUserOwner) {
      newMsg.sender = 'owner';
    }

    try {
      await setDoc(doc(db, 'chat_messages', newMsg.id), newMsg);
    } catch (e) {
      setChatMessages(prev => [...prev, newMsg]);
      handleFirestoreError(e, OperationType.WRITE, `chat_messages/${newMsg.id}`);
    }
  };

  const handleSeedDummyData = async (): Promise<boolean> => {
    try {
      showToast("Seeding default properties, messages, and inquiries to cloud Firestore...");
      // 1. Seed properties
      for (const prop of initialProperties) {
        await setDoc(doc(db, 'properties', prop.id), prop);
      }
      // 2. Seed starter inquiries
      const starterInquiries = [
        {
          id: 'inq-starter-1',
          propertyId: 'prop-1',
          tenantName: 'Alex Mercer (You)',
          tenantEmail: 'bennymax@gmail.com',
          tenantPhone: '+91 99405 11223',
          visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          visitTime: '02:00 PM',
          message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      for (const inq of starterInquiries) {
        await setDoc(doc(db, 'inquiries', inq.id), inq);
      }
      // 3. Seed starter chat messages
      const starterMessages = [
        {
          id: 'msg-start-1',
          propertyId: 'prop-1',
          sender: 'owner',
          text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
          timestamp: '10:14 AM'
        },
        {
          id: 'msg-start-2',
          propertyId: 'prop-1',
          sender: 'tenant',
          text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
          timestamp: '10:20 AM'
        }
      ];
      for (const msg of starterMessages) {
        await setDoc(doc(db, 'chat_messages', msg.id), msg);
      }
      showToast("Cloud Firestore successfully populated with standard Chennai listings!");
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'all_collections');
      return false;
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showToast("Removed from bookmarks");
        return prev.filter(fId => fId !== id);
      } else {
        showToast("Property bookmarked!");
        return [...prev, id];
      }
    });
  };

  const getCommuteTime = (cityZone: string, workplaceId: string, mode: 'metro' | 'auto' | 'bike'): number => {
    const workplace = workplacesData.find(w => w.id === workplaceId);
    if (!workplace) return 15;
    // Map ward names gracefully
    const mappedZone = cityZone === 'Adyar' ? 'Adyar' : cityZone === 'OMR' ? 'OMR' : cityZone === 'Mylapore' ? 'Mylapore' : 'Nungambakkam';
    return workplace.commuteTimes[mappedZone]?.[mode] ?? 15;
  };

  // --- Filtering Calculations ---
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === 'All' || p.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesType = selectedType === 'All' || p.type === selectedType.toLowerCase();
    const matchesPrice = p.price <= priceLimit;
    
    let matchesBeds = true;
    if (minBedrooms !== 'any') {
      if (minBedrooms === '3+') {
        matchesBeds = p.bedrooms >= 3;
      } else {
        matchesBeds = p.bedrooms === parseInt(minBedrooms);
      }
    }
    
    const matchesVerified = !onlyVerified || p.ownerVerified;
    const matchesTier = activePriceTiers.includes(getPropertyTier(p.price));
    
    // Commute filtering
    const commuteTime = getCommuteTime(p.city, selectedWorkplace, commuteTransitMode);
    const matchesCommute = commuteTime <= maxCommuteTime;

    return matchesSearch && matchesCity && matchesType && matchesPrice && matchesBeds && matchesVerified && matchesTier && matchesCommute;
  });

  const isFilterActive = searchQuery !== '' || 
                         selectedCity !== 'All' || 
                         selectedType !== 'All' || 
                         priceLimit < 100000 || 
                         minBedrooms !== 'any' || 
                         onlyVerified || 
                         activePriceTiers.length < 3 || 
                         maxCommuteTime !== 45;

  const totalSavingsCommissions = filteredProperties.reduce((sum, p) => sum + p.brokerSavings, 0);

  // --- Commute Route calculations for map overlay ---
  const activeRouteOriginZone = (() => {
    if (hoveredPropertyId) {
      const p = properties.find(x => x.id === hoveredPropertyId);
      if (p) return p.city;
    }
    if (hoveredNeighborhood) return hoveredNeighborhood;
    return selectedMapNeighborhood;
  })();

  const activeRouteOrigin = neighborhoodCenters[activeRouteOriginZone] || neighborhoodCenters['Adyar'];
  const activeRouteDest = workplacesData.find(w => w.id === selectedWorkplace) || workplacesData[0];
  const routeColor = commuteTransitMode === 'metro' ? '#3b82f6' : commuteTransitMode === 'auto' ? '#fbbf24' : '#10b981';

  // --- Mock Neighborhood Mapping simulator ---
  const neighborhoodData: Record<string, { desc: string; coords: string; avgRent: number; directCount: number }> = {
    'Adyar': { desc: 'Premium beachside avenues, elite standalone houses, modern rooftop lofts, and Elliot\'s walk.', coords: 'M 40,40 L 70,50 L 50,80 Z', avgRent: 45000, directCount: 2 },
    'OMR': { desc: 'The major IT Express Highway, modern high-rise tech apartments, co-living micro-studios.', coords: 'M 110,30 L 140,20 L 120,60 Z', avgRent: 21000, directCount: 3 },
    'Mylapore': { desc: 'Historic temple quarter containing traditional brass shops, lively alleys, and pure filter coffee.', coords: 'M 10,120 L 60,110 L 40,150 Z', avgRent: 25000, directCount: 1 },
    'Nungambakkam': { desc: 'Upscale heart of Chennai, rich commercial avenues, luxury high-rises, and prime residential leafy streets.', coords: 'M 80,75 L 110,95 L 75,115 Z', avgRent: 35000, directCount: 2 }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1A1D1F] font-sans antialiased" id="nestdirect-app-scope">
      
      {/* 🚀 TOAST ALERTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1A1D1F] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 backdrop-blur-xl"
          >
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold tracking-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📊 ONBOARDING PORTAL */}
      <AnimatePresence>
        {!onboardingCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FAFAFC] flex items-center justify-center p-4 sm:p-8 z-[90] overflow-y-auto"
          >
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Product Preview */}
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block relative"
              >
                <div className="w-[450px] h-[600px] bg-white rounded-[4rem] shadow-premium border border-slate-100 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white text-4xl font-extrabold font-display leading-tight">Modern Living. <br/>Direct from Owners.</h3>
                    <p className="text-white/70 mt-4 font-medium">Bypass fees and find your dream home in Chennai.</p>
                  </div>
                </div>
              </motion.div>

              {/* Login Actions */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Home className="w-8 h-8" />
                    <span className="text-xl font-black font-display tracking-tight text-[#1A1D1F]">NestDirect</span>
                  </div>
                  <h1 className="text-5xl font-black font-display tracking-tight leading-[1.1]">The future of <span className="text-blue-600">renting</span> is direct</h1>
                  <p className="text-slate-500 text-lg font-medium max-w-md">Connect with property owners without intermediaries. Save time, money, and hassle.</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={async () => {
                      const user = await signInWithGoogle();
                      if (user) {
                        localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                        setOnboardingCompleted(true);
                      }
                    }}
                    className="w-full h-16 bg-[#1A1D1F] hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-4 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <User className="w-5 h-5 text-blue-400" />
                    Continue with Google
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                      setOnboardingCompleted(true);
                    }}
                    className="w-full h-16 bg-white border border-slate-200 hover:bg-slate-50 text-[#1A1D1F] rounded-2xl font-bold transition-all cursor-pointer"
                  >
                    Explore as Guest
                  </button>
                </div>

                <div className="pt-10 border-t border-slate-100 flex items-center gap-8">
                  <div>
                    <p className="text-2xl font-black font-display">1.2k+</p>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Properties</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black font-display">₹10M+</p>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Saved in Fees</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖥️ NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setWebActiveSection('browse')}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Home className="w-6 h-6" />
              </div>
              <span className="text-xl font-black font-display tracking-tight">NestDirect</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { id: 'browse', label: 'Discover', icon: Compass },
                { id: 'chats', label: 'Messages', icon: MessageSquare },
                { id: 'owner', label: 'Owner Hub', icon: User },
                { id: 'guru', label: 'AI Guru', icon: Sparkles },
                { id: 'docs', label: 'Guidelines', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setWebActiveSection(item.id as any)}
                  className={`flex items-center gap-2.5 text-sm font-bold transition-all font-display ${
                    webActiveSection === item.id ? 'text-blue-600' : 'text-slate-500 hover:text-[#1A1D1F]'
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none">{currentUser.displayName?.split(' ')[0]}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Verified User</p>
                </div>
                <img src={currentUser.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                <button onClick={() => logoutUser()} className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="bg-[#1A1D1F] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12" id="web-dashboard-layout">
        {webActiveSection === 'browse' && (
          <div className="space-y-16 animate-fadeIn">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden rounded-[3rem] bg-[#1A1D1F] p-8 md:p-16 lg:p-24 shadow-premium">
              <motion.div 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.3, scale: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                <img src="https://images.unsplash.com/photo-1600585154340-be6199f7f009?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-12">
                <div className="space-y-6">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-full text-white text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Sparkles className="w-4 h-4" />
                    Trusted by 10,000+ Tenants
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black font-display text-white leading-tight max-w-2xl"
                  >
                    Find your <span className="text-blue-500">perfect</span> home away from home
                  </motion.h2>
                </div>

                {/* SEARCH BAR (Bento Style) */}
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-3 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-4xl"
                >
                  <div className="flex-1 flex items-center gap-4 pl-6 w-full h-16 md:h-auto">
                    <Search className="w-6 h-6 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="Search by location, neighborhood..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-[#1A1D1F] font-bold placeholder-slate-400 focus:outline-none text-lg"
                    />
                  </div>
                  <div className="hidden md:block w-px h-10 bg-slate-100 mx-2" />
                  <div className="flex-1 hidden md:flex items-center gap-4 px-6">
                    <MapPin className="w-6 h-6 text-slate-300" />
                    <select 
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="bg-transparent border-none text-[#1A1D1F] font-bold focus:outline-none text-base cursor-pointer w-full"
                    >
                      {['All', 'Adyar', 'Nungambakkam', 'OMR', 'Mylapore'].map(c => <option key={c} value={c}>{c === 'All' ? 'Everywhere' : c}</option>)}
                    </select>
                  </div>
                  <button className="w-full md:w-auto h-16 md:h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30">
                    Search
                  </button>
                </motion.div>
              </div>
            </section>

            {/* QUICK FILTERS */}
            <section className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-3">
                {['All', 'Apartment', 'House', 'Villa', 'Studio'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold border transition-all ${
                      selectedType === type 
                        ? 'bg-[#1A1D1F] text-white border-[#1A1D1F]' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400">Sort by:</span>
                <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-3 cursor-pointer">
                  Newest Listings
                  <ChevronRight className="w-4 h-4 rotate-90 text-slate-300" />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
              {/* LEFT: PROPERTY LIST & FILTERS (Col 1-3) */}
              <div className="xl:col-span-3 space-y-10">
                {/* 🌟 USER DIRECT UPLOAD CALL TO ACTION BANNER */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-blue-500/10"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/10 shadow-lg">
                      <Plus className="w-10 h-10" />
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="inline-block bg-blue-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/10">No Brokerage</span>
                      <h4 className="text-xl font-black font-display tracking-tight leading-tight mt-1">Rent Custom Listings Direct from Owners</h4>
                      <p className="text-sm text-white/70 font-medium">Bypass fees completely. Connect directly with verified office-goers and list units instantly.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setWebActiveSection('owner')}
                    className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-md active:scale-95 cursor-pointer relative z-10 font-sans"
                  >
                    List Your Unit Now
                  </button>
                </motion.div>

                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black font-display tracking-tight text-[#1A1D1F]">Featured Properties</h3>
                    <p className="text-slate-500 font-medium">{filteredProperties.length} handpicked listings for you in {selectedCity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <Grid className="w-5 h-5 text-slate-400" />
                    </button>
                    <button className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <Map className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="bg-white rounded-[3rem] py-24 text-center border border-slate-100 shadow-premium">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-[#1A1D1F]">No properties found</h4>
                    <p className="text-slate-500 mt-2">Try adjusting your filters to find more results in {selectedCity}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredProperties.map((prop, idx) => {
                      const commuteMin = getCommuteTime(prop.city, selectedWorkplace, commuteTransitMode);
                      return (
                        <motion.div
                          key={prop.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -8, scale: 1.01 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            delay: idx * 0.05 
                          }}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-card hover:shadow-premium hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
                        >
                          <PropertyCardImageCarousel
                            photos={prop.photos}
                            propertyId={prop.id}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            type={prop.type}
                            city={prop.city}
                            selectedWorkplace={selectedWorkplace}
                            commuteTransitMode={commuteTransitMode}
                            isFilterActive={isFilterActive}
                            getCommuteGrade={getCommuteGrade}
                            getCommuteTime={getCommuteTime}
                            prop={prop}
                          />

                          <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                  <MapPin className="w-4 h-4 text-blue-500" />
                                  {prop.city}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                  <Compass className="w-3 h-3" />
                                  {commuteMin} MINS
                                </div>
                              </div>
                              <h4 className="text-2xl font-black font-display tracking-tight text-[#1A1D1F] group-hover:text-blue-600 transition-colors leading-tight">{prop.title}</h4>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                  <span className="text-lg font-black text-[#1A1D1F]">{prop.bedrooms}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Beds</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-black text-[#1A1D1F]">{prop.bathrooms}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Baths</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-black text-[#1A1D1F]">{prop.areaSqFt}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sq.Ft</span>
                                </div>
                              </div>

                              <div className="flex -space-x-2">
                                <img src={prop.ownerAvatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white">
                                  <Check className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT: SMART INSIGHTS SIDEBAR (Col 4) */}
              <aside className="space-y-8 sticky top-28">
                {/* 🎯 Workspace Selection */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-[#1A1D1F]">Active Workspace</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Commute Optimization Hub</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {workplacesData.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWorkplace(w.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          selectedWorkplace === w.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'bg-slate-50 border-transparent text-[#1A1D1F] hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate leading-tight">{w.name}</p>
                          <p className={`text-[9px] font-bold mt-1 ${selectedWorkplace === w.id ? 'text-white/60' : 'text-slate-400'}`}>
                            {w.zone} Zone
                          </p>
                        </div>
                        {selectedWorkplace === w.id && <ChevronRight className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button 
                      onClick={() => setCommuteTransitMode('auto')}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${commuteTransitMode === 'auto' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Zap className="w-3 h-3" />
                      Auto
                    </button>
                    <button 
                      onClick={() => setCommuteTransitMode('metro')}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${commuteTransitMode === 'metro' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Bus className="w-3 h-3" />
                      Metro
                    </button>
                    <button 
                      onClick={() => setCommuteTransitMode('bike')}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${commuteTransitMode === 'bike' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Bike className="w-3 h-3" />
                      Bike
                    </button>
                  </div>
                </div>

                {/* 🗺️ Neighborhood Pulse */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium">
                  <NeighborhoodMap 
                    selectedZone={selectedCity === 'All' ? selectedMapNeighborhood : selectedCity}
                    onZoneSelect={(zone) => {
                      setSelectedCity(zone);
                      setSelectedMapNeighborhood(zone);
                      showToast(`Neighborhood set to ${zone}`);
                    }}
                    neighborhoodData={neighborhoodData}
                    transitMode={commuteTransitMode}
                  />
                </div>

                {/* 💰 Direct Savings Pulse */}
                <div className="bg-[#1A1D1F] rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden shadow-premium">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl -ml-16 -mb-16" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Direct Gains</h4>
                    </div>

                    <div className="space-y-1">
                      <p className="text-4xl font-black font-display tracking-tight">₹{totalSavingsCommissions.toLocaleString()}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Aggregate Brokerage Avoided</p>
                    </div>

                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" 
                      />
                    </div>

                    <p className="text-[11px] text-white/60 font-medium leading-relaxed italic">
                      "Save up to ₹{Math.max(...filteredProperties.map(p => p.brokerSavings)).toLocaleString()} in a single direct handshake transaction today."
                    </p>
                  </div>
                </div>

                {/* 📈 Market Trend Card (Visual Placeholder) */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-[#1A1D1F]">Trend Pulse</h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">+12%</span>
                  </div>

                  <div className="flex items-end gap-1.5 h-20 px-2">
                    {[30, 45, 35, 60, 50, 75, 40, 85, 95].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className={`flex-1 rounded-t-lg transition-colors ${i === 8 ? 'bg-blue-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-[0.2em]">Listing velocity in {selectedCity}</p>
                </div>
              </aside>
            </section>
          </div>
        )}

        {webActiveSection === 'chats' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden">
            <ChatSystem
              properties={properties}
              activePropertyId={activePropertyChatId}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onSelectPropertyChat={(id) => setActivePropertyChatId(id)}
            />
          </motion.div>
        )}

        {webActiveSection === 'guru' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[750px] bg-[#1A1D1F] rounded-[3rem] shadow-premium overflow-hidden">
            <GuruChatBot properties={properties} />
          </motion.div>
        )}

        {webActiveSection === 'owner' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden p-8">
            <OwnerPortal
              myProperties={properties.filter(p => p.ownerName.includes('(You)') || (currentUser && p.ownerEmail === currentUser.email))}
              inquiries={inquiries}
              onAddProperty={handleAddProperty}
              onUpdateInquiryStatus={handleUpdateInquiryStatus}
              currentUser={currentUser}
            />
          </motion.div>
        )}

        {webActiveSection === 'docs' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden p-8">
            <DocsHub 
              isKycVerified={isKycVerified} 
              onVerifyKyc={() => {
                setIsKycVerified(true);
                localStorage.setItem('nestdirect_kyc_verified_v4', 'true');
                showToast("Identity Synchronized. You are now a Verified Tenant.");
              }}
              onSeedDummyData={handleSeedDummyData}
            />
          </motion.div>
        )}
      </main>

      {/* ========================================== */}
      {/* 📊 FLOATING COMPARISON BASKET OVERLAY BADGE */}
      {/* ========================================== */}
      {comparedPropertyIds.length > 0 && (
        <motion.div 
          id="floating-compare-hud"
          whileHover={{
            scale: [1, 1.02, 1],
            borderColor: [
              "rgba(16, 185, 129, 0.3)",
              "rgba(16, 185, 129, 0.6)",
              "rgba(16, 185, 129, 0.3)"
            ],
            boxShadow: [
              "0 0 50px -12px rgba(16,185,129,0.3)",
              "0 0 50px -4px rgba(16,185,129,0.5)",
              "0 0 50px -12px rgba(16,185,129,0.3)"
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="fixed bottom-8 right-8 bg-slate-950/80 border border-emerald-500/30 pl-5 pr-3 py-3 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] z-40 flex items-center gap-6 animate-slideUp backdrop-blur-2xl max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse shrink-0" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Analysis Loop</p>
              <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{comparedPropertyIds.length} Vector{comparedPropertyIds.length > 1 ? 's' : ''} Staged</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-emerald-500/20"
            >
              Matrix
            </button>
            <button
              onClick={() => {
                setComparedPropertyIds([]);
                showToast('Matrix cleared');
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-wider w-10 h-10 flex items-center justify-center rounded-2xl border border-white/5 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 📊 DIRECT COMPARISON SIDE-BY-SIDE DIALOG */}
      {isCompareOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 z-50 animate-fadeIn" id="compare-modal-root">
          <div className="bg-slate-900 border border-white/5 rounded-[3rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_0_100px_-20px_rgba(16,185,129,0.1)] animate-scaleUp">
            
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-display tracking-tight">Rental Analysis Matrix</h3>
                  <p className="text-xs text-slate-500 font-bold tracking-wide uppercase mt-0.5">Real-time Comparative Protocol • Verified Listings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShareCompare}
                  className="px-5 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-emerald-500/20 hover:border-emerald-500/30 active:scale-95 cursor-pointer shrink-0"
                  title="Copy deep-link to share comparison with roommates"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Share Comparison</span>
                  <span className="sm:hidden">Share</span>
                </button>
                <button 
                  onClick={() => setIsCompareOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Matrix Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8 scrollbar-thin scrollbar-thumb-white/5">
              <div className="grid grid-cols-4 gap-6 items-stretch">
                
                {/* Labels Column */}
                <div className="space-y-6 pr-4 flex flex-col justify-between py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">
                  <div className="h-56 flex items-end pb-4 font-black">Configuration</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Economics</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Building className="w-4 h-4 text-emerald-500" /> Architecture</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Compass className="w-4 h-4 text-blue-500" /> Logistics</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-500" /> Direct Gain</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-500" /> Validation</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2">Inventory</div>
                  <div className="pt-6 border-t border-white/5">Protocol</div>
                </div>

                {/* Compare Properties columns (max 3) */}
                {properties.filter(p => comparedPropertyIds.includes(p.id)).map((p) => {
                  const commuteMin = getCommuteTime(p.city, selectedWorkplace, commuteTransitMode);
                  return (
                    <motion.div 
                      key={p.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="bg-white/90 border border-slate-100 rounded-[2.5rem] p-6 flex flex-col justify-between relative space-y-8 backdrop-blur-xl hover:shadow-indigo-500/10 hover:border-indigo-200 hover:shadow-premium transition-all duration-500 group shadow-lg shadow-slate-200/20"
                    >
                      
                      {/* Column Content 1: Header Image & Title */}
                      <div className="space-y-6 flex flex-col">
                        <div className="h-44 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner">
                          <img referrerPolicy="no-referrer" src={p.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest border border-slate-100 shadow-sm">
                            {p.type}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-base font-black text-slate-900 font-display line-clamp-2 leading-tight tracking-tight">{p.title}</h4>
                          <div className="text-[10px] text-slate-400 font-black flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            {p.city}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Rent & Deposit */}
                        <div className="pt-6 border-t border-slate-50">
                          <p className="text-2xl font-black text-slate-900 font-display tracking-tight">₹{p.price.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider leading-none">Deposit: ₹{p.securityDeposit.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Area & Space */}
                        <div className="pt-6 border-t border-slate-50 text-xs text-slate-500 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">{p.bedrooms}</span> Bed • <span className="text-slate-900">{p.bathrooms}</span> Bath
                          </div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider leading-none">{p.areaSqFt} SQFT Luxury Space</p>
                        </div>

                        {/* Commute Time to active office */}
                        <div className="pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-sm font-black text-blue-600 font-display">
                            <Compass className="w-4 h-4" />
                            <span>{commuteMin} MINS COMMUTE</span>
                          </div>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1 leading-none">To Active Workspace hub</p>
                        </div>

                        {/* Middleman Saved */}
                        <div className="pt-6 border-t border-slate-50">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                            <Zap className="w-3 h-3 fill-green-600" />
                            ₹{p.brokerSavings.toLocaleString('en-IN')} Saved
                          </div>
                        </div>

                        {/* Verified host */}
                        <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                          <img src={p.ownerAvatar} alt="" className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                          <div className="text-[10px]">
                            <p className="font-bold text-slate-900 leading-none mb-1.5">{p.ownerName}</p>
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-blue-500" />
                              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Verified Host</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Direct Chat) */}
                      <div className="pt-8 flex gap-3 mt-auto">
                        <button 
                          onClick={() => {
                            setActivePropertyChatId(p.id);
                            setWebActiveSection('chats');
                            setIsCompareOpen(false);
                            showToast(`Encrypted Link established with ${p.ownerName}`);
                          }}
                          className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                        >
                          Chat Direct
                        </button>
                        <button 
                          onClick={() => {
                            setComparedPropertyIds(prev => prev.filter(id => id !== p.id));
                          }}
                          className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* If < 3 properties, show a call-to-add blank column */}
                {Array.from({ length: Math.max(0, 3 - comparedPropertyIds.length) }).map((_, idx) => (
                  <div key={idx} className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center transition-all hover:bg-slate-50 hover:border-slate-200 group">
                    <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Add Protocol</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight leading-relaxed max-w-[120px]">Select listing to augment comparative analysis</p>
                  </div>
                ))}

              </div>
            </div>

            {/* Total savings calculation summary row */}
            <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-400 px-12 shrink-0 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 text-[11px] uppercase tracking-widest">Aggregate Direct Gains</span>
                  <span className="text-slate-400 text-[9px] uppercase tracking-[0.15em] mt-1">Net Direct Savings Portfolio</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 font-display">₹{properties.filter(p => comparedPropertyIds.includes(p.id)).reduce((sum, p) => sum + p.brokerSavings, 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-green-600 tracking-widest font-black uppercase">Commission Avoided</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
                  Export Report
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🚀 SHARED PROPERTY DETAIL DRAW PANEL (Slid from side) */}
      {/* ==================================================== */}
      {selectedPropertyId && (
        <PropertyDetail
          property={properties.find(p => p.id === selectedPropertyId)!}
          onClose={() => setSelectedPropertyId(null)}
          onStartChat={handleStartChat}
          onBookVisit={handleBookVisit}
          allProperties={properties}
          onSelectProperty={(id) => setSelectedPropertyId(id)}
          selectedWorkplace={selectedWorkplace}
          commuteTransitMode={commuteTransitMode}
        />
      )}

    </div>
  );
}
