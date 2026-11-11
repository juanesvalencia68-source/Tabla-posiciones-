import React from 'react';
import { History, ArrowDownRight, Tag } from 'lucide-react';
import { Deposit } from '../types';
import { formatCurrency, formatTimeAgo, formatExactTime } from '../utils/formatters';

interface RecentDepositsFeedProps {
  deposits: Deposit[];
}

export const RecentDepositsFeed: React.FC<RecentDepositsFeedProps> = ({ deposits }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Actividad Reciente de Depósitos</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {deposits.length} registros
        </span>
      </div>

      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {deposits.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No hay depósitos registrados todavía.
          </div>
        ) : (
          deposits.slice(0, 10).map((dep) => (
            <div
              key={dep.id}
              className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white truncate block">
                    {dep.agentName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span>{dep.method}</span>
                    {dep.reference && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{dep.reference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums block">
                  +{formatCurrency(dep.amount)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatTimeAgo(dep.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
