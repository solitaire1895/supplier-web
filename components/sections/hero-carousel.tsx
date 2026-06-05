"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function CarouselHero() {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    {
      url: "/asset/photo_2026-06-02_10-46-20.jpg",
      title: t.heroCarousel?.slides[0]?.title,
      description: t.heroCarousel?.slides[0]?.desc
    },
    {
      url: "/asset/photo_2026-06-02_10-46-26.jpg",
      title: t.heroCarousel?.slides[1]?.title,
      description: t.heroCarousel?.slides[1]?.desc
    },
    {
      url: "/asset/photo_2026-06-02_10-46-32.jpg",
      title: t.heroCarousel?.slides[2]?.title,
      description: t.heroCarousel?.slides[2]?.desc
    },
    {
      url: "/asset/photo_2026-06-02_10-46-38.jpg",
      title: t.heroCarousel?.slides[3]?.title,
      description: t.heroCarousel?.slides[3]?.desc
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!t) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const currentSlide = images[currentIndex];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentSlide.url})` }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md">
              <Zap size={16} className="text-red-500 fill-red-500" />
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">{t.heroCarousel?.intro}</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6 drop-shadow-2xl">
            {currentSlide.title?.split(' ').map((word: string, i: number) => (
              <span key={i} className={i === currentSlide.title.split(' ').length - 1 ? "text-red-500" : ""}>
                {word}{" "}
              </span>
            ))}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {currentSlide.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="px-10 py-4 bg-red-500 text-white rounded-full font-bold text-lg hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_50px_rgba(239,68,68,0.7)]"
            >
              {t.heroCarousel?.cta?.getStarted}
            </Link>
            <Link 
              href="#features"
              className="px-10 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-md border border-white/10"
            >
              {t.heroCarousel?.cta?.learnMore}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-white transition-all hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 border border-white/10 text-white transition-all hidden md:block"
      >
        <ChevronRight size={24} />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-12 h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? "bg-red-500" : "bg-white/20"}`}
          />
        ))}
      </div>
    </section>
  );
}