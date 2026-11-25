'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Volume2,
  VolumeX,
  FastForward,
} from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { soundFx } from '@/lib/audio/soundFx';

// The 5 essential career items (pure visual tokens, zero text)
interface CareerItem {
  id: number;
  type: 'resume' | 'profile' | 'education' | 'experience' | 'skills';
  startX: number; // in vw
  startY: number; // in vh
  rotate: number; // degrees
}

const CAREER_ITEMS: CareerItem[] = [
  { id: 1, type: 'resume', startX: -52, startY: -38, rotate: -16 },
  { id: 2, type: 'profile', startX: 50, startY: -32, rotate: 14 },
  { id: 3, type: 'education', startX: -55, startY: 28, rotate: -12 },
  { id: 4, type: 'experience', startX: 48, startY: 34, rotate: 12 },
  { id: 5, type: 'skills', startX: 8, startY: -54, rotate: -8 },
];

export const IntroAnimation: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const [scene, setScene] = useState<1 | 2 | 3 | 4>(1);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [absorbedItems, setAbsorbedItems] = useState<number[]>([]);
  const [boxReaction, setBoxReaction] = useState<boolean>(false);
  const [isLidClosed, setIsLidClosed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  const finishAnimation = useCallback(() => {
    setIsFadingOut(true);
    addTimer(() => {
      try {
        sessionStorage.setItem('rt_intro_played', 'true');
      } catch (_) {}
      setShouldRender(false);
    }, 600);
  }, [addTimer]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.selection();
    finishAnimation();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    haptics.light();
  };

  // Immediate interaction unlock for mobile browsers (especially Android Chrome)
  const handleTouchUnlock = () => {
    haptics.notifyUserInteraction();
    soundFx.unlock();
  };

  useEffect(() => {
    // 1. Check if already played in this browser session
    try {
      const alreadyPlayed = sessionStorage.getItem('rt_intro_played');
      if (alreadyPlayed === 'true') {
        return;
      }
    } catch (_) {}

    // 2. Check for reduced motion preference
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
    } catch (_) {}

    // Enable rendering
    setShouldRender(true);
    setIsMuted(soundFx.getMuted());

    // SCENE 1: Box Reveal (0.0s – 1.4s)
    soundFx.playBoxReveal();

    // SCENE 2: Item Flight Sequence (1.4s – 4.2s)
    // 5 items, each arriving at the box with precision timing
    const schedule = [
      { itemIdx: 0, launch: 1400, arrival: 2050 },
      { itemIdx: 1, launch: 1950, arrival: 2550 },
      { itemIdx: 2, launch: 2450, arrival: 3000 },
      { itemIdx: 3, launch: 2900, arrival: 3400 },
      { itemIdx: 4, launch: 3300, arrival: 3750 },
    ];

    addTimer(() => {
      setScene(2);
    }, 1400);

    schedule.forEach(({ itemIdx, launch, arrival }) => {
      // Launch item
      addTimer(() => {
        setActiveItemIndex(itemIdx);
        soundFx.playPaperFlutter();
      }, launch);

      // Contact / Box absorption moment
      addTimer(() => {
        setAbsorbedItems((prev) => [...prev, itemIdx]);
        setBoxReaction(true);
        addTimer(() => setBoxReaction(false), 140);

        // Synchronized Sound & Haptic Feedback at exact visual impact
        soundFx.playItemDrop(itemIdx);
        haptics.light();
      }, arrival);
    });

    // SCENE 3: Lid Closes (4.1s – 5.4s)
    addTimer(() => {
      setScene(3);
      setIsLidClosed(true);
    }, 4100);

    // Lid contact moment (tactile mechanical closure)
    addTimer(() => {
      soundFx.playBoxClose();
      haptics.impactMedium();
    }, 4550);

    // SCENE 4: Final Brand Reveal (5.4s – 7.8s)
    addTimer(() => {
      setScene(4);
      soundFx.playBrandReveal();
      haptics.success();
    }, 5400);

    // Smooth handoff to application workspace
    addTimer(() => {
      finishAnimation();
    }, 7800);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [addTimer, finishAnimation]);

  if (!shouldRender) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Resume Tailor"
      onPointerDown={handleTouchUnlock}
      onTouchStart={handleTouchUnlock}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0A0D14] text-white select-none transition-opacity duration-600 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ perspective: '1000px' }}
    >
      {/* Calm, Minimal Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[130px] transition-all duration-1000 ${
            scene === 4 ? 'bg-[#0066CC]/20 scale-110' : 'bg-[#0066CC]/12 scale-100'
          }`}
        />
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-auto">
        {/* Sound toggle */}
        <button
          onClick={handleToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:bg-white/[0.15] backdrop-blur-md border border-white/10 text-xs text-white/70 transition-all active:scale-95 touch-manipulation"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-[#0066CC]" />
          )}
        </button>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:bg-white/[0.15] backdrop-blur-md border border-white/10 text-xs font-medium text-white/80 transition-all active:scale-95 touch-manipulation"
          aria-label="Skip intro"
        >
          <span>Skip</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Stage: Minimalist Box & Brand Reveal */}
      <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 z-10">
        {/* SCENES 1, 2, 3: The Minimalist Box */}
        {scene < 4 && (
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              boxReaction ? 'scale-[0.97] translate-y-1' : 'scale-100 translate-y-0'
            }`}
            style={{
              transition: 'transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Box Soft Floor Shadow */}
            <div
              className={`absolute -bottom-8 w-44 sm:w-52 h-7 rounded-full bg-black/50 blur-lg transition-all duration-500 ${
                isLidClosed ? 'scale-100 opacity-60' : 'scale-90 opacity-40'
              }`}
            />

            {/* The 3D Box Body Container */}
            <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-2xl bg-[#121722] border border-white/15 shadow-2xl flex flex-col justify-end overflow-hidden">
              {/* Recessed Interior Cavity (visible when lid is open) */}
              <div
                className={`absolute inset-x-2 top-2 bottom-3 rounded-xl bg-[#080B11] border border-white/5 transition-opacity duration-400 ${
                  isLidClosed ? 'opacity-10' : 'opacity-100'
                }`}
              >
                {/* Gentle interior depth gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0066CC]/10" />
              </div>

              {/* Box Front Face with Subtle Matte Monogram */}
              <div className="relative z-10 w-full h-18 sm:h-20 bg-gradient-to-b from-[#18202D] to-[#0E131C] rounded-b-2xl border-t border-white/10 flex items-center justify-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066CC]" />
                </div>
              </div>

              {/* Animated Top Lid */}
              <div
                className="absolute top-0 inset-x-0 h-9 sm:h-10 rounded-t-2xl bg-gradient-to-b from-[#222C3D] to-[#161D29] border-t border-x border-white/20 shadow-md z-20 origin-top transition-all duration-450 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isLidClosed
                    ? 'perspective(600px) rotateX(0deg) translateY(0)'
                    : 'perspective(600px) rotateX(-55deg) translateY(-10px)',
                  boxShadow: isLidClosed
                    ? '0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 12px rgba(0,0,0,0.4)'
                    : 'none',
                }}
              >
                {/* Subtle flush seam highlight when closed */}
                {isLidClosed && (
                  <div className="absolute bottom-0 inset-x-0 h-[1px] bg-white/20" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2: Flying Minimalist Career Items (Pure Visual Tokens - Zero Text) */}
        {scene === 2 &&
          CAREER_ITEMS.map((item, idx) => {
            const isLaunched = activeItemIndex >= idx;
            const isAbsorbed = absorbedItems.includes(idx);
            if (!isLaunched || isAbsorbed) return null;

            return (
              <div
                key={item.id}
                className="absolute z-20 pointer-events-none"
                style={{
                  animation: `flyToBox 650ms cubic-bezier(0.25, 0.8, 0.4, 1) forwards`,
                  ['--start-x' as string]: `${item.startX}vw`,
                  ['--start-y' as string]: `${item.startY}vh`,
                  ['--start-rot' as string]: `${item.rotate}deg`,
                }}
              >
                {/* 1. Resume Document */}
                {item.type === 'resume' && (
                  <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-lg bg-white/95 backdrop-blur-sm shadow-xl border border-white/60 p-2 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0066CC]" />
                      <div className="w-5 h-1 bg-zinc-300 rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-1 bg-zinc-200 rounded-full" />
                      <div className="w-4/5 h-1 bg-zinc-200 rounded-full" />
                      <div className="w-3/5 h-1 bg-zinc-200 rounded-full" />
                    </div>
                    <div className="w-1/2 h-1 bg-[#0066CC]/50 rounded-full" />
                  </div>
                )}

                {/* 2. Professional Profile */}
                {item.type === 'profile' && (
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#1E293B] shadow-xl border border-white/20 flex items-center justify-center text-white">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                )}

                {/* 3. Degree / Education */}
                {item.type === 'education' && (
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#1E293B] shadow-xl border border-white/20 flex items-center justify-center text-white">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                  </div>
                )}

                {/* 4. Experience / Work */}
                {item.type === 'experience' && (
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#1E293B] shadow-xl border border-white/20 flex items-center justify-center text-white">
                    <Briefcase className="w-5 h-5 text-[#0066CC]" />
                  </div>
                )}

                {/* 5. Technical Skills */}
                {item.type === 'skills' && (
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#1E293B] shadow-xl border border-white/20 flex items-center justify-center text-white">
                    <Code2 className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
              </div>
            );
          })}

        {/* SCENE 4: Resume Tailor Final Brand Reveal */}
        {scene === 4 && (
          <div className="flex flex-col items-center justify-center text-center z-20 animate-in fade-in zoom-in-95 duration-700 ease-out">
            {/* Minimalist Logo Mark */}
            <div className="relative mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141A24] border border-white/15 shadow-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#0066CC]" />
              </div>
            </div>

            {/* Application Name (ONLY text displayed) */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
              Resume Tailor
            </h1>
          </div>
        )}
      </div>

      {/* Flight Keyframes */}
      <style jsx>{`
        @keyframes flyToBox {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 60px)
              rotate(var(--start-rot)) scale(1);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          75% {
            opacity: 0.95;
            transform: translate3d(
                calc(var(--start-x) * 0.12),
                calc(var(--start-y) * 0.12),
                10px
              )
              rotate(calc(var(--start-rot) * 0.15)) scale(0.65);
          }
          100% {
            transform: translate3d(0, 0, -30px) rotate(0deg) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
