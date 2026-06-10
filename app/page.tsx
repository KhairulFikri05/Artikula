import Link from "next/link"; // WAJIB tambahkan ini di baris paling atas

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] text-white">
      <h1 className="text-6xl font-bold text-blue-500 mb-4">ARTIKULA</h1>
      <p className="text-center mb-8 max-w-2xl text-slate-300">
        Platform Terapi Motorik Oral Berbasis Computer Vision dengan Pendekatan Multisensori (VAK).
      </p>
      
      <div className="flex gap-4">
        {/* Tombol ini sementara kita arahkan ke dasbor juga, atau nanti ke halaman siswa */}
        <Link 
          href="/petualangan" // PASTIKAN INI KE /petualangan, BUKAN /dashboard
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl transition transform hover:scale-105"
        >
          Mulai Petualangan
        </Link>

        {/* Tombol ini mengarah ke halaman login Guru BK */}
        <Link 
          href="/login" 
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-full font-bold transition"
        >
          Login Guru BK
        </Link>
      </div>
    </main>
  );
}