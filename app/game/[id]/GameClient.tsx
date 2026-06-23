"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { simpanSkorGame } from "../../action";
import { useFaceTracking, getVowelHint, type TargetVowel, type TargetConsonant } from "./useFaceTracking";
import { useAudioSensor } from "./useAudioSensor";
import { useVoiceGuide, LEVEL_INTROS } from "./useVoiceGuide";
import { MouthAnatomyVisualizer } from "../../../components/MouthAnatomyVisualizer";

// ===================================================================
type GameState = "SPLASH" | "MODE_SELECTION" | "LEVEL_MAP" | "GAMEPLAY" | "VICTORY";
type GameMode = "SOLO" | "ESTAFET";
type PanelTab = "CERMIN" | "ANATOMI";

interface SyllableTarget {
  display: string;
  vowel: TargetVowel;
  consonant: TargetConsonant;
  emoji: string;
  colorClass: string;
}
interface Level {
  id: string; planet: string; emoji: string; title: string; bab: string;
  targets: SyllableTarget[]; unlocked: boolean;
  bgFrom: string; bgTo: string; borderColor: string;
}

const LEVELS: Level[] = [
  {
    id: "bola-boni", planet: "Planet 1", emoji: "🔵", title: "Misi Bola Boni", bab: "Bab 1 — Huruf B",
    targets: [
      { display: "BA!", vowel: "A", consonant: "B", emoji: "🏀", colorClass: "from-blue-400 to-blue-600" },
      { display: "BI!", vowel: "I", consonant: "B", emoji: "🐝", colorClass: "from-sky-400 to-sky-600" },
      { display: "BU!", vowel: "U", consonant: "B", emoji: "🫧", colorClass: "from-indigo-400 to-indigo-600" },
    ],
    unlocked: true, bgFrom: "from-sky-400", bgTo: "to-blue-700", borderColor: "border-blue-300",
  },
  {
    id: "paman-pita", planet: "Planet 2", emoji: "🟣", title: "Misi Paman Pita", bab: "Bab 2 — Huruf P",
    targets: [
      { display: "PA!", vowel: "A", consonant: "P", emoji: "🪁", colorClass: "from-purple-400 to-purple-600" },
      { display: "PI!", vowel: "I", consonant: "P", emoji: "🫐", colorClass: "from-violet-400 to-violet-600" },
      { display: "PU!", vowel: "U", consonant: "P", emoji: "💜", colorClass: "from-pink-400 to-pink-600" },
    ],
    unlocked: true, bgFrom: "from-purple-400", bgTo: "to-pink-700", borderColor: "border-purple-300",
  },
  {
    id: "mama-mimi", planet: "Planet 3", emoji: "🟡", title: "Misi Mama & Mimi", bab: "Bab 3 — Huruf M",
    targets: [
      { display: "MA!", vowel: "A", consonant: "M", emoji: "🌼", colorClass: "from-yellow-400 to-yellow-600" },
      { display: "MI!", vowel: "I", consonant: "M", emoji: "🍜", colorClass: "from-amber-400 to-amber-600" },
      { display: "MU!", vowel: "U", consonant: "M", emoji: "🐮", colorClass: "from-orange-400 to-orange-600" },
      { display: "ME!", vowel: "E", consonant: "M", emoji: "🐾", colorClass: "from-lime-400 to-lime-600" },
      { display: "MO!", vowel: "O", consonant: "M", emoji: "🛵", colorClass: "from-green-400 to-green-600" },
    ],
    unlocked: true, bgFrom: "from-yellow-400", bgTo: "to-orange-600", borderColor: "border-yellow-300",
  },
  {
    id: "satu-sapi", planet: "Planet 4", emoji: "🟢", title: "Misi Satu Sapi", bab: "Bab 4 — Huruf S",
    targets: [
      { display: "SA!", vowel: "A", consonant: "S", emoji: "🌊", colorClass: "from-teal-400 to-teal-600" },
      { display: "SI!", vowel: "I", consonant: "S", emoji: "🐟", colorClass: "from-cyan-400 to-cyan-600" },
      { display: "SU!", vowel: "U", consonant: "S", emoji: "🌺", colorClass: "from-emerald-400 to-emerald-600" },
      { display: "SE!", vowel: "E", consonant: "S", emoji: "🥬", colorClass: "from-green-400 to-green-600" },
      { display: "SO!", vowel: "O", consonant: "S", emoji: "🔦", colorClass: "from-lime-400 to-lime-600" },
    ],
    unlocked: true, bgFrom: "from-teal-400", bgTo: "to-emerald-700", borderColor: "border-teal-300",
  },
];

// ===================================================================
export default function GameClient({ student }: { student: any }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>("SPLASH");
  const [gameMode, setGameMode] = useState<GameMode>("SOLO");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentPemain, setCurrentPemain] = useState(student?.name || "Kapten");
  const [isPausedForRotation, setIsPausedForRotation] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level>(LEVELS[0]);
  const [hitCount, setHitCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<SyllableTarget>(LEVELS[0].targets[0]);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("ANATOMI"); // Default: anatomi mulut

  // Visual FX
  const [laserFired, setLaserFired] = useState(false);
  const [explosionText, setExplosionText] = useState("");
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const { speak, speakText, stopAll, registerHit, resetCombo } = useVoiceGuide();

  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noVoiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer10Ref = useRef(false);
  const timer5Ref = useRef(false);
  const voiceActiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  
  const initAudioEngine = () => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
  };

  const playSuccessSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } catch (e) {}
  }, []);

  const baselineJaw = student?.baselineJawPixel || 80;
  const targetPlosiveThreshold = baselineJaw * 0.28;

  const getNextTarget = useCallback((level: Level, exclude?: SyllableTarget) => {
    const pool = level.targets.filter((t) => t !== exclude);
    return pool[Math.floor(Math.random() * pool.length)] || level.targets[0];
  }, []);

  // ── Ucapkan target ──
  const announceTarget = useCallback((target: SyllableTarget) => {
    const word = target.display.replace("!", "");
    speakText(`Ucapkan... ${word}!`);
  }, [speakText]);

  // ── Hint timer ──
  const startHintTimer = useCallback((target: SyllableTarget) => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowHint(true);
      // Voice hint
      const vowelEvent = `HINT_VOWEL_${target.vowel}` as any;
      speak(vowelEvent, undefined, "normal");
      if (["B","P","M"].includes(target.consonant)) {
        setTimeout(() => speak("HINT_CONSONANT_PLOSIF"), 4000);
      }
    }, 5000);
  }, [speak]);

  // ── Handler: hit berhasil ──
  const handlePlosiveHit = useCallback(() => {
    playSuccessSound();
    setScore((p) => p + 10);
    setHitCount((p) => p + 1);
    setTotalAttempts((p) => p + 1);
    setLaserFired(true);
    setIsScreenShaking(true);
    setShowHint(false);

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (noVoiceTimerRef.current) clearTimeout(noVoiceTimerRef.current);

    const pujian = ["HEBAT! 🌟","MANTAP! 🚀","SUPER! ⚡","KEREN! 🎯","BAGUS! 🏆"];
    setExplosionText(pujian[Math.floor(Math.random() * pujian.length)]);

    registerHit(() => speak("HIT_COMBO", undefined, "high"));
    speak("HIT_SUCCESS");

    const next = getNextTarget(selectedLevel, currentTarget);
    setCurrentTarget(next);

    setTimeout(() => {
      setLaserFired(false);
      setIsScreenShaking(false);
      setExplosionText("");
      setTimeout(() => announceTarget(next), 400);
      startHintTimer(next);
    }, 600);
  }, [playSuccessSound, selectedLevel, currentTarget, getNextTarget, speak, registerHit, announceTarget, startHintTimer]);

  const { streamRef, micVolume, requestDevicePermission } = useAudioSensor(gameState, isPausedForRotation);
  const { isAiReady, lipDistance, currentMAR, isVowelCorrect, initFaceMesh } = useFaceTracking(
    videoRef, canvasRef, gameState, isPausedForRotation,
    targetPlosiveThreshold, micVolume,
    currentTarget.vowel, currentTarget.consonant,
    handlePlosiveHit
  );

  // ── Suara aktif indicator ──
  useEffect(() => {
    if (micVolume > 15) {
      setVoiceActive(true);
      if (voiceActiveTimerRef.current) clearTimeout(voiceActiveTimerRef.current);
      voiceActiveTimerRef.current = setTimeout(() => setVoiceActive(false), 500);
    }
  }, [micVolume]);

  // ── Hint suara pelan ──
  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation) return;
    if (noVoiceTimerRef.current) clearTimeout(noVoiceTimerRef.current);
    if (micVolume < 5) {
      noVoiceTimerRef.current = setTimeout(() => speak("HINT_NO_VOICE"), 7000);
    }
    return () => { if (noVoiceTimerRef.current) clearTimeout(noVoiceTimerRef.current); };
  }, [micVolume, gameState, isPausedForRotation, speak]);

  // ── Hint mulut tertutup ──
  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation) return;
    if (lipDistance < targetPlosiveThreshold * 0.4 && micVolume > 12) {
      speak("HINT_MOUTH_CLOSED");
    }
  }, [lipDistance, micVolume, gameState, isPausedForRotation, speak, targetPlosiveThreshold]);

  // ── Init AI ──
  useEffect(() => {
    const iv = setInterval(() => {
      if ((window as any).FaceMesh) { clearInterval(iv); if (!isAiReady) initFaceMesh(); }
    }, 500);
    return () => clearInterval(iv);
  }, [isAiReady, initFaceMesh]);

  // ── Welcome voice — hanya ucap satu kali, jeda cukup ──
  useEffect(() => {
    if (isAiReady && gameState === "SPLASH") {
      // Jeda 1 detik baru mulai, supaya browser TTS voices sudah loaded
      const t1 = setTimeout(() => speak("INTRO_WELCOME", undefined, "high"), 1000);
      // AI_READY diucap 3.5 detik setelah welcome selesai kira-kira
      const t2 = setTimeout(() => speak("AI_READY"), 4500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isAiReady]); // Hanya trigger saat isAiReady berubah, bukan saat gameState berubah

  // ── Stream: pasang kamera ke video element ──
  // Dipanggil saat masuk GAMEPLAY, dan juga saat user switch ke tab CERMIN
  useEffect(() => {
    if (gameState === "GAMEPLAY" && streamRef.current && videoRef.current) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [gameState, streamRef, activeTab]);

  // ── Reset level ──
  useEffect(() => {
    setCurrentTarget(selectedLevel.targets[0]);
    setScore(0); setHitCount(0); setTotalAttempts(0);
    resetCombo();
  }, [selectedLevel]);

  // ── Timer ──
  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation) return;
    timer10Ref.current = false; timer5Ref.current = false;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 10 && !timer10Ref.current) { timer10Ref.current = true; speak("TIMER_10"); }
        if (prev === 5 && !timer5Ref.current) { timer5Ref.current = true; speak("TIMER_5", undefined, "high"); }
        if (prev <= 1) {
          if (gameMode === "ESTAFET" && currentPemain === student?.name) {
            setIsPausedForRotation(true);
            setCurrentPemain("Teman Regu");
            setTimeout(() => speak("ROTATION_PAUSE", undefined, "high"), 300);
            return 45;
          }
          clearInterval(timer);
          setGameState("VICTORY");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);


    return () => clearInterval(timer);
  }, [gameState, gameMode, currentPemain, isPausedForRotation, student, speak]);

  // ── Victory ──
  useEffect(() => {
    if (gameState !== "VICTORY" || !student?.id) return;
    const acc = totalAttempts > 0 ? Math.round((hitCount / totalAttempts) * 100) : 0;
    simpanSkorGame(student.id, acc, 45, `${selectedLevel.title} (${selectedLevel.bab})`);
    stopAll();
    setTimeout(() => {
      if (acc >= 80) speak("VICTORY_GREAT", undefined, "high");
      else if (acc >= 50) speak("VICTORY_GOOD", undefined, "high");
      else speak("VICTORY_TRY_AGAIN", undefined, "high");
    }, 600);
  }, [gameState]);

  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (noVoiceTimerRef.current) clearTimeout(noVoiceTimerRef.current);
  }, []);

  const accuracy = totalAttempts > 0 ? Math.round((hitCount / totalAttempts) * 100) : 0;
  const vowelHint = getVowelHint(currentTarget.vowel);

  // ─────────────────────────── RENDER ───────────────────────────
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b ${selectedLevel.bgFrom} via-indigo-600 ${selectedLevel.bgTo} text-white p-3 md:p-5 overflow-hidden select-none font-sans relative`}>

      {/* Dekorasi */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
        <div className="absolute top-6 left-12 text-5xl animate-pulse">⭐</div>
        <div className="absolute top-28 right-20 text-6xl animate-bounce">🌍</div>
        <div className="absolute bottom-14 left-1/4 text-7xl animate-pulse">✨</div>
        <div className="absolute bottom-28 right-14 text-4xl animate-bounce">🌙</div>
      </div>

      {/* ════════════ SPLASH ════════════ */}
      {gameState === "SPLASH" && (
        <div className="relative z-10 max-w-lg w-full bg-white/20 backdrop-blur-xl p-8 rounded-[3rem] border-8 border-white/40 shadow-2xl text-center space-y-5">
          <div className="text-8xl animate-bounce drop-shadow-xl">🚀</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">ARTIKULA</h1>
          <p className="text-white/80 font-bold text-sm">Platform Terapi Motorik Oral · Visual + Suara</p>
          <p className="text-yellow-200 font-black text-xl">Halo, <span className="text-white">{student?.name || "Kapten"}!</span> 👋</p>

          {!isAiReady ? (
            <div className="bg-white/10 rounded-2xl p-5 space-y-3">
              <div className="text-4xl animate-spin">⚙️</div>
              <p className="text-white/90 font-bold text-sm">Memuat Sensor AI, Panduan Suara & Visualisasi...</p>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div className="bg-yellow-400 h-full rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            <div className="bg-green-500/20 border-2 border-green-400/40 rounded-2xl p-3 text-green-200 font-bold text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              AI Visual + Panduan Suara Siap!
            </div>
          )}

          <button
            onClick={async () => { initAudioEngine(); const ok = await requestDevicePermission(); if (ok) setGameState("MODE_SELECTION"); }}
            disabled={!isAiReady}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-600 border-b-8 border-green-700 text-white font-black text-2xl py-5 rounded-3xl shadow-xl active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50"
          >
            {isAiReady ? "MULAI PETUALANGAN! 🎮" : "Memuat..."}
          </button>
          {isAiReady && (
            <button onClick={() => speakText(`Halo ${student?.name || "teman"}! Artikula siap menemanimu berlatih bicara hari ini!`)}
              className="w-full bg-white/10 hover:bg-white/20 border-4 border-white/20 text-white/70 font-bold text-sm py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
              🔊 Tes Panduan Suara
            </button>
          )}
        </div>
      )}

      {/* ════════════ MODE SELECTION ════════════ */}
      {gameState === "MODE_SELECTION" && (
        <div className="relative z-10 text-center w-full max-w-4xl space-y-8">
          <h2 className="text-5xl font-black text-yellow-300 drop-shadow-lg">PILIH MISI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { mode: "SOLO" as GameMode, icon: "🧑‍🚀", label: "Misi Solo", desc: "Latihan sendiri, fokus & mandiri", border: "border-blue-300", event: "MODE_SOLO" as const },
              { mode: "ESTAFET" as GameMode, icon: "🤝", label: "Misi Estafet", desc: "Bergantian dengan teman regu", border: "border-pink-300", event: "MODE_ESTAFET" as const },
            ].map((m) => (
              <button key={m.mode}
                onClick={() => { initAudioEngine(); speak(m.event, undefined, "high"); setGameMode(m.mode); setGameState("LEVEL_MAP"); }}
                className={`bg-white/20 backdrop-blur-md hover:bg-white/30 p-10 rounded-[3rem] border-8 ${m.border} shadow-xl flex flex-col items-center space-y-4 group transition-transform transform hover:-translate-y-2`}>
                <span className="text-8xl group-hover:scale-110 transition">{m.icon}</span>
                <span className="text-3xl font-black">{m.label}</span>
                <span className="text-white/70 text-sm font-bold">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ LEVEL MAP ════════════ */}
      {gameState === "LEVEL_MAP" && (
        <div className="relative z-10 w-full max-w-2xl space-y-4">
          <h2 className="text-4xl font-black text-yellow-300 text-center drop-shadow-md">🗺️ PETA TATA SURYA</h2>
          {LEVELS.map((level) => (
            <button key={level.id} disabled={!level.unlocked}
              onClick={() => {
                stopAll();
                setSelectedLevel(level); setCurrentTarget(level.targets[0]);
                setTimeLeft(45); setScore(0); setHitCount(0); setTotalAttempts(0);
                resetCombo();
                speak("LEVEL_SELECTED", LEVEL_INTROS[level.id], "high");
                setGameState("GAMEPLAY");
                // GAMEPLAY_START diucap setelah level intro selesai (~2.5 detik)
                // announceTarget diucap setelah GAMEPLAY_START selesai (~2 detik kemudian)
                setTimeout(() => speak("GAMEPLAY_START"), 2500);
                setTimeout(() => announceTarget(level.targets[0]), 5000);
                setTimeout(() => startHintTimer(level.targets[0]), 5000);
              }}
              className={`w-full bg-gradient-to-r ${level.unlocked ? `${level.bgFrom} ${level.bgTo}` : "from-slate-600 to-slate-700"} border-b-8 ${level.unlocked ? level.borderColor : "border-slate-800"} p-5 rounded-3xl flex items-center justify-between hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 shadow-xl`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{level.emoji}</span>
                <div className="text-left">
                  <div className="font-black text-xl">{level.planet}: {level.title}</div>
                  <div className="text-white/70 text-xs font-bold">{level.bab}</div>
                  <div className="text-white/50 text-xs mt-1">{level.targets.map((t) => t.display.replace("!", "")).join(" · ")}</div>
                </div>
              </div>
              <span className={`text-xs ${level.unlocked ? "bg-yellow-400 text-blue-900" : "bg-slate-500 text-white"} px-4 py-2 rounded-full font-black`}>
                {level.unlocked ? "MAIN!" : "🔒"}
              </span>
            </button>
          ))}
          <button onClick={() => setGameState("MODE_SELECTION")} className="text-white/50 hover:text-white text-sm font-bold transition text-center w-full">← Kembali</button>
        </div>
      )}

      {/* ════════════ GAMEPLAY ════════════ */}
      {gameState === "GAMEPLAY" && (
        <div className="relative z-10 w-full max-w-[1400px] flex flex-col lg:flex-row gap-6 items-stretch justify-center">

          {/* Modal Estafet */}
          {isPausedForRotation && (
            <div className="absolute inset-0 bg-indigo-900/96 z-50 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-6 border-8 border-pink-400 shadow-2xl">
              <div className="text-8xl animate-bounce">⏳</div>
              <h2 className="text-5xl font-black text-pink-300">WAKTU GANTIAN!</h2>
              <p className="text-white/80 text-xl font-bold">Giliran <span className="text-yellow-300">{currentPemain}</span></p>
              <button onClick={() => {
                initAudioEngine(); setIsPausedForRotation(false);
                setTimeout(() => speak("GAMEPLAY_START"), 500); setTimeout(() => announceTarget(currentTarget), 2800); setTimeout(() => startHintTimer(currentTarget), 2800);
              }} className="bg-gradient-to-r from-pink-400 to-rose-500 border-b-8 border-pink-700 text-white font-black text-3xl px-12 py-6 rounded-3xl shadow-xl active:border-b-0 active:translate-y-2 transition-all">
                SAYA SIAP! 🚀
              </button>
            </div>
          )}

          {/* ── PANEL KIRI: ANATOMI MULUT ── */}
          <div className="w-full lg:w-[320px] flex flex-col shrink-0 order-3 lg:order-1">
            <div className="bg-white/10 backdrop-blur-md border-8 border-white/30 rounded-[2rem] p-4 flex flex-col items-center shadow-xl h-full">
              <div className="text-xs font-black text-yellow-300 mb-2 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">
                🦷 PANDUAN VISUAL
              </div>
              <MouthAnatomyVisualizer
                vowel={currentTarget.vowel as any}
                consonant={currentTarget.consonant as any}
                isCorrect={isVowelCorrect}
                lipDistance={lipDistance}
                baselineJaw={baselineJaw}
                micVolume={micVolume}
                compact={false}
              />
              <div className="w-full mt-4">
                <p className="text-white/50 text-xs font-black uppercase mb-2 text-center">Tap untuk panduan suara vokal</p>
                <div className="grid grid-cols-5 gap-1">
                  {(["A","I","U","E","O"] as TargetVowel[]).map((v) => (
                    <button key={v}
                      onClick={() => { speak(`HINT_VOWEL_${v}` as any, undefined, "high"); }}
                      className={`rounded-xl py-2 font-black text-sm transition-all hover:scale-110 ${currentTarget.vowel === v ? "bg-yellow-400 text-yellow-900 scale-110 shadow-lg" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── PANEL TENGAH: ARENA ── */}
          <div className="flex-grow flex flex-col max-w-3xl order-1 lg:order-2">
            <div className="bg-white/10 backdrop-blur-md rounded-[3rem] p-4 border-8 border-white/30 flex flex-col items-center relative overflow-hidden min-h-[480px] shadow-2xl flex-grow">
              {laserFired && <div className="absolute inset-0 bg-green-300/40 z-10 pointer-events-none animate-ping" />}

              {/* HUD */}
              <div className="w-full flex justify-between items-center mb-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                <div className="text-sm font-black">👑 <span className="text-yellow-300 uppercase">{currentPemain}</span></div>
                <div className={`font-black text-xl px-4 py-1 rounded-full ${timeLeft <= 10 ? "bg-red-500 animate-pulse" : "bg-orange-500"}`}>⏱️ {timeLeft}s</div>
                <div className="text-sm font-black">🎯 <span className="text-cyan-300">{hitCount}/{totalAttempts || "–"}</span></div>
              </div>

              {/* Indikator suara aktif */}
              <div className={`w-full mb-2 flex items-center justify-center gap-2 transition-all duration-200 ${voiceActive ? "opacity-100 h-7" : "opacity-0 h-0 overflow-hidden"}`}>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`w-1 rounded-full bg-green-400 animate-bounce`} style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
                <span className="text-green-300 text-xs font-black">Suaramu terdengar!</span>
              </div>

              {/* Target Card */}
              <div className="w-full mb-3">
                <div className={`bg-gradient-to-r ${currentTarget.colorClass} rounded-3xl p-4 text-center border-4 border-white/30 shadow-lg`}>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Letupkan Suara!</p>
                  <div className="text-5xl drop-shadow-lg">{currentTarget.emoji}</div>
                  <div className="text-5xl font-black text-yellow-200 tracking-wider mt-1">{currentTarget.display}</div>
                  <div className="mt-2 bg-black/20 rounded-2xl px-3 py-1 inline-block">
                    <span className="text-white/70 text-xs font-bold">{vowelHint}</span>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className={`w-full transition-all duration-500 ${showHint ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"}`}>
                <div className="bg-yellow-400/90 text-yellow-900 rounded-2xl px-4 py-2 text-center font-black text-xs mb-3 shadow-lg border-2 border-yellow-300">
                  💡 {vowelHint}
                  {["B","P","M"].includes(currentTarget.consonant) && <div className="font-bold mt-0.5">Tutup bibir dulu, lalu letupkan!</div>}
                </div>
              </div>

              {/* Objek target animasi */}
              <div className={`flex-grow flex items-center justify-center w-full relative transition-transform ${isScreenShaking ? "translate-x-2 -translate-y-1" : ""}`}>
                <div className={`text-[110px] drop-shadow-2xl transition-all duration-150 z-10 ${laserFired ? "scale-[2.2] opacity-0 rotate-180 brightness-200 blur-sm" : "animate-bounce scale-100 opacity-100"}`}>
                  {currentTarget.emoji}
                </div>
                {explosionText && (
                  <div className="absolute z-20 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-300 to-white animate-ping">
                    {explosionText}
                  </div>
                )}
              </div>

              {/* Meter Sensor */}
              <div className="w-full grid grid-cols-2 gap-3 mt-3">
                <div className="bg-black/30 p-3 rounded-2xl border border-white/15">
                  <span className="font-black text-pink-300 block mb-1.5 text-xs text-center uppercase tracking-wider">🎤 Suara</span>
                  <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden p-0.5">
                    <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-75" style={{ width: `${micVolume}%` }} />
                  </div>
                  <div className="text-center text-white/40 text-xs mt-1">{micVolume}%</div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/15">
                  <span className={`font-black block mb-1.5 text-xs text-center uppercase tracking-wider ${isVowelCorrect ? "text-green-300" : "text-cyan-300"}`}>
                    {isVowelCorrect ? "✅" : "😮"} Mulut
                  </span>
                  <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden p-0.5">
                    <div className={`h-full rounded-full transition-all duration-75 ${isVowelCorrect ? "bg-green-400" : "bg-cyan-400"}`}
                      style={{ width: `${Math.min((lipDistance / baselineJaw) * 100, 100)}%` }} />
                  </div>
                  <div className="text-center text-white/40 text-xs mt-1">MAR: {currentMAR.toFixed(2)}</div>
                </div>
              </div>

              {/* Tombol panduan suara */}
              <button
                onClick={() => speakText(`${vowelHint} Coba ucapkan ${currentTarget.display.replace("!","")} sekali lagi!`)}
                className="mt-3 w-full bg-blue-500/20 hover:bg-blue-500/40 border-2 border-blue-400/30 text-white/80 font-bold text-xs py-2 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                🔊 Dengar Panduan Sekarang
              </button>
            </div>

          </div>

          {/* ── PANEL KANAN: CERMIN KAMERA & SKOR ── */}
          <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0 order-2 lg:order-3">
            <div className="bg-white/10 backdrop-blur-md border-8 border-white/30 rounded-[2rem] p-4 flex flex-col items-center shadow-xl">
              <div className="text-xs font-black text-yellow-300 mb-2 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> CERMIN KAPTEN
              </div>
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} width="300" height="225"
                className="w-full rounded-2xl border-4 border-black/50 bg-slate-900 scale-x-[-1] shadow-inner" />
              <div className={`mt-2 w-full text-center py-2 rounded-2xl font-black text-sm transition-all ${isVowelCorrect ? "bg-green-500/80 text-white" : "bg-white/10 text-white/40"}`}>
                {isVowelCorrect ? `✅ Bentuk "${currentTarget.vowel}" Benar!` : `👄 Tiru bentuk "${currentTarget.vowel}"`}
              </div>
            </div>

            {/* Skor dan Tombol Bawah */}
            <div className="flex flex-col items-center gap-3 mt-auto">
              <div className="bg-gradient-to-br from-yellow-300 to-orange-500 rounded-[2rem] px-6 py-4 text-center shadow-2xl border-4 border-yellow-200 w-full">
                <span className="text-orange-900 text-xs font-black uppercase tracking-wider block">✨ Bintang Energi</span>
                <span className="text-5xl font-black text-white drop-shadow-lg leading-tight">{score}</span>
                {totalAttempts > 0 && (
                  <div className="mt-1 bg-orange-600/40 rounded-2xl px-3 py-1 inline-block">
                    <span className="text-yellow-100 text-xs font-bold">Akurasi: {accuracy}%</span>
                  </div>
                )}
              </div>
              <button onClick={() => { stopAll(); setGameState("LEVEL_MAP"); }}
                className="bg-white/10 border-4 border-white/20 hover:bg-white/20 text-white font-black text-sm py-3 px-8 rounded-2xl transition-all shadow-lg w-full mb-2">
                ← Pilih Level Lain
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ════════════ VICTORY ════════════ */}
      {gameState === "VICTORY" && (
        <div className="relative z-10 text-center max-w-md w-full bg-white/20 backdrop-blur-xl border-8 border-yellow-300 p-8 rounded-[3rem] shadow-2xl space-y-5">
          <div className="text-9xl animate-bounce">{accuracy >= 80 ? "🏆" : accuracy >= 50 ? "⭐" : "💪"}</div>
          <h2 className="text-5xl font-black text-yellow-300">{accuracy >= 80 ? "LUAR BIASA!" : accuracy >= 50 ? "BAGUS!" : "TERUS BERLATIH!"}</h2>

          <div className="bg-black/20 rounded-3xl p-5 space-y-3">
            {[
              { label: "⭐ Bintang", value: score, color: "text-yellow-300" },
              { label: "🎯 Berhasil", value: `${hitCount} kali`, color: "text-green-300" },
              { label: "📊 Akurasi", value: `${accuracy}%`, color: accuracy >= 80 ? "text-green-300" : accuracy >= 50 ? "text-yellow-300" : "text-red-300" },
              { label: "📚 Level", value: selectedLevel.title, color: "text-cyan-300" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-white font-bold text-sm">
                <span>{item.label}</span><span className={item.color}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${accuracy >= 80 ? "bg-green-400" : accuracy >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
              style={{ width: `${accuracy}%` }} />
          </div>

          <button onClick={() => { if (accuracy >= 80) speak("VICTORY_GREAT",undefined,"high"); else if (accuracy >= 50) speak("VICTORY_GOOD",undefined,"high"); else speak("VICTORY_TRY_AGAIN",undefined,"high"); }}
            className="w-full bg-white/10 hover:bg-white/20 border-4 border-white/20 text-white/80 font-bold text-sm py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
            🔊 Dengar Pesan Guru
          </button>

          <div className="flex gap-3">
            <button onClick={() => {
              stopAll(); setGameState("GAMEPLAY");
              setScore(0); setHitCount(0); setTotalAttempts(0); setTimeLeft(45);
              setCurrentTarget(selectedLevel.targets[0]); resetCombo();
              setTimeout(() => speak("GAMEPLAY_START"), 500); setTimeout(() => announceTarget(selectedLevel.targets[0]), 2800); setTimeout(() => startHintTimer(selectedLevel.targets[0]), 2800);
            }} className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-500 border-b-8 border-blue-700 text-white font-black text-lg py-4 rounded-3xl hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all shadow-xl">
              🔄 Ulangi
            </button>
            <button onClick={() => { stopAll(); router.push("/petualangan"); }}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 border-b-8 border-orange-700 text-white font-black text-lg py-4 rounded-3xl hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all shadow-xl">
              🏠 Portal
            </button>
          </div>
        </div>
      )}

      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js" crossOrigin="anonymous" />
    </div>
  );
}
