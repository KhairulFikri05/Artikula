"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function tambahSiswa(prevState: any, formData: FormData) {
  console.log("Action dipanggil!"); // Lihat apakah ini muncul di terminal
  
  const session = await getServerSession();
  if (!session?.user?.email) return { error: "Harus Login" };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  const name = formData.get("name");
  const studentClass = formData.get("class");
  
  console.log("Data diterima:", { name, studentClass }); // Cek apakah datanya terambil

  try {
    await prisma.student.create({
      data: {
        userId: user!.id,
        name: name as string,
        class: studentClass as string,
        diagnosticNotes: formData.get("notes") as string,
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error Prisma:", err); // Jika gagal, error-nya akan muncul di terminal
    return { error: "Gagal simpan" };
  }
}

export async function simpanKalibrasi(studentId: string, jawPixel: number) {
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { baselineJawPixel: jawPixel } // Sesuai dengan kolom di skemamu
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal simpan kalibrasi:", error);
    return { error: "Gagal menyimpan data ke database" };
  }
}

export async function verifikasiSiswa(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, 
      name: true, 
      baselineJawPixel: true
      }
    });

    if (!student) {
      return { error: "Kode Petualang tidak ditemukan. Coba cek lagi ya!" };
    }

    return { success: true, student };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem." };
  }
}

export async function simpanSkorGame(studentId: string, accuracy: number, duration: number, level: string) {
  try {
    await prisma.motoricScore.create({
      data: {
        studentId: studentId,
        levelType: level,
        accuracyPercentage: accuracy,
        durationSeconds: duration
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan skor game:", error);
    return { error: "Gagal mencatat skor ke database" };
  }
}