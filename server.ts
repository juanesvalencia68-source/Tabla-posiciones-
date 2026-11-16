import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCliArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith('-')) {
    return process.argv[index + 1];
  }
  return undefined;
}

const PORT = parseInt(getCliArg('--port') || process.env.PORT || '3000', 10);
const HOST = getCliArg('--host') || process.env.HOST || '0.0.0.0';
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

const INITIAL_DEPOSITS: Deposit[] = [];

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

  // Admin credential verification endpoint
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    const expectedUser = process.env.ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin';

    if (String(username || '').trim() === expectedUser && String(password || '') === expectedPass) {
      res.json({ success: true, username: expectedUser });
      return;
    }

    res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
  });

  // Get full synchronized state
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(state);
  });

  // Register a deposit or negative balance adjustment from any device
  app.post('/api/deposits', (req: Request, res: Response) => {
    const { agentId, amount, method, reference, notes } = req.body;
    const numAmount = Number(amount);

    if (!agentId || isNaN(numAmount) || numAmount === 0) {
      res.status(400).json({ error: 'El monto debe ser diferente de 0 y el agente es obligatorio' });
      return;
    }

    const agentIndex = state.agents.findIndex((a) => a.id === agentId);
    if (agentIndex === -1) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    const targetAgent = state.agents[agentIndex];
    const branchAgentsBefore = state.agents.filter((a) => a.branch === targetAgent.branch);
    const previousDailyLeader = [...branchAgentsBefore].sort((a, b) => b.dailyTotal - a.dailyTotal)[0];

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

    // Check if daily Top 1 in this branch was overtaken (only for positive deposits)
    const branchAgentsAfter = state.agents.filter((a) => a.branch === targetAgent.branch);
    const newDailyLeader = [...branchAgentsAfter].sort((a, b) => b.dailyTotal - a.dailyTotal)[0];
    let overtakeEvent: Top1OvertakeEvent | null = null;

    if (
      numAmount > 0 &&
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

  // Reset daily deposits to 0 (optionally by branch)
  app.post('/api/reset-daily', (req: Request, res: Response) => {
    const { branch } = req.body || {};
    state.agents = state.agents.map((ag) => {
      if (!branch || ag.branch === branch) {
        return {
          ...ag,
          dailyTotal: 0,
          dailyDepositCount: 0,
        };
      }
      return ag;
    });
    saveStorage();

    broadcastSSE('reset_daily', { agents: state.agents, branch });
    res.json({ success: true, agents: state.agents });
  });

  // Reset total and daily deposits to 0 (optionally by branch)
  app.post('/api/reset-total', (req: Request, res: Response) => {
    const { branch } = req.body || {};
    state.agents = state.agents.map((ag) => {
      if (!branch || ag.branch === branch) {
        return {
          ...ag,
          dailyTotal: 0,
          grandTotal: 0,
          dailyDepositCount: 0,
          totalDepositCount: 0,
          lastDepositAt: undefined,
        };
      }
      return ag;
    });
    if (branch) {
      const branchAgentIds = new Set(state.agents.filter(a => a.branch === branch).map(a => a.id));
      state.deposits = state.deposits.filter(d => !branchAgentIds.has(d.agentId));
    } else {
      state.deposits = [];
    }
    saveStorage();

    broadcastSSE('reset_total', { agents: state.agents, branch });
    res.json({ success: true, agents: state.agents });
  });

  // Create an agent
  app.post('/api/agents', (req: Request, res: Response) => {
    const { name, code, branch, color, dailyTotal, grandTotal } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Nombre y código son obligatorios' });
      return;
    }

    const dailyVal = Number.isFinite(Number(dailyTotal)) ? Number(dailyTotal) : 0;
    const totalVal = Number.isFinite(Number(grandTotal)) ? Number(grandTotal) : 0;

    const newAgent: Agent = {
      id: `ag-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      branch: (branch?.trim() || 'Retención'),
      color: color || '#3B82F6',
      avatarSeed: name.trim(),
      dailyTotal: dailyVal,
      grandTotal: totalVal,
      dailyDepositCount: dailyVal !== 0 ? 1 : 0,
      totalDepositCount: totalVal !== 0 ? 1 : 0,
    };

    state.agents.push(newAgent);
    saveStorage();

    broadcastSSE('agents_updated', { agents: state.agents });
    res.json({ success: true, agent: newAgent, agents: state.agents });
  });

  // Update an agent
  app.put('/api/agents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, branch, color, dailyTotal, grandTotal } = req.body;

    const index = state.agents.findIndex((a) => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    const current = state.agents[index];
    const nextDaily = dailyTotal !== undefined && Number.isFinite(Number(dailyTotal)) ? Number(dailyTotal) : current.dailyTotal;
    const nextTotal = grandTotal !== undefined && Number.isFinite(Number(grandTotal)) ? Number(grandTotal) : current.grandTotal;

    state.agents[index] = {
      ...current,
      name: name?.trim() || current.name,
      code: code?.trim().toUpperCase() || current.code,
      branch: branch?.trim() || current.branch,
      color: color || current.color,
      dailyTotal: nextDaily,
      grandTotal: nextTotal,
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
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(path.resolve(distPath, 'index.html'))) {
    app.use('/assets', express.static(path.resolve(distPath, 'assets'), { maxAge: '7d', immutable: true }));
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req: Request, res: Response) => {
      const htmlFile = path.resolve(distPath, 'index.html');
      if (fs.existsSync(htmlFile)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.sendFile(htmlFile);
      } else {
        res.status(404).send('Index HTML not found');
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res
            .status(200)
            .set({
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            })
            .end(template);
        } else {
          res.status(404).send('index.html not found');
        }
      } catch (e) {
        next(e);
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n  VITE v8.3.8 ready in 150 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://${HOST}:${PORT}/\n`);
    console.log(`Leaderboard server listening on http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
