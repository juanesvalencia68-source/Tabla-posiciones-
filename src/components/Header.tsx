import React from 'react';
import { Crown, Plus, Volume2, VolumeX, Sparkles, UserPlus, RefreshCw, Calendar, Trophy } from 'lucide-react';
import { RankingView } from '../types';

interface HeaderProps {
  view: RankingView;
  onChangeView: (view: RankingView) => void;
  onOpenDeposit: () => void;
  onOpenNewAgent: () => void;
  onOpenAudioSettings: () => void;
  isMuted: boolean;
  onSimulateDeposit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  onChangeView,
  onOpenDeposit,
  onOpenNewAgent,
  onOpenAudioSettings,
  isMuted,
  onSimulateDeposit,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
            Leaderboard Agentes
          </span>
        </div>

        {/* Zone 2: Navigation / Section Toggle: Total vs Diario */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => onChangeView('daily')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              view === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ranking Diario</span>
          </button>

          <button
            onClick={() => onChangeView('total')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              view === 'total'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ranking Total</span>
          </button>
        </div>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Sound Toggle */}
          <button
            onClick={onOpenAudioSettings}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-slate-900 border-slate-700/80 text-emerald-400 hover:bg-slate-800'
            }`}
            title="Ajustes de Sonido"
            aria-label="Ajustes de Sonido"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick Demo Simulator button to test sound + celebrate Top 1 */}
          <button
            onClick={onSimulateDeposit}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
            title="Simula un depósito aleatorio para probar el sonido y las alertas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Depósito</span>
          </button>

          {/* Add Agent Button */}
          <button
            onClick={onOpenNewAgent}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Nuevo Agente</span>
          </button>

          {/* Primary CTA: Register Deposit */}
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/10 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Depósito</span>
          </button>
        </div>
      </div>
    </header>
  );
};
