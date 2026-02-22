
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Stethoscope, Ear } from 'lucide-react';

// Avatar States
const AVATAR_STATES = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking',
};

export function DoctorAvatar({
    state = AVATAR_STATES.IDLE,
    audioLevel = 0,
    className
}) {
    const [blinkTrigger, setBlinkTrigger] = useState(0);
    const [eyePos, setEyePos] = useState({ x: 0, y: 0 });

    // Eyeblink lifecycle
    useEffect(() => {
        let timeout;
        const triggerBlink = () => {
            setBlinkTrigger(prev => prev + 1);
            timeout = setTimeout(triggerBlink, 2500 + Math.random() * 4000); // Blink every 2.5-6.5 sec
        };
        timeout = setTimeout(triggerBlink, 2000);
        return () => clearTimeout(timeout);
    }, []);

    // Eye movement lifecycle based on state
    useEffect(() => {
        let timeout;
        const moveEyes = () => {
            if (state === AVATAR_STATES.THINKING) {
                setEyePos({ x: 3 + Math.random() * 2, y: -4 - Math.random() * 2 }); // look up/side
            } else if (state === AVATAR_STATES.LISTENING) {
                setEyePos({ x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 2 }); // focus
            } else if (state === AVATAR_STATES.SPEAKING) {
                setEyePos({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 1 }); // micro shifts
            } else {
                setEyePos({ x: 0, y: 0 }); // reset
            }
            timeout = setTimeout(moveEyes, 1500 + Math.random() * 2500);
        };
        timeout = setTimeout(moveEyes, 1000);
        return () => clearTimeout(timeout);
    }, [state]);

    const isSpeaking = state === AVATAR_STATES.SPEAKING;
    const isListening = state === AVATAR_STATES.LISTENING;
    const isThinking = state === AVATAR_STATES.THINKING;

    // Smoothed audio envelope mapping
    const safeAudioLevel = isNaN(audioLevel) ? 0 : Number(audioLevel);
    // Amplify audio visually for clearer lip sync, bound 0-1
    const openAmount = isSpeaking ? Math.min(Math.max(safeAudioLevel * 1.5, 0), 1) : 0;

    // Dynamic Facial Geometry Base Calculations
    const jawDrop = isSpeaking ? openAmount * 7 : 0;

    // Dynamic Mouth Parameters
    const mouthWidth = 14 + (isSpeaking ? openAmount * 5 : 0);
    const mouthHeight = isSpeaking ? 2 + (openAmount * 18) : 2;
    const mouthY = 110 + jawDrop * 0.4;

    // Smooth the lips
    const upperLipY = mouthY - (isSpeaking ? openAmount * 2 : 0);
    const lowerLipY = mouthY + mouthHeight;

    // Generate accurate path strings for the mouth cavity and lips
    const mouthCavityPath = `M ${100 - mouthWidth} ${mouthY} 
                             Q 100 ${upperLipY - mouthHeight * 0.3} ${100 + mouthWidth} ${mouthY} 
                             Q 100 ${lowerLipY + mouthHeight * 0.3} ${100 - mouthWidth} ${mouthY} Z`;

    const upperLipPath = `M ${100 - mouthWidth - 1} ${mouthY + 0.5} 
                          Q 100 ${upperLipY - mouthHeight * 0.2 - 4} ${100 + mouthWidth + 1} ${mouthY + 0.5}
                          Q 100 ${upperLipY} ${100 - mouthWidth - 1} ${mouthY + 0.5} Z`;

    const lowerLipPath = `M ${100 - mouthWidth - 1} ${mouthY - 0.5} 
                          Q 100 ${lowerLipY + mouthHeight * 0.3 + 5} ${100 + mouthWidth + 1} ${mouthY - 0.5}
                          Q 100 ${lowerLipY} ${100 - mouthWidth - 1} ${mouthY - 0.5} Z`;

    // Dynamic Face Path for jaw drop
    const chinY = 125 + jawDrop;
    const jawControlY = 125 + jawDrop * 0.7;
    const jawControlSideY = 110 + jawDrop * 0.3;
    const facePath = `M 60 80 
                      C 60 40, 140 40, 140 80 
                      C 140 ${jawControlSideY}, 120 ${jawControlY}, 100 ${chinY} 
                      C 80 ${jawControlY}, 60 ${jawControlSideY}, 60 80 Z`;

    // Eyebrow dynamics (softer expressions)
    const eyebrowLeft = isSpeaking ? -1.5 * openAmount : isThinking ? -3 : isListening ? -1.5 : 0;
    const eyebrowRight = isSpeaking ? -1.5 * openAmount : isThinking ? 2 : isListening ? -1.5 : 0;
    const leftEyebrowPath = `M 89 ${68 + eyebrowLeft} Q 76 ${62 + eyebrowLeft} 64 ${71 + eyebrowLeft}`;
    const rightEyebrowPath = `M 111 ${68 + eyebrowRight} Q 124 ${62 + eyebrowRight} 136 ${71 + eyebrowRight}`;

    return (
        <div className={cn("relative flex flex-col items-center", className)} data-testid="doctor-avatar">
            {/* Background Pulse Effects */}
            <div className="absolute inset-0 top-10 flex items-center justify-center pointer-events-none -z-10">
                <AnimatePresence>
                    {isListening && (
                        <>
                            <motion.div
                                className="absolute w-[280px] h-[280px] rounded-full bg-emerald-500/10"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                            />
                            <motion.div
                                className="absolute w-[240px] h-[240px] rounded-full bg-emerald-500/20"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.15, opacity: 0.7 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: "easeOut" }}
                            />
                        </>
                    )}
                    {isSpeaking && (
                        <motion.div
                            className="absolute w-[260px] h-[260px] rounded-full bg-blue-500/10"
                            animate={{ scale: [1, 1.05 + openAmount * 0.1, 1], opacity: [0.3, 0.6 + openAmount * 0.2, 0.3] }}
                            transition={{ duration: 0.1 }}
                        />
                    )}
                    {isThinking && (
                        <motion.div
                            className="absolute w-[260px] h-[260px] rounded-full bg-amber-500/10"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            style={{ backgroundImage: 'conic-gradient(from 0deg, transparent, rgba(245, 158, 11, 0.2), transparent)' }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Avatar Graphics */}
            <motion.div
                className="relative w-56 h-56 md:w-72 md:h-72 mx-auto drop-shadow-xl"
                animate={state === AVATAR_STATES.IDLE ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full overflow-visible"
                    aria-label="Dr. AYUSH Avatar"
                >
                    <defs>
                        {/* 10) Global Skin Blending */}
                        <filter id="gaussBlurSmall" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.4" />
                        </filter>

                        <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
                            <stop offset="0%" stopColor="#f5cdbf" />
                            <stop offset="70%" stopColor="#e2bbaa" />
                            <stop offset="100%" stopColor="#d3a899" />
                        </radialGradient>

                        {/* 5) Soft Cheeks */}
                        <radialGradient id="blush" cx="50%" cy="40%" r="50%">
                            <stop offset="0%" stopColor="#f2a9a0" stopOpacity="0.25" />
                            <stop offset="60%" stopColor="#f2a9a0" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>

                        {/* 3) Nose Soft Gradient */}
                        <linearGradient id="noseH" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#fbe9df" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>

                        {/* 6) Chin Shadow / Neck Shading */}
                        <linearGradient id="chinShadow" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="100%" stopColor="#d3a899" stopOpacity="0.3" />
                        </linearGradient>

                        {/* 8) Bindi Gradients */}
                        <radialGradient id="bindiGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ff4560" />
                            <stop offset="100%" stopColor="#b83a3a" />
                        </radialGradient>
                        <filter id="bindiDrop" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.15" />
                        </filter>

                        {/* 1) Iris Gradients */}
                        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="30%" stopColor="#6b4f3a" />
                            <stop offset="100%" stopColor="#3b2a1f" />
                        </radialGradient>

                        {/* 4) Lip Gradients */}
                        <linearGradient id="upperLipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#d08a83" />
                            <stop offset="100%" stopColor="#b96b63" />
                        </linearGradient>
                        <linearGradient id="lowerLipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#d5918a" />
                            <stop offset="100%" stopColor="#b15f57" />
                        </linearGradient>

                        {/* Hair Gradient */}
                        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2A2421" />
                            <stop offset="40%" stopColor="#1C1816" />
                            <stop offset="100%" stopColor="#0B0908" />
                        </linearGradient>

                        {/* Clothing Gradients */}
                        <linearGradient id="coatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#f1f5f9" />
                        </linearGradient>

                        {/* Base Filters */}
                        <filter id="heavyShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#000000" floodOpacity="0.1" />
                        </filter>
                        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.08" />
                        </filter>
                        <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                            <feFlood floodColor="#FFFFFF" floodOpacity="0.5" result="glowColor" />
                            <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
                            <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <clipPath id="mouthClip">
                            <path d={mouthCavityPath} />
                        </clipPath>
                    </defs>

                    {/* Backing Circle Form */}
                    <circle
                        cx="100" cy="100" r="95"
                        fill={isListening ? "#F0FDF4" : isThinking ? "#FFFBEB" : isSpeaking ? "#EFF6FF" : "#F8FAFC"}
                        stroke={isListening ? "#4ADE80" : isThinking ? "#FBBF24" : isSpeaking ? "#60A5FA" : "#E2E8F0"}
                        strokeWidth="3"
                        className="transition-colors duration-500"
                    />

                    {/* === BACK HAIR (BEHIND BODY) === */}
                    <g id="back-hair-group">
                        {/* Ponytail / Lower Bun (visible behind neck and coat) */}
                        <ellipse cx="100" cy="115" rx="36" ry="42" fill="url(#hairGrad)" />
                    </g>

                    {/* === BODY & CLOTHING === */}
                    <g id="body-group">
                        {/* 6) Smoother Neck (Below Clothing Layer) */}
                        <rect x="83" y="110" width="34" height="60" fill="url(#skinGrad)" />
                        <rect x="83" y="110" width="34" height="60" fill="url(#chinShadow)" filter="url(#gaussBlurSmall)" />

                        {/* Stethoscope Tubing Back */}
                        <path d="M 50 145 C 50 200, 150 200, 150 145" stroke="#1E293B" strokeWidth="6" fill="none" />

                        {/* Coat Shoulders */}
                        <path d="M 20 200 C 20 150, 45 130, 100 130 C 155 130, 180 150, 180 200 Z" fill="url(#coatGrad)" filter="url(#heavyShadow)" />

                        {/* Collar & Lapels */}
                        <path d="M 80 130 L 70 200 L 95 200 L 100 155 Z" fill="#F8FAFC" filter="url(#softShadow)" />
                        <path d="M 120 130 L 130 200 L 105 200 L 100 155 Z" fill="#F8FAFC" filter="url(#softShadow)" />

                        {/* Inner Scrub */}
                        <path d="M 82 130 L 100 160 L 118 130 Z" fill="#0369A1" filter="url(#innerGlow)" />

                        {/* Front Stethoscope Detail */}
                        <path d="M 68 150 C 68 140, 72 135, 80 120" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
                        <path d="M 132 150 C 132 140, 128 135, 120 120" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
                        <path d="M 100 185 L 100 200" stroke="#1E293B" strokeWidth="6" fill="none" />
                        <circle cx="100" cy="185" r="9" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2.5" filter="url(#heavyShadow)" />
                        <circle cx="100" cy="185" r="4.5" fill="#1E293B" />
                    </g>

                    {/* === HEAD & FACE === */}
                    <motion.g
                        id="head-group"
                        animate={
                            isSpeaking ? { rotate: [-0.5, 1, -0.5], y: [0, -1, 0] } :
                                isThinking ? { rotate: -2, y: -2 } :
                                    isListening ? { scale: 1.01, y: -1 } :
                                        { rotate: 0, scale: 1, y: 0 }
                        }
                        transition={isSpeaking ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.8, ease: "easeOut" }}
                        style={{ transformOrigin: "100px 125px" }}
                    >
                        {/* 9) Top Hair & Hairline */}
                        <path d="M 53 85 C 45 35, 155 35, 147 85 C 145 105, 125 110, 100 110 C 75 110, 55 105, 53 85 Z" fill="url(#hairGrad)" filter="url(#softShadow)" />

                        {/* Face Base */}
                        <path d={facePath} fill="url(#skinGrad)" filter="url(#heavyShadow)" />

                        {/* 5) Soft Cheeks */}
                        <ellipse cx="70" cy="92" rx="20" ry="12" fill="url(#blush)" />
                        <ellipse cx="130" cy="92" rx="20" ry="12" fill="url(#blush)" />

                        {/* 3) Soft Gradient Nose */}
                        <rect x="98" y="70" width="4" height="25" fill="url(#noseH)" opacity="0.8" filter="url(#gaussBlurSmall)" rx="2" />
                        {/* Tiny Nostril spots */}
                        <circle cx="95" cy="100" r="1.5" fill="#a07a6d" opacity="0.5" />
                        <circle cx="105" cy="100" r="1.5" fill="#a07a6d" opacity="0.5" />
                        <path d="M 93 99 C 96 103, 104 103, 107 99" stroke="#a07a6d" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" filter="url(#gaussBlurSmall)" />

                        {/* Smile Lines (Nasolabial Folds) - Opacity reduced for subtlety */}
                        <path d={`M 86 98 Q 80 108 ${84 - openAmount * 2} ${116 + jawDrop * 0.5}`} stroke="#CC9E86" strokeWidth="1" fill="none" opacity="0.25" strokeLinecap="round" filter="url(#gaussBlurSmall)" />
                        <path d={`M 114 98 Q 120 108 ${116 + openAmount * 2} ${116 + jawDrop * 0.5}`} stroke="#CC9E86" strokeWidth="1" fill="none" opacity="0.25" strokeLinecap="round" filter="url(#gaussBlurSmall)" />

                        {/* === EYES === */}
                        {/* 1) Realistic Eyes with Specular Highlight and Radial Iris */}
                        {/* Left Eye */}
                        <motion.g
                            animate={{ scaleY: [1, 0.05, 1] }}
                            transition={{ duration: 0.15, times: [0, 0.5, 1] }}
                            style={{ transformOrigin: '79px 80px' }}
                            key={`eye-l-${blinkTrigger}`}
                        >
                            {/* Warm Sclera */}
                            <ellipse cx="79" cy="80" rx="11" ry="4" fill="#fffdfb" filter="url(#softShadow)" />
                            {/* Iris & Pupil */}
                            <circle cx={79 + eyePos.x * 0.7} cy={80 + eyePos.y * 0.7} r="3.8" fill="url(#irisGrad)" />
                            <circle cx={79 + eyePos.x * 0.7} cy={80 + eyePos.y * 0.7} r="1.8" fill="#000000" />
                            {/* Specular Highlight */}
                            <circle cx={77.5 + eyePos.x * 0.7} cy={78.5 + eyePos.y * 0.7} r="0.8" fill="#ffffff" opacity="0.9" />
                            {/* Soft eyelid top-shadow */}
                            <ellipse cx="79" cy="77" rx="10" ry="2" fill="#000" opacity="0.08" />
                            {/* Deep Eyelid Crease Line */}
                            <path d="M 68 77 C 72 74, 86 74, 90 77" stroke="#b58d7d" strokeWidth="1" fill="none" strokeLinecap="round" filter="url(#gaussBlurSmall)" />
                        </motion.g>

                        {/* Right Eye */}
                        <motion.g
                            animate={{ scaleY: [1, 0.05, 1] }}
                            transition={{ duration: 0.15, times: [0, 0.5, 1] }}
                            style={{ transformOrigin: '121px 80px' }}
                            key={`eye-r-${blinkTrigger}`}
                        >
                            {/* Warm Sclera */}
                            <ellipse cx="121" cy="80" rx="11" ry="4" fill="#fffdfb" filter="url(#softShadow)" />
                            {/* Iris & Pupil */}
                            <circle cx={121 + eyePos.x * 0.7} cy={80 + eyePos.y * 0.7} r="3.8" fill="url(#irisGrad)" />
                            <circle cx={121 + eyePos.x * 0.7} cy={80 + eyePos.y * 0.7} r="1.8" fill="#000000" />
                            {/* Specular Highlight */}
                            <circle cx={119.5 + eyePos.x * 0.7} cy={78.5 + eyePos.y * 0.7} r="0.8" fill="#ffffff" opacity="0.9" />
                            {/* Soft eyelid top-shadow */}
                            <ellipse cx="121" cy="77" rx="10" ry="2" fill="#000" opacity="0.08" />
                            {/* Deep Eyelid Crease Line */}
                            <path d="M 110 77 C 114 74, 128 74, 132 77" stroke="#b58d7d" strokeWidth="1" fill="none" strokeLinecap="round" filter="url(#gaussBlurSmall)" />
                        </motion.g>

                        {/* 2) Tapered / Arched Brows (softer stroke and curve) */}
                        <path d={leftEyebrowPath} stroke="#382922" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.85" />
                        <path d={rightEyebrowPath} stroke="#382922" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.85" />

                        {/* 4) Layered Lips with Inner Highlights */}
                        <g>
                            <path d={mouthCavityPath} fill="#3A1212" />
                            {/* Teeth */}
                            <rect x="75" y={upperLipY - mouthHeight * 0.2} width="50" height="7" fill="#FDFDFD" clipPath="url(#mouthClip)" />
                            {/* Tongue */}
                            <circle cx="100" cy={lowerLipY + 4} r="12" fill="#E66767" clipPath="url(#mouthClip)" />

                            {/* Lips Base */}
                            <path d={upperLipPath} fill="url(#upperLipGrad)" />
                            <path d={lowerLipPath} fill="url(#lowerLipGrad)" />
                            {/* Inner Lip Highlights (Adds contour depth) */}
                            <path d={`M ${100 - mouthWidth + 2} ${mouthY + 1} Q 100 ${upperLipY} ${100 + mouthWidth - 2} ${mouthY + 1}`} fill="none" stroke="#f2c9c3" strokeWidth="1" opacity="0.3" filter="url(#gaussBlurSmall)" />
                            <path d={`M ${100 - mouthWidth + 3} ${mouthY} Q 100 ${lowerLipY - 1} ${100 + mouthWidth - 3} ${mouthY}`} fill="none" stroke="#f2c9c3" strokeWidth="0.8" opacity="0.15" filter="url(#gaussBlurSmall)" />
                            {/* Lip separation Crease / corner depth */}
                            <path d={`M ${100 - mouthWidth - 1} ${mouthY} Q 100 ${mouthY + 1} ${100 + mouthWidth + 1} ${mouthY}`} stroke="#541b14" strokeWidth="1.2" fill="none" opacity={isSpeaking ? 0.2 : 0.6} filter="url(#gaussBlurSmall)" />
                        </g>

                        {/* Front Hair / Bangs Swoop */}
                        <path d="M 100 35 C 75 35, 50 50, 56 85 C 65 65, 80 44, 100 44 Z" fill="url(#hairGrad)" filter="url(#softShadow)" />
                        <path d="M 100 35 C 125 35, 150 50, 144 85 C 135 65, 120 44, 100 44 Z" fill="url(#hairGrad)" filter="url(#softShadow)" />
                        {/* Stray front strands (for layered effect) */}
                        <path d="M 65 55 Q 60 70 56 85" stroke="#1c1816" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
                        <path d="M 135 55 Q 140 70 144 85" stroke="#1c1816" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
                        {/* 9) Hair Rim Light */}
                        <path d="M 104 36 C 125 36, 148 50, 142 80" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.15" filter="url(#gaussBlurSmall)" />

                        {/* 8) Softened Bindi with custom grad and drop shadow */}
                        <circle cx="100" cy="68" r="3.5" fill="url(#bindiGrad)" filter="url(#bindiDrop)" />
                    </motion.g>

                    {/* Name Badge Overlay (stays statically anchored to body/front) */}
                    <g transform="translate(10, 0)">
                        <rect x="115" y="152" width="55" height="24" rx="4" fill="#0F172A" filter="url(#heavyShadow)" />
                        <rect x="115" y="152" width="4" height="24" fill="#F59E0B" rx="1.5" />
                        <text x="144" y="167" fontSize="9" fill="#F8FAFC" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.5">
                            Dr. AYUSH
                        </text>
                    </g>
                </svg>
            </motion.div>

            {/* Smart Status Indicators */}
            <motion.div
                className="mt-6 flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className={cn(
                    "flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-sm border",
                    "transition-all duration-300 ease-in-out backdrop-blur-sm",
                    state === AVATAR_STATES.IDLE && "bg-slate-50 border-slate-200 text-slate-600",
                    state === AVATAR_STATES.LISTENING && "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100",
                    state === AVATAR_STATES.THINKING && "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100",
                    state === AVATAR_STATES.SPEAKING && "bg-blue-50 border-blue-200 text-blue-700 shadow-blue-100",
                )}>
                    {/* Animated Status Icon */}
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={state}
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {state === AVATAR_STATES.IDLE && <Stethoscope className="w-5 h-5 text-slate-400" />}
                            {state === AVATAR_STATES.LISTENING && <Ear className="w-5 h-5 text-emerald-500 animate-pulse" />}
                            {state === AVATAR_STATES.THINKING && <Sparkles className="w-5 h-5 text-amber-500 animate-spin-slow" />}
                            {state === AVATAR_STATES.SPEAKING && (
                                <div className="flex gap-0.5 items-center h-5">
                                    <motion.span animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-blue-500 rounded-full inline-block" />
                                    <motion.span animate={{ height: [12, 20, 12] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-blue-500 rounded-full inline-block" />
                                    <motion.span animate={{ height: [8, 14, 8] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-blue-500 rounded-full inline-block" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Status Text */}
                    <span className="tracking-wide">
                        {state === AVATAR_STATES.IDLE && "Ready"}
                        {state === AVATAR_STATES.LISTENING && "Listening..."}
                        {state === AVATAR_STATES.THINKING && "Analyzing..."}
                        {state === AVATAR_STATES.SPEAKING && "Speaking"}
                    </span>
                </div>

                {state === AVATAR_STATES.SPEAKING && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-blue-400/80 font-mono font-medium tracking-widest mt-1"
                    >
                        LIVE AUDIO LEVEL: {(Math.min(safeAudioLevel, 1) * 100).toFixed(0)}%
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

// Export states for external use
DoctorAvatar.STATES = AVATAR_STATES;

export default DoctorAvatar;
