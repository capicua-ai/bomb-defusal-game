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

      {/* ── Country question ── */}
      <div className="mb-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
          País
        </p>
        <p className="text-4xl font-black">{round.country}</p>
        <p className="text-sm text-zinc-500 mt-2">
          Cortá el cable del color de su bandera
        </p>
      </div>

      {/* ── Bomb assembly: detonator → cables → bomb ── */}
      <BombAssembly
        cables={round.cables}
        cutIndex={cutIndex}
        gameState={gameState}
        onCut={cutCable}
      />
    </div>
  );
}

/* ── Bomb assembly (detonator + cables + bomb body) ── */
function BombAssembly({
  cables,
  cutIndex,
  gameState,
  onCut,
}: {
  cables: CableColor[];
  cutIndex: number | null;
  gameState: GameState;
  onCut: (index: number) => void;
}) {
  const width = 360;
  const height = 280;
  const detonatorY = 18;
  const bombY = height - 60;
  const detonatorWidth = 220;
  const detonatorX = (width - detonatorWidth) / 2;

  const n = cables.length;
  // Evenly space cable endpoints along the detonator and the bomb top.
  const topXs = cables.map(
    (_, i) =>
      detonatorX + detonatorWidth * ((i + 1) / (n + 1))
  );
  // Bomb top-center area where cables plug in.
  const bombCenterX = width / 2;
  const bombPlugSpread = 90;
  const bottomXs = cables.map(
    (_, i) =>
      bombCenterX -
      bombPlugSpread / 2 +
      bombPlugSpread * (i / Math.max(n - 1, 1))
  );

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          {/* Soft shadow under cables */}
          <filter id="cableShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Cables */}
        {cables.map((cable, i) => {
          const x1 = topXs[i];
          const y1 = detonatorY + 22;
          const x2 = bottomXs[i];
          const y2 = bombY - 6;
          const isCut = cutIndex === i;
          // Natural sag: middle control points pulled down.
          const sag = 40 + Math.abs(x2 - x1) * 0.15;
          const cx1 = x1;
          const cy1 = y1 + sag;
          const cx2 = x2;
          const cy2 = y2 - sag * 0.3;

          // Cut midpoint — rough bezier midpoint approximation.
          const mx = (x1 + cx1 + cx2 + x2) / 4;
          const my = (y1 + cy1 + cy2 + y2) / 4;

          const stroke = cable.hex;
          const darkBorder =
            cable.hex === "#FFFFFF" || cable.hex === "#FCD116"
              ? "#4a4a4a"
              : cable.hex === "#000000"
              ? "#222"
              : "rgba(0,0,0,0.45)";

          const clickable = gameState === "playing";

          return (
            <g key={i}>
              {/* Shadow */}
              <path
                d={`M ${x1} ${y1 + 3} C ${cx1} ${cy1 + 3}, ${cx2} ${cy2 + 3}, ${x2} ${y2 + 3}`}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={12}
                fill="none"
                filter="url(#cableShadow)"
              />

              {!isCut ? (
                <>
                  {/* Outer casing (slightly darker border for contrast) */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    stroke={darkBorder}
                    strokeWidth={12}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Cable body */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    stroke={stroke}
                    strokeWidth={9}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Glossy highlight */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="0 0"
                    transform="translate(-1 -2)"
                  />
                  {/* Invisible thick hit area for easier clicking */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    stroke="transparent"
                    strokeWidth={26}
                    fill="none"
                    style={{ cursor: clickable ? "pointer" : "default" }}
                    onClick={() => clickable && onCut(i)}
                  />
                </>
              ) : (
                <>
                  {/* Upper half (hangs from detonator) */}
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1 * 0.75}, ${mx - 10} ${my - 8}, ${mx - 6} ${my - 2}`}
                    stroke={darkBorder}
                    strokeWidth={12}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.9}
                  />
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1 * 0.75}, ${mx - 10} ${my - 8}, ${mx - 6} ${my - 2}`}
                    stroke={stroke}
                    strokeWidth={9}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.95}
                  />
                  {/* Lower half (dangling from bomb) */}
                  <path
                    d={`M ${x2} ${y2} C ${cx2} ${cy2 + 10}, ${mx + 10} ${my + 14}, ${mx + 6} ${my + 6}`}
                    stroke={darkBorder}
                    strokeWidth={12}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.9}
                  />
                  <path
                    d={`M ${x2} ${y2} C ${cx2} ${cy2 + 10}, ${mx + 10} ${my + 14}, ${mx + 6} ${my + 6}`}
                    stroke={stroke}
                    strokeWidth={9}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.95}
                  />
                  {/* Exposed copper ends */}
                  <circle cx={mx - 6} cy={my - 2} r={3} fill="#e8a24a" />
                  <circle cx={mx + 6} cy={my + 6} r={3} fill="#e8a24a" />
                  {/* Spark */}
                  <text
                    x={mx}
                    y={my + 4}
                    textAnchor="middle"
                    fontSize={18}
                    style={{ pointerEvents: "none" }}
                  >
                    ✂️
                  </text>
                </>
              )}

              {/* Screw plug at bomb end */}
              <circle
                cx={x2}
                cy={y2}
                r={4}
                fill="#666"
                stroke="#1a1a1a"
                strokeWidth={1}
              />
              {/* Screw plug at detonator end */}
              <circle
                cx={x1}
                cy={y1}
                r={4}
                fill="#888"
                stroke="#1a1a1a"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>

      {/* Detonator box (top) */}
      <div
        className="absolute flex items-center justify-between px-3 rounded-md border-2 border-zinc-700 shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
        style={{
          left: detonatorX,
          top: detonatorY - 18,
          width: detonatorWidth,
          height: 40,
          background:
            "linear-gradient(180deg, #3a3a3a 0%, #1f1f1f 55%, #161616 100%)",
        }}
      >
        {/* LED */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              gameState === "playing"
                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse"
                : gameState === "defused"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                : "bg-zinc-600"
            }`}
          />
          <span className="text-[9px] font-mono text-zinc-400 tracking-wider">
            DET-01
          </span>
        </div>
        {/* Fake screws */}
        <div className="flex items-center gap-2">
          <Screw />
          <Screw />
        </div>
      </div>

      {/* Bomb body (bottom) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{ top: bombY - 10 }}
      >
        <div
          className="relative w-44 h-44 rounded-full border-4 border-zinc-700 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.25)]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #4a4a4a 0%, #232323 45%, #111 100%)",
          }}
        >
          {/* Top plate where cables plug in */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm border border-zinc-800 shadow-inner"
            style={{
              width: 110,
              height: 14,
              background:
                "linear-gradient(180deg, #2c2c2c 0%, #121212 100%)",
            }}
          />
          <span className="text-6xl drop-shadow-lg">
            {gameState === "playing"
              ? "💣"
              : gameState === "defused"
              ? "✅"
              : "💥"}
          </span>
          {gameState === "playing" && (
            <div className="absolute -right-1 top-4 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
          )}
        </div>
      </div>

      {/* Labels under each cable plug */}
      <div
        className="absolute left-0 right-0 flex"
        style={{ top: bombY + 140 }}
      >
        {cables.map((cable, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: bottomXs[i] }}
          >
            <span
              className={`text-[10px] font-bold tracking-wider uppercase ${
                gameState === "playing" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              {cable.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Screw() {
  return (
    <div className="w-2 h-2 rounded-full bg-zinc-500 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[7px] h-[1px] bg-zinc-800 rotate-45" />
      </div>
    </div>
  );
}
