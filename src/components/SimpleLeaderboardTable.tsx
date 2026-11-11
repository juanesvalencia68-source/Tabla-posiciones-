import React, { useState } from 'react';
import { Crown, ArrowDown, Search } from 'lucide-react';
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header with Sort Tabs & Search - High Contrast for TV */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Tabla de Posiciones de Agentes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Líder actual destacado con corona de oro 👑
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => onToggleSort('daily')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                sortBy === 'daily'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Depósitos Diarios
            </button>
            <button
              onClick={() => onToggleSort('total')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                sortBy === 'total'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Depósitos
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32 sm:w-44 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-2.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Clean Table with enhanced TV legibility (10-foot UI) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Pos</th>
              <th className="py-3.5 px-4 sm:px-6">Agente</th>
              <th
                onClick={() => onToggleSort('daily')}
                className="py-3.5 px-4 sm:px-6 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
              >
                <div className="inline-flex items-center gap-1.5 justify-end">
                  <span>Depósitos Diarios</span>
                  {sortBy === 'daily' && <ArrowDown className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </th>
              <th
                onClick={() => onToggleSort('total')}
                className="py-3.5 px-4 sm:px-6 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
              >
                <div className="inline-flex items-center gap-1.5 justify-end">
                  <span>Total Depósitos</span>
                  {sortBy === 'total' && <ArrowDown className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm sm:text-base">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-500 text-sm">
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
                    className={`transition-colors ${
                      isTop1
                        ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-400'
                        : index % 2 === 0
                        ? 'bg-slate-900/50 hover:bg-slate-800/60'
                        : 'bg-slate-900 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Position */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      {isTop1 ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-sm">
                          #1
                        </div>
                      ) : (
                        <span className="font-mono text-sm sm:text-base font-bold text-slate-400">
                          #{index + 1}
                        </span>
                      )}
                    </td>

                    {/* Agent Name + Crown */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base text-white shrink-0 border border-white/20"
                          style={{ backgroundColor: agent.color }}
                        >
                          {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {/* Crown for Top 1 */}
                            {isTop1 && (
                              <Crown
                                className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0"
                                aria-label="Líder Top 1"
                              />
                            )}
                            <span
                              className={`font-bold truncate ${
                                isTop1 ? 'text-amber-300 text-base sm:text-lg' : 'text-slate-100'
                              }`}
                            >
                              {agent.name}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-400 block truncate">
                            {agent.code} · Área de {agent.branch}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Daily Deposits */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span
                        className={`font-mono font-bold tabular-nums text-base sm:text-lg ${
                          sortBy === 'daily'
                            ? isTop1
                              ? 'text-amber-300 font-extrabold text-lg sm:text-xl'
                              : 'text-white'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatCurrency(agent.dailyTotal)}
                      </span>
                    </td>

                    {/* Total Deposits */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span
                        className={`font-mono font-bold tabular-nums text-base sm:text-lg ${
                          sortBy === 'total'
                            ? isTop1
                              ? 'text-amber-300 font-extrabold text-lg sm:text-xl'
                              : 'text-white'
                            : 'text-slate-300'
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

      {/* Subtle footer */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span>Actualización en tiempo real · Optimizado para pantallas y Smart TVs</span>
        <span className="text-slate-400 font-mono font-semibold">{filtered.length} agentes</span>
      </div>
    </div>
  );
};
