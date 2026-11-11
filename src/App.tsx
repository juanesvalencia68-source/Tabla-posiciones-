/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Crown, Volume2, VolumeX, Settings, Trophy, Maximize, Minimize, Radio, Wifi, WifiOff } from 'lucide-react';
import { Agent, Deposit, DepositMethod, RankingView, Top1OvertakeEvent } from './types';
import { 
  fetchState,
  subscribeToLiveUpdates,
  submitDepositApi,
  resetDailyApi,
  resetTotalApi,
  createAgentApi,
  updateAgentApi,
  deleteAgentApi
} from './utils/api';
import { soundEngine } from './utils/soundEffects';
import { SimpleLeaderboardTable } from './components/SimpleLeaderboardTable';
import { AdminPanel } from './components/AdminPanel';
import { DepositNotification, NotificationData } from './components/DepositNotification';
import { CelebrationModal } from './components/CelebrationModal';
import { ResetConfirmModal, ResetType } from './components/ResetConfirmModal';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [sortBy, setSortBy] = useState<RankingView>('daily');
  const [currentView, setCurrentView] = useState<'leaderboard' | 'admin'>('leaderboard');
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);
  const [celebrationEvent, setCelebrationEvent] = useState<Top1OvertakeEvent | null>(null);
  const [confirmResetType, setConfirmResetType] = useState<ResetType>(null);
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // 1. Initial State Load & Multi-Device Real-Time Sync Setup
  useEffect(() => {
    // Load initial shared state from server
    fetchState().then((data) => {
      if (data.agents && data.agents.length > 0) {
        setAgents(data.agents);
      }
      if (data.deposits) {
        setDeposits(data.deposits);
      }
    });

    // Subscribe to live SSE updates (when ANY device posts a deposit, resets, or updates agents)
    const unsubscribe = subscribeToLiveUpdates({
      onDepositReceived: (deposit, updatedAgents, overtake) => {
        setAgents(updatedAgents);
        setDeposits((prev) => [deposit, ...prev]);

        // Play coin money sound on all screens (TV, PCs)
        soundEngine.playCoinMoneySound();

        // Show notification toast
        setActiveNotification({
          id: String(Date.now()),
          agentName: deposit.agentName,
          amount: deposit.amount,
          timestamp: Date.now(),
        });

        // Trigger celebration if Top 1 was overtaken
        if (overtake) {
          soundEngine.playTop1Fanfare();
          setCelebrationEvent(overtake);
        }
      },
      onAgentsUpdated: (updatedAgents) => {
        setAgents(updatedAgents);
      },
      onConnectionStatusChange: (status) => {
        setIsConnected(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sorted agents based on active view (daily vs total)
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (sortBy === 'daily') {
        return b.dailyTotal - a.dailyTotal;
      }
      return b.grandTotal - a.grandTotal;
    });
  }, [agents, sortBy]);

  const top1Agent = sortedAgents[0];

  // Deposit registration via shared Server API
  const handleConfirmDeposit = useCallback(
    async (
      agentId: string,
      amount: number,
      method: DepositMethod = 'Efectivo',
      reference?: string
    ) => {
      try {
        const result = await submitDepositApi({
          agentId,
          amount,
          method,
          reference,
        });

        // Update local state immediately if server responds
        if (result.agents) {
          setAgents(result.agents);
        }
        if (result.deposit) {
          setDeposits((prev) => [result.deposit, ...prev]);
        }
      } catch (err) {
        console.error('Error submitting deposit:', err);
      }
    },
    []
  );

  // Quick simulation function to test the coin sound, notification, and celebration
  const handleSimulateDeposit = useCallback(() => {
    if (agents.length === 0) return;

    const candidate = sortedAgents[1] || sortedAgents[0];
    const top1Amount = sortBy === 'daily' ? sortedAgents[0].dailyTotal : sortedAgents[0].grandTotal;
    const candidateAmount = sortBy === 'daily' ? candidate.dailyTotal : candidate.grandTotal;

    const diff = Math.max(0, top1Amount - candidateAmount);
    const simAmount = diff > 0 ? diff + 100000 : 200000;

    handleConfirmDeposit(candidate.id, simAmount, 'Efectivo', 'SIM-TEST');
  }, [agents, sortedAgents, sortBy, handleConfirmDeposit]);

  const handleToggleMute = (muted: boolean) => {
    setIsMuted(muted);
    soundEngine.setMuted(muted);
  };

  const handleConfirmReset = async (type: 'daily' | 'total') => {
    try {
      if (type === 'daily') {
        const updated = await resetDailyApi();
        setAgents(updated);
        soundEngine.playCoinMoneySound();
        setActiveNotification({
          id: String(Date.now()),
          agentName: 'Reinicio Diario a $0',
          amount: 0,
          timestamp: Date.now(),
        });
      } else if (type === 'total') {
        const updated = await resetTotalApi();
        setAgents(updated);
        setDeposits([]);
        soundEngine.playCoinMoneySound();
        setActiveNotification({
          id: String(Date.now()),
          agentName: 'Reinicio Completo de Totales a $0',
          amount: 0,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error resetting:', err);
    }
  };

  const handleRestoreDemoData = async () => {
    try {
      const res = await fetch('/api/reset-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
        setDeposits(data.deposits);
        soundEngine.playCoinMoneySound();
        setActiveNotification({
          id: String(Date.now()),
          agentName: 'Datos de Ejemplo Restaurados',
          amount: 0,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error restoring demo data:', err);
    }
  };

  // Admin Panel CRUD Handlers synchronized via Server API
  const handleAddAgent = async (newAgent: Agent) => {
    try {
      const updated = await createAgentApi({
        name: newAgent.name,
        code: newAgent.code,
        branch: newAgent.branch,
        color: newAgent.color,
      });
      setAgents(updated);
      soundEngine.playCoinMoneySound();
      setActiveNotification({
        id: String(Date.now()),
        agentName: `${newAgent.name} (Nuevo Agente)`,
        amount: 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Error adding agent:', err);
    }
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    try {
      const updated = await updateAgentApi(updatedAgent.id, {
        name: updatedAgent.name,
        code: updatedAgent.code,
        branch: updatedAgent.branch,
        color: updatedAgent.color,
      });
      setAgents(updated);
      soundEngine.playCoinMoneySound();
      setActiveNotification({
        id: String(Date.now()),
        agentName: `${updatedAgent.name} (Actualizado)`,
        amount: 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Error updating agent:', err);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const target = agents.find((a) => a.id === agentId);
      const updated = await deleteAgentApi(agentId);
      setAgents(updated);
      setActiveNotification({
        id: String(Date.now()),
        agentName: `${target?.name || 'Agente'} Eliminado`,
        amount: 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification with Agent Name */}
      <DepositNotification
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isConnected ? 'En Vivo' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Agentes de Depósitos · Área de Retención</p>
            </div>
          </div>

          {/* Zone 2: Navigation Switcher between Table & Admin Panel */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Tabla de Posiciones</span>
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </button>
          </div>

          {/* Zone 3: Leader Crown Indicator & Controls */}
          <div className="flex items-center gap-2">
            {top1Agent && currentView === 'leaderboard' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-300">
                  Top 1: <strong className="text-amber-300 font-bold">{top1Agent.name}</strong>
                </span>
              </div>
            )}

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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'leaderboard' ? (
          /* Clean Full-Width Leaderboard Page */
          <div className="space-y-4">
            <SimpleLeaderboardTable
              agents={sortedAgents}
              sortBy={sortBy}
              onToggleSort={(view) => setSortBy(view)}
            />
          </div>
        ) : (
          /* Dedicated Independent Admin Panel: Deposit Entry, Reset Controls & Agent CRUD */
          <AdminPanel
            agents={agents}
            onConfirmDeposit={handleConfirmDeposit}
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            onResetDaily={() => setConfirmResetType('daily')}
            onResetTotal={() => setConfirmResetType('total')}
            onSimulateDeposit={handleSimulateDeposit}
            onBackToBoard={() => setCurrentView('leaderboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 mt-auto bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Tabla de Posiciones de Agentes · Sincronización en tiempo real entre múltiples pantallas y Smart TVs
          </p>
          <button
            onClick={handleRestoreDemoData}
            className="text-slate-400 hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Restaurar datos de ejemplo
          </button>
        </div>
      </footer>

      {/* Celebration Modal when reaching Top 1 */}
      <CelebrationModal
        event={celebrationEvent}
        onClose={() => setCelebrationEvent(null)}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        resetType={confirmResetType}
        onClose={() => setConfirmResetType(null)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
