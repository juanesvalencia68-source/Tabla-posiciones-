import { Agent, Deposit, Top1OvertakeEvent } from '../types';
import { loadAgents, saveAgents, loadDeposits, saveDeposits } from './storage';

export interface SyncHandlers {
  onDepositReceived: (deposit: Deposit, updatedAgents: Agent[], overtake: Top1OvertakeEvent | null) => void;
  onAgentsUpdated: (updatedAgents: Agent[]) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

export async function fetchState(): Promise<{ agents: Agent[]; deposits: Deposit[] }> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Error al cargar estado del servidor');
    const data = await res.json();
    if (data.agents && Array.isArray(data.agents)) {
      saveAgents(data.agents);
    }
    if (data.deposits && Array.isArray(data.deposits)) {
      saveDeposits(data.deposits);
    }
    return data;
  } catch (err) {
    console.warn('Usando respaldo local offline:', err);
    return {
      agents: loadAgents(),
      deposits: loadDeposits(),
    };
  }
}

export function subscribeToLiveUpdates(handlers: SyncHandlers): () => void {
  let eventSource: EventSource | null = null;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        handlers.onConnectionStatusChange?.(true);
      };

      eventSource.addEventListener('deposit', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.agents) saveAgents(payload.agents);
          if (payload.deposit) {
            const current = loadDeposits();
            saveDeposits([payload.deposit, ...current]);
          }
          handlers.onDepositReceived(payload.deposit, payload.agents, payload.overtakeEvent || null);
        } catch (err) {
          console.error('Error parseando evento deposit:', err);
        }
      });

      eventSource.addEventListener('reset_daily', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.agents) {
            saveAgents(payload.agents);
            handlers.onAgentsUpdated(payload.agents);
          }
        } catch (err) {
          console.error('Error parseando evento reset_daily:', err);
        }
      });

      eventSource.addEventListener('reset_total', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.agents) {
            saveAgents(payload.agents);
            saveDeposits([]);
            handlers.onAgentsUpdated(payload.agents);
          }
        } catch (err) {
          console.error('Error parseando evento reset_total:', err);
        }
      });

      eventSource.addEventListener('agents_updated', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.agents) {
            saveAgents(payload.agents);
            handlers.onAgentsUpdated(payload.agents);
          }
        } catch (err) {
          console.error('Error parseando evento agents_updated:', err);
        }
      });

      eventSource.onerror = () => {
        handlers.onConnectionStatusChange?.(false);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('Error inicializando EventSource:', err);
      handlers.onConnectionStatusChange?.(false);
      if (!isClosed) {
        retryTimeout = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  // Secondary silent polling fallback every 8 seconds for Smart TVs if SSE pauses
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      const fresh = await fetchState();
      if (fresh.agents) {
        handlers.onAgentsUpdated(fresh.agents);
      }
    } catch {
      // ignore silent poll error
    }
  }, 8000);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    if (retryTimeout) clearTimeout(retryTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export async function submitDepositApi(data: {
  agentId: string;
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; deposit: Deposit; agents: Agent[]; overtakeEvent: Top1OvertakeEvent | null }> {
  const res = await fetch('/api/deposits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al enviar depósito al servidor');
  }
  return res.json();
}

export async function resetDailyApi(): Promise<Agent[]> {
  const res = await fetch('/api/reset-daily', { method: 'POST' });
  if (!res.ok) throw new Error('Error al reiniciar depósitos diarios');
  const data = await res.json();
  return data.agents;
}

export async function resetTotalApi(): Promise<Agent[]> {
  const res = await fetch('/api/reset-total', { method: 'POST' });
  if (!res.ok) throw new Error('Error al reiniciar depósitos totales');
  const data = await res.json();
  return data.agents;
}

export async function createAgentApi(agent: {
  name: string;
  code: string;
  branch?: string;
  color?: string;
}): Promise<Agent[]> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  if (!res.ok) throw new Error('Error al crear agente');
  const data = await res.json();
  return data.agents;
}

export async function updateAgentApi(
  id: string,
  agent: { name: string; code: string; branch?: string; color?: string }
): Promise<Agent[]> {
  const res = await fetch(`/api/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  if (!res.ok) throw new Error('Error al actualizar agente');
  const data = await res.json();
  return data.agents;
}

export async function deleteAgentApi(id: string): Promise<Agent[]> {
  const res = await fetch(`/api/agents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar agente');
  const data = await res.json();
  return data.agents;
}
