"use client";

export default function CopyButton({ studentId }: { studentId: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(studentId);
    alert("Kode Petualang berhasil disalin! Berikan kode ini ke siswa.");
  };

  return (
    <button 
      onClick={handleCopy}
      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition mx-1"
    >
      Copy Kode 🔑
    </button>
  );
}