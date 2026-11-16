import React, { useState, useEffect, useMemo, memo } from 'react';
import { Crown, ArrowDown, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Agent, RankingView } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SimpleLeaderboardTableProps {
  agents: Agent[];
  sortBy: RankingView;
  onToggleSort: (view: RankingView) => void;
  onSelectAgentForDeposit?: (agent: Agent) => void;
}

interface RowProps {
  agent: Agent;
  index: number;
  rank: number;
  sortBy: RankingView;
  onSelectAgentForDeposit?: (agent: Agent) => void;
}

// Memoized Leaderboard Row: Top 3 in Gold, #4-#10 in standout bright Blue, large high-impact TV typography
const LeaderboardRow = memo(
  ({ agent, index, rank, sortBy, onSelectAgentForDeposit }: RowProps) => {
    const isTop1 = rank === 1;
    const isTop3 = rank <= 3;

    // Top 3 = Gold theme; #4-#10 = Standout bright Blue theme
    const rowClasses = isTop3
      ? isTop1
        ? 'bg-amber-500/18 hover:bg-amber-500/24 border-l-[6px] border-amber-300'
        : 'bg-amber-500/12 hover:bg-amber-500/18 border-l-[6px] border-amber-400'
      : index % 2 === 0
      ? 'bg-sky-500/12 hover:bg-sky-500/18 border-l-[6px] border-sky-400'
      : 'bg-blue-500/10 hover:bg-sky-500/18 border-l-[6px] border-blue-400';

    return (
      <tr
        onClick={() => onSelectAgentForDeposit && onSelectAgentForDeposit(agent)}
        className={`tv-table-row transition-colors cursor-pointer ${rowClasses}`}
      >
        {/* Position */}
        <td className="py-3 sm:py-4 xl:py-5 px-3 sm:px-6 text-center">
          {isTop3 ? (
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black text-xl sm:text-2xl xl:text-3xl border border-amber-200">
              #{rank}
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-2xl bg-sky-500/20 text-sky-300 font-black text-xl sm:text-2xl xl:text-3xl border border-sky-400/50">
              #{rank}
            </div>
          )}
        </td>

        {/* Agent Name + Crown for Top 1 */}
        <td className="py-3 sm:py-4 xl:py-5 px-3 sm:px-6">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-2xl flex items-center justify-center text-base sm:text-xl xl:text-2xl font-black shrink-0 select-none ${
                isTop3
                  ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 border border-amber-200'
                  : 'bg-gradient-to-br from-sky-400 to-blue-600 text-white border border-sky-300/70'
              }`}
            >
              {agent.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {isTop1 && (
                  <Crown
                    className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300 fill-amber-300 shrink-0"
                    aria-label="Líder Top 1"
                  />
                )}
                <span
                  className={`truncate leading-tight ${
                    isTop3
                      ? 'text-amber-300 text-xl sm:text-3xl xl:text-4xl font-black tracking-tight'
                      : 'text-sky-200 text-xl sm:text-3xl xl:text-[34px] font-extrabold tracking-tight'
                  }`}
                >
                  {agent.name}
                </span>
                {isTop3 && (
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/50 shrink-0">
                    Top {rank}
                  </span>
                )}
              </div>
              <span
                className={`text-xs sm:text-base xl:text-lg block truncate leading-tight mt-1 ${
                  isTop3 ? 'text-amber-200/80' : 'text-sky-300/85'
                }`}
              >
                {agent.code} · Área de {agent.branch}
              </span>
            </div>
          </div>
        </td>

        {/* Daily Deposits */}
        <td className="py-3 sm:py-4 xl:py-5 px-3 sm:px-6 text-right">
          <span
            className={`font-mono tabular-nums ${
              sortBy === 'daily'
                ? isTop3
                  ? 'text-amber-300 font-black text-xl sm:text-3xl xl:text-4xl'
                  : 'text-sky-300 font-black text-xl sm:text-3xl xl:text-4xl'
                : isTop3
                ? 'text-amber-300/85 font-bold text-lg sm:text-2xl xl:text-3xl'
                : 'text-sky-200/85 font-bold text-lg sm:text-2xl xl:text-3xl'
            }`}
          >
            {formatCurrency(agent.dailyTotal)}
          </span>
        </td>

        {/* Total Deposits */}
        <td className="py-3 sm:py-4 xl:py-5 px-3 sm:px-6 text-right">
          <span
            className={`font-mono tabular-nums ${
              sortBy === 'total'
                ? isTop3
                  ? 'text-amber-300 font-black text-xl sm:text-3xl xl:text-4xl'
                  : 'text-sky-300 font-black text-xl sm:text-3xl xl:text-4xl'
                : isTop3
                ? 'text-amber-300/85 font-bold text-lg sm:text-2xl xl:text-3xl'
                : 'text-sky-200/85 font-bold text-lg sm:text-2xl xl:text-3xl'
            }`}
          >
            {formatCurrency(agent.grandTotal)}
          </span>
        </td>
      </tr>
    );
  },
  (prev, next) => {
    return (
      prev.agent.id === next.agent.id &&
      prev.agent.dailyTotal === next.agent.dailyTotal &&
      prev.agent.grandTotal === next.agent.grandTotal &&
      prev.agent.name === next.agent.name &&
      prev.rank === next.rank &&
      prev.index === next.index &&
      prev.sortBy === next.sortBy
    );
  }
);

LeaderboardRow.displayName = 'LeaderboardRow';

export const SimpleLeaderboardTable: React.FC<SimpleLeaderboardTableProps> = memo(({
  agents,
  sortBy,
  onToggleSort,
  onSelectAgentForDeposit,
}) => {
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tv_page_size_v2');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && [0, 5, 10].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return 5; // Default 5 agents per page (rotates 1-5 and 6-10 on Smart TV)
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [progressKey, setProgressKey] = useState<number>(0);

  // Show ONLY the Top 10 agents with the highest deposits
  const top10Agents = useMemo(() => agents.slice(0, 10), [agents]);

  const handleSetPageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
    setProgressKey((k) => k + 1);
    try {
      localStorage.setItem('tv_page_size_v2', String(size));
    } catch {
      // ignore
    }
  };

  const totalPages = pageSize > 0 ? Math.ceil(top10Agents.length / pageSize) : 1;

  // Auto clamp currentPage if list changes
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(0);
    }
  }, [currentPage, totalPages]);

  // 15-second TV auto-rotation timer
  useEffect(() => {
    if (!isAutoRotating || pageSize === 0 || totalPages <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 15000);

    return () => clearInterval(timer);
  }, [isAutoRotating, pageSize, totalPages, progressKey]);

  const handlePageSelect = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    setProgressKey((k) => k + 1);
  };

  const handleNextPage = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
    setProgressKey((k) => k + 1);
  };

  const handlePrevPage = () => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    setProgressKey((k) => k + 1);
  };

  const handleToggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
    setProgressKey((k) => k + 1);
  };

  // Slice displayed agents for current page within Top 10
  const displayedAgents = useMemo(() => {
    if (pageSize === 0) {
      return top10Agents;
    }
    const start = currentPage * pageSize;
    return top10Agents.slice(start, start + pageSize);
  }, [top10Agents, currentPage, pageSize]);

  const pageStartOffset = pageSize > 0 ? currentPage * pageSize : 0;

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Main Full-Bleed Leaderboard Table Container */}
      <div className="flex-1 flex flex-col w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* TV Broadcast Rotation Bar & Page Navigation */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm xl:text-base">
          {/* Left: TV Auto-Rotation Status Toggle & Page Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {pageSize > 0 && totalPages > 1 && (
              <>
                <button
                  onClick={handleToggleAutoRotate}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm xl:text-base font-bold transition-colors cursor-pointer select-none ${
                    isAutoRotating
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                  title={isAutoRotating ? 'Pausar rotación automática' : 'Reanudar rotación automática en TV (cada 15s)'}
                >
                  {isAutoRotating ? (
                    <>
                      <Pause className="w-4 h-4 text-amber-400" />
                      <span>Rotación 15s</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-slate-400" />
                      <span>Pausada</span>
                    </>
                  )}
                </button>

                {/* Page Buttons with Range Info */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handlePrevPage}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const start = idx * pageSize + 1;
                    const end = Math.min((idx + 1) * pageSize, top10Agents.length);
                    const isActive = currentPage === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePageSelect(idx)}
                        className={`px-3 py-1 rounded-lg text-xs sm:text-sm xl:text-base font-bold transition-all cursor-pointer select-none font-mono ${
                          isActive
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {start}-{end}
                      </button>
                    );
                  })}

                  <button
                    onClick={handleNextPage}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </>
            )}
            {(pageSize === 0 || totalPages <= 1) && (
              <span className="text-xs sm:text-sm xl:text-base text-amber-300 font-bold px-1">
                Top {top10Agents.length} Mejores Agentes
              </span>
            )}
          </div>

          {/* Right: Agents-per-page selector for TV customization */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-xs sm:text-sm text-slate-400 hidden md:inline">Por pág:</span>
            <button
              onClick={() => handleSetPageSize(5)}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm xl:text-base font-bold font-mono transition-colors cursor-pointer ${
                pageSize === 5
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
              title="Mostrar 5 agentes por página"
            >
              5
            </button>
            <button
              onClick={() => handleSetPageSize(0)}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm xl:text-base font-bold transition-colors cursor-pointer ${
                pageSize === 0 || pageSize === 10
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
              title="Mostrar los 10 mejores sin paginación"
            >
              Top {top10Agents.length}
            </button>
          </div>
        </div>

        {/* 15-Second Golden Visual Countdown Bar */}
        {isAutoRotating && pageSize > 0 && totalPages > 1 && (
          <div className="h-1 bg-slate-950 w-full overflow-hidden">
            <div key={progressKey} className="w-full h-full bg-amber-400 animate-rotation-progress" />
          </div>
        )}

        {/* Fixed-layout Full-Width & Full-Height Table for TV */}
        <div className="flex-1 flex flex-col overflow-x-auto">
          <table className="w-full flex-1 text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-20 sm:w-28 xl:w-32" />
              <col className="w-auto" />
              <col className="w-40 sm:w-64 xl:w-80" />
              <col className="w-40 sm:w-64 xl:w-80" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs sm:text-base xl:text-lg font-extrabold text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-6 text-center">Pos</th>
                <th className="py-3 px-3 sm:px-6">Agente</th>
                <th
                  onClick={() => onToggleSort('daily')}
                  className="py-3 px-3 sm:px-6 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Diario</span>
                    {sortBy === 'daily' && <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
                  </div>
                </th>
                <th
                  onClick={() => onToggleSort('total')}
                  className="py-3 px-3 sm:px-6 text-right cursor-pointer hover:text-amber-400 transition-colors select-none"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Total</span>
                    {sortBy === 'total' && <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody key={currentPage} className="animate-tv-page divide-y divide-slate-800">
              {displayedAgents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-lg sm:text-xl">
                    No hay agentes registrados en esta área.
                  </td>
                </tr>
              ) : (
                displayedAgents.map((agent, index) => (
                  <LeaderboardRow
                    key={agent.id}
                    agent={agent}
                    index={index}
                    rank={pageStartOffset + index + 1}
                    sortBy={sortBy}
                    onSelectAgentForDeposit={onSelectAgentForDeposit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Subtle footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs sm:text-sm xl:text-base text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>
              {isAutoRotating && pageSize > 0 && totalPages > 1
                ? `Rotación automática cada 15s · Página ${currentPage + 1} de ${totalPages}`
                : 'Top 10 Mejores Agentes · Sincronización en vivo'}
            </span>
          </span>
          <span className="text-slate-300 font-mono font-bold">
            {pageSize > 0
              ? `Pág ${currentPage + 1}/${totalPages} (Top ${top10Agents.length})`
              : `Mostrando Top ${top10Agents.length}`}
          </span>
        </div>
      </div>
    </div>
  );
});

SimpleLeaderboardTable.displayName = 'SimpleLeaderboardTable';
