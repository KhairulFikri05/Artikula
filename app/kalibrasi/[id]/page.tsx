"use client";

import { useEffect, useRef, useState, use } from "react";
import Script from "next/script";
import { simpanKalibrasi } from "../../action";
import { useRouter } from "next/navigation";

export default function KalibrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); 
  const id = resolvedParams.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [jawDistance, setJawDistance] = useState<number>(0);
  const [isAiReady, setIsAiReady] = useState(false);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSimpan = async () => {
    setIsSaving(true);
    // Menyimpan angka jawDistance ke MySQL berdasarkan ID siswa dari URL
    const result = await simpanKalibrasi(id, jawDistance);
    
    if (result.success) {
      alert("Baseline Rahang berhasil disimpan!");
      router.push("/dashboard"); // Balik ke dasbor
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
        setJawDistance(Math.round(distance));

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

    // 3. Menyalakan Kamera Browser
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement!.srcObject = stream;
        videoElement!.play();

        const sendFrame = async () => {
          if (!videoElement!.paused && !videoElement!.ended) {
            await faceMesh.send({ image: videoElement! });
          }
          animationFrameId = requestAnimationFrame(sendFrame);
        };
        
        videoElement!.onloadeddata = () => {
          sendFrame();
        };
      } catch (error) {
        console.error("Akses kamera ditolak/gagal:", error);
      }
    }

    startCamera();

    // 4. Cleanup function saat komponen di-unmount (mencegah memory/camera leak)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (faceMesh) faceMesh.close();
    };
  }, [isAiReady]); // useEffect ini akan menyala ulang setelah AI siap

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
      {/* Script injeksi langsung ke CDN untuk menghindari error Turbopack */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" 
        onReady={() => setIsAiReady(true)} 
      />

      <h1 className="text-3xl font-bold mb-2">Kalibrasi Sensor ARTIKULA</h1>
      <p className="text-slate-400 mb-8">Buka mulutmu lebar-lebar untuk mengukur baseline rahang.</p>
      
      {!isAiReady && (
        <div className="animate-pulse text-blue-400 mb-4">Memuat modul Artificial Intelligence...</div>
      )}

      <div className={`relative ${!isAiReady ? 'hidden' : ''}`}>
        <video ref={videoRef} className="hidden" playsInline />
        <canvas 
          ref={canvasRef} 
          width="640" 
          height="480" 
          className="rounded-xl shadow-2xl border-4 border-slate-700 bg-black scale-x-[-1]" 
        />
      </div>

      <div className="mt-8 text-center bg-slate-800 px-12 py-6 rounded-2xl border border-slate-700">
        <h2 className="text-lg text-slate-300 uppercase tracking-widest">Bukaan Rahang / Mulut</h2>
        <div className="flex items-baseline justify-center gap-2 mt-2">
          <span className="text-7xl font-extrabold text-green-400">{jawDistance}</span>
          <span className="text-2xl text-green-600 font-bold">px</span>
        </div>
      </div>

      <button 
        onClick={handleSimpan}
        disabled={isSaving || jawDistance === 0}
        className="mt-8 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg transition transform hover:scale-105 active:scale-95 disabled:bg-slate-600 disabled:cursor-not-allowed"
      >
        {isSaving ? "Menyimpan..." : "Simpan Baseline"}
      </button>
    </div>
  );
}