"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ────────────────────────────────────────────
   Country → flag‑colour mapping
   ──────────────────────────────────────────── */
type CountryEntry = { country: string; colors: string[] };

const COUNTRIES: CountryEntry[] = [
  { country: "Argentina", colors: ["#74ACDF", "#FFFFFF"] },
  { country: "Uruguay", colors: ["#0038A8", "#FFFFFF", "#FCD116"] },
  { country: "Brasil", colors: ["#009739", "#FEDD00", "#002776"] },
  { country: "Colombia", colors: ["#FCD116", "#003893", "#CE1126"] },
  { country: "México", colors: ["#006341", "#FFFFFF", "#CE1126"] },
  { country: "Francia", colors: ["#0055A4", "#FFFFFF", "#EF4135"] },
  { country: "Italia", colors: ["#009246", "#FFFFFF", "#CE2B37"] },
  { country: "Alemania", colors: ["#000000", "#DD0000", "#FFCC00"] },
  { country: "Japón", colors: ["#FFFFFF", "#BC002D"] },
  { country: "España", colors: ["#AA151B", "#F1BF00"] },
  { country: "Suecia", colors: ["#006AA7", "#FECC02"] },
  { country: "Irlanda", colors: ["#169B62", "#FFFFFF", "#FF883E"] },
  { country: "Bélgica", colors: ["#000000", "#FDDA24", "#EF3340"] },
  { country: "Perú", colors: ["#D91023", "#FFFFFF"] },
  { country: "Chile", colors: ["#D52B1E", "#FFFFFF", "#0039A6"] },
  { country: "Países Bajos", colors: ["#AE1C28", "#FFFFFF", "#21468B"] },
  { country: "Ucrania", colors: ["#0057B7", "#FFD700"] },
  { country: "Polonia", colors: ["#FFFFFF", "#DC143C"] },
  { country: "Turquía", colors: ["#E30A17", "#FFFFFF"] },
  { country: "Grecia", colors: ["#0D5EAF", "#FFFFFF"] },
  { country: "Nigeria", colors: ["#008751", "#FFFFFF"] },
  { country: "Jamaica", colors: ["#009B3A", "#000000", "#FED100"] },
  { country: "Rumania", colors: ["#002B7F", "#FCD116", "#CE1126"] },
  { country: "Bulgaria", colors: ["#FFFFFF", "#00966E", "#D62612"] },
  { country: "Costa Rica", colors: ["#002B7F", "#FFFFFF", "#CE1126"] },
  { country: "Noruega", colors: ["#EF2B2D", "#FFFFFF", "#002868"] },
  { country: "Austria", colors: ["#ED2939", "#FFFFFF"] },
  { country: "Hungría", colors: ["#CE2939", "#FFFFFF", "#477050"] },
  { country: "Croacia", colors: ["#FF0000", "#FFFFFF", "#171796"] },
];

/* ── Colour palette for cables ────────── */
type CableColor = { label: string; hex: string };

const PALETTE: CableColor[] = [
  { label: "Rojo", hex: "#E30A17" },
  { label: "Azul", hex: "#0055A4" },
  { label: "Verde", hex: "#009739" },
  { label: "Amarillo", hex: "#FCD116" },
  { label: "Blanco", hex: "#FFFFFF" },
  { label: "Negro", hex: "#000000" },
  { label: "Naranja", hex: "#FF883E" },
];

/* ── helpers ─────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function colourDistance(a: string, b: string): number {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function closestPaletteColor(flagHex: string): CableColor {
  let best = PALETTE[0];
  let bestDist = Infinity;
  for (const c of PALETTE) {
    const d = colourDistance(flagHex, c.hex);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

type Round = { country: string; cables: CableColor[]; correctIndex: number };

function generateRound(): Round {
  const entry = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const flagColor =
    entry.colors[Math.floor(Math.random() * entry.colors.length)];
  const correct = closestPaletteColor(flagColor);

  // 2 distractors that are NOT in the flag
  const flagPaletteHexes = new Set(
    entry.colors.map((c) => closestPaletteColor(c).hex)
  );
  const distractors = shuffle(
    PALETTE.filter((c) => !flagPaletteHexes.has(c.hex))
  ).slice(0, 2);

  const cables = shuffle([correct, ...distractors]);
  const correctIndex = cables.indexOf(correct);

  return { country: entry.country, cables, correctIndex };
}

/* ── Component ─────────────────────── */
type GameState = "playing" | "defused" | "exploded";

export default function BombGame() {
  const [round, setRound] = useState<Round | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [cutIndex, setCutIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRound = useCallback(() => {
    setRound(generateRound());
    setTimeLeft(10);
    setGameState("playing");
    setCutIndex(null);
  }, []);

  useEffect(() => {
    startRound();
  }, [startRound]);

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("exploded");
          setStreak(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const cutCable = (index: number) => {
    if (gameState !== "playing" || !round) return;
    setCutIndex(index);
    if (timerRef.current) clearInterval(timerRef.current);
    if (index === round.correctIndex) {
      setGameState("defused");
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setGameState("exploded");
      setStreak(0);
    }
  };

  if (!round) return null;

  const urgent = timeLeft <= 3;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 select-none overflow-hidden relative font-sans">
      {/* ── Explosion overlay ── */}
      {gameState === "exploded" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle, rgba(255,60,0,0.9) 0%, rgba(0,0,0,0.95) 70%)",
          }}
        >
          <div className="text-center px-6">
            <p className="text-[120px] leading-none mb-2 animate-bounce">
              💥
            </p>
            <p className="text-5xl font-black tracking-wider text-red-500 uppercase mb-3">
              ¡BOOM!
            </p>
            {cutIndex !== null ? (
              <p className="text-zinc-400 text-base mb-6">
                Era el cable{" "}
                <span
                  style={{ color: round.cables[round.correctIndex].hex }}
                  className="font-bold"
                >
                  {round.cables[round.correctIndex].label}
                </span>
              </p>
            ) : (
              <p className="text-zinc-400 text-base mb-6">
                ¡Se acabó el tiempo!
              </p>
            )}
            <button
              onClick={startRound}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-lg font-bold tracking-wide transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* ── Defused overlay ── */}
      {gameState === "defused" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center px-6">
            <p className="text-[100px] leading-none mb-2">😮‍💨</p>
            <p className="text-4xl font-black tracking-wider text-emerald-400 uppercase mb-1">
              ¡Desactivada!
            </p>
            <p className="text-zinc-400 mb-6">
              Quedan {timeLeft}s en el reloj
            </p>
            <button
              onClick={startRound}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-lg font-bold tracking-wide transition-colors"
            >
              Siguiente bomba →
            </button>
          </div>
        </div>
      )}

      {/* ── Score ── */}
      <div className="absolute top-6 right-6 text-right">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Desactivadas
        </p>
        <p className="text-3xl font-black tabular-nums">{score}</p>
        {streak > 1 && (
          <p className="text-xs text-amber-400 font-medium">
            Racha: {streak}
          </p>
        )}
      </div>

      {/* ── Timer ── */}
      <div
        className={`mb-8 text-center transition-colors ${
          urgent ? "text-red-500" : "text-zinc-300"
        }`}
      >
        <p className="text-[10px] uppercase tracking-widest mb-1 text-zinc-500">
          Tiempo
        </p>
        <p
          className={`text-8xl font-black tabular-nums ${
            urgent ? "animate-pulse" : ""
          }`}
        >
          {timeLeft}
        </p>
      </div>

      {/* ── Bomb body ── */}
      <div className="relative mb-10">
        <div className="w-40 h-40 bg-zinc-800 rounded-full border-4 border-zinc-700 flex items-center justify-center shadow-[0_0_80px_rgba(239,68,68,0.2)]">
          <span className="text-6xl">
            {gameState === "playing" ? "💣" : gameState === "defused" ? "✅" : "💥"}
          </span>
        </div>
        {gameState === "playing" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 animate-ping" />
        )}
      </div>

      {/* ── Country question ── */}
      <div className="mb-10 text-center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
          País
        </p>
        <p className="text-4xl font-black">{round.country}</p>
        <p className="text-sm text-zinc-500 mt-2">
          Cortá el cable del color de su bandera
        </p>
      </div>

      {/* ── Cables ── */}
      <div className="flex gap-8">
        {round.cables.map((cable, i) => {
          const isCut = cutIndex === i;
          return (
            <button
              key={i}
              disabled={gameState !== "playing"}
              onClick={() => cutCable(i)}
              className="group flex flex-col items-center gap-3 disabled:cursor-default"
            >
              <div className="relative">
                <div
                  className={`w-7 rounded-full transition-all duration-300
                    ${
                      isCut
                        ? "h-10 opacity-40"
                        : "h-32 group-hover:h-28 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                    }
                    ${gameState === "playing" ? "cursor-pointer" : ""}
                  `}
                  style={{
                    backgroundColor: cable.hex,
                    border:
                      cable.hex === "#FFFFFF"
                        ? "2px solid #555"
                        : cable.hex === "#000000"
                        ? "2px solid #444"
                        : "none",
                  }}
                />
                {isCut && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <span className="text-lg">✂️</span>
                  </div>
                )}
              </div>
              <span
                className={`text-sm font-bold tracking-wide uppercase transition-colors ${
                  gameState === "playing"
                    ? "text-zinc-400 group-hover:text-white"
                    : "text-zinc-600"
                }`}
              >
                {cable.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
