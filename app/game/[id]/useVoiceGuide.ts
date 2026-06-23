"use client";

import { useRef, useCallback, useEffect } from "react";

// ===================================================================
// SKRIP PANDUAN SUARA MULTISENSORI — ARTIKULA
// Semua teks dalam Bahasa Indonesia ramah anak SD
// ===================================================================

export type VoiceEvent =
  | "INTRO_WELCOME"        // Saat splash screen muncul
  | "AI_READY"             // AI selesai loading
  | "MODE_SOLO"            // Pilih misi solo
  | "MODE_ESTAFET"         // Pilih misi estafet
  | "LEVEL_SELECTED"       // Level dipilih
  | "GAMEPLAY_START"       // Game mulai
  | "TARGET_ANNOUNCE"      // Umumkan suku kata target baru
  | "HIT_SUCCESS"          // Berhasil mengucapkan dengan benar
  | "HIT_COMBO"            // Berhasil 3x berturut-turut
  | "HINT_VOWEL_A"         // Petunjuk vokal A
  | "HINT_VOWEL_I"         // Petunjuk vokal I
  | "HINT_VOWEL_U"         // Petunjuk vokal U
  | "HINT_VOWEL_E"         // Petunjuk vokal E
  | "HINT_VOWEL_O"         // Petunjuk vokal O
  | "HINT_CONSONANT_PLOSIF"// Petunjuk konsonan B/P/M
  | "HINT_NO_VOICE"        // Suara terlalu pelan
  | "HINT_MOUTH_CLOSED"    // Mulut belum terbuka
  | "TIMER_10"             // 10 detik tersisa
  | "TIMER_5"              // 5 detik tersisa
  | "ROTATION_PAUSE"       // Waktu gantian estafet
  | "VICTORY_GREAT"        // Menang akurasi ≥ 80%
  | "VICTORY_GOOD"         // Menang akurasi 50–79%
  | "VICTORY_TRY_AGAIN"    // Akurasi < 50%
  | "CALIBRATION_START"    // Mulai kalibrasi
  | "CALIBRATION_SUCCESS"; // Kalibrasi berhasil

// Kumpulan skrip per event (beberapa varian untuk variasi)
const SCRIPTS: Record<VoiceEvent, string[]> = {
  INTRO_WELCOME: [
    `Halo! Selamat datang di Artikula!`,
    `Hai! Ayo latihan bicara bareng!`,
  ],
  AI_READY: [
    "Sensor siap! Ayo mulai!",
    "Kamera aktif! Yuk mulai!",
  ],
  MODE_SOLO: [
    "Misi Solo! Tunjukkan kemampuanmu!",
    "Solo mode! Fokus dan semangat!",
  ],
  MODE_ESTAFET: [
    "Estafet! Kerja sama tim!",
    "Ayo main bareng teman!",
  ],
  LEVEL_SELECTED: [
    "Level dipilih! Siap-siap!",
    "Ayo, kita segera mulai!",
  ],
  GAMEPLAY_START: [
    "Ucapkan suku kata yang muncul dengan keras!",
    "Mulai! Buka mulut dan bersuara!",
  ],
  TARGET_ANNOUNCE: [
    "Sekarang ucapkan ini!",
    "Coba yang ini ya!",
    "Giliranmu! Ucapkan!",
  ],
  HIT_SUCCESS: [
    "Hebat!",
    "Bagus sekali!",
    "Mantap!",
    "Keren!",
    "Yes! Benar!",
    "Luar biasa!",
  ],
  HIT_COMBO: [
    "Tiga kali berturut! Luar biasa!",
    "Combo! Kamu jago!",
    "Woah! Terus semangat!",
  ],
  HINT_VOWEL_A: [
    "Buka mulut lebar seperti bilang Aaa!",
    "Turunkan rahang, mulut terbuka besar!",
  ],
  HINT_VOWEL_I: [
    "Senyum lebar untuk huruf I!",
    "Tarik sudut bibir ke samping, I!",
  ],
  HINT_VOWEL_U: [
    "Moncongkan bibir ke depan untuk U!",
    "Bibir maju seperti paruh bebek, U!",
  ],
  HINT_VOWEL_E: [
    "Buka mulut sedikit, santai, E!",
    "Rileks, celah kecil saja untuk E!",
  ],
  HINT_VOWEL_O: [
    "Bulatkan bibir seperti huruf O!",
    "Bibir bulat seperti donat, O!",
  ],
  HINT_CONSONANT_PLOSIF: [
    "Tutup bibir dulu, lalu letupkan!",
    "Rapatkan bibir, tahan, lalu pop!",
  ],
  HINT_NO_VOICE: [
    "Lebih keras lagi! Ayo berteriak!",
    "Keraskan suaramu, jangan malu!",
  ],
  HINT_MOUTH_CLOSED: [
    "Buka mulutmu lebih lebar!",
    "Ayo buka mulut lebih besar!",
  ],
  TIMER_10: [
    "Sepuluh detik lagi! Ayo!",
    "Hampir selesai! Semangat!",
  ],
  TIMER_5: [
    "Lima detik! Ayo bisa!",
    "Lima! Empat! Tiga! Ayo!",
  ],
  ROTATION_PAUSE: [
    "Gantian! Sekarang giliranmu!",
    "Waktu bergantian! Semangat!",
  ],
  VICTORY_GREAT: [
    "Luar biasa! Nilai sempurna! Kamu bintang hari ini!",
    "Hebat sekali! Guru pasti bangga padamu!",
  ],
  VICTORY_GOOD: [
    "Bagus! Latihan lagi supaya makin jago!",
    "Ayo terus berlatih! Hampir sempurna!",
  ],
  VICTORY_TRY_AGAIN: [
    "Jangan menyerah! Coba lagi, pasti bisa!",
    "Semangat! Latihan itu butuh waktu. Ulangi ya!",
  ],
  CALIBRATION_START: [
    "Buka mulut lebar dan bilang Aaaaa sekeras mungkin!",
    "Ayo! Buka mulut selebar bisa dan bersuara keras!",
  ],
  CALIBRATION_SUCCESS: [
    "Yeay! Kalibrasi berhasil! Mari bermain!",
    "Bagus! Sensor sudah mengenalmu. Ayo mulai!",
  ],
};

// Petikan khusus per level (diumumkan saat level dipilih)
export const LEVEL_INTROS: Record<string, string> = {
  "bola-boni": "Misi Bola Boni! Kita akan belajar huruf B. Ucapkan BA, BI, dan BU dengan lantang!",
  "paman-pita": "Misi Paman Pita! Sekarang huruf P. Coba PA, PI, dan PU ya!",
  "mama-mimi": "Misi Mama dan Mimi! Kita belajar huruf M. Ada MA, MI, MU, ME, dan MO!",
  "satu-sapi": "Misi Satu Sapi! Huruf S dan semua vokal! SA, SI, SU, SE, dan SO. Siap?",
};

// ===================================================================
// HOOK UTAMA
// ===================================================================
export function useVoiceGuide() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const comboCountRef = useRef(0);
  const lastEventRef = useRef<VoiceEvent | null>(null);
  const hintCooldownRef = useRef<Record<string, number>>({});

  // Pilih teks acak dari daftar skrip
  const pickScript = (event: VoiceEvent): string => {
    const options = SCRIPTS[event];
    return options[Math.floor(Math.random() * options.length)];
  };

  // ── SPEAK via Browser TTS (fallback & utama) ──
  const speakBrowser = useCallback((text: string, priority: "high" | "normal" = "normal") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (priority === "high") {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }

    if (isSpeakingRef.current) {
      queueRef.current.push(text);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    utter.rate = 0.95;   // Sedikit lebih lambat agar anak SD mudah mengerti
    utter.pitch = 1.15;  // Nada sedikit lebih tinggi, ramah anak
    utter.volume = 1.0;

    // Coba cari suara Indonesia
    const voices = window.speechSynthesis.getVoices();
    const idVoice =
      voices.find((v) => v.lang === "id-ID") ||
      voices.find((v) => v.lang.startsWith("id")) ||
      voices.find((v) => v.lang === "en-US"); // fallback ke English
    if (idVoice) utter.voice = idVoice;

    utter.onstart = () => { isSpeakingRef.current = true; };
    utter.onend = () => {
      isSpeakingRef.current = false;
      // Proses antrian
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setTimeout(() => speakBrowser(next), 100);
      }
    };
    utter.onerror = () => { isSpeakingRef.current = false; };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  // ── SPEAK via Anthropic TTS API ──
  const speakAPI = useCallback(async (text: string, priority: "high" | "normal" = "normal") => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: `Kamu adalah asisten suara untuk anak SD yang ramah dan menyemangati. 
Ucapkan teks ini dengan gaya yang ceria dan bersemangat: "${text}"
Balas HANYA dengan teks yang sama, tidak perlu komentar tambahan.`,
            },
          ],
        }),
      });
      // Jika API berhasil, tetap gunakan TTS browser untuk memutar
      // (karena kita tidak stream audio langsung dari API text-generation)
      speakBrowser(text, priority);
    } catch {
      // Fallback ke browser TTS
      speakBrowser(text, priority);
    }
  }, [speakBrowser]);

  // ── FUNGSI UTAMA: speak event ──
  const speak = useCallback((event: VoiceEvent, extra?: string, priority: "high" | "normal" = "normal") => {
    // Cooldown untuk event hint (jangan spam)
    const HINT_EVENTS: VoiceEvent[] = [
      "HINT_VOWEL_A","HINT_VOWEL_I","HINT_VOWEL_U","HINT_VOWEL_E","HINT_VOWEL_O",
      "HINT_CONSONANT_PLOSIF","HINT_NO_VOICE","HINT_MOUTH_CLOSED",
    ];
    if (HINT_EVENTS.includes(event)) {
      const now = Date.now();
      const last = hintCooldownRef.current[event] || 0;
      if (now - last < 8000) return; // 8 detik cooldown antar hint sejenis
      hintCooldownRef.current[event] = now;
    }

    // Cooldown sukses — ucap setiap 2 hit agar tidak spam tapi tetap ada feedback
    if (event === "HIT_SUCCESS") {
      const now = Date.now();
      const last = hintCooldownRef.current["HIT_SUCCESS"] || 0;
      if (now - last < 2200) return; // 2.2 detik cooldown
      hintCooldownRef.current["HIT_SUCCESS"] = now;
      // Bersihkan antrian supaya ucapan sebelumnya tidak tertunda
      queueRef.current = [];
    }

    lastEventRef.current = event;
    const text = extra || pickScript(event);
    speakBrowser(text, priority);
  }, [speakBrowser]);

  // ── SPEAK TEKS BEBAS ──
  const speakText = useCallback((text: string, priority: "high" | "normal" = "normal") => {
    speakBrowser(text, priority);
  }, [speakBrowser]);

  // ── STOP SEMUA SUARA ──
  const stopAll = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    queueRef.current = [];
  }, []);

  // ── TRACKER COMBO ──
  const registerHit = useCallback((onCombo: () => void) => {
    comboCountRef.current += 1;
    if (comboCountRef.current >= 3) {
      comboCountRef.current = 0;
      onCombo();
    }
  }, []);

  const resetCombo = useCallback(() => {
    comboCountRef.current = 0;
  }, []);

  // Load voices saat komponen mount (browser butuh trigger)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  return { speak, speakText, stopAll, registerHit, resetCombo };
}
