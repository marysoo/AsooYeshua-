import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, BookOpen, ShoppingBag, Calendar, MessageSquare, 
  ShieldCheck, Heart, Share2, Youtube, Facebook, Play, 
  ChevronRight, Sparkles, ArrowUpRight, BookOpenCheck, Globe, Star,
  Download, Smartphone, X
} from 'lucide-react';
import { seedDatabaseIfEmpty } from './firebase';
import { applySEO } from './lib/seo';
import SplashVideoIntro from './components/SplashVideoIntro';
import SermonSlider from './components/SermonSlider';
import BlogSection from './components/BlogSection';
import MarketplaceSection from './components/MarketplaceSection';
import AIAssistantWidget from './components/AIAssistantWidget';
import AdminPanel from './components/AdminPanel';

// Custom TikTok SVG Icon for authentic branding
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ width: '1em', height: '1em' }}
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.22-.4-.47-.58-.73v6.56c-.02 2.13-.7 4.31-2.28 5.76-1.71 1.62-4.22 2.34-6.52 1.9-2.31-.41-4.34-1.92-5.26-4.09-.98-2.26-.74-5.01.76-7.01 1.41-1.92 3.82-3.04 6.22-2.92.05 1.34-.02 2.68-.01 4.02-1.3-.12-2.67.24-3.51 1.25-.87 1.01-1.01 2.53-.42 3.73.57 1.19 1.93 2.01 3.25 1.98 1.41.01 2.71-.97 3.01-2.34.13-.51.15-1.04.14-1.57V.02z" />
  </svg>
);

export default function App() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // PWA & Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Initialize DB and Seed data if empty
  useEffect(() => {
    seedDatabaseIfEmpty();
  }, []);

  // Check sessionStorage for skip intro
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('asooyeshua_intro_seen');
    if (hasSeen === 'true') {
      setIntroCompleted(true);
    }
  }, []);

  // Synchronize showInstallModal with window hash to handle browser Back button gracefully
  useEffect(() => {
    if (showInstallModal) {
      if (window.location.hash !== '#guide') {
        window.history.pushState({ modal: 'guide' }, '', '#guide');
      }
    } else {
      if (window.location.hash === '#guide') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (window.location.hash !== '#guide' && showInstallModal) {
        setShowInstallModal(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showInstallModal]);

  // SEO and Tab URL routing synchronizer
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#sermon=')) {
        setActiveTab('blog');
      } else if (hash.startsWith('#product=')) {
        setActiveTab('marketplace');
      } else if (hash === '#blog') {
        setActiveTab('blog');
      } else if (hash === '#marketplace') {
        setActiveTab('marketplace');
      } else if (hash === '#admin') {
        setActiveTab('admin');
      } else if (hash === '#home') {
        setActiveTab('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (introCompleted) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [introCompleted]);

  // SEO Integration for Home & Console
  useEffect(() => {
    if (!introCompleted) return;

    if (activeTab === 'home') {
      const origin = window.location.origin || 'https://asooyeshua.com';
      const ministrySchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${origin}/#organization`,
            "name": "AsooYeshua Ministry",
            "url": origin,
            "logo": {
              "@type": "ImageObject",
              "url": `${origin}/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg`
            },
            "sameAs": [
              "https://facebook.com/AsooYeshua",
              "https://youtube.com/@asooyeshua",
              "https://tiktok.com/@AsooYeshua"
            ]
          },
          {
            "@type": "WebSite",
            "@id": `${origin}/#website`,
            "url": origin,
            "name": "AsooYeshua Ministry",
            "description": "The online home of AsooYeshua Ministry chaired by fiery preacher Tersoo Terence Aker, offering gospel sermons, ebooks, and prayer consultations.",
            "publisher": {
              "@id": `${origin}/#organization`
            }
          }
        ]
      };

      applySEO({
        title: "AsooYeshua Ministry | Promoting the Gospel of Jesus Christ",
        description: "Welcome to AsooYeshua Ministry, chaired by Tersoo Terence Aker (AsooYeshua). Explore inspiring sermon blogs, acquire Christian books, study opening prayer PWAs, and consult with AsooYeshua.",
        url: origin,
        schema: ministrySchema
      });
    } else if (activeTab === 'admin') {
      applySEO({
        title: "Sanctuary Console | AsooYeshua Ministry",
        description: "Sanctuary administration panel for managing sermons and pastoral resources.",
        url: `${window.location.origin}/#admin`
      });
    }
  }, [activeTab, introCompleted]);

  // Handle PWA installation event listening
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show banner if user hasn't explicitly dismissed it this session
      const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if app is already running in standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      console.log(`User choice: ${outcome}`);
    } catch (err) {
      console.error('Error triggering PWA prompt:', err);
    } finally {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    setShowInstallBanner(false);
  };

  // Handler to switch to marketplace with a selected product pre-loaded
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveTab('marketplace');
  };

  const handleSelectSermon = (sermonId: string) => {
    // We navigate to blog, and since BlogSection automatically listens for changes,
    // we let it handle the search/view, or scroll down to the blog layout.
    setActiveTab('blog');
  };

  const triggerAIAssistantCall = () => {
    const triggerBtn = document.getElementById('ai-assistant-trigger');
    if (triggerBtn) {
      triggerBtn.click();
    }
  };

  if (!introCompleted) {
    return <SplashVideoIntro onComplete={() => setIntroCompleted(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans flex flex-col relative antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Sacred Top Border Styling (Gold Accented) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />

      {/* Primary Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Title */}
          <button 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-3 group cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white border border-amber-500/20 group-hover:scale-105 transition-all shadow-md">
              <Flame className="w-5 h-5 fill-white text-amber-500 animate-pulse" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-wide block group-hover:text-amber-700 transition-colors">
                AsooYeshua
              </span>
              <span className="text-[9px] font-bold text-amber-600 tracking-widest uppercase block mt-[-3px]">
                Promoting the Gospel
              </span>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'blog', label: 'Sermon Blog' },
              { id: 'marketplace', label: 'Marketplace' },
              { id: 'admin', label: 'Sanctuary Console' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-stone-900 text-amber-400 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Highly visible PWA button */}
            <button
              id="desktop-pwa-nav-btn"
              onClick={() => setShowInstallModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-55 flex items-center gap-1"
            >
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Opening Prayer PWA</span>
            </button>
          </nav>

          {/* Social Icons & Fast Call CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 border-r border-stone-200 pr-3">
              <a 
                href="https://facebook.com/AsooYeshua" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-700 flex items-center justify-center transition-colors shadow-xs"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/@asooyeshua?si=fbozRCm_vNubg6Fp" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-700 flex items-center justify-center transition-colors shadow-xs"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="https://tiktok.com/@AsooYeshua" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-700 flex items-center justify-center transition-colors shadow-xs"
                title="TikTok"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
              </a>

              {/* Install App Trigger */}
              <button
                onClick={() => setShowInstallModal(true)}
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                title="Install App"
              >
                <Download className="w-4 h-4 animate-bounce" />
              </button>
            </div>

            <button
              onClick={triggerAIAssistantCall}
              className="bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> Talk & Book Call
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden bg-stone-900 border-t border-stone-800 text-white justify-around py-3.5 px-2">
          {[
            { id: 'home', label: 'Home', icon: Flame },
            { id: 'blog', label: 'Sermons', icon: BookOpen },
            { id: 'marketplace', label: 'Market', icon: ShoppingBag },
            { id: 'pwa', label: 'Prayer App', icon: Smartphone, action: () => setShowInstallModal(true) },
            { id: 'admin', label: 'Admin', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  isSelected ? 'text-amber-400 scale-105' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* Sliding sermon carousel showcasing pictures of AsooYeshua */}
              <SermonSlider />

              {/* Immersive PWA Call-to-Action Hero Banner */}
              <section className="bg-gradient-to-r from-amber-500 to-amber-400 border border-amber-500/30 text-stone-950 p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none" />
                <div className="space-y-2 flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-stone-900 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Bible Study Companion App (PWA)
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
                    Opening Prayer for Bible Study App
                  </h3>
                  <p className="text-stone-900 text-xs sm:text-sm max-w-3xl leading-relaxed">
                    Install the official Opening Prayer Progressive Web App (PWA) on your phone, tablet, or PC for just $7 (~₦10,500). Curate powerful templates, structure study guides, and organize scriptures entirely offline. Tap the button to view the guide or acquire full access in our Market.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center shrink-0">
                  <button
                    onClick={() => setShowInstallModal(true)}
                    className="bg-stone-900 hover:bg-stone-850 text-amber-400 font-bold text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 animate-bounce" /> Setup Guide & Info
                  </button>
                </div>
              </section>

              {/* Bento Grid: Ministry Mission Summary */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Block 1: About the Mission */}
                <div className="bg-white border border-stone-200 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <Flame className="w-5 h-5 fill-amber-500 text-amber-700" />
                    </div>
                    <h3 className="font-serif text-xl text-stone-900 font-bold tracking-wide">
                      Our Vision & Call
                    </h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      AsooYeshua is a specialized online sanctuary led by <strong>Tersoo Terence Aker</strong>, designed exclusively to spread the wholesome Gospel of Jesus Christ. We aggressively seek salvation, truth, and faith restoration through sound preaching.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest pt-6 cursor-pointer"
                  >
                    View Sermons <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Block 2: Professional Blog Content */}
                <div className="bg-white border border-stone-200 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <BookOpenCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-xl text-stone-900 font-bold tracking-wide">
                      Inspiring Sermons
                    </h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      Study theological guides on Grace, Salvation, and spiritual discipline. Author your own study materials using our built-in writer or consume sound, original messages to build up your inner man.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest pt-6 cursor-pointer"
                  >
                    Enter Library <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Block 3: Monitized Marketplace */}
                <div className="bg-white border border-stone-200 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-xl text-stone-900 font-bold tracking-wide">
                      Faith bookstore
                    </h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      Acquire daily scripture devotionals, premium eBooks, and high-fidelity audio sermon guides. Monitored safely using **Flutterwave Inline Checkout** supporting domestic and global cards.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest pt-6 cursor-pointer"
                  >
                    Acquire Books <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

              </section>

              {/* YouTube Featured Section */}
              <section className="bg-stone-950 rounded-3xl border border-stone-850 p-6 sm:p-10 text-white flex flex-col lg:flex-row items-center gap-8 shadow-xl">
                <div className="space-y-4 flex-1">
                  <span className="text-amber-400 text-xs font-bold tracking-widest uppercase block">
                    Featured Video Broadcast
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-amber-100 tracking-wide">
                    Watch AsooYeshua Broadcasts
                  </h2>
                  <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
                    Promote the word of salvation with us! AsooYeshua actively publishes visual sermon bytes, prayer conferences, and theological insights on YouTube, TikTok, and Facebook. Connect with our interactive social community.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href="https://youtube.com/@asooyeshua?si=fbozRCm_vNubg6Fp"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Youtube className="w-4 h-4" /> Subscribe on YouTube
                    </a>
                    <button
                      onClick={triggerAIAssistantCall}
                      className="border border-stone-700 hover:border-amber-500 hover:text-amber-400 text-stone-300 font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition-all cursor-pointer"
                    >
                      Schedule Prayer Time
                    </button>
                  </div>
                </div>

                <div className="w-full lg:w-[45%] aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-inner border border-stone-800">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/5_7I7g04Tio"
                    title="AsooYeshua Ministry Sermon Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: 0 }}
                  ></iframe>
                </div>
              </section>

              {/* Contact/About Call block */}
              <section className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 flex-1 text-center md:text-left">
                  <div className="flex items-center gap-1 text-amber-700 text-xs font-bold uppercase tracking-widest justify-center md:justify-start">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Ministry Consultation
                  </div>
                  <h3 className="font-serif text-2xl text-stone-900 font-bold tracking-wide">
                    Need Guidance or Prayer?
                  </h3>
                  <p className="text-stone-500 text-xs sm:text-sm max-w-xl">
                    Tersoo Terence Aker (AsooYeshua) is dedicated to praying and supporting your faith walk. Book a private call reservation on our AI Panel, and we will notify AsooYeshua directly on WhatsApp.
                  </p>
                </div>
                
                <button
                  onClick={triggerAIAssistantCall}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Schedule Conversation
                </button>
              </section>
            </motion.div>
          )}

          {activeTab === 'blog' && (
            <motion.div
              key="blog-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BlogSection onSelectProduct={handleSelectProduct} isActive={activeTab === 'blog'} />
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div
              key="market-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MarketplaceSection 
                onSelectSermon={handleSelectSermon} 
                overrideSelectedProductId={selectedProductId}
                onClearOverrideProduct={() => setSelectedProductId(null)}
                isActive={activeTab === 'marketplace'}
              />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating AI Assistant Agent Widget */}
      <AIAssistantWidget onSelectTab={setActiveTab} />

      {/* Elegant Gospel Footer */}
      <footer className="bg-stone-950 text-stone-400 border-t border-stone-900 py-12 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-stone-900 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5 fill-amber-400 text-stone-950" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-white tracking-wide block">
                  AsooYeshua
                </span>
                <span className="text-[9px] font-bold text-stone-500 tracking-widest uppercase block">
                  Chaired by Tersoo Terence Aker
                </span>
              </div>
            </div>

            {/* Social channels */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Follow AsooYeshua:</span>
              <a 
                href="https://facebook.com/AsooYeshua" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all shadow-xs text-stone-400"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/@asooyeshua?si=fbozRCm_vNubg6Fp" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all shadow-xs text-stone-400"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="https://tiktok.com/@AsooYeshua" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all shadow-xs text-stone-400"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-stone-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} AsooYeshua Ministry. All Rights Reserved. Dedicated to promoting the Gospel of Jesus Christ.
            </p>
            <div className="flex gap-4 font-semibold text-stone-500 items-center">
              <button onClick={() => setActiveTab('home')} className="hover:text-amber-400 cursor-pointer">Sanctuary</button>
              <button onClick={() => setActiveTab('blog')} className="hover:text-amber-400 cursor-pointer">Sermons</button>
              <button onClick={() => setActiveTab('marketplace')} className="hover:text-amber-400 cursor-pointer">Store</button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-amber-400 cursor-pointer">Console</button>
              <button onClick={() => setShowInstallModal(true)} className="hover:text-amber-400 cursor-pointer text-amber-500 font-bold flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Install App
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-6 left-6 right-6 sm:right-auto sm:left-6 z-50 max-w-sm bg-stone-900 text-white p-4 rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 text-stone-950 font-extrabold text-base shadow-sm">
              OP
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-sm font-bold text-amber-400">Install Opening Prayer App</h4>
              <p className="text-stone-300 text-[11px] leading-snug">
                Add the official Opening Prayer for Bible Study app to your home screen for instant study structures, templates, and zero-data offline reading!
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleDismissBanner}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-stone-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              Install Now
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal (Universal for iOS & Android) */}
      {showInstallModal && (
        <div 
          onClick={() => setShowInstallModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs transition-all duration-300 animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative transition-all duration-300 animate-in zoom-in-95 cursor-default"
          >
            {/* Sticky Header inside modal */}
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">PWA GUIDE</span>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-stone-400 hover:text-stone-600 bg-white hover:bg-stone-100 p-1.5 rounded-full border border-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content wrapper */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md border-2 border-white">
                  🙏
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 pt-2">
                  Opening Prayer for Bible Study App
                </h3>
                <p className="text-stone-500 text-xs">
                  PWA Installation & Usage Guide ($7 Value)
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    📖 How to Access and Use the App:
                  </p>
                  <ul className="text-stone-700 text-[11px] space-y-2 list-none">
                    <li className="flex items-start gap-1">
                      <span>✨</span>
                      <span><strong>Step 1:</strong> Acquire full access to the Opening Prayer PWA under our <strong>Market</strong> tab for $7 (~₦10,500) to receive your official installer link and access credentials.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span>✨</span>
                      <span><strong>Step 2:</strong> Once purchased, open the dedicated link on your device browser (Android, iOS Safari, or PC browser).</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span>✨</span>
                      <span><strong>Step 3:</strong> Tap <strong>"Install to Home Screen"</strong> inside the application to pin it as a native utility.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span>✨</span>
                      <span><strong>Step 4:</strong> Works 100% offline — use the Prayer Generator and Study guides during sessions even with zero network signal!</span>
                    </li>
                  </ul>
                </div>

                {/* Option A: Direct prompt installation (Android/Chrome/Edge) */}
                {deferredPrompt ? (
                  <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-600" /> One-Click Install (Demo Portal)
                    </p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      Your browser fully supports instant installation. Tap below to pin the demo portal to your home screen!
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" /> Install Application
                    </button>
                  </div>
                ) : isIOS ? (
                  /* Option B: iOS iPhone/iPad specific instructions */
                  <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-600" /> Apple iOS Setup Guide
                    </p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      Safari does not support one-click web installs, but you can add it manually after purchasing:
                    </p>
                    <ol className="text-stone-600 text-[11px] space-y-2 list-decimal list-inside pl-1">
                      <li>Open your purchased premium link inside the <strong>Safari browser</strong>.</li>
                      <li>Tap the <strong>Share</strong> button (the box with an arrow pointing up icon at the bottom screen).</li>
                      <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                      <li>Tap <strong>"Add"</strong> in the top-right corner to complete.</li>
                    </ol>
                  </div>
                ) : (
                  /* Option C: Desktop/Generic manual setup instruction */
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-stone-600" /> Web App Installation
                    </p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      Add the application to your desktop or mobile home screen as a standalone app after purchase:
                    </p>
                    <ul className="text-stone-600 text-[11px] space-y-2 list-disc list-inside pl-1">
                      <li><strong>On Chrome/Edge:</strong> Access your premium web link, look for the <strong>App Install icon</strong> in the address bar (top right), or tap menu ⫶ and select "Install".</li>
                      <li><strong>On Mobile browsers:</strong> Open your premium web link, expand the browser menu (three dots ⫶) and choose <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</li>
                    </ul>
                  </div>
                )}

                <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Why install as a Web App?
                  </p>
                  <ul className="text-stone-500 text-[11px] space-y-1 list-none">
                    <li>⚡ Launches instantly from your native home screen launcher</li>
                    <li>📵 Works even with weak or offline network connections</li>
                    <li>✨ Full screen immersive experience without browser URL bars</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sticky Footer inside modal */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-stone-900 hover:bg-stone-850 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
