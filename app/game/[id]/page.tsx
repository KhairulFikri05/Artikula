import prisma from "@/lib/prisma"; // Sesuaikan path prisma-mu
import { notFound } from "next/navigation";
import GameClient from "@/app/game/[id]/GameClient";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Ambil data siswa dan pastikan nilai baseline rahangnya ada
  const student = await prisma.student.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!student) return notFound();

  // Lempar data siswa ke komponen Client Game
  return <GameClient student={student} />;
}