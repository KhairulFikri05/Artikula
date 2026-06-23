import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import FormTambahSiswa from "@/components/FormTambahSiswa";
import CopyButton from "@/components/CopyButton";

// Komponen Progress Bar (Server Component)
function ProgressBar({ value, max = 100, color = "bg-emerald-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

// Badge akurasi
function AccuracyBadge({ value }: { value: number }) {
  const color = value >= 80 ? "bg-emerald-100 text-emerald-700" : value >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`${color} text-xs font-black px-2 py-1 rounded-full`}>{value}%</span>;
}

export default async function DashboardPage() {
  const session = await getServerSession();

  // Ambil data siswa beserta skor motorik mereka
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      motoricScores: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Statistik ringkasan
  const totalSiswa = students.length;
  const sudahKalibrasi = students.filter((s) => s.baselineJawPixel).length;
  const sudahBermain = students.filter((s) => s.motoricScores.length > 0).length;
  const rataAkurasi =
    students.length > 0
      ? Math.round(
          students
            .filter((s) => s.motoricScores.length > 0)
            .reduce((sum, s) => {
              const avg = s.motoricScores.reduce((a, b) => a + b.accuracyPercentage, 0) / s.motoricScores.length;
              return sum + avg;
            }, 0) / Math.max(sudahBermain, 1)
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">📊 ARTIKULA</h1>
            <p className="text-indigo-200 font-bold text-sm mt-1">Analytic Dashboard Guru · Platform Terapi Motorik Oral</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm font-bold">{session?.user?.email || "Guru"}</p>
            <p className="text-white/60 text-xs">Universitas Syiah Kuala · 2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Kartu Statistik Ringkasan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Peserta Didik", value: totalSiswa, icon: "👥", color: "from-blue-500 to-indigo-600" },
            { label: "Sudah Kalibrasi", value: sudahKalibrasi, icon: "✅", color: "from-emerald-500 to-teal-600" },
            { label: "Sudah Berlatih", value: sudahBermain, icon: "🎮", color: "from-orange-500 to-red-600" },
            { label: "Rata-rata Akurasi", value: `${rataAkurasi}%`, icon: "🎯", color: "from-purple-500 to-pink-600" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-6 shadow-lg`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-white/80 text-xs font-bold mt-1 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Form Tambah Siswa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4">➕ Tambah Peserta Didik Baru</h2>
          <FormTambahSiswa />
        </div>

        {/* Tabel Peserta Didik + Analitik */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-black text-slate-800">📋 Daftar Peserta Didik & Perkembangan</h2>
            <p className="text-slate-500 text-xs font-bold mt-1">
              Berdasarkan Asesmen Pre-Test & Post-Test ARTIKULA · Indikator Keterampilan Artikulasi & Kepercayaan Diri
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black text-xs uppercase tracking-wider">
                  <th className="px-5 py-4">Peserta Didik</th>
                  <th className="px-5 py-4">Status Sensor CV</th>
                  <th className="px-5 py-4">Sesi Latihan</th>
                  <th className="px-5 py-4">Akurasi Terbaik</th>
                  <th className="px-5 py-4">Akurasi Terakhir</th>
                  <th className="px-5 py-4">Tren Perkembangan</th>
                  <th className="px-5 py-4">Catatan Diagnostik</th>
                  <th className="px-5 py-4 text-center">Kode Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
                      Belum ada peserta didik. Tambahkan di atas! 👆
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const scores = student.motoricScores;
                    const bestAccuracy = scores.length > 0 ? Math.max(...scores.map((s) => s.accuracyPercentage)) : null;
                    const latestAccuracy = scores.length > 0 ? scores[scores.length - 1].accuracyPercentage : null;
                    const firstAccuracy = scores.length > 0 ? scores[0].accuracyPercentage : null;
                    const trend =
                      scores.length >= 2
                        ? latestAccuracy! - firstAccuracy! > 5
                          ? "naik"
                          : latestAccuracy! - firstAccuracy! < -5
                          ? "turun"
                          : "stabil"
                        : null;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                          <div className="text-slate-400 text-xs">Kelas {student.class}</div>
                        </td>
                        <td className="px-5 py-4">
                          {student.baselineJawPixel ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif ({student.baselineJawPixel}px)
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Belum Kalibrasi
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700 text-sm font-bold">{scores.length} sesi</td>
                        <td className="px-5 py-4">
                          {bestAccuracy !== null ? <AccuracyBadge value={bestAccuracy} /> : <span className="text-slate-300 text-xs">–</span>}
                        </td>
                        <td className="px-5 py-4">
                          {latestAccuracy !== null ? (
                            <div className="space-y-1">
                              <AccuracyBadge value={latestAccuracy} />
                              {scores.length > 0 && (
                                <div className="text-slate-400 text-xs">{scores[scores.length - 1].levelType.split("(")[0].trim()}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">–</span>
                          )}
                        </td>
                        <td className="px-5 py-4 min-w-[140px]">
                          {trend ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-black ${trend === "naik" ? "text-emerald-600" : trend === "turun" ? "text-red-500" : "text-slate-500"}`}>
                                  {trend === "naik" ? "📈 Meningkat" : trend === "turun" ? "📉 Menurun" : "➡️ Stabil"}
                                </span>
                              </div>
                              <ProgressBar
                                value={latestAccuracy ?? 0}
                                color={latestAccuracy! >= 80 ? "bg-emerald-500" : latestAccuracy! >= 50 ? "bg-yellow-400" : "bg-red-400"}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">Belum cukup data</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 italic max-w-[180px] truncate">
                          {student.diagnosticNotes || "–"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <CopyButton studentId={student.id} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panduan Asesmen */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4">📝 Panduan Asesmen ARTIKULA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-black text-indigo-700 text-sm uppercase tracking-wider mb-3">Interpretasi Akurasi</h3>
              <div className="space-y-2">
                {[
                  { range: "≥ 80%", label: "Mahir", color: "bg-emerald-100 text-emerald-700", desc: "Sudah menguasai, lanjut level berikutnya" },
                  { range: "50–79%", label: "Berkembang", color: "bg-yellow-100 text-yellow-700", desc: "Perlu latihan tambahan 2–3 sesi" },
                  { range: "< 50%", label: "Perlu Intervensi", color: "bg-red-100 text-red-700", desc: "Perhatikan hambatan motorik oral" },
                ].map((item) => (
                  <div key={item.range} className="flex items-center gap-3">
                    <span className={`${item.color} px-2 py-1 rounded-full text-xs font-black w-20 text-center`}>{item.range}</span>
                    <div>
                      <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                      <span className="text-slate-400 text-xs ml-2">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-black text-indigo-700 text-sm uppercase tracking-wider mb-3">Indikator Asesmen (Skor 1–4)</h3>
              <div className="space-y-1 text-xs text-slate-600">
                {[
                  "Mampu mengenali bunyi huruf & suku kata dengan tepat",
                  "Mampu membedakan bunyi yang berbeda",
                  "Mampu mengucapkan bunyi vokal A/I/U/E/O dengan jelas",
                  "Mampu mengikuti instruksi pelafalan Artikula",
                  "Menunjukkan keberanian berbicara di depan guru/teman",
                  "Peningkatan kepercayaan diri dalam berkomunikasi",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-black mt-0.5">{i + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
