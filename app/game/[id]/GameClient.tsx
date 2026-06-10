"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { simpanSkorGame } from "../../action";

export default function GameClient({ student }: { student: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [isAiReady, setIsAiReady] = useState(false);
  const [jawDistance, setJawDistance] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"READY" | "PLAYING" | "FINISHED">("READY");
  
  // Menetapkan target kesulitan game: 80% dari bukaan maksimal (baseline) siswa
  const baseline = student.baselineJawPixel || 70; 
  const targetGoal = Math.round(baseline * 0.8); 

  useEffect(() => {
    if (!isAiReady || gameState !== "PLAYING") return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;
    const canvasCtx = canvasElement.getContext("2d");

    const FaceMesh = (window as any).FaceMesh;
    const faceMesh = new FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results: any) => {
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const y1 = landmarks[13].y * canvasElement.height; // Bibir Atas
        const y2 = landmarks[14].y * canvasElement.height; // Bibir Bawah
        const distance = Math.abs(y2 - y1);
        setJawDistance(Math.round(distance));

        // Gambar UI Game sederhana di atas wajah anak (Visual VAK)
        if (distance >= targetGoal) {
          // Jika rahang anak menyentuh target 80% baseline
          canvasCtx.strokeStyle = "#00FF00";
          canvasCtx.lineWidth = 6;
          setScore((prev) => prev + 1); // Skor bertambah terus selama mulut terbuka lebar
        } else {
          canvasCtx.strokeStyle = "#FF0000";
          canvasCtx.lineWidth = 3;
        }
        
        // Gambar lingkaran indikator di mulut
        canvasCtx.beginPath();
        canvasCtx.arc(landmarks[13].x * canvasElement.width, y1, 6, 0, 2 * Math.PI);
        canvasCtx.arc(landmarks[14].x * canvasElement.width, y2, 6, 0, 2 * Math.PI);
        canvasCtx.stroke();
      }
    });

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement!.srcObject = stream;
        videoElement!.play();
        const sendFrame = async () => {
          if (!videoElement!.paused && !videoElement!.ended && gameState === "PLAYING") {
            await faceMesh.send({ image: videoElement! });
            requestAnimationFrame(sendFrame);
          }
        };
        videoElement!.onloadeddata = () => { sendFrame(); };
      } catch (err) { console.error(err); }
    }

    startCamera();
  }, [isAiReady, gameState]);

  const handleSelesaiBermain = async () => {
    setGameState("FINISHED");
    // Konversi total poin menjadi persentase akurasi (maksimal di-cap 100%)
    const finalAccuracy = Math.min(Math.round((score / 200) * 100), 100);
    
    const res = await simpanSkorGame(student.id, finalAccuracy, 30, "Level 1 (Vokal)");
    if (res.success) {
      alert(`Hebat! Petualangan selesai. Akurasi Motorikmu: ${finalAccuracy}% 🎉`);
      router.push("/petualangan");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" onReady={() => setIsAiReady(true)} />

      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-amber-400">🎮 PETUALANGAN MOTORIK ORAL</h1>
        <p className="text-slate-300 font-medium">Petualang: <span className="text-cyan-400">{student.name}</span></p>
      </div>

      {gameState === "READY" && (
        <div className="text-center bg-slate-900 p-8 rounded-3xl border-2 border-slate-800 max-w-md shadow-xl">
          <div className="text-6xl mb-4">👾</div>
          <h2 className="text-xl font-bold mb-4">Misi: Beri Makan Monster</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Buka mulutmu lebar-lebar mengikuti tanda di layar untuk memberikan energi pada Monster Artikula! Latihan ini akan membantumu melafalkan huruf **A, I, U, E, O**.
          </p>
          <button 
            onClick={() => setGameState("PLAYING")}
            disabled={!isAiReady}
            className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-3 rounded-xl font-black text-lg shadow-lg hover:from-emerald-400 disabled:from-slate-700 disabled:cursor-not-allowed"
          >
            {isAiReady ? "MULAI BERMAIN GAME" : "Menyiapkan AI..."}
          </button>
        </div>
      )}

      {gameState === "PLAYING" && (
        <div className="flex flex-col items-center">
          {/* Bar Progress / Indikator Umpan Balik Visual VAK */}
          <div className="w-[640px] mb-4 bg-slate-800 h-6 rounded-full overflow-hidden p-1 border border-slate-700">
            <div 
              className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 h-full rounded-full transition-all duration-100"
              style={{ width: `${Math.min((jawDistance / targetGoal) * 100, 100)}%` }}
            />
          </div>

          <div className="relative">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas ref={canvasRef} width="640" height="480" className="rounded-2xl border-4 border-slate-800 bg-black scale-x-[-1]" />
            
            {/* Overlay Karakter Rakasa Lucu di Pojok Layar */}
            <div className="absolute top-4 right-4 bg-slate-900/90 p-4 rounded-xl text-center border border-slate-700">
              <span className="text-4xl block animate-pulse">{jawDistance >= targetGoal ? "😋" : "😮"}</span>
              <span className="text-xs font-bold text-slate-400 mt-1 block">
                {jawDistance >= targetGoal ? "NYAM! KENYANG" : "AYO BUKA LAGI!"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between w-[640px] mt-6 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Minimal</p>
              <p className="text-xl font-black text-emerald-400">{targetGoal} px <span className="text-xs text-slate-500">(Baseline: {baseline}px)</span></p>
            </div>
            <button 
              onClick={handleSelesaiBermain}
              className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition"
            >
              Selesai & Simpan Skor 💾
            </button>
          </div>
        </div>
      )}
    </div>
  );
}