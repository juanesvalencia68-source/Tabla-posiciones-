import React, { useEffect, memo } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { formatCurrency, RETENCION_TARGET_AMOUNT } from '../utils/formatters';

interface TargetCelebrationModalProps {
  totalAmount: number;
  targetAmount?: number;
  onClose: () => void;
}

interface MoneyDrop {
  id: number;
  leftPercent: number;
  delaySec: number;
  durationSec: number;
  swayPx: number;
  spinDeg: number;
  kind: 'bill' | 'coin';
  scale: number;
}

// Deterministic money rain items (bills & gold coins) across the full viewport
const MONEY_DROPS: MoneyDrop[] = Array.from({ length: 34 }, (_, i) => {
  const leftPercent = ((i * 29 + 5) % 94) + 2;
  const delaySec = (i % 10) * 0.38;
  const durationSec = 2.8 + (i % 5) * 0.55;
  const swayPx = (i % 2 === 0 ? 1 : -1) * (24 + (i % 4) * 18);
  const spinDeg = (i % 2 === 0 ? 1 : -1) * (220 + (i % 3) * 110);
  const kind: 'bill' | 'coin' = i % 3 === 0 ? 'coin' : 'bill';
  const scale = 0.85 + (i % 4) * 0.16;
  return { id: i, leftPercent, delaySec, durationSec, swayPx, spinDeg, kind, scale };
});

export const TargetCelebrationModal: React.FC<TargetCelebrationModalProps> = memo(
  ({ totalAmount, targetAmount = RETENCION_TARGET_AMOUNT, onClose }) => {
    useEffect(() => {
      const colors = ['#FBBF24', '#FDE047', '#10B981', '#34D399', '#F97316', '#FFFFFF'];
      const timers: ReturnType<typeof setTimeout>[] = [];

      const fireBurst = (
        x: number,
        y: number,
        particleCount: number,
        spread: number,
        angle = 90,
        startVelocity = 42
      ) => {
        try {
          confetti({
            particleCount,
            angle,
            spread,
            startVelocity,
            origin: { x, y },
            colors,
            zIndex: 80,
            disableForReducedMotion: true,
          });
        } catch {
          // Ignore if canvas is unavailable
        }
      };

      // Wave 1: Immediate mega center explosion + side cannons
      fireBurst(0.5, 0.45, 95, 360, 90, 48);
      fireBurst(0.08, 0.72, 45, 65, 60, 52);
      fireBurst(0.92, 0.72, 45, 65, 120, 52);

      // Follow-up firework explosions across the screen
      const explosionWaves: Array<[number, number, number, number, number]> = [
        [750, 0.22, 0.3, 60, 360],
        [1350, 0.78, 0.28, 60, 360],
        [2100, 0.5, 0.35, 85, 360],
        [2950, 0.18, 0.55, 55, 360],
        [3750, 0.82, 0.52, 55, 360],
        [4700, 0.35, 0.25, 65, 360],
        [5600, 0.65, 0.25, 65, 360],
        [6700, 0.5, 0.42, 80, 360],
      ];

      explosionWaves.forEach(([delay, x, y, count, spread]) => {
        timers.push(setTimeout(() => fireBurst(x, y, count, spread, 90, 40), delay));
      });

      // Auto-close after 10 seconds so TV returns cleanly to the board
      const dismissTimer = setTimeout(() => {
        onClose();
      }, 10000);
      timers.push(dismissTimer);

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    }, [onClose]);

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 bg-slate-950/92 overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Target de Retención alcanzado"
      >
        {/* Full-Screen Money Rain Layer (Bills & Gold Coins) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {MONEY_DROPS.map((drop) => (
            <div
              key={drop.id}
              className="animate-money-rain absolute top-0"
              style={
                {
                  left: `${drop.leftPercent}%`,
                  '--fall-dur': `${drop.durationSec}s`,
                  '--fall-delay': `${drop.delaySec}s`,
                  '--sway': `${drop.swayPx}px`,
                  '--spin': `${drop.spinDeg}deg`,
                } as React.CSSProperties
              }
            >
              {drop.kind === 'bill' ? (
                <svg
                  width={Math.round(62 * drop.scale)}
                  height={Math.round(32 * drop.scale)}
                  viewBox="0 0 64 34"
                  fill="none"
                >
                  <rect
                    x="1.5"
                    y="1.5"
                    width="61"
                    height="31"
                    rx="5"
                    fill="#059669"
                    stroke="#6EE7B7"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="6"
                    y="6"
                    width="52"
                    height="22"
                    rx="2.5"
                    fill="#10B981"
                    stroke="#A7F3D0"
                    strokeWidth="1.2"
                  />
                  <circle cx="32" cy="17" r="8" fill="#047857" stroke="#D1FAE5" strokeWidth="1.4" />
                  <text
                    x="32"
                    y="21.5"
                    textAnchor="middle"
                    fill="#FEF08A"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    $
                  </text>
                </svg>
              ) : (
                <svg
                  width={Math.round(38 * drop.scale)}
                  height={Math.round(38 * drop.scale)}
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <circle cx="20" cy="20" r="18" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2.5" />
                  <circle cx="20" cy="20" r="13" fill="#FBBF24" stroke="#FDE68A" strokeWidth="1.5" />
                  <text
                    x="20"
                    y="25.5"
                    textAnchor="middle"
                    fill="#78350F"
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    $
                  </text>
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Centerpiece Stage */}
        <div className="relative z-10 w-full max-w-3xl bg-slate-900/95 border-2 border-amber-400 rounded-3xl px-6 py-8 sm:px-12 sm:py-10 text-center overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar celebración"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Giant Crown + Shockwave Explosion Rings + Sunburst */}
          <div className="relative mx-auto w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Expanding golden explosion rings */}
            <div
              className="animate-explosion-ring absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-amber-300/80 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="animate-explosion-ring absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-emerald-400/75 pointer-events-none"
              style={{ animationDelay: '0.55s' }}
              aria-hidden="true"
            />
            <div
              className="animate-explosion-ring absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-yellow-200/70 pointer-events-none"
              style={{ animationDelay: '1.1s' }}
              aria-hidden="true"
            />

            {/* Rotating golden sunburst rays */}
            <svg
              className="animate-crown-rays absolute inset-0 w-full h-full pointer-events-none opacity-35"
              viewBox="0 0 240 240"
              fill="none"
              aria-hidden="true"
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <polygon
                  key={idx}
                  points="120,120 108,8 132,8"
                  fill={idx % 2 === 0 ? '#FBBF24' : '#34D399'}
                  transform={`rotate(${idx * 30} 120 120)`}
                />
              ))}
            </svg>

            {/* Giant Golden Crown Vector */}
            <svg
              className="animate-giant-crown relative z-10 w-44 h-44 sm:w-56 sm:h-56 xl:w-64 xl:h-64"
              viewBox="0 0 220 180"
              fill="none"
              aria-label="Corona Gigante de Meta Cumplida"
            >
              <defs>
                <linearGradient id="crownGoldMain" x1="0" y1="0" x2="220" y2="180" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="45%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="crownBandGold" x1="0" y1="125" x2="220" y2="165" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>

              {/* Back crown spikes */}
              <path
                d="M44 128L66 44L110 88L154 44L176 128H44Z"
                fill="#B45309"
                stroke="#FDE68A"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Front crown body */}
              <path
                d="M28 134L18 52L72 92L110 24L148 92L202 52L192 134H28Z"
                fill="url(#crownGoldMain)"
                stroke="#FEF9C3"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />

              {/* Crown pearls at tips */}
              <circle cx="18" cy="46" r="10" fill="#FEF08A" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="110" cy="18" r="13" fill="#FEF08A" stroke="#F59E0B" strokeWidth="3.5" />
              <circle cx="202" cy="46" r="10" fill="#FEF08A" stroke="#F59E0B" strokeWidth="3" />

              {/* Crown base band */}
              <rect
                x="26"
                y="130"
                width="168"
                height="32"
                rx="10"
                fill="url(#crownBandGold)"
                stroke="#FEF9C3"
                strokeWidth="4"
              />

              {/* Crown jewels */}
              <polygon points="110,136 120,146 110,156 100,146" fill="#10B981" stroke="#D1FAE5" strokeWidth="2" />
              <circle cx="64" cy="146" r="7" fill="#EF4444" stroke="#FECACA" strokeWidth="2" />
              <circle cx="156" cy="146" r="7" fill="#EF4444" stroke="#FECACA" strokeWidth="2" />
              <circle cx="110" cy="96" r="9" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Celebration Copy */}
          <div className="mt-2 space-y-2 relative z-10">
            <p className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-emerald-300">
              Área de Retención · Target Cumplido
            </p>
            <h2 className="text-3xl sm:text-5xl xl:text-6xl font-black text-amber-300 tracking-tight leading-none text-balance">
              ¡META ALCANZADA!
            </h2>
            <p className="text-base sm:text-xl text-slate-200 font-semibold">
              Se alcanzó el objetivo de{' '}
              <span className="font-mono font-black text-emerald-300 tabular-nums">
                {formatCurrency(targetAmount)}
              </span>
            </p>
          </div>

          {/* Reached Amount Callout */}
          <div className="mt-6 py-4 px-6 rounded-2xl bg-slate-950 border border-amber-400/60 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-5 relative z-10">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-200">
              Total Ret
            </span>
            <span className="hidden sm:block h-8 w-px bg-amber-400/40" aria-hidden="true" />
            <span className="text-3xl sm:text-5xl font-mono font-black text-amber-300 tabular-nums leading-none">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Close Button + 10s Countdown */}
          <div className="mt-6 flex flex-col items-center gap-2.5 relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-7 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base rounded-xl transition-colors cursor-pointer"
            >
              Continuar a la Tabla
            </button>

            <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-200 animate-countdown-10s" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TargetCelebrationModal.displayName = 'TargetCelebrationModal';
