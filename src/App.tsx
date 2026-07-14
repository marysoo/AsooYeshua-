import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, BookOpen, ShoppingBag, Calendar, MessageSquare, 
  ShieldCheck, Heart, Share2, Youtube, Facebook, Play, 
  ChevronRight, Sparkles, ArrowUpRight, BookOpenCheck, Globe, Star 
} from 'lucide-react';
import { seedDatabaseIfEmpty } from './firebase';
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
            { id: 'admin', label: 'Admin', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === item.id ? 'text-amber-400 scale-105' : 'text-stone-400 hover:text-stone-200'
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
              <BlogSection onSelectProduct={handleSelectProduct} />
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
            <div className="flex gap-4 font-semibold text-stone-500">
              <button onClick={() => setActiveTab('home')} className="hover:text-amber-400 cursor-pointer">Sanctuary</button>
              <button onClick={() => setActiveTab('blog')} className="hover:text-amber-400 cursor-pointer">Sermons</button>
              <button onClick={() => setActiveTab('marketplace')} className="hover:text-amber-400 cursor-pointer">Store</button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-amber-400 cursor-pointer">Console</button>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
