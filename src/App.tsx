/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Crown, Sparkles, Volume2, VolumeX, Settings, Trophy, LayoutDashboard } from 'lucide-react';
import { Agent, Deposit, DepositMethod, RankingView, Top1OvertakeEvent } from './types';
import { 
  loadAgents, 
  saveAgents, 
  loadDeposits, 
  saveDeposits, 
  resetDailyDeposits, 
  resetTotalDeposits,
  resetAllData 
} from './utils/storage';
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

  // Load initial data
  useEffect(() => {
    setAgents(loadAgents());
    setDeposits(loadDeposits());
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

  // Handle deposit registration
  const handleConfirmDeposit = useCallback(
    (
      agentId: string,
      amount: number,
      method: DepositMethod = 'Efectivo',
      reference?: string
    ) => {
      // 1. Play authentic coin sound
      soundEngine.playCoinMoneySound();

      // Check current leader before applying deposit
      const previousLeader = [...agents].sort((a, b) => {
        return sortBy === 'daily' ? b.dailyTotal - a.dailyTotal : b.grandTotal - a.grandTotal;
      })[0];

      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const now = new Date().toISOString();
      const updatedAgent: Agent = {
        ...agent,
        dailyTotal: agent.dailyTotal + amount,
        grandTotal: agent.grandTotal + amount,
        dailyDepositCount: agent.dailyDepositCount + 1,
        totalDepositCount: agent.totalDepositCount + 1,
        lastDepositAt: now,
      };

      const updatedAgents = agents.map((a) => (a.id === agentId ? updatedAgent : a));
      saveAgents(updatedAgents);
      setAgents(updatedAgents);

      // Save deposit record
      const newDeposit: Deposit = {
        id: `dep-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        amount,
        timestamp: now,
        method,
        reference,
      };
      const updatedDeposits = [newDeposit, ...deposits];
      saveDeposits(updatedDeposits);
      setDeposits(updatedDeposits);

      // 2. Trigger notification with agent name and amount
      setActiveNotification({
        id: String(Date.now()),
        agentName: agent.name,
        amount: amount,
        timestamp: Date.now(),
      });

      // 3. Check if this agent reached or took Top 1
      const newLeader = [...updatedAgents].sort((a, b) => {
        return sortBy === 'daily' ? b.dailyTotal - a.dailyTotal : b.grandTotal - a.grandTotal;
      })[0];

      if (newLeader.id === updatedAgent.id && previousLeader?.id !== updatedAgent.id) {
        soundEngine.playTop1Fanfare();
        setCelebrationEvent({
          agent: updatedAgent,
          previousLeaderName: previousLeader?.name,
          newAmount: sortBy === 'daily' ? updatedAgent.dailyTotal : updatedAgent.grandTotal,
          view: sortBy,
          timestamp: Date.now(),
        });
      }
    },
    [agents, deposits, sortBy]
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

  const handleConfirmReset = (type: 'daily' | 'total') => {
    if (type === 'daily') {
      const updated = resetDailyDeposits();
      setAgents(updated);
      soundEngine.playCoinMoneySound();
      setActiveNotification({
        id: String(Date.now()),
        agentName: 'Reinicio Diario a $0',
        amount: 0,
        timestamp: Date.now(),
      });
    } else if (type === 'total') {
      const updated = resetTotalDeposits();
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
  };

  const handleRestoreDemoData = () => {
    const restored = resetAllData();
    setAgents(restored.agents);
    setDeposits(restored.deposits);
    soundEngine.playCoinMoneySound();
    setActiveNotification({
      id: String(Date.now()),
      agentName: 'Datos de Ejemplo Restaurados',
      amount: 0,
      timestamp: Date.now(),
    });
  };

  // Admin Panel CRUD Handlers
  const handleAddAgent = (newAgent: Agent) => {
    const updated = [...agents, newAgent];
    saveAgents(updated);
    setAgents(updated);
    soundEngine.playCoinMoneySound();
    setActiveNotification({
      id: String(Date.now()),
      agentName: `${newAgent.name} (Nuevo Agente Creado)`,
      amount: newAgent.dailyTotal,
      timestamp: Date.now(),
    });
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    const updated = agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a));
    saveAgents(updated);
    setAgents(updated);
    soundEngine.playCoinMoneySound();
    setActiveNotification({
      id: String(Date.now()),
      agentName: `${updatedAgent.name} (Datos Actualizados)`,
      amount: updatedAgent.dailyTotal,
      timestamp: Date.now(),
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    const target = agents.find((a) => a.id === agentId);
    const updated = agents.filter((a) => a.id !== agentId);
    saveAgents(updated);
    setAgents(updated);
    setActiveNotification({
      id: String(Date.now()),
      agentName: `${target?.name || 'Agente'} Eliminado`,
      amount: 0,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification with Agent Name */}
      <DepositNotification
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                Tabla de Posiciones
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Agentes de Depósitos</p>
            </div>
          </div>

          {/* Zone 2: Navigation Switcher between Table & Admin Panel */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </button>
          </div>

          {/* Zone 3: Leader Crown Indicator & Audio Toggle */}
          <div className="flex items-center gap-2">
            {top1Agent && currentView === 'leaderboard' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-xs text-slate-300">
                  Top 1: <strong className="text-amber-300 font-bold">{top1Agent.name}</strong>
                </span>
              </div>
            )}

            <button
              onClick={() => handleToggleMute(!isMuted)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-slate-900 border-slate-700 text-emerald-400'
              }`}
              title={isMuted ? 'Activar sonido de monedas' : 'Silenciar sonido'}
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
          <p>Tabla de Posiciones de Agentes · Sonido de monedas al registrar depósitos</p>
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
