import { Agent, Deposit } from '../types';

const AGENTS_KEY = 'deposit_agents_v1';
const DEPOSITS_KEY = 'deposits_history_v1';

export const INITIAL_AGENTS: Agent[] = [
  { id: 'ag-1', name: 'A. Morillo', code: 'AG-01', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Morillo', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-2', name: 'F. Lopez', code: 'AG-02', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Lopez', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-3', name: 'J. Adams', code: 'AG-03', branch: 'Retención', color: '#3B82F6', avatarSeed: 'JAdams', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-4', name: 'A. Adams', code: 'AG-04', branch: 'Retención', color: '#3B82F6', avatarSeed: 'AAdams', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-5', name: 'R. Cortes', code: 'AG-05', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Cortes', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-6', name: 'S. Galarce', code: 'AG-06', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Galarce', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-7', name: 'B. Duckket', code: 'AG-07', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Duckket', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-8', name: 'J. Dupre', code: 'AG-08', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Dupre', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-9', name: 'R. Palacios', code: 'AG-09', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Palacios', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-10', name: 'A. Sandoval', code: 'AG-10', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Sandoval', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-11', name: 'A. Montes', code: 'AG-11', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Montes', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-12', name: 'A. Guzman', code: 'AG-12', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Guzman', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-13', name: 'S. Benford', code: 'AG-13', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Benford', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-14', name: 'C. Fernandez', code: 'AG-14', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Fernandez', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-15', name: 'S. Suarez', code: 'AG-15', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Suarez', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-16', name: 'M. Ferreira', code: 'AG-16', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Ferreira', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-17', name: 'M. Louis', code: 'AG-17', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Louis', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-18', name: 'A. Wilson', code: 'AG-18', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Wilson', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-19', name: 'M. Martinez', code: 'AG-19', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Martinez', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-20', name: 'Z. Ferrari', code: 'AG-20', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Ferrari', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-21', name: 'J. Rodriguez', code: 'AG-21', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Rodriguez', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-22', name: 'R. Torres', code: 'AG-22', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Torres', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-23', name: 'J. Ortiz', code: 'AG-23', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Ortiz', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-24', name: 'J. Pablo', code: 'AG-24', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Pablo', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-25', name: 'V. Banoli', code: 'AG-25', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Banoli', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-26', name: 'D. Bauman', code: 'AG-26', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Bauman', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-27', name: 'T. Munoz', code: 'AG-27', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Munoz', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-28', name: 'C. Meyer', code: 'AG-28', branch: 'Retención', color: '#3B82F6', avatarSeed: 'Meyer', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  // Agentes Iniciales - Área de Conversión
  { id: 'ag-cv-1', name: 'Agente 1', code: 'CV-01', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV1', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-2', name: 'Agente 2', code: 'CV-02', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV2', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-3', name: 'Agente 3', code: 'CV-03', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV3', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-4', name: 'Agente 4', code: 'CV-04', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV4', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-5', name: 'Agente 5', code: 'CV-05', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV5', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-6', name: 'Agente 6', code: 'CV-06', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV6', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-7', name: 'Agente 7', code: 'CV-07', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV7', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-8', name: 'Agente 8', code: 'CV-08', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV8', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-9', name: 'Agente 9', code: 'CV-09', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV9', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
  { id: 'ag-cv-10', name: 'Agente 10', code: 'CV-10', branch: 'Conversión', color: '#10B981', avatarSeed: 'CV10', dailyTotal: 0, grandTotal: 0, dailyDepositCount: 0, totalDepositCount: 0 },
];

export const INITIAL_DEPOSITS: Deposit[] = [];

export function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(AGENTS_KEY);
    if (!raw) {
      saveAgents(INITIAL_AGENTS);
      return INITIAL_AGENTS;
    }
    const parsed: Agent[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAgents(INITIAL_AGENTS);
      return INITIAL_AGENTS;
    }
    const hasOldAgents = parsed.some((a) => a.name === 'Carlos Mendoza' || a.name === 'Valentina Restrepo');
    if (hasOldAgents) {
      saveAgents(INITIAL_AGENTS);
      return INITIAL_AGENTS;
    }
    const updated = parsed.map((ag) => ({
      ...ag,
      branch: !ag.branch || ag.branch.toLowerCase().includes('sede') ? 'Retención' : ag.branch,
      dailyTotal: ag.dailyTotal || 0,
      grandTotal: ag.grandTotal || 0,
      dailyDepositCount: ag.dailyDepositCount || 0,
      totalDepositCount: ag.totalDepositCount || 0,
    }));
    return updated;
  } catch {
    return INITIAL_AGENTS;
  }
}

let lastSavedAgentsStr = '';
export function saveAgents(agents: Agent[]) {
  try {
    const serialized = JSON.stringify(agents);
    if (serialized === lastSavedAgentsStr) return;
    lastSavedAgentsStr = serialized;
    localStorage.setItem(AGENTS_KEY, serialized);
  } catch (err) {
    console.error('Failed to save agents to localStorage:', err);
  }
}

export function loadDeposits(): Deposit[] {
  try {
    const raw = localStorage.getItem(DEPOSITS_KEY);
    if (!raw) {
      saveDeposits(INITIAL_DEPOSITS);
      return INITIAL_DEPOSITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEPOSITS;
  }
}

let lastSavedDepositsStr = '';
export function saveDeposits(deposits: Deposit[]) {
  try {
    const serialized = JSON.stringify(deposits);
    if (serialized === lastSavedDepositsStr) return;
    lastSavedDepositsStr = serialized;
    localStorage.setItem(DEPOSITS_KEY, serialized);
  } catch (err) {
    console.error('Failed to save deposits to localStorage:', err);
  }
}

export function resetDailyDeposits(): Agent[] {
  const agents = loadAgents();
  const updated = agents.map((ag) => ({
    ...ag,
    dailyTotal: 0,
    dailyDepositCount: 0,
  }));
  saveAgents(updated);
  return updated;
}

export function resetTotalDeposits(): Agent[] {
  const agents = loadAgents();
  const updated = agents.map((ag) => ({
    ...ag,
    dailyTotal: 0,
    grandTotal: 0,
    dailyDepositCount: 0,
    totalDepositCount: 0,
    lastDepositAt: undefined,
  }));
  saveAgents(updated);
  saveDeposits([]);
  return updated;
}

export function resetAllData(): { agents: Agent[]; deposits: Deposit[] } {
  saveAgents(INITIAL_AGENTS);
  saveDeposits(INITIAL_DEPOSITS);
  return { agents: INITIAL_AGENTS, deposits: INITIAL_DEPOSITS };
}
