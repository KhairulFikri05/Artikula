"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { simpanSkorGame } from "../../action";

import { useFaceTracking } from "./useFaceTracking";
import { useAudioSensor } from "./useAudioSensor";

type GameState = "SPLASH" | "MODE_SELECTION" | "LEVEL_MAP" | "GAMEPLAY" | "VICTORY";
type GameMode = "SOLO" | "ESTAFET";

export default function GameClient({ student }: { student: any }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>("SPLASH");
  const [gameMode, setGameMode] = useState<GameMode>("SOLO");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentPemain, setCurrentPemain] = useState<string>(student?.name || "Kapten");
  const [isPausedForRotation, setIsPausedForRotation] = useState(false);

  const [laserFired, setLaserFired] = useState(false);
  const [explosionText, setExplosionText] = useState("");
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  // --- AUDIO ENGINE BARU (Disimpan di Ref agar tidak mati) ---
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioEngine = () => {
    // Pancing AudioContext saat user mengklik sesuatu
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playShootSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    try {
      const audioCtx = audioCtxRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.log("Audio play failed", e);
    }
  }, []);

  const baselineJaw = student?.baselineJawPixel || 80;
  const targetPlosiveThreshold = baselineJaw * 0.3;

  const handlePlosiveHit = useCallback(() => {
    playShootSound(); 
    setScore((prev) => prev + 10);
    setLaserFired(true);
    setIsScreenShaking(true); 
    
    const pujian = ["HEBAT!", "BOOM!", "KENA!", "SUPER!"];
    setExplosionText(pujian[Math.floor(Math.random() * pujian.length)]);

    setTimeout(() => {
      setLaserFired(false);
      setIsScreenShaking(false);
      setExplosionText("");
    }, 500);
  }, [playShootSound]);

  const { streamRef, micVolume, requestDevicePermission } = useAudioSensor(gameState, isPausedForRotation);
  
  const { isAiReady, lipDistance, initFaceMesh } = useFaceTracking(
    videoRef,
    canvasRef,
    gameState,
    isPausedForRotation,
    targetPlosiveThreshold,
    micVolume,
    handlePlosiveHit
  );

  useEffect(() => {
    const checkAI = setInterval(() => {
      if ((window as any).FaceMesh) {
        clearInterval(checkAI);
        if (!isAiReady) {
          initFaceMesh();
        }
      }
    }, 500);
    return () => clearInterval(checkAI);
  }, [isAiReady, initFaceMesh]);

  const handleIzinkanPerangkat = async () => {
    initAudioEngine(); // Pancing Audio saat klik splash!
    const diizinkan = await requestDevicePermission();
    if (diizinkan) {
      setGameState("MODE_SELECTION");
    }
  };

  useEffect(() => {
    if (gameState === "GAMEPLAY" && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
  }, [gameState, streamRef]);

  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gameMode === "ESTAFET" && currentPemain === student?.name) {
            setIsPausedForRotation(true);
            setCurrentPemain("Teman Regu (Budi)");
            return 30;
          } else {
            clearInterval(timer);
            setGameState("VICTORY");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode, currentPemain, isPausedForRotation, student]);

  useEffect(() => {
    if (gameState === "VICTORY") {
      const finalAccuracy = Math.min(Math.round((score / 150) * 100), 100);
      simpanSkorGame(student.id, finalAccuracy, 30, "Planet Letupan (P, B, M)");
    }
  }, [gameState, score, student?.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-800 text-white p-6 overflow-hidden select-none font-sans relative">
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-20 text-4xl animate-pulse">⭐</div>
        <div className="absolute top-40 right-32 text-5xl animate-bounce">🌍</div>
        <div className="absolute bottom-20 left-1/4 text-6xl animate-pulse">☄️</div>
      </div>

      {gameState === "SPLASH" && (
        <div className="relative z-10 max-w-lg w-full bg-white/20 backdrop-blur-xl p-10 rounded-[3rem] border-8 border-white/40 shadow-2xl text-center transform transition-all animate-fade-in">
          <div className="text-8xl mb-6 drop-shadow-xl animate-bounce">🚀</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 drop-shadow-md mb-4">ARTIKULA ARCADE</h1>
          <p className="text-white/90 font-bold text-lg mb-8">Siap memulai petualangan seru melatih suara hebatmu?</p>
          <button 
            onClick={handleIzinkanPerangkat}
            disabled={!isAiReady}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-600 border-b-8 border-green-700 hover:from-green-300 hover:to-emerald-500 text-white font-black text-2xl py-6 rounded-3xl shadow-xl active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {isAiReady ? "MULAI PETUALANGAN! 🎮" : "Memuat AI Sistem..."}
          </button>
        </div>
      )}

      {gameState === "MODE_SELECTION" && (
        <div className="relative z-10 text-center w-full max-w-4xl space-y-8 animate-fade-in">
          <h2 className="text-5xl font-black text-yellow-300 drop-shadow-lg">PILIH STRATEGI KAPTEN</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* PASTIKAN AUDIO ENGINE DIPANCING LAGI SAAT MEMILIH MODE */}
            <button onClick={() => { initAudioEngine(); setGameMode("SOLO"); setGameState("LEVEL_MAP"); }} className="bg-white/20 backdrop-blur-md hover:bg-white/30 p-10 rounded-[3rem] border-8 border-blue-300 shadow-xl flex flex-col items-center space-y-4 group transition-transform transform hover:-translate-y-2">
              <span className="text-8xl group-hover:scale-110 transition drop-shadow-md">🧑‍🚀</span>
              <span className="text-3xl font-black text-white">Misi Solo</span>
            </button>
            <button onClick={() => { initAudioEngine(); setGameMode("ESTAFET"); setGameState("LEVEL_MAP"); }} className="bg-white/20 backdrop-blur-md hover:bg-white/30 p-10 rounded-[3rem] border-8 border-pink-300 shadow-xl flex flex-col items-center space-y-4 group transition-transform transform hover:-translate-y-2">
              <span className="text-8xl group-hover:scale-110 transition drop-shadow-md">🚀🧑‍🚀</span>
              <span className="text-3xl font-black text-white">Misi Estafet</span>
            </button>
          </div>
        </div>
      )}

      {gameState === "LEVEL_MAP" && (
        <div className="relative z-10 text-center w-full max-w-2xl space-y-8 animate-fade-in bg-white/20 backdrop-blur-md p-10 rounded-[3rem] border-8 border-white/30 shadow-2xl">
          <h2 className="text-4xl font-black text-yellow-300 drop-shadow-md">PETA TATA SURYA</h2>
          <div className="space-y-6">
            <button onClick={() => setGameState("GAMEPLAY")} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 border-b-8 border-blue-700 p-6 rounded-3xl flex items-center justify-between hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-5xl drop-shadow-md">🌋</span>
                <span className="font-black text-2xl text-white">Planet Letupan (P, B, M)</span>
              </div>
              <span className="text-sm bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-black shadow-inner">TERBUKA</span>
            </button>
          </div>
        </div>
      )}

      {gameState === "GAMEPLAY" && (
        <div className="relative z-10 w-full max-w-5xl flex gap-6 items-start">
          
          {isPausedForRotation && (
            <div className="absolute inset-0 bg-indigo-900/95 z-50 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-6 border-8 border-pink-400 shadow-2xl backdrop-blur-sm">
              <div className="text-8xl animate-bounce drop-shadow-lg">⏳</div>
              <h2 className="text-5xl font-black text-pink-300">WAKTU GANTIAN!</h2>
              <button onClick={() => { initAudioEngine(); setIsPausedForRotation(false); }} className="bg-gradient-to-r from-pink-400 to-rose-500 border-b-8 border-pink-700 text-white font-black text-3xl px-12 py-6 rounded-3xl shadow-xl hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all">
                SAYA SIAP! 🚀
              </button>
            </div>
          )}

          <div className="flex-grow bg-white/10 backdrop-blur-md rounded-[3rem] p-6 border-8 border-white/30 flex flex-col items-center relative overflow-hidden min-h-[540px] shadow-2xl">
            {laserFired && <div className="absolute inset-0 bg-yellow-300/40 z-10 pointer-events-none animate-ping" />}
            
            <div className="w-full flex justify-between items-center mb-4 bg-black/20 p-4 rounded-3xl backdrop-blur-sm border-2 border-white/10">
              <div className="text-lg font-black text-white">KAPTEN: <span className="text-yellow-300 uppercase">{currentPemain}</span></div>
              <div className="bg-red-500 text-white font-black text-2xl px-6 py-2 rounded-full shadow-inner animate-pulse">⏱️ {timeLeft}s</div>
            </div>
            
            <div className={`flex-grow flex items-center justify-center w-full relative transition-transform ${isScreenShaking ? 'translate-x-2 -translate-y-2' : ''}`}>
              
              <div className={`text-[150px] drop-shadow-2xl transition-all duration-150 z-10 ${
                laserFired 
                  ? 'scale-[2.5] opacity-0 rotate-180 brightness-200 contrast-200 blur-sm' 
                  : 'animate-bounce scale-100 opacity-100 hover:scale-110'
              }`}>
                ☄️
              </div>

              {explosionText && (
                <div className="absolute z-20 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-400 to-red-500 animate-[ping_0.3s_ease-out_forwards] drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                  {explosionText}
                </div>
              )}

              <div className="absolute bottom-6 font-black text-3xl text-yellow-300 tracking-wider bg-black/50 px-8 py-4 rounded-full border-4 border-white/20 backdrop-blur-md shadow-xl z-0">
                Tirukan Letupan: <span className="text-white">"BOOM!"</span>
              </div>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-6 mt-6">
              <div className="bg-black/30 p-4 rounded-3xl border-2 border-white/20">
                <span className="font-black text-pink-300 block mb-2 text-center">🎤 KEKUATAN SUARA</span>
                <div className="w-full bg-white/20 h-6 rounded-full overflow-hidden shadow-inner p-1">
                  <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-75" style={{ width: `${micVolume}%` }} />
                </div>
              </div>
              <div className="bg-black/30 p-4 rounded-3xl border-2 border-white/20">
                <span className="font-black text-cyan-300 block mb-2 text-center">😲 BUKAAN MULUT</span>
                <div className="w-full bg-white/20 h-6 rounded-full overflow-hidden shadow-inner p-1">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-75" style={{ width: `${Math.min((lipDistance / baselineJaw) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-[320px] flex flex-col gap-6">
            <div className="bg-white/10 backdrop-blur-md border-8 border-white/30 rounded-[3rem] p-4 flex flex-col items-center shadow-xl">
              <span className="text-sm font-black text-yellow-300 mb-2 uppercase tracking-widest bg-black/30 px-4 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> CERMIN KAPTEN
              </span>
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} width="320" height="240" className="w-full rounded-3xl border-4 border-black/50 bg-slate-900 scale-x-[-1] shadow-inner" />
            </div>

            <div className="bg-gradient-to-br from-yellow-300 to-orange-500 rounded-[3rem] p-8 text-center shadow-2xl border-8 border-yellow-200">
              <span className="text-orange-900 text-lg font-black uppercase tracking-wider block drop-shadow-sm">Bintang Energi</span>
              <span className="text-8xl font-black text-white drop-shadow-lg">{score}</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "VICTORY" && (
        <div className="relative z-10 text-center max-w-lg bg-white/20 backdrop-blur-xl border-8 border-yellow-300 p-12 rounded-[3rem] shadow-2xl space-y-8 animate-fade-in">
          <div className="text-9xl animate-bounce drop-shadow-xl">👑</div>
          <h2 className="text-5xl font-black text-yellow-300 drop-shadow-md">HEBAT!</h2>
          <button onClick={() => router.push("/petualangan")} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 border-b-8 border-orange-700 text-white font-black text-2xl py-5 rounded-3xl hover:brightness-110 active:border-b-0 active:translate-y-2 transition-all shadow-xl">
            KEMBALI KE PORTAL 🚀
          </button>
        </div>
      )}
    </div>
  );
}