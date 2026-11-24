'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  FileText,
  User,
  GraduationCap,
  Award,
  Briefcase,
  Code2,
  Trophy,
  FolderGit2,
  Target,
  Volume2,
  VolumeX,
  FastForward,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { soundFx } from '@/lib/audio/soundFx';

// The 10 Career & Resume Items flying into the box
interface FlyingItem {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  startX: number; // in vw (-80 to 80)
  startY: number; // in vh (-80 to 80)
  rotate: number; // initial rotation degrees
}

const CAREER_ITEMS: FlyingItem[] = [
  {
    id: 1,
    title: 'Verified Resume',
    subtitle: 'ATS Optimized Document',
    icon: FileText,
    color: '#0066CC',
    gradient: 'from-[#0066CC] to-[#004494]',
    startX: -65,
    startY: -50,
    rotate: -24,
  },
  {
    id: 2,
    title: 'Professional Profile',
    subtitle: 'Identity & Ground Truth',
    icon: User,
    color: '#6366F1',
    gradient: 'from-[#6366F1] to-[#4338CA]',
    startX: 70,
    startY: -45,
    rotate: 22,
  },
  {
    id: 3,
    title: 'BS Computer Science',
    subtitle: 'Graduation Degree',
    icon: GraduationCap,
    color: '#8B5CF6',
    gradient: 'from-[#8B5CF6] to-[#6D28D9]',
    startX: -75,
    startY: 20,
    rotate: 18,
  },
  {
    id: 4,
    title: 'AWS & Cloud Certified',
    subtitle: 'Industry Credentials',
    icon: Award,
    color: '#EC4899',
    gradient: 'from-[#EC4899] to-[#BE185D]',
    startX: 65,
    startY: 35,
    rotate: -19,
  },
  {
    id: 5,
    title: 'Software Engineer',
    subtitle: 'Production Work History',
    icon: Briefcase,
    color: '#0284C7',
    gradient: 'from-[#0284C7] to-[#0369A1]',
    startX: -40,
    startY: -70,
    rotate: 14,
  },
  {
    id: 6,
    title: 'Technical Skills Matrix',
    subtitle: 'React, Node, Cloud, SQL',
    icon: Code2,
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#047857]',
    startX: 55,
    startY: -65,
    rotate: -28,
  },
  {
    id: 7,
    title: 'Top Performer Award',
    subtitle: 'Career Achievement',
    icon: Trophy,
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#D97706]',
    startX: -70,
    startY: 55,
    rotate: -15,
  },
  {
    id: 8,
    title: 'Portfolio & System Architecture',
    subtitle: 'Verified Case Studies',
    icon: FolderGit2,
    color: '#14B8A6',
    gradient: 'from-[#14B8A6] to-[#0F766E]',
    startX: 75,
    startY: -20,
    rotate: 30,
  },
  {
    id: 9,
    title: 'Granular Impact Bullets',
    subtitle: 'Metrics & Responsibilities',
    icon: Target,
    color: '#3B82F6',
    gradient: 'from-[#3B82F6] to-[#1D4ED8]',
    startX: -30,
    startY: 75,
    rotate: 25,
  },
  {
    id: 10,
    title: 'Target Job Description',
    subtitle: 'ATS 98% Match Goal',
    icon: Sparkles,
    color: '#0071E3',
    gradient: 'from-[#0071E3] to-[#2997FF]',
    startX: 40,
    startY: 70,
    rotate: -12,
  },
];

export const IntroAnimation: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const [scene, setScene] = useState<1 | 2 | 3 | 4>(1);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [absorbedItems, setAbsorbedItems] = useState<number[]>([]);
  const [boxReaction, setBoxReaction] = useState<boolean>(false);
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

  const handleSkip = () => {
    haptics.selection();
    finishAnimation();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    haptics.light();
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

    // SCENE 1: Box Reveal (0.0s – 1.8s)
    soundFx.playBoxReveal();
    haptics.light();

    // SCENE 2: Item Flight Sequence (1.8s – 5.8s)
    // Progressively accelerating interval between item launches
    const itemSchedule = [
      { itemIdx: 0, delay: 1800, duration: 800 },
      { itemIdx: 1, delay: 2200, duration: 750 },
      { itemIdx: 2, delay: 2600, duration: 700 },
      { itemIdx: 3, delay: 2950, duration: 650 },
      { itemIdx: 4, delay: 3300, duration: 600 },
      { itemIdx: 5, delay: 3620, duration: 550 },
      { itemIdx: 6, delay: 3920, duration: 500 },
      { itemIdx: 7, delay: 4200, duration: 460 },
      { itemIdx: 8, delay: 4460, duration: 420 },
      { itemIdx: 9, delay: 4700, duration: 380 },
    ];

    addTimer(() => {
      setScene(2);
    }, 1800);

    itemSchedule.forEach(({ itemIdx, delay, duration }) => {
      // Launch item
      addTimer(() => {
        setActiveItemIndex(itemIdx);
      }, delay);

      // Contact / Box Absorption moment
      addTimer(() => {
        // Visual impact reaction
        setAbsorbedItems((prev) => [...prev, itemIdx]);
        setBoxReaction(true);
        addTimer(() => setBoxReaction(false), 140);

        // Synchronized Sound & Haptic Feedback
        soundFx.playItemDrop(itemIdx);
        haptics.light();
      }, delay + duration);
    });

    // SCENE 3: Magic Transformation (5.6s – 7.4s)
    addTimer(() => {
      setScene(3);
      soundFx.playTransformation();
      haptics.impactMedium();
    }, 5600);

    // SCENE 4: Brand Reveal & Transition (7.4s – 9.8s)
    addTimer(() => {
      setScene(4);
      soundFx.playBrandReveal();
      haptics.success();
    }, 7400);

    // Fade out and handoff to workspace at 9.6s
    addTimer(() => {
      finishAnimation();
    }, 9600);

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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0A0D14] text-white select-none transition-opacity duration-600 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Background Glow & Ambient Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] transition-all duration-1000 ${
            scene === 1
              ? 'bg-[#0066CC]/20 scale-75'
              : scene === 2
              ? 'bg-blue-600/30 scale-100'
              : scene === 3
              ? 'bg-gradient-to-tr from-[#0066CC]/40 via-purple-600/40 to-cyan-400/40 scale-125'
              : 'bg-[#0066CC]/35 scale-110'
          }`}
        />
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30">
        {/* Sound toggle button */}
        <button
          onClick={handleToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs text-white/80 transition-all active:scale-95 touch-manipulation"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-medium hidden sm:inline">Sound Active</span>
            </>
          )}
        </button>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all active:scale-95 touch-manipulation"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Stage: The 3D Magic Resume Box Container */}
      <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 z-10">
        {/* SCENES 1, 2, 3: The 3D Magic Box */}
        {scene < 4 && (
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              boxReaction ? 'scale-110' : 'scale-100'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Box Floor Shadow */}
            <div
              className={`absolute -bottom-14 w-52 sm:w-60 h-10 rounded-full blur-xl transition-all duration-500 ${
                scene === 3
                  ? 'bg-blue-400/50 scale-125'
                  : 'bg-[#0066CC]/35 scale-100'
              }`}
            />

            {/* Shockwave Rings on Impact */}
            {boxReaction && (
              <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/80 animate-ping pointer-events-none" />
            )}

            {/* Magic Transformation Energy Wave */}
            {scene === 3 && (
              <>
                <div className="absolute -inset-10 rounded-full border border-cyan-400/40 animate-ping duration-1000" />
                <div className="absolute -inset-16 rounded-full border border-blue-500/30 animate-pulse duration-700" />
              </>
            )}

            {/* 3D Box Main Body */}
            <div
              className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl p-1 bg-gradient-to-b from-[#0066CC] via-[#004C99] to-[#0A2540] shadow-2xl border border-cyan-400/40 flex flex-col items-center justify-center transition-all duration-700 ${
                scene === 1
                  ? 'animate-in zoom-in-50 duration-1000'
                  : scene === 3
                  ? 'ring-8 ring-cyan-400/30 scale-105'
                  : ''
              }`}
              style={{
                boxShadow:
                  scene === 3
                    ? '0 0 70px rgba(0, 200, 255, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.4)'
                    : '0 25px 60px -10px rgba(0, 102, 204, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Inner Glowing Depth Cavity */}
              <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-[#071324] via-[#0B1E38] to-[#08182B] flex flex-col items-center justify-center p-3 relative overflow-hidden border border-white/10">
                {/* Glowing Top Lid Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

                {/* Box Emblem */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0066CC] to-[#2997FF] flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${
                    boxReaction ? 'scale-125 rotate-6' : 'scale-100'
                  }`}
                >
                  <Sparkles className="w-8 h-8 animate-pulse text-white" />
                </div>

                {/* Box Title */}
                <div className="text-center mt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    Magic Resume Vault
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-[11px] text-white/70">
                    <span>Absorbing Facts:</span>
                    <span className="font-bold text-white">
                      {absorbedItems.length}/10
                    </span>
                  </div>
                </div>

                {/* Tiny Light Particles emitting from inside the box */}
                <div className="absolute bottom-1 inset-x-2 flex justify-around opacity-60">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping" />
                  <span className="w-1 h-1 rounded-full bg-cyan-200 animate-bounce delay-150" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2: Flying Career Objects */}
        {scene === 2 &&
          CAREER_ITEMS.map((item, idx) => {
            const isLaunched = activeItemIndex >= idx;
            const isAbsorbed = absorbedItems.includes(idx);
            if (!isLaunched || isAbsorbed) return null;

            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="absolute z-20 pointer-events-none transition-all ease-in"
                style={{
                  animation: `flyToBox 600ms cubic-bezier(0.2, 0.8, 0.4, 1) forwards`,
                  // CSS Custom properties for dynamic flight path
                  ['--start-x' as string]: `${item.startX}vw`,
                  ['--start-y' as string]: `${item.startY}vh`,
                  ['--start-rot' as string]: `${item.rotate}deg`,
                }}
              >
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/40 text-[#1D1D1F]">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-sm shrink-0`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left pr-1 whitespace-nowrap">
                    <p className="text-xs font-bold text-[#1D1D1F] leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#666666] leading-none mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        {/* SCENE 4: Resume Tailor Final Brand Reveal */}
        {scene === 4 && (
          <div className="flex flex-col items-center text-center z-20 animate-in zoom-in-75 duration-700">
            {/* Glowing Logo Icon */}
            <div className="relative mb-5">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#0066CC] to-[#2997FF] rounded-3xl blur-2xl opacity-60 animate-pulse" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#0052A3] via-[#0066CC] to-[#2997FF] flex items-center justify-center text-white shadow-2xl border border-white/30 ring-4 ring-white/10">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
              </div>
            </div>

            {/* Application Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>RESUME</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997FF] to-cyan-300">
                TAILOR
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/80 font-medium mt-2 tracking-wide max-w-xs sm:max-w-md">
              &ldquo;Craft Your Career. Shape Your Future.&rdquo;
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white/90">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>100% Factual Grounding</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Hallucinations</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Scene Status Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 inset-x-4 text-center z-20">
        <p className="text-xs font-medium text-white/60 tracking-wider uppercase">
          {scene === 1 && 'Assembling Career Vault...'}
          {scene === 2 && 'Gathering Experience, Skills & Credentials...'}
          {scene === 3 && 'Synthesizing Verified Career Ground Truth...'}
          {scene === 4 && 'Opening Studio Workspace...'}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-2.5">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                scene === step
                  ? 'w-6 bg-[#2997FF]'
                  : scene > step
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keyframe animations for item flight paths */}
      <style jsx>{`
        @keyframes flyToBox {
          0% {
            transform: translate3d(var(--start-x), var(--start-y), 200px)
              rotate(var(--start-rot)) scale(1.15);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(0, 0, -80px) rotate(0deg) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
