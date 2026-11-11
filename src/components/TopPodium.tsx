import React from 'react';
import { Crown, Medal, Plus, TrendingUp } from 'lucide-react';
import { Agent, RankingView } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

interface TopPodiumProps {
  topAgents: Agent[];
  view: RankingView;
  onOpenDepositForAgent: (agent: Agent) => void;
}

export const TopPodium: React.FC<TopPodiumProps> = ({
  topAgents,
  view,
  onOpenDepositForAgent,
}) => {
  if (topAgents.length === 0) return null;

  // We arrange podium as [2nd, 1st, 3rd] if we have at least 2 or 3
  const first = topAgents[0];
  const second = topAgents[1];
  const third = topAgents[2];

  const getAmount = (agent: Agent) =>
    view === 'daily' ? agent.dailyTotal : agent.grandTotal;

  const getCount = (agent: Agent) =>
    view === 'daily' ? agent.dailyDepositCount : agent.totalDepositCount;

  return (
    <div className="relative pt-6 pb-2">
      {/* Visual Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase flex items-center gap-2">
            <span>Podio de Honor</span>
            <span className="text-xs font-normal text-slate-500 normal-case">
              · Líderes del {view === 'daily' ? 'Día' : 'Acumulado Total'}
            </span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
        {/* SECOND PLACE (Left on desktop) */}
        {second ? (
          <div className="order-2 md:order-1 flex flex-col items-center">
            <div className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 flex flex-col items-center text-center relative hover:border-slate-600 transition-colors">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-200 text-xs font-bold px-3 py-0.5 rounded-full border border-slate-600 flex items-center gap-1 shadow-sm">
                <Medal className="w-3.5 h-3.5 text-slate-300" />
                <span>#2 Plata</span>
              </div>

              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white mt-2 shadow-inner border-2 border-slate-400/40"
                style={{ backgroundColor: second.color }}
              >
                {second.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>

              <h3 className="font-bold text-slate-100 mt-2 text-sm sm:text-base truncate max-w-full">
                {second.name}
              </h3>
              <p className="text-xs text-slate-400">{second.branch}</p>

              <div className="mt-3 py-1.5 px-3 bg-slate-950/60 rounded-lg w-full">
                <span className="text-xs text-slate-400 block">Total {view === 'daily' ? 'Hoy' : 'Global'}</span>
                <span className="font-mono font-bold text-slate-200 text-base sm:text-lg tabular-nums">
                  {formatCurrency(getAmount(second))}
                </span>
                <span className="text-xs text-slate-500 block">
                  {getCount(second)} depósitos
                </span>
              </div>

              <button
                onClick={() => onOpenDepositForAgent(second)}
                className="mt-3 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Depósito</span>
              </button>
            </div>
            {/* Desktop Pedestal base */}
            <div className="hidden md:block w-full h-12 bg-slate-800/40 border-t border-slate-700 rounded-b-xl" />
          </div>
        ) : (
          <div className="order-2 md:order-1" />
        )}

        {/* FIRST PLACE (Center - Elevated, Golden, Crowned) */}
        {first && (
          <div className="order-1 md:order-2 flex flex-col items-center">
            <div className="w-full bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 flex flex-col items-center text-center relative shadow-xl shadow-amber-500/10 glow-top1">
              {/* Crown on top */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <Crown className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-md animate-bounce" />
              </div>

              {/* Top 1 Badge */}
              <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md mb-2 mt-1">
                <span>★ TOP 1 ORO ★</span>
              </div>

              {/* Avatar with shining golden ring */}
              <div className="relative mt-1">
                <div
                  className="w-18 h-18 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-lg border-2 border-amber-400 ring-4 ring-amber-500/30"
                  style={{ backgroundColor: first.color }}
                >
                  {first.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              </div>

              {/* Agent Name with prominent CROWN */}
              <div className="flex items-center justify-center gap-1.5 mt-3 max-w-full">
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                <h3 className="font-extrabold text-amber-300 text-base sm:text-xl truncate">
                  {first.name}
                </h3>
              </div>
              <p className="text-xs text-amber-200/80 font-medium">{first.branch} · {first.code}</p>

              {/* Amount box */}
              <div className="mt-3 py-2 px-4 bg-amber-950/50 border border-amber-500/40 rounded-xl w-full">
                <span className="text-xs text-amber-300/80 font-medium block">
                  Líder {view === 'daily' ? 'del Día' : 'Total'}
                </span>
                <span className="font-mono font-black text-amber-300 text-xl sm:text-2xl tabular-nums tracking-tight">
                  {formatCurrency(getAmount(first))}
                </span>
                <div className="flex items-center justify-center gap-2 mt-0.5 text-xs text-amber-200/70">
                  <span>{getCount(first)} depósitos</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                    <TrendingUp className="w-3 h-3" /> Máximo
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenDepositForAgent(first)}
                className="mt-3.5 w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Depósito</span>
              </button>
            </div>
            {/* Desktop Pedestal base */}
            <div className="hidden md:block w-full h-20 bg-gradient-to-b from-amber-900/30 to-slate-800/40 border-t border-amber-500/50 rounded-b-xl flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">
                Primer Puesto
              </span>
            </div>
          </div>
        )}

        {/* THIRD PLACE (Right on desktop) */}
        {third ? (
          <div className="order-3 flex flex-col items-center">
            <div className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 flex flex-col items-center text-center relative hover:border-slate-600 transition-colors">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-900/80 text-amber-200 text-xs font-bold px-3 py-0.5 rounded-full border border-amber-700/80 flex items-center gap-1 shadow-sm">
                <Medal className="w-3.5 h-3.5 text-amber-500" />
                <span>#3 Bronce</span>
              </div>

              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white mt-2 shadow-inner border-2 border-amber-700/40"
                style={{ backgroundColor: third.color }}
              >
                {third.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>

              <h3 className="font-bold text-slate-100 mt-2 text-sm sm:text-base truncate max-w-full">
                {third.name}
              </h3>
              <p className="text-xs text-slate-400">{third.branch}</p>

              <div className="mt-3 py-1.5 px-3 bg-slate-950/60 rounded-lg w-full">
                <span className="text-xs text-slate-400 block">Total {view === 'daily' ? 'Hoy' : 'Global'}</span>
                <span className="font-mono font-bold text-slate-200 text-base sm:text-lg tabular-nums">
                  {formatCurrency(getAmount(third))}
                </span>
                <span className="text-xs text-slate-500 block">
                  {getCount(third)} depósitos
                </span>
              </div>

              <button
                onClick={() => onOpenDepositForAgent(third)}
                className="mt-3 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Depósito</span>
              </button>
            </div>
            {/* Desktop Pedestal base */}
            <div className="hidden md:block w-full h-8 bg-slate-800/40 border-t border-slate-700 rounded-b-xl" />
          </div>
        ) : (
          <div className="order-3" />
        )}
      </div>
    </div>
  );
};
