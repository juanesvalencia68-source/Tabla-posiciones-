/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Crown, Volume2, VolumeX, Settings, Trophy, Maximize, Minimize, Tv, Copy, Check, X } from 'lucide-react';
import { Agent, DepositMethod, RankingView, Top1OvertakeEvent } from './types';
import { useFirebase } from './contexts/FirebaseContext';
import {
  subscribeAgentsFromFirestore,
  subscribeLatestBoardEvent,
  ensureSeededInFirestore,
  submitDepositFirestore,
  createAgentFirestore,
  updateAgentFirestore,
  deleteAgentFirestore,
  resetDailyFirestore,
  resetTotalFirestore,
  ensureRetencionDailyResetFirestore,
} from './services/firestoreService';
import { soundEngine } from './utils/soundEffects';
import { SimpleLeaderboardTable } from './components/SimpleLeaderboardTable';
import { DepositNotification, NotificationData } from './components/DepositNotification';
import type { ResetType } from './components/ResetConfirmModal';
import {
  getConversionSalesCount,
  CONVERSION_SALE_AMOUNT,
  RETENCION_TARGET_AMOUNT,
  getLocalDateKey,
} from './utils/formatters';

import { loadAgents } from './utils/storage';

const AdminPanel = lazy(() => import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const CelebrationModal = lazy(() => import('./components/CelebrationModal').then((m) => ({ default: m.CelebrationModal })));
const TargetCelebrationModal = lazy(() =>
  import('./components/TargetCelebrationModal').then((m) => ({ default: m.TargetCelebrationModal }))
);
const ResetConfirmModal = lazy(() => import('./components/ResetConfirmModal').then((m) => ({ default: m.ResetConfirmModal })));

function detectInitialArea(): 'Retención' | 'Conversión' {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path.includes('conversion') || params.get('area')?.toLowerCase() === 'conversion') {
      return 'Conversión';
    }
  }
  return 'Retención';
}

export default function App() {
  const { authReady, isAdmin } = useFirebase();
  const [currentArea, setCurrentArea] = useState<'Retención' | 'Conversión'>(detectInitialArea);
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents());
  const agentsRef = useRef<Agent[]>(agents);
  agentsRef.current = agents;
  const hasSeededRef = useRef(false);
  const [agentsSyncedFromFirestore, setAgentsSyncedFromFirestore] = useState(false);
  const [todayKey, setTodayKey] = useState<string>(() => getLocalDateKey());
  const lastDailyResetCheckRef = useRef<string>('');

  const [sortBy, setSortBy] = useState<RankingView>('total');
  const [currentView, setCurrentView] = useState<'leaderboard' | 'admin'>('leaderboard');
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);
  const [celebrationEvent, setCelebrationEvent] = useState<Top1OvertakeEvent | null>(null);
  const [showTargetCelebration, setShowTargetCelebration] = useState(false);
  const prevRetencionTotalRef = useRef<number | null>(null);
  const [confirmResetType, setConfirmResetType] = useState<ResetType>(null);
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showTvModal, setShowTvModal] = useState(false);
  const [tvModalArea, setTvModalArea] = useState<'Retención' | 'Conversión'>(currentArea);
  const [copied, setCopied] = useState(false);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync area with browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const area = detectInitialArea();
      setCurrentArea(area);
      setTvModalArea(area);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchArea = (area: 'Retención' | 'Conversión') => {
    setCurrentArea(area);
    setTvModalArea(area);
    if (typeof window !== 'undefined') {
      const targetUrl = area === 'Conversión' ? '/conversion' : '/';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ area }, '', targetUrl);
      }
    }
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore if unsupported in iframe sandbox
    }
  };

  // 1a. Real-Time Cloud Firestore Agents Sync (works without login on Smart TVs)
  useEffect(() => {
    const unsubscribeAgents = subscribeAgentsFromFirestore(
      (firestoreAgents, count) => {
        if (count > 0) {
          setAgents(firestoreAgents);
          setAgentsSyncedFromFirestore(true);
        }
      },
      (status) => {
        setIsConnected(status);
      }
    );

    return () => {
      unsubscribeAgents();
    };
  }, []);

  // Watch calendar day changes (for 24/7 Smart TVs & returning shifts)
  useEffect(() => {
    const checkDayChange = () => {
      const nextKey = getLocalDateKey();
      setTodayKey((prev) => (prev !== nextKey ? nextKey : prev));
    };
    const interval = setInterval(checkDayChange, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDayChange();
      }
    };
    window.addEventListener('focus', checkDayChange);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkDayChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Automatically reset Retención daily deposits to $0 at the start of each new day
  useEffect(() => {
    if (!agentsSyncedFromFirestore) return;
    if (lastDailyResetCheckRef.current === todayKey) return;
    lastDailyResetCheckRef.current = todayKey;

    void ensureRetencionDailyResetFirestore(agentsRef.current).catch((err) => {
      console.error('Error checking daily reset for Retención:', err);
      lastDailyResetCheckRef.current = '';
    });
  }, [agentsSyncedFromFirestore, todayKey]);

  // 1b. Area-Isolated Real-Time Board Events (Retención and Conversión never mix)
  useEffect(() => {
    setActiveNotification(null);
    setCelebrationEvent(null);
    setShowTargetCelebration(false);

    const unsubscribeEvents = subscribeLatestBoardEvent(currentArea, (evt) => {
      const branchName: 'Retención' | 'Conversión' =
        evt.branch === 'Conversión' ? 'Conversión' : 'Retención';

      // Extra client-side guard so events from another area never mix
      if (evt.branch !== 'Todas' && branchName !== currentArea) {
        return;
      }

      soundEngine.playCoinMoneySound();

      setActiveNotification({
        id: String(evt.eventSeq || Date.now()),
        agentName: evt.agentName,
        amount: evt.amount,
        branch: branchName,
        timestamp: Date.now(),
      });

      if (evt.overtake && evt.type === 'deposit' && evt.amount > 0) {
        const matchedAgent = agentsRef.current.find((a) => a.id === evt.agentId);
        const fallbackAgent: Agent = matchedAgent || {
          id: evt.agentId || 'top-1',
          name: evt.agentName,
          code: 'TOP-1',
          branch: branchName,
          color: branchName === 'Conversión' ? '#10B981' : '#3B82F6',
          avatarSeed: evt.agentName,
          dailyTotal: evt.amount,
          grandTotal: evt.amount,
          dailyDepositCount: 1,
          totalDepositCount: 1,
        };

        soundEngine.playTop1Fanfare();
        setCelebrationEvent({
          agent: fallbackAgent,
          previousLeaderName: evt.previousLeaderName,
          newAmount: matchedAgent ? matchedAgent.grandTotal : evt.amount,
          view: 'total',
          timestamp: Date.now(),
        });
      }
    });

    return () => {
      unsubscribeEvents();
    };
  }, [currentArea]);

  // 2. Auto-seed Firestore on first verified Admin login if collection is empty
  useEffect(() => {
    if (authReady && isAdmin && !hasSeededRef.current) {
      hasSeededRef.current = true;
      void ensureSeededInFirestore(agentsRef.current).catch((err) => {
        console.error('Error seeding Firestore agents:', err);
        hasSeededRef.current = false;
      });
    }
  }, [authReady, isAdmin]);

  // Department counts & Retención grand total (for $550,000 target tracking)
  const retencionCount = useMemo(() => agents.filter((a) => a.branch === 'Retención').length, [agents]);
  const conversionCount = useMemo(() => agents.filter((a) => a.branch === 'Conversión').length, [agents]);
  const retencionGrandTotal = useMemo(
    () =>
      agents
        .filter((a) => a.branch === 'Retención')
        .reduce((sum, ag) => sum + (Number.isFinite(ag.grandTotal) ? ag.grandTotal : 0), 0),
    [agents]
  );

  // Trigger giant crown + explosions + money rain when Total Ret crosses the $550,000 target
  useEffect(() => {
    if (!agentsSyncedFromFirestore) return;

    if (prevRetencionTotalRef.current === null) {
      prevRetencionTotalRef.current = retencionGrandTotal;
      return;
    }

    const crossedTarget =
      prevRetencionTotalRef.current < RETENCION_TARGET_AMOUNT &&
      retencionGrandTotal >= RETENCION_TARGET_AMOUNT;

    prevRetencionTotalRef.current = retencionGrandTotal;

    if (crossedTarget && currentArea === 'Retención') {
      soundEngine.playTargetReachedCelebration();
      setShowTargetCelebration(true);
    }
  }, [agentsSyncedFromFirestore, retencionGrandTotal, currentArea]);

  // Agents filtered by current active area
  const areaAgents = useMemo(() => {
    return agents.filter((a) => a.branch === currentArea);
  }, [agents, currentArea]);

  // Sorted agents based on active area (Retención always ranked by Total, Conversión by Total Ventas)
  const sortedAgents = useMemo(() => {
    return [...areaAgents].sort((a, b) => {
      if (currentArea === 'Conversión') {
        const salesDiff = getConversionSalesCount(b.grandTotal) - getConversionSalesCount(a.grandTotal);
        if (salesDiff !== 0) return salesDiff;
        return b.grandTotal - a.grandTotal;
      }
      // Retención: Top 1 is always whoever has the most accumulated in Total
      const totalDiff = b.grandTotal - a.grandTotal;
      if (totalDiff !== 0) return totalDiff;
      return b.dailyTotal - a.dailyTotal;
    });
  }, [areaAgents, currentArea]);

  const top1Agent = sortedAgents[0];

  // Deposit registration persisted in Cloud Firestore
  const handleConfirmDeposit = useCallback(
    async (
      agentId: string,
      amount: number,
      method: DepositMethod = 'Efectivo',
      reference?: string
    ) => {
      try {
        await submitDepositFirestore({
          agentId,
          amount,
          method,
          reference,
          allAgents: agentsRef.current,
        });
      } catch (err) {
        console.error('Error submitting deposit to Firestore:', err);
      }
    },
    []
  );

  // Quick simulation function to test the coin sound, notification, and celebration
  const handleSimulateDeposit = useCallback(() => {
    if (sortedAgents.length === 0) return;

    const candidate = sortedAgents[1] || sortedAgents[0];
    if (currentArea === 'Conversión') {
      const top1Sales = getConversionSalesCount(sortedAgents[0].grandTotal);
      const targetAmount = (top1Sales + 1) * CONVERSION_SALE_AMOUNT;
      const needed = Math.max(CONVERSION_SALE_AMOUNT, targetAmount - candidate.grandTotal);
      const simAmount = Math.ceil(needed / CONVERSION_SALE_AMOUNT) * CONVERSION_SALE_AMOUNT;
      void handleConfirmDeposit(candidate.id, simAmount, 'Efectivo', 'SIM-VENTA');
      return;
    }

    const top1Amount = sortedAgents[0].grandTotal;
    const candidateAmount = candidate.grandTotal;

    const diff = Math.max(0, top1Amount - candidateAmount);
    const simAmount = diff > 0 ? diff + 100000 : 200000;

    void handleConfirmDeposit(candidate.id, simAmount, 'Efectivo', 'SIM-TEST');
  }, [sortedAgents, currentArea, handleConfirmDeposit]);

  const handleToggleMute = (muted: boolean) => {
    setIsMuted(muted);
    soundEngine.setMuted(muted);
  };

  const handleConfirmReset = async (type: 'daily' | 'total') => {
    try {
      if (type === 'daily') {
        await resetDailyFirestore(currentArea, agentsRef.current);
      } else if (type === 'total') {
        await resetTotalFirestore(currentArea, agentsRef.current);
      }
    } catch (err) {
      console.error('Error resetting in Firestore:', err);
    }
  };

  const handleDismissNotification = useCallback(() => setActiveNotification(null), []);
  const handleCloseCelebration = useCallback(() => setCelebrationEvent(null), []);
  const handleCloseTargetCelebration = useCallback(() => setShowTargetCelebration(false), []);
  const handleReplayTargetCelebration = useCallback(() => {
    soundEngine.playTargetReachedCelebration();
    setShowTargetCelebration(true);
  }, []);
  const handleToggleSort = useCallback((view: RankingView) => setSortBy(view), []);

  // Admin Panel CRUD Handlers persisted in Cloud Firestore
  const handleAddAgent = async (newAgent: Agent) => {
    try {
      await createAgentFirestore(newAgent);
      soundEngine.playCoinMoneySound();
      const agentBranch: 'Retención' | 'Conversión' =
        newAgent.branch === 'Conversión' ? 'Conversión' : 'Retención';
      if (agentBranch === currentArea) {
        setActiveNotification({
          id: String(Date.now()),
          agentName: `${newAgent.name} (Nuevo Agente)`,
          amount: 0,
          branch: agentBranch,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error adding agent to Firestore:', err);
    }
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    try {
      await updateAgentFirestore(updatedAgent);
      soundEngine.playCoinMoneySound();
      const agentBranch: 'Retención' | 'Conversión' =
        updatedAgent.branch === 'Conversión' ? 'Conversión' : 'Retención';
      if (agentBranch === currentArea) {
        setActiveNotification({
          id: String(Date.now()),
          agentName: `${updatedAgent.name} (Actualizado)`,
          amount: 0,
          branch: agentBranch,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error updating agent in Firestore:', err);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const target = agents.find((a) => a.id === agentId);
      await deleteAgentFirestore(agentId);
      const agentBranch: 'Retención' | 'Conversión' =
        target?.branch === 'Conversión' ? 'Conversión' : 'Retención';
      if (agentBranch === currentArea) {
        setActiveNotification({
          id: String(Date.now()),
          agentName: `${target?.name || 'Agente'} Eliminado`,
          amount: 0,
          branch: agentBranch,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error deleting agent in Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification with Agent Name */}
      <DepositNotification
        notification={activeNotification}
        onDismiss={handleDismissNotification}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800">
        <div className={`${currentView === 'leaderboard' ? 'w-full px-3 sm:px-5' : 'max-w-6xl mx-auto px-4 sm:px-6'} h-14 flex items-center justify-between gap-4`}>
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 p-0.5 flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                  Tabla de Posiciones
                </h1>
                {/* Live Sync Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                  title={isConnected ? 'Sincronizado en tiempo real con todas las pantallas' : 'Reconectando con el servidor...'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {isConnected ? 'En Vivo' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Agentes · <span className={`font-bold ${currentArea === 'Conversión' ? 'text-emerald-400' : 'text-blue-400'}`}>Área de {currentArea}</span>
              </p>
            </div>
          </div>

          {/* Zone 2: Area Switcher & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Area Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => handleSwitchArea('Retención')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentArea === 'Retención'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢 Retención</span>
                <span className="text-[10px] opacity-80 font-mono">({retencionCount})</span>
              </button>

              <button
                onClick={() => handleSwitchArea('Conversión')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentArea === 'Conversión'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎯 Conversión</span>
                <span className="text-[10px] opacity-80 font-mono">({conversionCount})</span>
              </button>
            </div>

            {/* View Switcher between Table & Admin Panel */}
            <div className="hidden sm:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'leaderboard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>

              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Zone 3: Leader Crown Indicator & Controls */}
          <div className="flex items-center gap-2">
            {top1Agent && currentView === 'leaderboard' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-300">
                  Top 1: <strong className="text-amber-300 font-bold">{top1Agent.name}</strong>
                  {currentArea === 'Conversión' && (
                    <span className="ml-1.5 text-emerald-300 font-mono font-bold">
                      ({getConversionSalesCount(top1Agent.grandTotal)}{' '}
                      {getConversionSalesCount(top1Agent.grandTotal) === 1 ? 'venta' : 'ventas'})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Mobile Admin toggle */}
            <button
              onClick={() => setCurrentView((v) => (v === 'leaderboard' ? 'admin' : 'leaderboard'))}
              className={`sm:hidden p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
              title="Panel Admin"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Enlace Corto para Smart TV / QR */}
            <button
              onClick={() => {
                setTvModalArea(currentArea);
                setShowTvModal(true);
              }}
              className="p-2 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Ver enlace corto para escribir en Smart TV o escanear QR"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Enlace TV</span>
            </button>

            {/* TV Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Pantalla Completa (Ideal para TV)'}
              aria-label="Pantalla Completa"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => handleToggleMute(!isMuted)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-slate-900 border-slate-700 text-emerald-400'
              }`}
              title={isMuted ? 'Activar sonido de monedas' : 'Silenciar sonido'}
              aria-label="Alternar sonido"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className={`flex-1 flex flex-col w-full ${currentView === 'leaderboard' ? 'px-2 sm:px-3 py-2' : 'max-w-6xl mx-auto px-4 sm:px-6 py-3'}`}>
        {currentView === 'leaderboard' ? (
          /* Clean Full-Width & Full-Height Leaderboard Page for Smart TV */
          <div className="flex-1 flex flex-col w-full">
            <SimpleLeaderboardTable
              agents={sortedAgents}
              area={currentArea}
              sortBy={sortBy}
              onToggleSort={handleToggleSort}
              onReplayTargetCelebration={handleReplayTargetCelebration}
            />
          </div>
        ) : (
          /* Dedicated Independent Admin Panel: Deposit Entry, Reset Controls & Agent CRUD */
          <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Cargando panel administrativo...</div>}>
            <AdminPanel
              agents={agents}
              currentArea={currentArea}
              onConfirmDeposit={handleConfirmDeposit}
              onAddAgent={handleAddAgent}
              onUpdateAgent={handleUpdateAgent}
              onDeleteAgent={handleDeleteAgent}
              onResetDaily={() => setConfirmResetType('daily')}
              onResetTotal={() => setConfirmResetType('total')}
              onSimulateDeposit={handleSimulateDeposit}
              onBackToBoard={() => setCurrentView('leaderboard')}
            />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-2 mt-auto bg-slate-950 text-center text-xs text-slate-500">
        <div className={`${currentView === 'leaderboard' ? 'w-full px-3 sm:px-5' : 'max-w-6xl mx-auto px-4'} flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500`}>
          <p>
            Tabla de Posiciones de Agentes · Sincronización en tiempo real entre múltiples pantallas y Smart TVs
          </p>
          <p className="text-[11px] text-slate-400">
            Mostrando: <strong className={currentArea === 'Conversión' ? 'text-emerald-400' : 'text-blue-400'}>Top 10 · Área de {currentArea}</strong>
          </p>
        </div>
      </footer>

      {/* Celebration Modal when reaching Top 1 */}
      {celebrationEvent && (
        <Suspense fallback={null}>
          <CelebrationModal
            event={celebrationEvent}
            onClose={handleCloseCelebration}
          />
        </Suspense>
      )}

      {/* Giant Crown + Explosions + Money Rain Modal when Retención reaches $550,000 Target */}
      {showTargetCelebration && (
        <Suspense fallback={null}>
          <TargetCelebrationModal
            totalAmount={retencionGrandTotal}
            targetAmount={RETENCION_TARGET_AMOUNT}
            onClose={handleCloseTargetCelebration}
          />
        </Suspense>
      )}

      {/* Reset Confirmation Modal */}
      {confirmResetType && (
        <Suspense fallback={null}>
          <ResetConfirmModal
            resetType={confirmResetType}
            areaName={currentArea}
            onClose={() => setConfirmResetType(null)}
            onConfirm={handleConfirmReset}
          />
        </Suspense>
      )}

      {/* Modal: Enlace Corto & QR para Smart TV */}
      {showTvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center animate-tv-modal">
            <button
              onClick={() => setShowTvModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <Tv className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-white">Enlaces para Smart TV</h3>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona el área que quieres visualizar en tu televisor:
            </p>

            {/* Area selection tabs inside modal */}
            <div className="flex items-center justify-center p-1 bg-slate-950 border border-slate-800 rounded-xl my-3">
              <button
                type="button"
                onClick={() => setTvModalArea('Retención')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tvModalArea === 'Retención'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏢 Retención
              </button>
              <button
                type="button"
                onClick={() => setTvModalArea('Conversión')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tvModalArea === 'Conversión'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎯 Conversión
              </button>
            </div>

            {/* Direct short URL banner */}
            <div className="my-3 p-3 bg-slate-950 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono font-black text-amber-300 text-base sm:text-lg select-all">
                {tvModalArea === 'Conversión' ? 'is.gd/conversiontv' : 'is.gd/retenciontv'}
              </span>
              <button
                onClick={() => {
                  const url = tvModalArea === 'Conversión' ? 'https://is.gd/conversiontv' : 'https://is.gd/retenciontv';
                  navigator.clipboard?.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2.5 rounded-xl inline-block mb-3 border border-slate-700">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
                  tvModalArea === 'Conversión'
                    ? 'https://is.gd/conversiontv'
                    : 'https://is.gd/retenciontv'
                }`}
                alt="Código QR para Smart TV"
                className="w-36 h-36 mx-auto block"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Escribe el enlace en el navegador de tu TV o escanea el QR con la cámara de tu celular.
            </p>

            <button
              onClick={() => setShowTvModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
