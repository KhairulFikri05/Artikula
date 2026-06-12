"use client";

import { useEffect, useRef, useState, RefObject } from "react";

let globalFaceMesh: any = null;

export function useFaceTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  gameState: string,
  isPausedForRotation: boolean,
  targetPlosiveThreshold: number,
  micVolume: number,
  onPlosiveHit: () => void 
) {
  const faceMeshRef = useRef<any>(null);
  const [isAiReady, setIsAiReady] = useState(false);
  const [lipDistance, setLipDistance] = useState(0);

  // --- SOLUSI ANTI RESET (Bypass React Closure) ---
  const lipWasClosedRef = useRef(false);
  const micVolumeRef = useRef(micVolume);
  const onPlosiveHitRef = useRef(onPlosiveHit);

  // Update nilai volume dan fungsi secara diam-diam tanpa mereset AI
  useEffect(() => {
    micVolumeRef.current = micVolume;
    onPlosiveHitRef.current = onPlosiveHit;
  }, [micVolume, onPlosiveHit]);

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
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      await faceMesh.initialize();
      globalFaceMesh = faceMesh;
      faceMeshRef.current = faceMesh;
      setIsAiReady(true);
    } catch (error) {
      console.error(error);
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
        const landmarks = results.multiFaceLandmarks[0];
        const lipPoints = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 78, 308, 13, 14];
        
        canvasCtx.fillStyle = "#00FFFF";
        lipPoints.forEach(pointIndex => {
          const x = landmarks[pointIndex].x * canvasElement.width;
          const y = landmarks[pointIndex].y * canvasElement.height;
          canvasCtx.beginPath(); canvasCtx.arc(x, y, 2, 0, 2 * Math.PI); canvasCtx.fill();
        });

        const y1 = landmarks[13].y * canvasElement.height;
        const y2 = landmarks[14].y * canvasElement.height;
        const distance = Math.abs(y2 - y1);
        setLipDistance(Math.round(distance));

        // --- MEKANIK DETEKSI YANG SUDAH DIPERBAIKI ---
        if (distance <= targetPlosiveThreshold) {
          lipWasClosedRef.current = true; // Simpan ke ingatan kebal
          canvasCtx.fillStyle = "#FBBF24"; 
        } else if (lipWasClosedRef.current && distance > targetPlosiveThreshold * 1.8) {
          // Gunakan volume terbaru dari ref
          if (micVolumeRef.current > 20) { 
            onPlosiveHitRef.current(); // BOOM! Tembak!
          }
          lipWasClosedRef.current = false; // Reset setelah mangap
        }

        canvasCtx.beginPath(); canvasCtx.arc(landmarks[13].x * canvasElement.width, y1, 5, 0, 2*Math.PI); canvasCtx.fill();
        canvasCtx.beginPath(); canvasCtx.arc(landmarks[14].x * canvasElement.width, y2, 5, 0, 2*Math.PI); canvasCtx.fill();
      }
    });

    const video = videoRef.current;
    const sendFrames = async () => {
      if (!video.paused && gameState === "GAMEPLAY" && !isPausedForRotation && !isProcessingFrame) {
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

  // PERHATIKAN: micVolume dan onPlosiveHit kita keluarkan dari array ini!
  }, [gameState, isPausedForRotation, targetPlosiveThreshold]);

  return { isAiReady, lipDistance, initFaceMesh };
}