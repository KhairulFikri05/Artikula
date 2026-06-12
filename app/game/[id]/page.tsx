import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import GameClient from "./GameClient";

// Inisialisasi Prisma
const prisma = new PrismaClient();

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  // Ekstrak ID dari URL parameter
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 1. Fetch data Student dari MySQL
  const student = await prisma.student.findUnique({
    where: { id: id },
  });

  // 2. Jika ID tidak ada di database, tampilkan halaman 404 Not Found
  if (!student) {
    return notFound();
  }

  // 3. Gerbang Keamanan: Jika anak belum kalibrasi, paksa kembali ke halaman kalibrasi
  if (!student.baselineJawPixel || !student.baselineVoiceDb) {
    redirect(`/kalibrasi/${id}`);
  }

  // 4. Render GameClient dan kirim data dari Database ke Client-Side
  return (
    <GameClient 
      student={student} 
    />
  );
}