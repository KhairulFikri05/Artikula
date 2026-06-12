"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Sesuaikan nama path ini jika filemu bernama action.ts atau actions.ts
import { verifikasiSiswa } from "../action"; 

export default function GerbangPetualanganPage() {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMasukGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setIsLoading(true);
    setError("");

    const res = await verifikasiSiswa(studentId.trim());

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else if (res.success && res.student) {
      if (!res.student.baselineJawPixel) {
        alert(`Halo ${res.student.name}! Karena ini petualangan pertamamu, yuk kita kalibrasi sensor wajah dulu ya!🚀`);
        router.push(`/kalibrasi/${res.student.id}`);
      } else {
        router.push(`/game/${res.student.id}`);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-300 via-blue-400 to-indigo-600 p-6 overflow-hidden">
      
      {/* Elemen Dekorasi Latar Belakang Animasi */}
      <div className="absolute top-10 left-10 text-6xl animate-pulse opacity-80">☁️</div>
      <div className="absolute top-20 right-20 text-7xl animate-bounce opacity-80">🪐</div>
      <div className="absolute bottom-20 left-32 text-5xl animate-bounce opacity-80">✨</div>
      <div className="absolute bottom-10 right-10 text-8xl animate-pulse opacity-80">🚀</div>

      {/* Kontainer Utama */}
      <div className="relative z-10 max-w-lg w-full bg-white/95 backdrop-blur-sm p-10 rounded-[3rem] border-8 border-white/50 shadow-2xl text-center transform transition-all">
        
        {/* Maskot Game */}
        <div className="text-8xl mb-6 drop-shadow-xl animate-bounce">👾</div>
        
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-4 drop-shadow-sm">
          GERBANG ARTIKULA
        </h1>
        <p className="text-slate-500 font-bold text-lg mb-8">
          Siap bertualang? Masukkan Kode Rahasiamu di sini! 👇
        </p>

        <form onSubmit={handleMasukGame} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Ketik kodemu..."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-4 border-blue-200 text-center text-3xl font-black text-blue-900 tracking-widest placeholder:text-blue-300 placeholder:font-bold placeholder:text-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all shadow-inner uppercase"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-4 border-red-400 text-red-600 font-bold text-sm px-4 py-3 rounded-2xl">
              Oops! {error} 🙈
            </div>
          )}

          {/* Tombol 3D ala Game Anak-anak */}
          <button
            type="submit"
            disabled={isLoading || !studentId.trim()}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 border-b-8 border-orange-600 hover:from-orange-300 hover:to-pink-400 text-white py-5 rounded-3xl font-black text-2xl shadow-xl transition-all active:border-b-0 active:translate-y-2 disabled:from-slate-400 disabled:to-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed"
          >
            {isLoading ? "Membuka Portal... ⏳" : "GAS MAIN! 🎮"}
          </button>
        </form>

        <div className="mt-8 pt-6">
          <button 
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-blue-500 text-sm font-black transition-colors"
          >
            🏠 Kembali ke Rumah
          </button>
        </div>
      </div>
    </div>
  );
}