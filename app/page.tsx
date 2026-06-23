import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white font-sans overflow-hidden relative selection:bg-pink-500 selection:text-white">
      
      {/* --- BACKGROUND BINTANG ANIMASI (TETAP DIPERTAHANKAN) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-10 left-10 text-3xl animate-pulse">⭐</div>
        <div className="absolute top-40 right-20 text-4xl animate-bounce">🌍</div>
        <div className="absolute bottom-32 left-1/4 text-5xl animate-pulse">🪐</div>
        <div className="absolute top-1/3 left-1/2 text-2xl animate-ping">✨</div>
        <div className="absolute bottom-20 right-1/3 text-6xl opacity-50 animate-bounce">☄️</div>
      </div>

      {/* --- HEADER / NAVBAR --- */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Logo diubah dari roket menjadi ikon artikulasi, teks tetap gradasi kuning-oranye */}
          <span className="text-4xl drop-shadow-lg">🗣️</span>
          <span className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 drop-shadow-md">
            ARTIKULA
          </span>
        </div>
        <div className="hidden md:flex gap-8 font-bold text-lg text-white/80">
          <a href="#fitur" className="hover:text-yellow-300 transition">Inovasi Kami</a>
          <a href="#kurikulum" className="hover:text-yellow-300 transition">Kurikulum</a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 font-bold px-6 py-2 rounded-full mb-4 shadow-xl">
          🌟 Solusi Intervensi Digital untuk Pendidikan Inklusi
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black leading-tight drop-shadow-2xl">
          Petualangan <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Motorik Oral</span> <br />
          di Luar Angkasa!
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed font-medium">
          Platform Terapi Berbasis <b>Computer Vision</b> dengan Pendekatan Multisensori (VAK) untuk Intervensi Gangguan Artikulasi Siswa Kelas 1 SD Inklusi.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 pt-8">
          <Link href="/petualangan">
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 border-b-8 border-orange-700 hover:from-yellow-300 hover:to-orange-400 text-white font-black text-2xl px-12 py-5 rounded-full shadow-2xl active:border-b-0 active:translate-y-2 transition-all transform hover:scale-105">
              MULAI PETUALANGAN! 🎮
            </button>
          </Link>
          <a href="#fitur">
            <button className="bg-white/10 backdrop-blur-md border-4 border-white/30 hover:bg-white/20 text-white font-bold text-xl px-12 py-5 rounded-full shadow-xl transition-all">
              Pelajari Inovasi 💡
            </button>
          </a>
        </div>
      </main>

      {/* --- FITUR UNGGULAN (DESAIN TETAP, TEKS PROPOSAL LIDM) --- */}
      <section id="fitur" className="relative z-10 bg-white/5 backdrop-blur-lg border-y border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-yellow-300 mb-4">PENDEKATAN PEDAGOGIS ARTIKULA</h2>
            <p className="text-xl text-white/80">Menggabungkan Computer-Assisted Language Learning (CALL) dan desain interaktif.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Kartu 1 */}
            <div className="bg-gradient-to-br from-indigo-800/80 to-purple-900/80 p-8 rounded-3xl border-4 border-indigo-500/50 hover:border-indigo-400 transition-all shadow-2xl hover:-translate-y-2">
              <div className="text-6xl mb-6">👁️</div>
              <h3 className="text-2xl font-black text-white mb-3">AI Computer Vision</h3>
              <p className="text-white/70 leading-relaxed">
                Mendeteksi koordinat artikulasi bibir dan rahang secara <i>real-time</i>. Sistem memberikan umpan balik korektif instan (<i>scaffolded self-correction</i>) agar peserta didik dapat memperbaiki pelafalan secara mandiri.
              </p>
            </div>
            
            {/* Kartu 2 */}
            <div className="bg-gradient-to-br from-pink-800/80 to-rose-900/80 p-8 rounded-3xl border-4 border-pink-500/50 hover:border-pink-400 transition-all shadow-2xl hover:-translate-y-2">
              <div className="text-6xl mb-6">🖐️</div>
              <h3 className="text-2xl font-black text-white mb-3">Gamified Multisensory</h3>
              <p className="text-white/70 leading-relaxed">
                Mengonversi latihan motorik oral menjadi petualangan naratif. Menggabungkan stimulasi Visual, Auditori, dan Kinestetik untuk mengurangi beban kognitif anak secara terukur.
              </p>
            </div>

            {/* Kartu 3 */}
            <div className="bg-gradient-to-br from-cyan-800/80 to-blue-900/80 p-8 rounded-3xl border-4 border-cyan-500/50 hover:border-cyan-400 transition-all shadow-2xl hover:-translate-y-2">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-black text-white mb-3">Rapor Analitik Guru</h3>
              <p className="text-white/70 leading-relaxed">
                Platform otomatis merekam log performa akurasi pelafalan ke dalam dasbor analitik. Menyajikan data evaluasi yang terukur, berkelanjutan, dan bebas dari bias subjektivitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- INTEGRASI KURIKULUM (TETAP DIPERTAHANKAN) --- */}
      <section id="kurikulum" className="relative z-10 py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 mb-8">
          100% Terintegrasi Kurikulum Nasional
        </h2>
        <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] border border-white/20 shadow-2xl text-left">
          <p className="text-xl text-white/90 leading-relaxed mb-6">
            Materi dalam ARTIKULA disesuaikan langsung dengan capaian pembelajaran <b>Fase A (Kelas 1 SD)</b> pada buku Bahasa Indonesia:
          </p>
          <ul className="grid sm:grid-cols-2 gap-4 text-lg font-medium text-white/80">
            <li className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
              <span className="text-3xl">🔵</span> <b>Bab 1:</b> Awalan &apos;B&apos; (Bola Boni)
            </li>
            <li className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
              <span className="text-3xl">⚠️</span> <b>Bab 2:</b> Awalan &apos;H&apos; (Hati-Hati!)
            </li>
            <li className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
              <span className="text-3xl">🦠</span> <b>Bab 3:</b> Awalan &apos;K&apos; (Awas Kuman!)
            </li>
            <li className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
              <span className="text-3xl">🕷️</span> <b>Bab 4:</b> Awalan &apos;L&apos; (Aku Bisa!)
            </li>
          </ul>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-8 text-center text-white/50 font-medium">
        <p className="mb-2">DIrancang oleh Articulation Team</p>
        <p className="text-yellow-400 font-bold tracking-wider">UNIVERSITAS SYIAH KUALA</p>
      </footer>

    </div>
  );
}