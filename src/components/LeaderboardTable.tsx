import React, { useState } from 'react';
import { Crown, Medal, Plus, Search, ArrowUpDown, Clock, Building2 } from 'lucide-react';
import { Agent, RankingView } from '../types';
import { formatCurrency, formatTimeAgo } from '../utils/formatters';

interface LeaderboardTableProps {
  agents: Agent[];
  view: RankingView;
  onOpenDepositForAgent: (agent: Agent) => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  agents,
  view,
  onOpenDepositForAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Filter agents
  const branches = Array.from(new Set(agents.map((a) => a.branch)));

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || agent.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  // Calculate highest amount for relative progress bar
  const highestAmount = agents.length > 0
    ? Math.max(...agents.map((a) => (view === 'daily' ? a.dailyTotal : a.grandTotal)))
    : 1;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Clasificación Completa de Agentes</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredAgents.length} {filteredAgents.length === 1 ? 'agente' : 'agentes'})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ordenado por monto {view === 'daily' ? 'depositado hoy' : 'acumulado total'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition-colors"
          >
            <option value="all">Todas las sedes</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-48 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-14 text-center">Pos</th>
              <th className="py-3 px-4 min-w-[200px]">Agente de Depósitos</th>
              <th className="py-3 px-4 text-right min-w-[150px]">
                {view === 'daily' ? 'Monto Hoy' : 'Total Histórico'}
              </th>
              <th className="py-3 px-4 text-right hidden md:table-cell min-w-[110px]">
                Depósitos
              </th>
              <th className="py-3 px-4 text-right hidden lg:table-cell min-w-[130px]">
                {view === 'daily' ? 'Histórico Total' : 'Hoy'}
              </th>
              <th className="py-3 px-4 text-left hidden sm:table-cell min-w-[130px]">
                Última Actividad
              </th>
              <th className="py-3 px-4 text-right w-28">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  No se encontraron agentes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                const currentAmount = view === 'daily' ? agent.dailyTotal : agent.grandTotal;
                const alternateAmount = view === 'daily' ? agent.grandTotal : agent.dailyTotal;
                const currentCount = view === 'daily' ? agent.dailyDepositCount : agent.totalDepositCount;
                const progressPct = highestAmount > 0 ? Math.min(100, Math.round((currentAmount / highestAmount) * 100)) : 0;

                return (
                  <tr
                    key={agent.id}
                    className={`transition-colors group ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent hover:bg-amber-500/15'
                        : index % 2 === 0
                        ? 'bg-slate-900/30 hover:bg-slate-800/50'
                        : 'bg-slate-900/60 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {isTop1 ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-500/30 text-xs">
                            #1
                          </div>
                        ) : isTop2 ? (
                          <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-200 font-bold flex items-center justify-center border border-slate-600 text-xs">
                            #2
                          </div>
                        ) : isTop3 ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-900/70 text-amber-300 font-bold flex items-center justify-center border border-amber-800 text-xs">
                            #3
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Agent Name + Crown for Top 1 */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm border border-white/10 relative"
                          style={{ backgroundColor: agent.color }}
                        >
                          {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          {isTop1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-slate-950 rounded-full p-0.5 border border-amber-400">
                              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {/* USER SPECIFICATION: el que este en top 1 destaque con una corona en su nombre */}
                            {isTop1 && (
                              <Crown
                                className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 animate-pulse"
                                aria-label="Líder Top 1"
                              />
                            )}
                            <span
                              className={`font-bold truncate ${
                                isTop1
                                  ? 'text-amber-300 text-base flex items-center gap-1'
                                  : 'text-slate-100'
                              }`}
                            >
                              {agent.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-400 font-medium">{agent.code}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {agent.branch}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount + Progress bar */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono font-bold tabular-nums text-base ${
                            isTop1 ? 'text-amber-300 text-lg' : 'text-slate-100'
                          }`}
                        >
                          {formatCurrency(currentAmount)}
                        </span>
                        {/* Relative bar compared to Top 1 */}
                        <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop1
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-slate-600 group-hover:bg-amber-500/70'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Deposits count */}
                    <td className="py-3 px-4 text-right hidden md:table-cell">
                      <span className="font-mono text-slate-300 font-medium tabular-nums">
                        {currentCount}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">regs</span>
                    </td>

                    {/* Alternate View Amount */}
                    <td className="py-3 px-4 text-right hidden lg:table-cell">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-slate-400 text-xs tabular-nums">
                          {formatCurrency(alternateAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {view === 'daily' ? 'total global' : 'solo hoy'}
                        </span>
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeAgo(agent.lastDepositAt)}</span>
                      </div>
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenDepositForAgent(agent)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 hover:border-amber-400 shadow-sm active:scale-95 whitespace-nowrap"
                        title={`Registrar depósito para ${agent.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Depósito</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
