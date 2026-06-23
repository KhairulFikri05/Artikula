"use client";

import { useEffect, useRef, useState, use } from "react";
import Script from "next/script";
import { simpanKalibrasi } from "../../actions";
import { useRouter } from "next/navigation";

// Deskripsi pola bentuk mulut setiap vokal
const VOWEL_GUIDE = [
  { label: "A", hint: "Buka mulut lebar, rahang turun", emoji: "😮" },
  { label: "I", hint: "Senyum lebar, bibir melebar", emoji: "😁" },
  { label: "U", hint: "Moncongkan bibir ke depan", emoji: "😙" },
  { label: "E", hint: "Bibir santai, celah sedang", emoji: "🙂" },
  { label: "O", hint: "Bibir bulat seperti donat", emoji: "😮" },
];

export default function KalibrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [jawDistance, setJawDistance] = useState<number>(0);
  const [voiceDb, setVoiceDb] = useState<number>(0);
  const [isAiReady, setIsAiReady] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<"intro" | "kalibrate" | "done">("intro");
  const router = useRouter();

  const handleSimpan = async () => {
    if (jawDistance < 5) {
      alert("Buka mulut dulu ya! Sensor belum mendeteksi bukaan mulut. 🙈");
      return;
    }
    setIsSaving(true);

    const result = await simpanKalibrasi(id, jawDistance, voiceDb);

    if (result.success) {
      setStep("done");
      setTimeout(() => router.push(`/game/${id}`), 2000);
    } else {
      alert("Gagal menyimpan data. Coba lagi ya!");
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isAiReady || step !== "kalibrate") return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;
    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    const FaceMesh = (window as any).FaceMesh;
    const faceMesh = new FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: any) => {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiFaceLandmarks?.length > 0) {
        const lm = results.multiFaceLandmarks[0];
        const W = canvasElement.width;
        const H = canvasElement.height;

        const upperY = lm[13].y * H;
        const lowerY = lm[14].y * H;
        const upperX = lm[13].x * W;
        const lowerX = lm[14].x * W;
        const dist = Math.abs(lowerY - upperY);

        // Catat jarak maksimum saat mulut dibuka lebar (baseline)
        setJawDistance((prev) => Math.max(prev, Math.round(dist)));

        // Gambar landmark bibir
        canvasCtx.fillStyle = dist > 20 ? "#22C55E" : "#F59E0B";
        canvasCtx.shadowBlur = 8;
        canvasCtx.shadowColor = canvasCtx.fillStyle;
        [[upperX, upperY], [lowerX, lowerY]].forEach(([x, y]) => {
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
          canvasCtx.fill();
        });
        // Garis ukuran
        canvasCtx.strokeStyle = canvasCtx.fillStyle;
        canvasCtx.lineWidth = 3;
        canvasCtx.beginPath();
        canvasCtx.moveTo(upperX, upperY);
        canvasCtx.lineTo(lowerX, lowerY);
        canvasCtx.stroke();
        // Label jarak
        canvasCtx.shadowBlur = 0;
        canvasCtx.fillStyle = "white";
        canvasCtx.font = "bold 14px sans-serif";
        canvasCtx.fillText(`${Math.round(dist)}px`, lowerX + 8, (upperY + lowerY) / 2);
      }
    });

    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;

    async function startSensors() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const mic = audioContext.createMediaStreamSource(stream);
        mic.connect(analyser);
        analyser.fftSize = 256;
        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play();
        }

        const loop = async () => {
          if (videoElement && !videoElement.paused && !videoElement.ended) {
            await faceMesh.send({ image: videoElement });
          }
          analyser.getByteFrequencyData(dataArr);
          const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
          setVoiceDb((prev) => Math.max(prev, Math.round(avg)));
          animationFrameId = requestAnimationFrame(loop);
        };
        if (videoElement) videoElement.onloadeddata = () => loop();
      } catch (err) {
        console.error("Sensor error:", err);
        alert("Kamera/mikrofon tidak dapat diakses. Pastikan izin diberikan ya! 🙏");
      }
    }

    startSensors();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (faceMesh) faceMesh.close();
      if (audioContext) audioContext.close();
    };
  }, [isAiReady, step]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-indigo-500 via-purple-600 to-pink-700 p-6 font-sans">
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js"
        crossOrigin="anonymous"
        onReady={() => setIsAiReady(true)}
      />

      {/* ── INTRO ── */}
      {step === "intro" && (
        <div className="max-w-lg w-full bg-white/20 backdrop-blur-xl rounded-[3rem] border-8 border-white/40 shadow-2xl p-10 text-center space-y-6">
          <div className="text-8xl animate-bounce">⚙️</div>
          <h1 className="text-4xl font-black text-yellow-300">Ruang Kalibrasi</h1>
          <p className="text-white/90 font-bold text-lg">
            Kita akan belajar mengenali <span className="text-yellow-200">bentuk mulutmu</span> untuk 5 huruf vokal! 🎤
          </p>
          {/* Panduan vokal */}
          <div className="grid grid-cols-5 gap-2">
            {VOWEL_GUIDE.map((v) => (
              <div key={v.label} className="bg-white/20 rounded-2xl p-3 text-center">
                <div className="text-2xl">{v.emoji}</div>
                <div className="text-white font-black text-lg">{v.label}</div>
                <div className="text-white/60 text-xs">{v.hint}</div>
              </div>
            ))}
          </div>
          <p className="text-white/70 text-sm font-bold">
            💡 Nanti kamu akan diminta membuka mulut lebar sambil bersuara <span className="text-yellow-200">"Aaaaa!"</span> supaya sensor bisa belajar ukuran mulutmu.
          </p>
          {!isAiReady ? (
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2 animate-spin">⚙️</div>
              <p className="text-white/80 font-bold text-sm">Memuat Sensor AI...</p>
            </div>
          ) : (
            <button
              onClick={() => setStep("kalibrate")}
              className="w-full bg-linear-to-r from-green-400 to-emerald-600 border-b-8 border-green-700 text-white font-black text-2xl py-6 rounded-3xl shadow-xl active:border-b-0 active:translate-y-2 transition-all"
            >
              MULAI KALIBRASI! 🚀
            </button>
          )}
        </div>
      )}

      {/* ── KALIBRASI ── */}
      {step === "kalibrate" && (
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-black text-yellow-300 drop-shadow-md mb-2">Ruang Kalibrasi</h1>
            <div className="inline-block bg-white/20 px-6 py-3 rounded-full text-white font-black text-xl animate-bounce border-4 border-yellow-300/50">
              "Buka mulutmu lebar-lebar dan bersuara A...!" 📢
            </div>
          </div>

          <div className="relative">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="w-full rounded-3xl shadow-2xl border-8 border-indigo-400 bg-black scale-x-[-1]"
            />
            {/* Overlay status */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full font-black text-sm ${jawDistance > 20 ? "bg-green-500 text-white" : "bg-yellow-400 text-yellow-900"}`}>
              {jawDistance > 20 ? "✅ Terdeteksi!" : "👄 Buka mulutmu..."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 text-center border-4 border-green-300">
              <p className="text-white/70 font-black text-xs uppercase mb-1">📐 Jarak Bibir</p>
              <div className="text-5xl font-black text-green-300">{jawDistance}</div>
              <div className="text-white/60 text-sm font-bold">px</div>
              <div className="w-full bg-white/20 rounded-full h-3 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${jawDistance > 20 ? "bg-green-400" : "bg-yellow-400"}`}
                  style={{ width: `${Math.min((jawDistance / 120) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 text-center border-4 border-blue-300">
              <p className="text-white/70 font-black text-xs uppercase mb-1">🎤 Suara Mic</p>
              <div className="text-5xl font-black text-blue-300">{voiceDb}</div>
              <div className="text-white/60 text-sm font-bold">level</div>
              <div className="w-full bg-white/20 rounded-full h-3 mt-2 overflow-hidden">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min((voiceDb / 128) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSimpan}
            disabled={isSaving || jawDistance < 5}
            className="w-full bg-linear-to-r from-orange-400 to-red-500 border-b-8 border-red-700 text-white font-black text-2xl py-6 rounded-3xl shadow-xl active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {isSaving ? "Menyimpan... ⏳" : jawDistance < 5 ? "Buka mulutmu dulu! 👄" : "MULAI PETUALANGAN! 🚀"}
          </button>
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-[3rem] border-8 border-green-400 shadow-2xl p-10 text-center space-y-6">
          <div className="text-8xl animate-bounce">🎉</div>
          <h2 className="text-4xl font-black text-green-300">Kalibrasi Berhasil!</h2>
          <p className="text-white/80 font-bold">Sensor sudah mengenal mulutmu. Kita siap petualangan! 🚀</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/20 rounded-2xl p-4">
              <div className="text-3xl font-black text-green-300">{jawDistance}px</div>
              <div className="text-white/60 text-xs">Jarak Bibir</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-4">
              <div className="text-3xl font-black text-blue-300">{voiceDb}</div>
              <div className="text-white/60 text-xs">Level Suara</div>
            </div>
          </div>
          <div className="text-white/60 text-sm animate-pulse">Memuat game... ⚙️</div>
        </div>
      )}
    </div>
  );
}
