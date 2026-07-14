import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Flame } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  scripture: string;
  reference: string;
}

const slides: Slide[] = [
  {
    image: '/src/assets/images/asooyeshua_portrait_1_1784026936123.jpg',
    title: 'Preaching Grace and Redemption',
    subtitle: 'Chaired by Tersoo Terence Aker aka AsooYeshua',
    scripture: '“For by grace you have been saved through faith, and that not of yourselves; it is the gift of God.”',
    reference: 'Ephesians 2:8'
  },
  {
    image: '/src/assets/images/asooyeshua_portrait_2_1784026952199.jpg',
    title: 'Promoting the Gospel of Christ',
    subtitle: 'Spreading the Uncompromising Word of God Worldwide',
    scripture: '“Go into all the world and preach the gospel to every creature.”',
    reference: 'Mark 16:15'
  },
  {
    image: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
    title: 'Equipping the Saints',
    subtitle: 'Faith-Building eBooks, Audio Series & Daily Devotionals',
    scripture: '“Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.”',
    reference: '2 Timothy 2:15'
  }
];

export default function SermonSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [current]);

  const handleNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slideVariants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 0.6 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    })
  };

  return (
    <div className="relative w-full h-[550px] sm:h-[650px] bg-stone-950 overflow-hidden rounded-3xl border border-stone-800 shadow-2xl">
      {/* Background Slides */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Image */}
            <img
              src={slides[current].image}
              alt={slides[current].title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-[0.4] transition-all duration-700"
            />
            {/* Ambient vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-transparent to-stone-950/80" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Text Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 z-10 select-none">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            key={`badge-${current}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            {current === 0 && <Flame className="w-3.5 h-3.5" />}
            {current === 1 && <Sparkles className="w-3.5 h-3.5" />}
            {current === 2 && <BookOpen className="w-3.5 h-3.5" />}
            <span>{current === 0 ? 'Ministry Vision' : current === 1 ? 'Evangelism' : 'Bible Study'}</span>
          </motion.div>

          {/* Title */}
          <motion.h2
            key={`title-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-amber-50 tracking-wide leading-tight mb-2"
          >
            {slides[current].title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-stone-300 font-sans text-sm sm:text-base md:text-lg mb-6 tracking-wide font-medium"
          >
            {slides[current].subtitle}
          </motion.p>

          {/* Scripture Box */}
          <motion.div
            key={`scrip-${current}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="border-l-4 border-amber-500 bg-white/[0.03] backdrop-blur-md px-5 py-4 rounded-r-xl max-w-2xl shadow-lg border border-white/5"
          >
            <p className="font-serif text-amber-100/90 italic text-sm sm:text-base leading-relaxed">
              {slides[current].scripture}
            </p>
            <p className="text-right text-amber-500 text-xs font-semibold tracking-wider uppercase mt-2">
              — {slides[current].reference}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Arrow Controls */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-stone-900/50 hover:bg-stone-900/80 backdrop-blur-md text-amber-100 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-all cursor-pointer group"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-stone-900/50 hover:bg-stone-900/80 backdrop-blur-md text-amber-100 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-all cursor-pointer group"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Index Dots */}
      <div className="absolute bottom-6 right-6 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > current ? 1 : -1);
              setCurrent(idx);
            }}
            className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
              idx === current ? 'w-8 bg-amber-500' : 'bg-stone-600 hover:bg-stone-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
