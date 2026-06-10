"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border-4 border-blue-500/50 shadow-2xl text-center">
        
        {/* Karakter/Maskot Pengganti Visual */}
        <div className="text-6xl mb-4 animate-bounce">🚀</div>
        
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
          Halo Petualang Cilik!
        </h1>
        <p className="text-slate-300 text-sm mb-8">
          Masukkan Kode Petualangmu di bawah ini untuk memulai latihan seru bersama ARTIKULA!
        </p>

        <form onSubmit={handleMasukGame} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Masukkan Kode Petualang (ID)..."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white text-center text-lg font-bold tracking-wider placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-cyan-400 transition"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !studentId.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-blue-500/20 transition transform hover:scale-[102%] active:scale-[98%] disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed"
          >
            {isLoading ? "Membuka Gerbang..." : "Mulai Petualangan! 🎮"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <button 
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white text-xs font-semibold transition"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}