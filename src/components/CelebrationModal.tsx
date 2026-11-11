import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, X, TrendingUp } from 'lucide-react';
import { Top1OvertakeEvent } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CelebrationModalProps {
  event: Top1OvertakeEvent | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (!event) return;

    // Trigger explosive celebratory confetti from both bottom corners
    const end = Date.now() + 2500;
    const colors = ['#F59E0B', '#FBBF24', '#FDE68A', '#3B82F6', '#10B981', '#EC4899'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.8 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.8 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Secondary burst of golden stars in the center
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#F59E0B', '#FBBF24', '#EAB308'],
        shapes: ['star'],
        scalar: 1.2,
      });
    }, 400);

    // Auto-dismiss after exactly 6 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [event, onClose]);

  if (!event) return null;

  const { agent, newAmount, view, previousLeaderName } = event;
  const viewLabel = view === 'daily' ? 'Ranking Diario' : 'Ranking Total';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-lg p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-2xl shadow-2xl shadow-amber-500/20 text-center overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar festejo"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Crown Badge */}
          <motion.div
            initial={{ y: -30, rotate: -15, scale: 0 }}
            animate={{ y: 0, rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.15, stiffness: 260 }}
            className="inline-flex items-center justify-center relative mb-3"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Crown className="w-10 h-10 text-amber-400 animate-bounce" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            </span>
          </motion.div>

          {/* Title */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              ¡Hazaña en la tabla!
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ¡NUEVO LÍDER EN EL TOP 1! 👑
            </h2>
            <p className="text-sm text-slate-400">
              Ha tomado el primer lugar en el <strong className="text-amber-300">{viewLabel}</strong>
            </p>
          </div>

          {/* Agent Showcase Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-6 p-4 rounded-xl bg-slate-800/80 border border-amber-500/30 flex items-center gap-4 text-left"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0 border border-white/20"
              style={{ backgroundColor: agent.color }}
            >
              {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {agent.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {agent.code} · Área de {agent.branch}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-amber-400 font-medium block">Nuevo Total</span>
              <span className="text-lg sm:text-xl font-mono font-bold text-white tabular-nums">
                {formatCurrency(newAmount)}
              </span>
            </div>
          </motion.div>

          {/* Context note if overtaking another agent */}
          {previousLeaderName && previousLeaderName !== agent.name && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Superó a <strong className="text-slate-200">{previousLeaderName}</strong> para reclamar la corona
              </span>
            </div>
          )}

          {/* Action button & 6s Auto-dismiss countdown */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              ¡Felicitaciones! Continuar
            </button>

            <span className="text-[11px] text-slate-400">
              Se cerrará automáticamente en 6 segundos
            </span>

            {/* 6-Second Auto-dismiss Progress Bar */}
            <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className="h-full bg-amber-400"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
