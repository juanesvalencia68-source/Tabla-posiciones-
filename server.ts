import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'leaderboard-data.json');

export interface Agent {
  id: string;
  name: string;
  code: string;
  branch: string;
  color: string;
  avatarSeed: string;
  avatarUrl?: string;
  dailyTotal: number;
  grandTotal: number;
  dailyDepositCount: number;
  totalDepositCount: number;
  lastDepositAt?: string;
}

export type DepositMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque' | 'Otro';

export interface Deposit {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  timestamp: string;
  method: DepositMethod;
  reference?: string;
  notes?: string;
}

export interface Top1OvertakeEvent {
  agent: Agent;
  previousLeaderName?: string;
  newAmount: number;
  view: 'daily' | 'total';
  timestamp: number;
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'ag-1',
    name: 'Carlos Mendoza',
    code: 'AG-01',
    branch: 'Retención',
    color: '#3B82F6',
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
    color: '#10B981',
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
    color: '#8B5CF6',
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
    color: '#F59E0B',
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
    color: '#EC4899',
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
    color: '#06B6D4',
    avatarSeed: 'Camila',
    dailyTotal: 400000,
    grandTotal: 6900000,
    dailyDepositCount: 2,
    totalDepositCount: 19,
    lastDepositAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
];

const INITIAL_DEPOSITS: Deposit[] = [
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
];

interface AppState {
  agents: Agent[];
  deposits: Deposit[];
}

let state: AppState = {
  agents: INITIAL_AGENTS,
  deposits: INITIAL_DEPOSITS,
};

// Ensure data folder and load persisted data
function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.agents)) {
        state.agents = parsed.agents.map((ag: Agent) => ({
          ...ag,
          branch: !ag.branch || ag.branch.toLowerCase().includes('sede') ? 'Retención' : ag.branch,
        }));
      }
      if (parsed && Array.isArray(parsed.deposits)) {
        state.deposits = parsed.deposits;
      }
    } else {
      saveStorage();
    }
  } catch (err) {
    console.error('Error initializing storage file:', err);
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving storage file:', err);
  }
}

initStorage();

// Real-Time Server-Sent Events (SSE) Client Pool
const sseClients = new Set<Response>();

function broadcastSSE(eventType: string, data: unknown) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Heartbeat every 20s to keep connection open through Smart TV proxies
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 20000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // SSE endpoint for instant multi-device synchronization
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(': connected\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get full synchronized state
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(state);
  });

  // Register a deposit from any device
  app.post('/api/deposits', (req: Request, res: Response) => {
    const { agentId, amount, method, reference, notes } = req.body;
    const numAmount = Number(amount);

    if (!agentId || isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Monto y agente son obligatorios' });
      return;
    }

    const agentIndex = state.agents.findIndex((a) => a.id === agentId);
    if (agentIndex === -1) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    const previousDailyLeader = [...state.agents].sort((a, b) => b.dailyTotal - a.dailyTotal)[0];
    const targetAgent = state.agents[agentIndex];

    const newDeposit: Deposit = {
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agentId: targetAgent.id,
      agentName: targetAgent.name,
      amount: numAmount,
      timestamp: new Date().toISOString(),
      method: method || 'Transferencia',
      reference: reference?.trim() || undefined,
      notes: notes?.trim() || undefined,
    };

    const updatedAgent: Agent = {
      ...targetAgent,
      dailyTotal: targetAgent.dailyTotal + numAmount,
      grandTotal: targetAgent.grandTotal + numAmount,
      dailyDepositCount: targetAgent.dailyDepositCount + 1,
      totalDepositCount: targetAgent.totalDepositCount + 1,
      lastDepositAt: newDeposit.timestamp,
    };

    state.agents[agentIndex] = updatedAgent;
    state.deposits = [newDeposit, ...state.deposits].slice(0, 100);

    // Check if daily Top 1 was overtaken
    const newDailyLeader = [...state.agents].sort((a, b) => b.dailyTotal - a.dailyTotal)[0];
    let overtakeEvent: Top1OvertakeEvent | null = null;

    if (
      newDailyLeader.id === updatedAgent.id &&
      (!previousDailyLeader || previousDailyLeader.id !== updatedAgent.id) &&
      updatedAgent.dailyTotal > (previousDailyLeader?.dailyTotal || 0)
    ) {
      overtakeEvent = {
        agent: updatedAgent,
        previousLeaderName: previousDailyLeader?.name,
        newAmount: updatedAgent.dailyTotal,
        view: 'daily',
        timestamp: Date.now(),
      };
    }

    saveStorage();

    // Broadcast to TV and all connected PCs
    broadcastSSE('deposit', {
      deposit: newDeposit,
      agents: state.agents,
      overtakeEvent,
    });

    res.json({
      success: true,
      deposit: newDeposit,
      agents: state.agents,
      overtakeEvent,
    });
  });

  // Reset daily deposits to 0
  app.post('/api/reset-daily', (_req: Request, res: Response) => {
    state.agents = state.agents.map((ag) => ({
      ...ag,
      dailyTotal: 0,
      dailyDepositCount: 0,
    }));
    saveStorage();

    broadcastSSE('reset_daily', { agents: state.agents });
    res.json({ success: true, agents: state.agents });
  });

  // Reset total and daily deposits to 0
  app.post('/api/reset-total', (_req: Request, res: Response) => {
    state.agents = state.agents.map((ag) => ({
      ...ag,
      dailyTotal: 0,
      grandTotal: 0,
      dailyDepositCount: 0,
      totalDepositCount: 0,
      lastDepositAt: undefined,
    }));
    state.deposits = [];
    saveStorage();

    broadcastSSE('reset_total', { agents: state.agents });
    res.json({ success: true, agents: state.agents });
  });

  // Create an agent
  app.post('/api/agents', (req: Request, res: Response) => {
    const { name, code, branch, color } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Nombre y código son obligatorios' });
      return;
    }

    const newAgent: Agent = {
      id: `ag-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      branch: (branch?.trim() || 'Retención'),
      color: color || '#3B82F6',
      avatarSeed: name.trim(),
      dailyTotal: 0,
      grandTotal: 0,
      dailyDepositCount: 0,
      totalDepositCount: 0,
    };

    state.agents.push(newAgent);
    saveStorage();

    broadcastSSE('agents_updated', { agents: state.agents });
    res.json({ success: true, agent: newAgent, agents: state.agents });
  });

  // Update an agent
  app.put('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, branch, color } = req.body;

    const index = state.agents.findIndex((a) => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    state.agents[index] = {
      ...state.agents[index],
      name: name?.trim() || state.agents[index].name,
      code: code?.trim().toUpperCase() || state.agents[index].code,
      branch: branch?.trim() || state.agents[index].branch,
      color: color || state.agents[index].color,
    };

    saveStorage();
    broadcastSSE('agents_updated', { agents: state.agents });
    res.json({ success: true, agent: state.agents[index], agents: state.agents });
  });

  // Delete an agent
  app.delete('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    state.agents = state.agents.filter((a) => a.id !== id);
    saveStorage();

    broadcastSSE('agents_updated', { agents: state.agents });
    res.json({ success: true, agents: state.agents });
  });

  // Reset to initial demo agents
  app.post('/api/reset-all', (_req: Request, res: Response) => {
    state.agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
    state.deposits = JSON.parse(JSON.stringify(INITIAL_DEPOSITS));
    saveStorage();

    broadcastSSE('agents_updated', { agents: state.agents });
    res.json({ success: true, agents: state.agents, deposits: state.deposits });
  });

  // Mount Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Leaderboard server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
