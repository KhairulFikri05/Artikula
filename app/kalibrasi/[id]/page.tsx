"use client";

import { useEffect, useRef, useState, use } from "react";
import Script from "next/script";
import { simpanKalibrasi } from "../../actions";
import { useRouter } from "next/navigation";

export default function KalibrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); 
  const id = resolvedParams.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [jawDistance, setJawDistance] = useState<number>(0);
  const [voiceDb, setVoiceDb] = useState<number>(0);
  const [isAiReady, setIsAiReady] = useState(false);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSimpan = async () => {
    setIsSaving(true);
    // Menyimpan angka Viskom (jawDistance) dan Mic (voiceDb) ke MySQL
    const result = await simpanKalibrasi(id, jawDistance, voiceDb);
    
    if (result.success) {
      router.push(`/game/${id}`); // Lanjut ke Peta Level
    } else {
      alert("Gagal menyimpan data.");
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Jangan jalankan kode AI kalau library MediaPipe belum selesai di-load browser
    if (!isAiReady) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    // 1. Ambil FaceMesh langsung dari Window (Bypass error Turbopack Next.js)
    const FaceMesh = (window as any).FaceMesh;

    const faceMesh = new FaceMesh({ 
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` 
    });
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // 2. Logika Deteksi Koordinat Wajah
    faceMesh.onResults((results: any) => {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Titik Bibir Atas (13) dan Bibir Bawah (14)
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];

        const x1 = upperLip.x * canvasElement.width;
        const y1 = upperLip.y * canvasElement.height;
        const x2 = lowerLip.x * canvasElement.width;
        const y2 = lowerLip.y * canvasElement.height;

        const distance = Math.abs(y2 - y1); 
        // Kunci angka Viskom di batas maksimal (Baseline)
        setJawDistance((prev) => Math.max(prev, Math.round(distance)));

        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.beginPath(); canvasCtx.arc(x1, y1, 4, 0, 2 * Math.PI); canvasCtx.fill();
        canvasCtx.beginPath(); canvasCtx.arc(x2, y2, 4, 0, 2 * Math.PI); canvasCtx.fill();
        
        canvasCtx.strokeStyle = "#00FF00";
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        canvasCtx.moveTo(x1, y1);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.stroke();
      }
    });

    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;

    // 3. Menyalakan Kamera & Mikrofon (Dual-Sensor)
    async function startSensors() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Setup Audio Analyser
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        videoElement!.srcObject = stream;
        videoElement!.play();

        const sendFrame = async () => {
          if (!videoElement!.paused && !videoElement!.ended) {
            await faceMesh.send({ image: videoElement! });
          }
          
          // Hitung Volume Mic (Amplitudo frekuensi)
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          // Kunci angka Suara Mic di batas maksimal (Baseline)
          setVoiceDb((prev) => Math.max(prev, Math.round(average)));

          animationFrameId = requestAnimationFrame(sendFrame);
        };
        
        videoElement!.onloadeddata = () => {
          sendFrame();
        };
      } catch (error) {
        console.error("Akses Sensor ditolak/gagal:", error);
      }
    }

    startSensors();

    // 4. Cleanup function saat komponen di-unmount (mencegah memory/camera leak)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (faceMesh) faceMesh.close();
      if (audioContext) audioContext.close();
    };
  }, [isAiReady]); // useEffect ini akan menyala ulang setelah AI siap

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-200 text-slate-800 p-4 font-sans">
      {/* Script injeksi langsung ke CDN untuk menghindari error Turbopack */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" 
        onReady={() => setIsAiReady(true)} 
      />

      {/* Judul & Panduan Suara/Teks (Krusial) */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 drop-shadow-md mb-4">
          Ruang Kalibrasi
        </h1>
        <p className="text-2xl font-bold text-orange-600 bg-white/80 px-8 py-4 rounded-full shadow-sm inline-block animate-bounce">
          "Buka mulutmu lebar-lebar dan bersuara Aaaaa!" 📢
        </p>
      </div>
      
      {!isAiReady && (
        <div className="animate-pulse text-indigo-600 font-bold text-xl mb-4">Mempersiapkan Sensor Ajaib... ✨</div>
      )}

      <div className={`relative ${!isAiReady ? 'hidden' : ''}`}>
        <video ref={videoRef} className="hidden" playsInline />
        <canvas 
          ref={canvasRef} 
          width="640" 
          height="480" 
          className="rounded-3xl shadow-2xl border-8 border-indigo-400 bg-black scale-x-[-1] max-w-full h-auto" 
        />
      </div>

      <div className="flex flex-wrap gap-6 mt-8 justify-center w-full max-w-2xl">
        {/* Kotak Sensor Viskom */}
        <div className="flex-1 text-center bg-white px-6 py-6 rounded-3xl border-b-8 border-green-500 shadow-xl">
          <h2 className="text-xl font-bold text-slate-500 uppercase">Jarak Bibir</h2>
          <div className="flex items-baseline justify-center gap-2 mt-1">
            <span className="text-6xl font-black text-green-500">{jawDistance}</span>
            <span className="text-2xl font-bold text-green-700">px</span>
          </div>
        </div>

        {/* Kotak Sensor Audio (Desibel) */}
        <div className="flex-1 text-center bg-white px-6 py-6 rounded-3xl border-b-8 border-blue-500 shadow-xl">
          <h2 className="text-xl font-bold text-slate-500 uppercase">Suara Mic</h2>
          <div className="flex items-baseline justify-center gap-2 mt-1">
            <span className="text-6xl font-black text-blue-500">{voiceDb}</span>
            <span className="text-2xl font-bold text-blue-700">dB</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSimpan}
        disabled={isSaving || (jawDistance === 0 && voiceDb === 0)}
        className="mt-10 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-12 py-5 rounded-full font-black text-3xl shadow-[0_10px_0_rgb(185,28,28)] active:shadow-[0_0px_0_rgb(185,28,28)] active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
      >
        {isSaving ? "Menyimpan..." : "MULAI PETUALANGAN!"}
      </button>
    </div>
  );
}