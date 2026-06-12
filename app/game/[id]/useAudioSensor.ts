"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioSensor(gameState: string, isPausedForRotation: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [micVolume, setMicVolume] = useState(0);

  // Fungsi untuk meminta izin mic & kamera dari browser
  const requestDevicePermission = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = streamData;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamData);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      return true; // Izin berhasil didapat
    } catch (err) {
      console.error("Izin perangkat ditolak:", err);
      alert("Oops! Kamera dan Mikrofon WAJIB diizinkan untuk petualangan ini! 🚀");
      return false; // Izin ditolak
    }
  };

  // Loop untuk membaca volume suara secara real-time
  useEffect(() => {
    if (gameState !== "GAMEPLAY" || isPausedForRotation) return;

    const checkAudio = () => {
      if (!analyserRef.current || gameState !== "GAMEPLAY" || isPausedForRotation) return;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      setMicVolume(Math.min(Math.round((average / 128) * 100), 100));
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  }, [gameState, isPausedForRotation]);

  return {
    streamRef,
    micVolume,
    requestDevicePermission
  };
}