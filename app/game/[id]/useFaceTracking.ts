"use client";

import { useEffect, useRef, useState, RefObject } from "react";

let globalFaceMesh: any = null;

// ===================================================================
// TABEL POLA BUKAAN MULUT BERDASARKAN FONETIK BAHASA INDONESIA
// MAR = Mouth Aspect Ratio = verticalDist / horizontalDist
// ===================================================================
// VOKAL:
//   A → mulut terbuka lebar, rahang turun jauh       → MAR > 0.55
//   I → mulut melebar horizontal, celah vertikal kecil → MAR < 0.30
//   U → bibir maju/mengerucut, celah sedang           → MAR 0.20–0.55, lebar < threshold
//   E → mirip I tapi sedikit lebih buka               → MAR 0.20–0.45
//   O → bibir bulat, bukaan sedang-besar              → MAR 0.35–0.75, lebar < threshold
// KONSONAN PLOSIF (butuh tutup-buka):
//   B/P/M → bibir harus tertutup penuh dulu, lalu meledak terbuka
// KONSONAN NON-PLOSIF (butuh bukaan & suara):
//   H/K/L/R/S/N/G/D/T → bibir dominan terbuka, butuh volume suara
// ===================================================================

export type TargetVowel = "A" | "I" | "U" | "E" | "O" | "ANY";
export type TargetConsonant = "B" | "P" | "M" | "H" | "K" | "L" | "R" | "S" | "N" | "G" | "D" | "T" | "ANY";

// Definisi presisi tiap vokal
interface VowelSpec {
  minMAR: number;
  maxMAR: number;
  maxWidthRatio?: number; // Rasio lebar bibir vs lebar wajah (untuk U dan O yang mengerucut)
  label: string;
  hint: string;
}

const VOWEL_SPECS: Record<TargetVowel, VowelSpec> = {
  A: { minMAR: 0.55, maxMAR: 999, label: "A", hint: "Buka mulut lebar! 😮" },
  I: { minMAR: 0.05, maxMAR: 0.30, label: "I", hint: "Senyum lebar! 😁" },
  U: { minMAR: 0.20, maxMAR: 0.55, maxWidthRatio: 0.65, label: "U", hint: "Moncongkan bibir! 😙" },
  E: { minMAR: 0.20, maxMAR: 0.45, label: "E", hint: "Bibir santai, sedikit terbuka! 🙂" },
  O: { minMAR: 0.35, maxMAR: 0.75, maxWidthRatio: 0.70, label: "O", hint: "Bibir bulat seperti lingkaran! 😮" },
  ANY: { minMAR: 0, maxMAR: 999, label: "ANY", hint: "Buka mulut dan bersuara!" },
};

export function checkVowelShape(
  mar: number,
  vowel: TargetVowel,
  horizontalDist: number,
  faceWidth: number
): boolean {
  const spec = VOWEL_SPECS[vowel];
  const marOk = mar >= spec.minMAR && mar <= spec.maxMAR;
  if (!marOk) return false;
  
  // Untuk U dan O: lebar bibir harus lebih sempit (bibir mengerucut/bulat)
  if (spec.maxWidthRatio && faceWidth > 0) {
    const widthRatio = horizontalDist / faceWidth;
    return widthRatio <= spec.maxWidthRatio;
  }
  return true;
}

export function getVowelHint(vowel: TargetVowel): string {
  return VOWEL_SPECS[vowel]?.hint || "Bersuara!";
}

export function useFaceTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  gameState: string,
  isPausedForRotation: boolean,
  targetPlosiveThreshold: number,
  micVolume: number,
  targetVowel: TargetVowel,
  targetConsonant: TargetConsonant,
  onPlosiveHit: () => void
) {
  const faceMeshRef = useRef<any>(null);
  const [isAiReady, setIsAiReady] = useState(false);
  const [lipDistance, setLipDistance] = useState(0);
  const [currentMAR, setCurrentMAR] = useState(0);
  const [isVowelCorrect, setIsVowelCorrect] = useState(false);

  const timeClosedRef = useRef(0);
  const micVolumeRef = useRef(micVolume);
  const onPlosiveHitRef = useRef(onPlosiveHit);
  const targetVowelRef = useRef(targetVowel);
  const targetConsonantRef = useRef(targetConsonant);

  useEffect(() => {
    micVolumeRef.current = micVolume;
    onPlosiveHitRef.current = onPlosiveHit;
    targetVowelRef.current = targetVowel;
    targetConsonantRef.current = targetConsonant;
  }, [micVolume, onPlosiveHit, targetVowel, targetConsonant]);

  const initFaceMesh = async () => {
    if (globalFaceMesh) {
      faceMeshRef.current = globalFaceMesh;
      setIsAiReady(true);
      return;
    }
    if ((window as any).isInitializingFaceMesh) return;
    (window as any).isInitializingFaceMesh = true;

    try {
      const FaceMesh = (window as any).FaceMesh;
      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      await faceMesh.initialize();
      globalFaceMesh = faceMesh;
      faceMeshRef.current = faceMesh;
      setIsAiReady(true);
    } catch (error) {
      console.error("FaceMesh init error:", error);
    } finally {
      (window as any).isInitializingFaceMesh = false;
    }
  };

  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation || !faceMeshRef.current || !videoRef.current) return;

    let isProcessingFrame = false;

    faceMeshRef.current.onResults((results: any) => {
      isProcessingFrame = false;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement?.getContext("2d");
      if (!canvasElement || !canvasCtx) return;

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const lm = results.multiFaceLandmarks[0];
        const W = canvasElement.width;
        const H = canvasElement.height;

        // ──────────────────────────────────────────────
        // PENGUKURAN GEOMETRI BIBIR (MediaPipe FaceMesh)
        // Titik kunci:
        //   13 = bibir atas tengah (inner)
        //   14 = bibir bawah tengah (inner)
        //   78 = sudut bibir kiri (inner)
        //  308 = sudut bibir kanan (inner)
        //   61 = sudut bibir kiri (outer)
        //  291 = sudut bibir kanan (outer)
        //  234 = pipi kiri (untuk lebar wajah)
        //  454 = pipi kanan (untuk lebar wajah)
        // ──────────────────────────────────────────────
        const upperLipY  = lm[13].y * H;
        const lowerLipY  = lm[14].y * H;
        const upperLipX  = lm[13].x * W;
        const lowerLipX  = lm[14].x * W;
        const leftCornerX = lm[78].x * W;
        const rightCornerX = lm[308].x * W;
        const faceLeftX  = lm[234].x * W;
        const faceRightX = lm[454].x * W;

        const verticalDist  = Math.abs(lowerLipY - upperLipY);
        const horizontalDist = Math.abs(rightCornerX - leftCornerX);
        const faceWidth     = Math.abs(faceRightX - faceLeftX);
        const mar = horizontalDist > 0 ? verticalDist / horizontalDist : 0;

        setLipDistance(verticalDist);
        setCurrentMAR(parseFloat(mar.toFixed(3)));

        // ──────────────────────────────────────────────
        // EVALUASI BENTUK VOKAL
        // ──────────────────────────────────────────────
        const vowelOk = checkVowelShape(mar, targetVowelRef.current, horizontalDist, faceWidth);
        setIsVowelCorrect(vowelOk);

        // ──────────────────────────────────────────────
        // LOGIKA DETEKSI SUKU KATA
        // ──────────────────────────────────────────────
        const now       = Date.now();
        const lastHit   = (window as any).lastHitTime || 0;
        const COOLDOWN  = 1200; // ms antar deteksi
        const RELEASE_MULTIPLIER = 1.25;

        if (verticalDist <= targetPlosiveThreshold) {
          timeClosedRef.current = now;
        }
        const timeSinceClosed = now - timeClosedRef.current;

        let shouldTrigger = false;
        const consonant = targetConsonantRef.current;
        const PLOSIF = ["B", "P", "M"];
        const FRIKATIF = ["S", "H"];
        const SONORAN = ["L", "R", "N"];
        const VELAR = ["K", "G"];
        const DENTAL = ["D", "T"];

        if (PLOSIF.includes(consonant)) {
          // Konsonan plosif: bibir HARUS tutup dulu (<= threshold), lalu meledak terbuka
          if (
            verticalDist > targetPlosiveThreshold * RELEASE_MULTIPLIER &&
            timeSinceClosed < 600 &&
            micVolumeRef.current > 8
          ) {
            shouldTrigger = true;
          }
        } else if (FRIKATIF.includes(consonant)) {
          // Frikatif (S, H): mulut sedikit terbuka, butuh suara hembusan
          if (verticalDist > targetPlosiveThreshold * 1.2 && micVolumeRef.current > 12) {
            shouldTrigger = true;
          }
        } else if (SONORAN.includes(consonant) || VELAR.includes(consonant) || DENTAL.includes(consonant)) {
          // L/R/N/K/G/D/T: mulut cukup terbuka, butuh volume suara jelas
          if (verticalDist > targetPlosiveThreshold * 1.4 && micVolumeRef.current > 15) {
            shouldTrigger = true;
          }
        } else {
          // Konsonan ANY atau tidak dikenali: cukup buka mulut + bersuara
          if (verticalDist > targetPlosiveThreshold * 1.3 && micVolumeRef.current > 10) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger && vowelOk && now - lastHit > COOLDOWN) {
          (window as any).lastHitTime = now;
          onPlosiveHitRef.current();
          timeClosedRef.current = 0;
        }

        // ──────────────────────────────────────────────
        // VISUALISASI TITIK LANDMARK BIBIR
        // ──────────────────────────────────────────────
        const isMingkem = verticalDist <= targetPlosiveThreshold;
        const dotColor = isMingkem
          ? "#FBBF24"   // kuning  = bibir tertutup (siap plosif)
          : vowelOk
            ? "#22C55E" // hijau   = bentuk vokal benar!
            : "#00FFFF"; // cyan   = bibir terbuka tapi belum pas

        canvasCtx.fillStyle = dotColor;
        canvasCtx.shadowBlur = 6;
        canvasCtx.shadowColor = dotColor;

        // Titik landmark bibir (inner + outer)
        [13, 14, 61, 291, 78, 308, 81, 82, 87, 88, 178, 87, 311, 312, 317, 318, 402, 310, 415].forEach((idx) => {
          if (!lm[idx]) return;
          canvasCtx.beginPath();
          canvasCtx.arc(lm[idx].x * W, lm[idx].y * H, 2.5, 0, 2 * Math.PI);
          canvasCtx.fill();
        });

        // Titik pusat bibir (lebih besar)
        canvasCtx.beginPath(); canvasCtx.arc(upperLipX, upperLipY, 5, 0, 2 * Math.PI); canvasCtx.fill();
        canvasCtx.beginPath(); canvasCtx.arc(lowerLipX, lowerLipY, 5, 0, 2 * Math.PI); canvasCtx.fill();

        // Garis vertikal bibir
        canvasCtx.strokeStyle = dotColor;
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        canvasCtx.moveTo(upperLipX, upperLipY);
        canvasCtx.lineTo(lowerLipX, lowerLipY);
        canvasCtx.stroke();

        canvasCtx.shadowBlur = 0;
      }
    });

    const video = videoRef.current;
    const sendFrames = async () => {
      if (
        video &&
        !video.paused &&
        gameState === "GAMEPLAY" &&
        !isPausedForRotation &&
        !isProcessingFrame
      ) {
        isProcessingFrame = true;
        try {
          await faceMeshRef.current.send({ image: video });
        } catch (err) {
          isProcessingFrame = false;
        }
      }
      requestAnimationFrame(sendFrames);
    };

    video.onloadeddata = () => sendFrames();
    if (video.readyState >= 2) sendFrames();
  }, [gameState, isPausedForRotation, targetPlosiveThreshold]);

  return { isAiReady, lipDistance, currentMAR, isVowelCorrect, initFaceMesh };
}
