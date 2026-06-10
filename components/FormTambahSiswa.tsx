"use client";

import { useActionState } from "react";
import { tambahSiswa } from "../app/action";

export default function FormTambahSiswa() {
  const [state, action, pending] = useActionState(tambahSiswa, null);

  return (
    <form action={action} className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-bold mb-4">Tambah Siswa Baru</h3>
      <div className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Nama Lengkap" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
        
        {/* Dropdown Kelas */}
        <select name="class" className="p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
          <option value="">Pilih Kelas</option>
          <option value="1A">Kelas 1A</option>
          <option value="1B">Kelas 1B</option>
          <option value="2A">Kelas 2A</option>
          <option value="2B">Kelas 2B</option>
          <option value="3">Kelas 3</option>
          <option value="4">Kelas 4</option>
          <option value="5">Kelas 5</option>
          <option value="6">Kelas 6</option>
        </select>
      </div>

      {/* Catatan Diagnostik yang disesuaikan */}
      <textarea 
        name="diagnosticNotes" 
        placeholder="Catatan Diagnostik Awal (Contoh: Kesulitan melafalkan huruf R dan S)" 
        className="w-full p-4 mt-4 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 italic text-slate-600"
      ></textarea>
      <button 
        type="submit" 
        disabled={pending}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
      >
        {pending ? "Menyimpan..." : "Simpan Siswa"}
      </button>
    </form>
  );
}