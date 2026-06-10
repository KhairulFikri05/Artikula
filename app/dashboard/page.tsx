import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import FormTambahSiswa from "@/components/FormTambahSiswa";
import CopyButton from "@/components/CopyButton";


export default async function DashboardPage() {
  const session = await getServerSession();
  
  // Ambil data siswa yang terdaftar di database
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard Guru BK</h1>
        
        {/* Form untuk menambah siswa baru */}
        <FormTambahSiswa />

        {/* Tabel Daftar Siswa */}
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 mt-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-sm">
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Sensor Rahang (CV)</th>
                <th className="px-6 py-4">Catatan Diagnostik</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold">
                      Kelas {student.class}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    {student.baselineJawPixel ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Terkalibrasi ({student.baselineJawPixel}px)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        Belum Kalibrasi
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                    {student.diagnosticNotes || "-"}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {/* 2. PANGGIL COMPONENT CLENT-SIDE COPIER DI SINI */}
                    <CopyButton studentId={student.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}