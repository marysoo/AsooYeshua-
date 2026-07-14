import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, SkipForward, Volume2, Youtube, Clock } from 'lucide-react';

interface SplashVideoIntroProps {
  onComplete: () => void;
}

export default function SplashVideoIntro({ onComplete }: SplashVideoIntroProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [isVisible, setIsVisible] = useState(true);

  // Default elegant worship/gospel intro video ID.
  // This can be easily changed by the user.
  const videoId = '5_7I7g04Tio'; 

  useEffect(() => {
    // Check if user has already seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem('asooyeshua_intro_seen');
    if (hasSeenIntro === 'true') {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem('asooyeshua_intro_seen', 'true');
    // Allow animation to complete before triggering callback
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-white"
        >
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(120,53,4,0.15)_0%,rgba(0,0,0,0.95)_100%]" />

          <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
            {/* Header / Ministry Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs tracking-widest uppercase mb-3">
                <Youtube className="w-3.5 h-3.5" /> AsooYeshua Gospel Broadcast
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-amber-100 tracking-wide">
                AsooYeshua Ministry
              </h1>
              <p className="text-stone-400 text-sm mt-1">Promoting the Gospel of Jesus Christ</p>
            </motion.div>

            {/* Immersive Video Aspect Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(217,119,6,0.15)] border border-stone-800 relative group"
            >
              {/* YouTube IFrame Embed */}
              <iframe
                className="w-full h-full pointer-events-none"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&start=15`}
                title="AsooYeshua Ministry Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 0 }}
              ></iframe>

              {/* Mute Notification Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-stone-300">
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Ambient Preview (Muted for browser compatibility)</span>
              </div>

              {/* Channel Watermark */}
              <a
                href="https://youtube.com/@asooyeshua?si=fbozRCm_vNubg6Fp"
                target="_blank"
                rel="noreferrer"
                className="absolute top-4 right-4 bg-amber-500 hover:bg-amber-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 text-stone-950 shadow-lg"
              >
                <Youtube className="w-3.5 h-3.5" /> Visit Channel
              </a>
            </motion.div>

            {/* Countdown Slider & Skip controls */}
            <div className="w-full max-w-2xl mt-8 flex flex-col items-center">
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden mb-4 border border-stone-900/50">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                  className="h-full bg-linear-to-r from-amber-600 to-amber-400 rounded-full"
                />
              </div>

              <div className="w-full flex items-center justify-between text-stone-400 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Entering Sanctuary in <strong className="text-amber-400 font-mono text-base">{timeLeft}</strong>s</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-amber-500/10 cursor-pointer transition-colors"
                >
                  Skip to Sanctuary <SkipForward className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
