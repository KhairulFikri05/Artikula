"use client";

import { useEffect, useRef, useState } from "react";

// ===================================================================
// MOUTH ANATOMY VISUALIZER — ARTIKULA
// Menampilkan posisi lidah, bibir, dan rahang secara animatif
// untuk setiap huruf vokal & konsonan (SVG transparan 3D-style)
// ===================================================================

export type VowelTarget = "A" | "I" | "U" | "E" | "O" | "ANY";
export type ConsonantTarget = "B" | "P" | "M" | "S" | "ANY";

// ─── Data anatomi per fonem ───────────────────────────────────────
// Setiap fonem punya:
//   jawOpen   : seberapa turun rahang bawah (0–60)
//   lipSpread : seberapa melebar bibir (0–1, dimana 1=penuh senyum)
//   lipRound  : seberapa mengerucut bibir (0–1)
//   tongueTip : posisi X ujung lidah (0=kiri, 1=kanan, .5=tengah)
//   tongueDorsum: ketinggian punggung lidah (0=rendah, 1=tinggi)
//   tongueBody  : posisi depan-belakang (0=maju, 1=mundur)
//   tongueColor : warna overlay lidah
//   lipsClosed  : bibir tertutup rapat (untuk B/P/M)
//   label       : nama fonem
//   steps       : langkah panduan teks
// ─────────────────────────────────────────────────────────────────
interface PhonemeConfig {
  jawOpen: number;
  lipSpread: number;
  lipRound: number;
  tongueTip: number;
  tongueDorsum: number;
  tongueBody: number;
  tongueColor: string;
  lipsClosed: boolean;
  label: string;
  bgGradient: string;
  steps: string[];
  articulatorNote: string;
}

const PHONEME_DATA: Record<string, PhonemeConfig> = {
  A: {
    jawOpen: 56,
    lipSpread: 0.4,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.15,
    tongueBody: 0.6,
    tongueColor: "#FF7F50",
    lipsClosed: false,
    label: "A",
    bgGradient: "from-orange-400 to-red-500",
    articulatorNote: "Rahang turun jauh, lidah datar di tengah rongga mulut",
    steps: [
      "😮 Buka mulut LEBAR-LEBAR",
      "👅 Lidah datar, istirahat di bawah",
      "📢 Ucapkan 'Aaaa...' dengan keras!",
    ],
  },
  I: {
    jawOpen: 14,
    lipSpread: 0.92,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.85,
    tongueBody: 0.15,
    tongueColor: "#4ADE80",
    lipsClosed: false,
    label: "I",
    bgGradient: "from-green-400 to-emerald-600",
    articulatorNote: "Bibir melebar senyum, lidah naik ke langit-langit depan",
    steps: [
      "😁 Senyum lebar, tarik sudut bibir",
      "👅 Dorong lidah ke depan & naikan",
      "📢 Ucapkan 'Iiii...' tipis & terang!",
    ],
  },
  U: {
    jawOpen: 22,
    lipSpread: 0.0,
    lipRound: 0.95,
    tongueTip: 0.5,
    tongueDorsum: 0.80,
    tongueBody: 0.85,
    tongueColor: "#818CF8",
    lipsClosed: false,
    label: "U",
    bgGradient: "from-indigo-400 to-purple-600",
    articulatorNote: "Bibir maju mengerucut, lidah naik ke langit-langit belakang",
    steps: [
      "😙 Maju & kerucut bibirmu ke depan",
      "👅 Lidah mundur & naik ke belakang",
      "📢 Ucapkan 'Uuuu...' bulat & penuh!",
    ],
  },
  E: {
    jawOpen: 24,
    lipSpread: 0.5,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.6,
    tongueBody: 0.3,
    tongueColor: "#FBBF24",
    lipsClosed: false,
    label: "E",
    bgGradient: "from-yellow-400 to-amber-600",
    articulatorNote: "Mulut sedikit terbuka, lidah di posisi tengah-depan",
    steps: [
      "🙂 Buka mulut sedikit, santai",
      "👅 Lidah di tengah, sedikit naik",
      "📢 Ucapkan 'Eeee...' santai!",
    ],
  },
  O: {
    jawOpen: 38,
    lipSpread: 0.0,
    lipRound: 0.85,
    tongueTip: 0.5,
    tongueDorsum: 0.55,
    tongueBody: 0.75,
    tongueColor: "#F472B6",
    lipsClosed: false,
    label: "O",
    bgGradient: "from-pink-400 to-rose-600",
    articulatorNote: "Bibir bulat membentuk lingkaran, lidah mundur di tengah",
    steps: [
      "😮 Bulatkan bibir seperti huruf O",
      "👅 Lidah mundur, posisi tengah",
      "📢 Ucapkan 'Oooo...' bulat!",
    ],
  },
  B: {
    jawOpen: 0,
    lipSpread: 0.0,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.3,
    tongueBody: 0.5,
    tongueColor: "#60A5FA",
    lipsClosed: true,
    label: "B",
    bgGradient: "from-blue-400 to-sky-600",
    articulatorNote: "Kedua bibir rapat tertutup, lalu meledak terbuka",
    steps: [
      "🤐 Rapatkan kedua bibir ERAT",
      "💨 Tahan napas di belakang bibir",
      "💥 LETUPKAN bibir → 'Bah!'",
    ],
  },
  P: {
    jawOpen: 0,
    lipSpread: 0.0,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.3,
    tongueBody: 0.5,
    tongueColor: "#A78BFA",
    lipsClosed: true,
    label: "P",
    bgGradient: "from-purple-400 to-violet-600",
    articulatorNote: "Seperti B tapi tanpa getaran suara, hembus udara keras",
    steps: [
      "🤐 Tutup bibir RAPAT",
      "💨 Tekan udara di mulut",
      "💨 POP! Buka bibir kencang → 'Pah!'",
    ],
  },
  M: {
    jawOpen: 0,
    lipSpread: 0.0,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.2,
    tongueBody: 0.5,
    tongueColor: "#34D399",
    lipsClosed: true,
    label: "M",
    bgGradient: "from-emerald-400 to-teal-600",
    articulatorNote: "Bibir tertutup rapat, suara bergetar lewat hidung",
    steps: [
      "🤐 Tutup bibir RAPAT",
      "🔈 Bersuara 'Mmmm...' lewat hidung",
      "😮 Buka bibir → selesaikan vokalnya!",
    ],
  },
  S: {
    jawOpen: 16,
    lipSpread: 0.6,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.7,
    tongueBody: 0.2,
    tongueColor: "#2DD4BF",
    lipsClosed: false,
    label: "S",
    bgGradient: "from-teal-400 to-cyan-600",
    articulatorNote: "Gigi hampir merapat, udara mendesis lewat ujung lidah",
    steps: [
      "😬 Gigi hampir merapat, bibir sedikit buka",
      "👅 Ujung lidah ke gigi depan atas",
      "💨 Hembuskan udara → 'Ssss...'",
    ],
  },
  ANY: {
    jawOpen: 30,
    lipSpread: 0.3,
    lipRound: 0.0,
    tongueTip: 0.5,
    tongueDorsum: 0.4,
    tongueBody: 0.5,
    tongueColor: "#94A3B8",
    lipsClosed: false,
    label: "?",
    bgGradient: "from-slate-400 to-slate-600",
    articulatorNote: "Buka mulut dan bersuara!",
    steps: ["😮 Buka mulut", "📢 Bersuara!", "🎯 Ucapkan dengan jelas!"],
  },
};

// ─── Props ────────────────────────────────────────────────────────
interface Props {
  vowel: VowelTarget;
  consonant: ConsonantTarget;
  isCorrect: boolean;
  lipDistance: number;
  baselineJaw: number;
  micVolume: number;
  compact?: boolean; // Mode ringkas untuk sidebar
}

// ─── Komponen SVG Anatomi ─────────────────────────────────────────
export function MouthAnatomyVisualizer({
  vowel, consonant, isCorrect, lipDistance, baselineJaw, micVolume, compact = false,
}: Props) {
  const [animPhase, setAnimPhase] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const animRef = useRef<number>(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ambil config fonem yang relevan — prioritaskan konsonan plosif
  const plosifKeys = ["B","P","M"];
  const key = plosifKeys.includes(consonant) ? consonant : vowel;
  const cfg = PHONEME_DATA[key] || PHONEME_DATA["ANY"];

  // ── Animasi bernapas / pulsa ──
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t += 0.04;
      setAnimPhase(t);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── Rotasi langkah panduan tiap 2.5 detik ──
  useEffect(() => {
    setActiveStep(0);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setActiveStep((p) => (p + 1) % cfg.steps.length);
    }, 2500);
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, [cfg]);

  // ── Kalkulasi geometri SVG ──
  const W = compact ? 220 : 320;
  const H = compact ? 180 : 260;
  const CX = W / 2;
  const CY = H / 2 - (compact ? 5 : 10);

  // Faktor pulsasi kecil untuk efek hidup
  const breathe = Math.sin(animPhase) * (compact ? 1.5 : 2);

  // Rahang bawah (bergerak ke bawah sesuai jawOpen)
  const jawY = CY + (compact ? 18 : 26) + cfg.jawOpen * (compact ? 0.45 : 0.6) + breathe * 0.3;
  // Bibir atas tetap
  const upperLipY = CY + (compact ? 16 : 24);
  // Lebar mulut: melebar saat lipSpread tinggi, menyempit saat lipRound
  const mouthW = (compact ? 52 : 76) + cfg.lipSpread * (compact ? 28 : 40) - cfg.lipRound * (compact ? 18 : 26);

  // Bibir tertutup → tumpuk
  const effectiveJawY = cfg.lipsClosed ? upperLipY + 1 : jawY;

  // Lidah
  const tongueW = (compact ? 32 : 48) - cfg.lipRound * (compact ? 10 : 14);
  const tongueH = (compact ? 14 : 20) + cfg.tongueDorsum * (compact ? 12 : 18);
  const tongueCY = compact
    ? effectiveJawY - 8 - cfg.tongueDorsum * 16
    : effectiveJawY - 12 - cfg.tongueDorsum * 22;
  const tongueCX = CX + (cfg.tongueBody - 0.5) * (compact ? 20 : 30);

  // Warna status
  const statusColor = isCorrect ? "#22C55E" : "#F59E0B";
  const glowIntensity = isCorrect ? 10 : 4;

  const fontSize = compact ? 9 : 11;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Badge fonem aktif */}
      <div className={`bg-gradient-to-r ${cfg.bgGradient} px-4 py-1 rounded-full flex items-center gap-2 shadow-lg`}>
        <span className="text-white font-black text-lg">{cfg.label}</span>
        <span className={`w-2 h-2 rounded-full ${isCorrect ? "bg-green-300 animate-pulse" : "bg-white/50"}`} />
      </div>

      {/* SVG Anatomi Mulut */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="drop-shadow-2xl"
        style={{ filter: `drop-shadow(0 0 ${glowIntensity}px ${statusColor})` }}
      >
        <defs>
          {/* Gradien kepala transparan */}
          <radialGradient id="headGrad" cx="50%" cy="45%" r="52%">
            <stop offset="0%" stopColor="#FDE8D8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FBBF9A" stopOpacity="0.6" />
          </radialGradient>
          {/* Gradien rongga mulut */}
          <radialGradient id="mouthGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3B0F0A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1A0905" stopOpacity="1" />
          </radialGradient>
          {/* Gradien lidah */}
          <radialGradient id="tongueGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor={cfg.tongueColor} stopOpacity="1" />
            <stop offset="100%" stopColor={cfg.tongueColor} stopOpacity="0.75" />
          </radialGradient>
          {/* Glow status */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          {/* Clip untuk rongga mulut */}
          <clipPath id="mouthClip">
            <ellipse cx={CX} cy={(upperLipY + effectiveJawY) / 2} rx={mouthW / 2 + 2} ry={(effectiveJawY - upperLipY) / 2 + 4} />
          </clipPath>
        </defs>

        {/* ── Wajah (transparan) ── */}
        <ellipse cx={CX} cy={CY} rx={compact ? 90 : 130} ry={compact ? 75 : 108}
          fill="url(#headGrad)" stroke="#E5B896" strokeWidth={compact ? 1.5 : 2} />

        {/* Hidung kecil */}
        <ellipse cx={CX} cy={upperLipY - (compact ? 18 : 26)} rx={compact ? 9 : 13} ry={compact ? 6 : 8}
          fill="#FBBF9A" stroke="#E5A07A" strokeWidth="1" opacity="0.7" />
        <circle cx={CX - (compact ? 4 : 6)} cy={upperLipY - (compact ? 17 : 24)} r={compact ? 2.5 : 3.5}
          fill="#C97040" opacity="0.4" />
        <circle cx={CX + (compact ? 4 : 6)} cy={upperLipY - (compact ? 17 : 24)} r={compact ? 2.5 : 3.5}
          fill="#C97040" opacity="0.4" />

        {/* ── Rongga Mulut (gelap) ── */}
        <ellipse
          cx={CX} cy={(upperLipY + effectiveJawY) / 2}
          rx={mouthW / 2} ry={Math.max((effectiveJawY - upperLipY) / 2, 0.5)}
          fill="url(#mouthGrad)"
        />

        {/* ── Gigi Atas ── */}
        {!cfg.lipsClosed && (
          <g>
            {[-3,-1,1,3].map((i) => (
              <rect key={i}
                x={CX + i * (compact ? 7 : 10) - (compact ? 3 : 4)}
                y={upperLipY + 1}
                width={compact ? 6 : 9}
                height={compact ? 8 : 12}
                rx={compact ? 1.5 : 2}
                fill="#F8F8F8" stroke="#E0E0E0" strokeWidth="0.5" opacity="0.95"
              />
            ))}
          </g>
        )}

        {/* ── Gigi Bawah ── */}
        {!cfg.lipsClosed && cfg.jawOpen > 12 && (
          <g>
            {[-2,0,2].map((i) => (
              <rect key={i}
                x={CX + i * (compact ? 8 : 11) - (compact ? 3.5 : 5)}
                y={effectiveJawY - (compact ? 9 : 13)}
                width={compact ? 7 : 10}
                height={compact ? 8 : 11}
                rx={compact ? 1.5 : 2}
                fill="#F8F8F8" stroke="#E0E0E0" strokeWidth="0.5" opacity="0.9"
              />
            ))}
          </g>
        )}

        {/* ── Lidah ── */}
        {!cfg.lipsClosed && (
          <g>
            {/* Body lidah */}
            <ellipse
              cx={tongueCX} cy={tongueCY}
              rx={tongueW / 2} ry={tongueH / 2}
              fill="url(#tongueGrad)"
              filter="url(#glow)"
              opacity="0.95"
            />
            {/* Garis tengah lidah */}
            <line
              x1={tongueCX} y1={tongueCY - tongueH * 0.35}
              x2={tongueCX} y2={tongueCY + tongueH * 0.25}
              stroke={cfg.tongueColor} strokeWidth="1.5" strokeDasharray="2,2" opacity="0.5"
            />
            {/* Ujung lidah */}
            <ellipse
              cx={tongueCX + (cfg.tongueBody - 0.5) * (compact ? 4 : 6)}
              cy={tongueCY + tongueH * 0.38}
              rx={compact ? 6 : 9} ry={compact ? 3.5 : 5}
              fill={cfg.tongueColor} opacity="0.8"
            />
            {/* Label "Lidah" */}
            <text
              x={tongueCX} y={tongueCY}
              textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={compact ? 7 : 9} fontWeight="bold" opacity="0.9"
            >
              {compact ? "L" : "Lidah"}
            </text>
          </g>
        )}

        {/* ── Bibir Atas ── */}
        <g>
          {/* Bibir atas luar */}
          <path
            d={`M ${CX - mouthW / 2 - 4} ${upperLipY}
                Q ${CX - mouthW / 4} ${upperLipY - (compact ? 9 : 13)} ${CX} ${upperLipY - (compact ? 5 : 7)}
                Q ${CX + mouthW / 4} ${upperLipY - (compact ? 9 : 13)} ${CX + mouthW / 2 + 4} ${upperLipY}
                Q ${CX} ${upperLipY + (compact ? 3 : 5)} ${CX - mouthW / 2 - 4} ${upperLipY} Z`}
            fill={cfg.lipsClosed ? "#E05070" : "#E06080"}
            stroke="#C04060" strokeWidth="1"
          />
          {/* Cupid's bow */}
          <path
            d={`M ${CX - mouthW / 4} ${upperLipY - (compact ? 6 : 9)}
                Q ${CX} ${upperLipY - (compact ? 10 : 15)} ${CX + mouthW / 4} ${upperLipY - (compact ? 6 : 9)}`}
            fill="none" stroke="#C04060" strokeWidth={compact ? 1 : 1.5} opacity="0.6"
          />
        </g>

        {/* ── Bibir Bawah ── */}
        <path
          d={`M ${CX - mouthW / 2 - 4} ${effectiveJawY}
              Q ${CX} ${effectiveJawY + (compact ? 8 : 12)} ${CX + mouthW / 2 + 4} ${effectiveJawY}
              Q ${CX} ${effectiveJawY - (compact ? 3 : 4)} ${CX - mouthW / 2 - 4} ${effectiveJawY} Z`}
          fill={cfg.lipsClosed ? "#E05070" : "#E06080"}
          stroke="#C04060" strokeWidth="1"
        />

        {/* ── Indikator posisi lidah (panah) ── */}
        {!cfg.lipsClosed && !compact && (
          <>
            {/* Panah posisi lidah */}
            <line
              x1={tongueCX + (compact ? 20 : 32)} y1={tongueCY}
              x2={tongueCX + (compact ? 30 : 46)} y2={tongueCY}
              stroke={cfg.tongueColor} strokeWidth="1.5"
              strokeDasharray="3,2" opacity="0.8"
            />
            <text
              x={tongueCX + (compact ? 32 : 50)} y={tongueCY}
              fill={cfg.tongueColor} fontSize={compact ? 7.5 : 9.5}
              fontWeight="bold" dominantBaseline="middle" opacity="0.9"
            >
              {cfg.tongueBody < 0.35 ? "depan" : cfg.tongueBody > 0.65 ? "belakang" : "tengah"}
            </text>
          </>
        )}

        {/* ── Label posisi: "Bukaan: X px" & MAR ── */}
        {!compact && (
          <>
            <rect x={4} y={H - 22} width={110} height={18} rx={5} fill="black" opacity="0.35" />
            <text x={10} y={H - 10} fill="white" fontSize={9} fontWeight="bold" opacity="0.85">
              Posisi: {key} | Lidah: {cfg.tongueDorsum > 0.6 ? "↑ Tinggi" : cfg.tongueDorsum < 0.3 ? "↓ Rendah" : "→ Tengah"}
            </text>
          </>
        )}

        {/* ── Status indikator pojok kanan atas ── */}
        <circle
          cx={W - (compact ? 12 : 16)} cy={compact ? 12 : 16}
          r={compact ? 5 : 7}
          fill={isCorrect ? "#22C55E" : "#F59E0B"}
          filter="url(#glow)"
        />
        <text
          x={W - (compact ? 12 : 16)} y={compact ? 12 : 16}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={compact ? 6 : 8} fill="white" fontWeight="bold"
        >
          {isCorrect ? "✓" : "?"}
        </text>

        {/* ── Label bibir ── */}
        {!compact && (
          <>
            <text x={CX - mouthW / 2 - 28} y={upperLipY} fill="#FBBF24" fontSize={8} fontWeight="bold" dominantBaseline="middle" opacity="0.8">bibir atas</text>
            <line x1={CX - mouthW / 2 - 10} y1={upperLipY} x2={CX - mouthW / 2 + 2} y2={upperLipY}
              stroke="#FBBF24" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
            <text x={CX - mouthW / 2 - 28} y={effectiveJawY} fill="#FBBF24" fontSize={8} fontWeight="bold" dominantBaseline="middle" opacity="0.8">bibir bawah</text>
            <line x1={CX - mouthW / 2 - 10} y1={effectiveJawY} x2={CX - mouthW / 2 + 2} y2={effectiveJawY}
              stroke="#FBBF24" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
          </>
        )}

        {/* ── Langit-langit (palate) sebagai referensi ── */}
        {!cfg.lipsClosed && !compact && (
          <>
            <path
              d={`M ${CX - mouthW / 2 + 4} ${upperLipY + 4}
                  Q ${CX} ${upperLipY - (compact ? 4 : 6)} ${CX + mouthW / 2 - 4} ${upperLipY + 4}`}
              fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5"
            />
            <text x={CX + mouthW / 2 + 4} y={upperLipY + 2}
              fill="#FDA4AF" fontSize={7.5} opacity="0.7" fontWeight="bold">langit</text>
          </>
        )}
      </svg>

      {/* ── Panduan Langkah ── */}
      <div className={`w-full ${compact ? "space-y-1" : "space-y-2"}`}>
        {cfg.steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-500 ${
              activeStep === i
                ? "bg-white/30 text-white scale-[1.02] shadow-md border border-white/30"
                : "bg-white/10 text-white/50 scale-100"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs ${activeStep === i ? "bg-yellow-400 text-yellow-900" : "bg-white/20 text-white/40"}`}>
              {i + 1}
            </span>
            <span className={`${compact ? "text-xs" : "text-sm"} font-bold`}>{step}</span>
          </div>
        ))}
      </div>

      {/* ── Catatan artikulator ── */}
      {!compact && (
        <div className="w-full bg-black/20 rounded-2xl px-3 py-2 text-center">
          <p className="text-white/60 text-xs">📖 <span className="text-white/80 font-bold">{cfg.articulatorNote}</span></p>
        </div>
      )}

      {/* ── Meter bukaan aktual vs target ── */}
      <div className="w-full bg-black/20 rounded-xl px-3 py-2">
        <div className="flex justify-between text-xs text-white/60 font-bold mb-1">
          <span>Bukaan Aktual</span>
          <span className={isCorrect ? "text-green-400" : "text-yellow-400"}>
            {isCorrect ? "✅ Pas!" : "⏳ Belum pas"}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${isCorrect ? "bg-green-400" : "bg-yellow-400"}`}
            style={{ width: `${Math.min((lipDistance / Math.max(baselineJaw, 1)) * 100, 100)}%` }}
          />
        </div>
        {/* Target range indicator */}
        <div className="relative h-1 mt-0.5">
          <div
            className="absolute bg-white/30 h-full rounded-full"
            style={{
              left: `${(PHONEME_DATA[key]?.jawOpen / 60) * 50}%`,
              width: "20%",
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
          <span>Tertutup</span>
          <span className="text-white/50">▲ Target {key}</span>
          <span>Terbuka Maks</span>
        </div>
      </div>
    </div>
  );
}
