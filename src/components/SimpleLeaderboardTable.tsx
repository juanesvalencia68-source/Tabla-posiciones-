import React, { useState } from 'react';
import { Crown, ArrowUpDown, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Agent, RankingView } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SimpleLeaderboardTableProps {
  agents: Agent[];
  sortBy: RankingView;
  onToggleSort: (view: RankingView) => void;
  onSelectAgentForDeposit?: (agent: Agent) => void;
}

export const SimpleLeaderboardTable: React.FC<SimpleLeaderboardTableProps> = ({
  agents,
  sortBy,
  onToggleSort,
  onSelectAgentForDeposit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter agents by search
  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header with Sort Tabs & Search */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/90">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Tabla de Posiciones de Agentes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            El puesto #1 lleva la corona de líder 👑
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => onToggleSort('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Depósitos Diarios
            </button>
            <button
              onClick={() => onToggleSort('total')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'total'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Depósitos
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32 sm:w-40 bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-14 text-center">Pos</th>
              <th className="py-3 px-4">Agente</th>
              <th
                onClick={() => onToggleSort('daily')}
                className="py-3 px-4 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
              >
                <div className="inline-flex items-center gap-1.5 justify-end">
                  <span>Depósitos Diarios</span>
                  {sortBy === 'daily' && <ArrowDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
              <th
                onClick={() => onToggleSort('total')}
                className="py-3 px-4 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
              >
                <div className="inline-flex items-center gap-1.5 justify-end">
                  <span>Total Depósitos</span>
                  {sortBy === 'total' && <ArrowDown className="w-3 h-3 text-amber-400" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-500 text-xs">
                  No se encontraron agentes con ese criterio.
                </td>
              </tr>
            ) : (
              filtered.map((agent, index) => {
                const isTop1 = index === 0;

                return (
                  <tr
                    key={agent.id}
                    onClick={() => onSelectAgentForDeposit && onSelectAgentForDeposit(agent)}
                    className={`transition-colors cursor-pointer ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent hover:bg-amber-500/20'
                        : index % 2 === 0
                        ? 'bg-slate-900/40 hover:bg-slate-800/40'
                        : 'bg-slate-900/70 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 px-4 text-center">
                      {isTop1 ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
                          #1
                        </div>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          #{index + 1}
                        </span>
                      )}
                    </td>

                    {/* Agent Name + Crown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 border border-white/10"
                          style={{ backgroundColor: agent.color }}
                        >
                          {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {/* Crown for Top 1 */}
                            {isTop1 && (
                              <Crown
                                className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 animate-bounce"
                                aria-label="Líder Top 1"
                              />
                            )}
                            <span
                              className={`font-bold truncate ${
                                isTop1 ? 'text-amber-300 text-base' : 'text-slate-100'
                              }`}
                            >
                              {agent.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {agent.code} · Área de {agent.branch}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Daily Deposits */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          sortBy === 'daily'
                            ? isTop1
                              ? 'text-amber-300 text-base'
                              : 'text-white text-sm'
                            : 'text-slate-300 text-sm'
                        }`}
                      >
                        {formatCurrency(agent.dailyTotal)}
                      </span>
                    </td>

                    {/* Total Deposits */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          sortBy === 'total'
                            ? isTop1
                              ? 'text-amber-300 text-base'
                              : 'text-white text-sm'
                            : 'text-slate-300 text-sm'
                        }`}
                      >
                        {formatCurrency(agent.grandTotal)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Subtle footer hint */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Posiciones actualizadas en tiempo real · Sonido de monedas y coronación del Top 1</span>
        <span className="text-slate-400 font-mono">{filtered.length} agentes</span>
      </div>
    </div>
  );
};
