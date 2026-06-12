"use server";

import { PrismaClient } from "@prisma/client";

// Inisialisasi Prisma Client (Jika Anda sudah memiliki file lib/prisma.ts, 
// Anda bisa meng-importnya dari sana untuk mencegah multiple instance di mode development)
const prisma = new PrismaClient();

export async function simpanKalibrasi(studentId: string, jawDistance: number, voiceDb: number) {
  try {
    // Update data Student di MySQL berdasarkan ID-nya
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { baselineJawPixel: jawDistance, baselineVoiceDb: voiceDb },
    });

    // Return success agar bisa dibaca oleh percabangan if() di Client Component
    return { success: true, data: updatedStudent };
  } catch (error) {
    console.error("Gagal menyimpan kalibrasi rahang:", error);
    return { success: false, message: "Gagal menyimpan data ke database" };
  }
}