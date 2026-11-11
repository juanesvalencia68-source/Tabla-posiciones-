import { Agent, Deposit } from '../types';

const AGENTS_KEY = 'deposit_agents_v1';
const DEPOSITS_KEY = 'deposits_history_v1';

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'ag-1',
    name: 'Carlos Mendoza',
    code: 'AG-01',
    branch: 'Retención',
    color: '#3B82F6', // Blue
    avatarSeed: 'Carlos',
    dailyTotal: 1850000,
    grandTotal: 14250000,
    dailyDepositCount: 6,
    totalDepositCount: 42,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ag-2',
    name: 'Valentina Restrepo',
    code: 'AG-02',
    branch: 'Retención',
    color: '#10B981', // Emerald
    avatarSeed: 'Valentina',
    dailyTotal: 2150000,
    grandTotal: 16800000,
    dailyDepositCount: 8,
    totalDepositCount: 48,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'ag-3',
    name: 'Mateo Gómez',
    code: 'AG-03',
    branch: 'Retención',
    color: '#8B5CF6', // Purple
    avatarSeed: 'Mateo',
    dailyTotal: 1400000,
    grandTotal: 11900000,
    dailyDepositCount: 5,
    totalDepositCount: 36,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'ag-4',
    name: 'Daniela Herrera',
    code: 'AG-04',
    branch: 'Retención',
    color: '#F59E0B', // Amber
    avatarSeed: 'Daniela',
    dailyTotal: 950000,
    grandTotal: 9650000,
    dailyDepositCount: 3,
    totalDepositCount: 29,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
  },
  {
    id: 'ag-5',
    name: 'Andrés Felipe Silva',
    code: 'AG-05',
    branch: 'Retención',
    color: '#EC4899', // Pink
    avatarSeed: 'Andres',
    dailyTotal: 650000,
    grandTotal: 8100000,
    dailyDepositCount: 2,
    totalDepositCount: 24,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: 'ag-6',
    name: 'Camila Torres',
    code: 'AG-06',
    branch: 'Retención',
    color: '#06B6D4', // Cyan
    avatarSeed: 'Camila',
    dailyTotal: 400000,
    grandTotal: 6900000,
    dailyDepositCount: 2,
    totalDepositCount: 19,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
];

export const INITIAL_DEPOSITS: Deposit[] = [
  {
    id: 'dep-1',
    agentId: 'ag-2',
    agentName: 'Valentina Restrepo',
    amount: 500000,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    method: 'Transferencia',
    reference: 'TR-99824',
    notes: 'Depósito cliente corporativo',
  },
  {
    id: 'dep-2',
    agentId: 'ag-1',
    agentName: 'Carlos Mendoza',
    amount: 350000,
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    method: 'Efectivo',
    reference: 'EF-44120',
    notes: 'Recaudo sucursal centro',
  },
  {
    id: 'dep-3',
    agentId: 'ag-3',
    agentName: 'Mateo Gómez',
    amount: 450000,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    method: 'Tarjeta',
    reference: 'TJ-77610',
    notes: 'Pago con datáfono',
  },
  {
    id: 'dep-4',
    agentId: 'ag-2',
    agentName: 'Valentina Restrepo',
    amount: 750000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    method: 'Transferencia',
    reference: 'TR-99811',
  },
  {
    id: 'dep-5',
    agentId: 'ag-4',
    agentName: 'Daniela Herrera',
    amount: 300000,
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    method: 'Efectivo',
    reference: 'EF-44098',
  },
];

export function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(AGENTS_KEY);
    if (!raw) {
      saveAgents(INITIAL_AGENTS);
      return INITIAL_AGENTS;
    }
    const parsed: Agent[] = JSON.parse(raw);
    const updated = parsed.map((ag) => ({
      ...ag,
      branch: !ag.branch || ag.branch.toLowerCase().includes('sede') ? 'Retención' : ag.branch,
    }));
    return updated;
  } catch {
    return INITIAL_AGENTS;
  }
}

export function saveAgents(agents: Agent[]) {
  try {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
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

export function saveDeposits(deposits: Deposit[]) {
  try {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(deposits));
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
