import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  query,
  where,
  writeBatch,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Agent, DepositMethod, RankingView, Top1OvertakeEvent } from '../types';
import { INITIAL_AGENTS, saveAgents } from '../utils/storage';
import { getConversionSalesCount, getLocalDateKey } from '../utils/formatters';

// Volumetric boundaries synchronized verbatim with firebase-blueprint.json
const MAX_ID_LEN = 64;
const MAX_NAME_LEN = 80;
const MAX_CODE_LEN = 20;
const MAX_REF_LEN = 80;
const MAX_NOTES_LEN = 200;
const MAX_LAST_DEPOSIT_LEN = 40;
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function sanitizeId(raw: string, fallbackPrefix = 'ag'): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .slice(0, MAX_ID_LEN);
  if (cleaned && ID_REGEX.test(cleaned)) return cleaned;
  return `${fallbackPrefix}-${Date.now()}`;
}

function sanitizeBranch(raw?: string): 'Retención' | 'Conversión' {
  const normalized = (raw || '').trim().toLowerCase();
  if (normalized.includes('conver') || normalized.includes('cv')) {
    return 'Conversión';
  }
  return 'Retención';
}

function sanitizeColor(raw?: string, branch: 'Retención' | 'Conversión' = 'Retención'): string {
  const trimmed = (raw || '').trim();
  if (COLOR_REGEX.test(trimmed)) return trimmed;
  return branch === 'Conversión' ? '#10B981' : '#3B82F6';
}

function sanitizeString(raw: string | undefined, maxLen: number, fallback = ''): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export interface LiveBoardEventPayload {
  id: string;
  type: 'deposit' | 'reset_daily' | 'reset_total' | 'agents_updated';
  branch: 'Retención' | 'Conversión' | 'Todas';
  agentId?: string;
  agentName: string;
  amount: number;
  overtake: boolean;
  previousLeaderName?: string;
  view?: RankingView;
  eventSeq: number;
}

/**
 * Subscribe to real-time agents from Firestore (zero-login compatible for Smart TVs).
 */
export function subscribeAgentsFromFirestore(
  onAgents: (agents: Agent[], fromFirestoreCount: number) => void,
  onConnectionChange?: (connected: boolean) => void
): () => void {
  const q = query(collection(db, 'agents'), where('isPublic', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      onConnectionChange?.(true);
      if (snapshot.empty) {
        onAgents([], 0);
        return;
      }

      const loaded: Agent[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const branch = sanitizeBranch(d.branch);
        return {
          id: docSnap.id,
          name: String(d.name || ''),
          code: String(d.code || ''),
          branch,
          color: sanitizeColor(d.color, branch),
          avatarSeed: String(d.avatarSeed || d.name || docSnap.id),
          dailyTotal: safeNum(d.dailyTotal, 0),
          grandTotal: safeNum(d.grandTotal, 0),
          dailyDepositCount: Math.max(0, safeNum(d.dailyDepositCount, 0)),
          totalDepositCount: Math.max(0, safeNum(d.totalDepositCount, 0)),
          lastDepositAt: typeof d.lastDepositAt === 'string' ? d.lastDepositAt : undefined,
        };
      });

      saveAgents(loaded);
      onAgents(loaded, loaded.length);
    },
    (error) => {
      onConnectionChange?.(false);
      handleFirestoreError(error, OperationType.LIST, 'agents');
    }
  );
}

function getBoardEventDocId(branch: 'Retención' | 'Conversión' | 'Todas'): string {
  if (branch === 'Conversión') return 'latest_conversion';
  if (branch === 'Retención') return 'latest_retencion';
  return 'latest';
}

/**
 * Subscribe to area-specific /board_events/latest_{area} so Smart TVs play coin sound,
 * centered banner & Top-1 celebration ONLY for the active area (Retención or Conversión).
 * Ignores the very first initial snapshot so refreshing a TV never replays stale alerts.
 */
export function subscribeLatestBoardEvent(
  area: 'Retención' | 'Conversión',
  onEvent: (event: LiveBoardEventPayload) => void
): () => void {
  const docId = getBoardEventDocId(area);
  const eventRef = doc(db, 'board_events', docId);
  let initialized = false;
  let lastSeenSeq = 0;

  return onSnapshot(
    eventRef,
    (snap) => {
      if (!snap.exists()) {
        initialized = true;
        return;
      }

      const d = snap.data();
      const seq = safeNum(d.eventSeq, 0);

      if (!initialized) {
        initialized = true;
        lastSeenSeq = seq;
        return;
      }

      if (seq > lastSeenSeq && (d.branch === area || d.branch === 'Todas')) {
        lastSeenSeq = seq;
        onEvent({
          id: snap.id,
          type: d.type,
          branch: d.branch,
          agentId: d.agentId,
          agentName: String(d.agentName || ''),
          amount: safeNum(d.amount, 0),
          overtake: Boolean(d.overtake),
          previousLeaderName: typeof d.previousLeaderName === 'string' ? d.previousLeaderName : undefined,
          view: d.view === 'total' ? 'total' : 'daily',
          eventSeq: seq,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `board_events/${docId}`);
    }
  );
}

/**
 * Seeds Firestore /agents collection once if currently empty.
 * Preserves any non-zero local agent balances if migrating from pre-Firestore state.
 */
export async function ensureSeededInFirestore(localAgents: Agent[]): Promise<boolean> {
  const q = query(collection(db, 'agents'), where('isPublic', '==', true));

  try {
    const existingSnap = await getDocsFromServer(q);
    if (!existingSnap.empty) {
      return false;
    }

    const sourceList = localAgents.length > 0 ? localAgents : INITIAL_AGENTS;
    const batch = writeBatch(db);

    for (const ag of sourceList) {
      const safeId = sanitizeId(ag.id, 'ag');
      const branch = sanitizeBranch(ag.branch);
      const agentRef = doc(db, 'agents', safeId);

      const payload: Record<string, unknown> = {
        id: safeId,
        name: sanitizeString(ag.name, MAX_NAME_LEN, 'Agente'),
        code: sanitizeString(ag.code, MAX_CODE_LEN, 'AG-01').toUpperCase(),
        branch,
        color: sanitizeColor(ag.color, branch),
        avatarSeed: sanitizeString(ag.avatarSeed || ag.name, MAX_NAME_LEN, safeId),
        dailyTotal: safeNum(ag.dailyTotal, 0),
        grandTotal: safeNum(ag.grandTotal, 0),
        dailyDepositCount: Math.max(0, safeNum(ag.dailyDepositCount, 0)),
        totalDepositCount: Math.max(0, safeNum(ag.totalDepositCount, 0)),
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (ag.lastDepositAt && ag.lastDepositAt.trim()) {
        payload.lastDepositAt = ag.lastDepositAt.trim().slice(0, MAX_LAST_DEPOSIT_LEN);
      }

      batch.set(agentRef, payload);
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'agents');
  }
}

async function writeLatestBoardEventToBatch(
  batch: ReturnType<typeof writeBatch>,
  payload: {
    type: 'deposit' | 'reset_daily' | 'reset_total' | 'agents_updated';
    branch: 'Retención' | 'Conversión' | 'Todas';
    agentId?: string;
    agentName: string;
    amount: number;
    overtake: boolean;
    previousLeaderName?: string;
    view?: RankingView;
  }
) {
  const eventDocId = getBoardEventDocId(payload.branch);
  const eventRef = doc(db, 'board_events', eventDocId);
  const snap = await getDoc(eventRef);
  const seq = Date.now();

  if (!snap.exists()) {
    const createData: Record<string, unknown> = {
      id: eventDocId,
      type: payload.type,
      branch: payload.branch,
      agentName: sanitizeString(payload.agentName, MAX_NAME_LEN, 'Sistema'),
      amount: safeNum(payload.amount, 0),
      overtake: Boolean(payload.overtake),
      eventSeq: seq,
      isPublic: true,
      createdByUid: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (payload.agentId) createData.agentId = sanitizeId(payload.agentId, 'ag');
    if (payload.previousLeaderName) {
      createData.previousLeaderName = sanitizeString(payload.previousLeaderName, MAX_NAME_LEN);
    }
    if (payload.view) createData.view = payload.view;
    batch.set(eventRef, createData);
  } else {
    const updateData: Record<string, unknown> = {
      type: payload.type,
      branch: payload.branch,
      agentId: payload.agentId ? sanitizeId(payload.agentId, 'ag') : deleteField(),
      agentName: sanitizeString(payload.agentName, MAX_NAME_LEN, 'Sistema'),
      amount: safeNum(payload.amount, 0),
      overtake: Boolean(payload.overtake),
      previousLeaderName: payload.previousLeaderName
        ? sanitizeString(payload.previousLeaderName, MAX_NAME_LEN)
        : deleteField(),
      view: payload.view ? payload.view : deleteField(),
      eventSeq: seq,
      isPublic: true,
      createdByUid: 'admin',
      updatedAt: serverTimestamp(),
    };
    batch.update(eventRef, updateData);
  }
}

/**
 * Automatically resets Retención daily totals (dailyTotal & dailyDepositCount) to 0
 * once per calendar day when a new day / shift begins, preserving grandTotal.
 */
export async function ensureRetencionDailyResetFirestore(allAgents: Agent[]): Promise<boolean> {
  const retencionAgents = allAgents.filter((a) => sanitizeBranch(a.branch) === 'Retención');
  if (retencionAgents.length === 0) return false;

  const todayKey = getLocalDateKey();
  const settingRef = doc(db, 'board_settings', 'retencion_daily');

  try {
    const snap = await getDocFromServer(settingRef);
    if (snap.exists() && snap.data().lastResetDate === todayKey) {
      return false;
    }

    const batch = writeBatch(db);

    if (snap.exists()) {
      for (const ag of retencionAgents) {
        if (ag.dailyTotal !== 0 || ag.dailyDepositCount !== 0) {
          batch.update(doc(db, 'agents', ag.id), {
            dailyTotal: 0,
            dailyDepositCount: 0,
            updatedAt: serverTimestamp(),
          });
        }
      }
      batch.update(settingRef, {
        lastResetDate: todayKey,
        updatedAt: serverTimestamp(),
      });
    } else {
      for (const ag of retencionAgents) {
        const depositedToday = Boolean(
          ag.lastDepositAt && getLocalDateKey(new Date(ag.lastDepositAt)) === todayKey
        );
        if (!depositedToday && (ag.dailyTotal !== 0 || ag.dailyDepositCount !== 0)) {
          batch.update(doc(db, 'agents', ag.id), {
            dailyTotal: 0,
            dailyDepositCount: 0,
            updatedAt: serverTimestamp(),
          });
        }
      }
      batch.set(settingRef, {
        id: 'retencion_daily',
        branch: 'Retención',
        lastResetDate: todayKey,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'board_settings/retencion_daily');
  }
}

export async function submitDepositFirestore(params: {
  agentId: string;
  amount: number;
  method?: DepositMethod;
  reference?: string;
  notes?: string;
  allAgents: Agent[];
}): Promise<{ overtakeEvent: Top1OvertakeEvent | null }> {
  const numAmount = Number(params.amount);
  if (!params.agentId || !Number.isFinite(numAmount) || numAmount === 0) {
    throw new Error('El monto debe ser distinto de 0.');
  }

  const targetAgent = params.allAgents.find((a) => a.id === params.agentId);
  if (!targetAgent) {
    throw new Error('Agente no encontrado.');
  }

  const branch = sanitizeBranch(targetAgent.branch);
  const isConversion = branch === 'Conversión';
  const branchBefore = params.allAgents.filter((a) => sanitizeBranch(a.branch) === branch);

  // Check if Retención is rolling over into a new calendar day
  const todayKey = getLocalDateKey();
  let retencionSettingExists = true;
  let needsRetencionRollover = false;

  if (!isConversion) {
    const settingRef = doc(db, 'board_settings', 'retencion_daily');
    try {
      const settingSnap = await getDocFromServer(settingRef);
      retencionSettingExists = settingSnap.exists();
      if (!settingSnap.exists() || settingSnap.data().lastResetDate !== todayKey) {
        needsRetencionRollover = true;
      }
    } catch {
      // Fallback: let deposit proceed if server check temporarily fails
    }
  }

  const sortBranchAgents = (list: Agent[]) =>
    [...list].sort((a, b) => {
      if (isConversion) {
        const salesDiff = getConversionSalesCount(b.grandTotal) - getConversionSalesCount(a.grandTotal);
        if (salesDiff !== 0) return salesDiff;
        return b.grandTotal - a.grandTotal;
      }
      // Retención: Top 1 is always whoever has the most accumulated in Total (grandTotal)
      const totalDiff = b.grandTotal - a.grandTotal;
      if (totalDiff !== 0) return totalDiff;
      return b.dailyTotal - a.dailyTotal;
    });

  const previousLeader = sortBranchAgents(branchBefore)[0];

  const targetDepositedToday = Boolean(
    targetAgent.lastDepositAt && getLocalDateKey(new Date(targetAgent.lastDepositAt)) === todayKey
  );
  const resetTargetDaily =
    !isConversion && needsRetencionRollover && (retencionSettingExists || !targetDepositedToday);

  const baseDailyTotal = resetTargetDaily ? 0 : targetAgent.dailyTotal;
  const baseDailyCount = resetTargetDaily ? 0 : targetAgent.dailyDepositCount;

  const nowIso = new Date().toISOString().slice(0, MAX_LAST_DEPOSIT_LEN);
  const updatedAgent: Agent = {
    ...targetAgent,
    dailyTotal: baseDailyTotal + numAmount,
    grandTotal: targetAgent.grandTotal + numAmount,
    dailyDepositCount: baseDailyCount + 1,
    totalDepositCount: targetAgent.totalDepositCount + 1,
    lastDepositAt: nowIso,
  };

  const branchAfter = branchBefore.map((a) => (a.id === updatedAgent.id ? updatedAgent : a));
  const newLeader = sortBranchAgents(branchAfter)[0];

  let overtakeEvent: Top1OvertakeEvent | null = null;
  const hasImprovedLead = isConversion
    ? getConversionSalesCount(updatedAgent.grandTotal) > getConversionSalesCount(previousLeader?.grandTotal || 0) ||
      (getConversionSalesCount(updatedAgent.grandTotal) === getConversionSalesCount(previousLeader?.grandTotal || 0) &&
        updatedAgent.grandTotal > (previousLeader?.grandTotal || 0))
    : updatedAgent.grandTotal > (previousLeader?.grandTotal || 0);

  if (
    numAmount > 0 &&
    newLeader &&
    newLeader.id === updatedAgent.id &&
    (!previousLeader || previousLeader.id !== updatedAgent.id) &&
    hasImprovedLead
  ) {
    overtakeEvent = {
      agent: updatedAgent,
      previousLeaderName: previousLeader?.name,
      newAmount: updatedAgent.grandTotal,
      view: 'total',
      timestamp: Date.now(),
    };
  }

  const depositId = `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const validMethod: DepositMethod = (
    ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'] as DepositMethod[]
  ).includes(params.method || 'Efectivo')
    ? (params.method as DepositMethod)
    : 'Efectivo';

  try {
    const batch = writeBatch(db);

    if (!isConversion && needsRetencionRollover) {
      for (const ag of branchBefore) {
        if (ag.id === targetAgent.id) continue;
        const agDepositedToday = Boolean(
          ag.lastDepositAt && getLocalDateKey(new Date(ag.lastDepositAt)) === todayKey
        );
        const shouldResetOther = retencionSettingExists || !agDepositedToday;
        if (shouldResetOther && (ag.dailyTotal !== 0 || ag.dailyDepositCount !== 0)) {
          batch.update(doc(db, 'agents', ag.id), {
            dailyTotal: 0,
            dailyDepositCount: 0,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const settingRef = doc(db, 'board_settings', 'retencion_daily');
      if (retencionSettingExists) {
        batch.update(settingRef, {
          lastResetDate: todayKey,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(settingRef, {
          id: 'retencion_daily',
          branch: 'Retención',
          lastResetDate: todayKey,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    const agentRef = doc(db, 'agents', targetAgent.id);
    batch.update(agentRef, {
      dailyTotal: updatedAgent.dailyTotal,
      grandTotal: updatedAgent.grandTotal,
      dailyDepositCount: updatedAgent.dailyDepositCount,
      totalDepositCount: updatedAgent.totalDepositCount,
      lastDepositAt: nowIso,
      updatedAt: serverTimestamp(),
    });

    const depositRef = doc(db, 'deposits', depositId);
    const depositDoc: Record<string, unknown> = {
      id: depositId,
      agentId: targetAgent.id,
      agentName: sanitizeString(targetAgent.name, MAX_NAME_LEN, 'Agente'),
      branch,
      amount: numAmount,
      method: validMethod,
      createdByUid: 'admin',
      createdAt: serverTimestamp(),
    };
    if (params.reference?.trim()) {
      depositDoc.reference = sanitizeString(params.reference, MAX_REF_LEN);
    }
    if (params.notes?.trim()) {
      depositDoc.notes = sanitizeString(params.notes, MAX_NOTES_LEN);
    }
    batch.set(depositRef, depositDoc);

    await writeLatestBoardEventToBatch(batch, {
      type: 'deposit',
      branch,
      agentId: targetAgent.id,
      agentName: sanitizeString(targetAgent.name, MAX_NAME_LEN),
      amount: numAmount,
      overtake: Boolean(overtakeEvent),
      previousLeaderName: overtakeEvent?.previousLeaderName,
      view: 'total',
    });

    await batch.commit();
    return { overtakeEvent };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `agents/${targetAgent.id}`);
  }
}

export async function createAgentFirestore(newAgent: Agent): Promise<void> {
  const safeId = sanitizeId(newAgent.id, 'ag');
  const branch = sanitizeBranch(newAgent.branch);
  const dailyVal = safeNum(newAgent.dailyTotal, 0);
  const totalVal = safeNum(newAgent.grandTotal, 0);

  const docData: Record<string, unknown> = {
    id: safeId,
    name: sanitizeString(newAgent.name, MAX_NAME_LEN, 'Agente'),
    code: sanitizeString(newAgent.code, MAX_CODE_LEN, 'AG-01').toUpperCase(),
    branch,
    color: sanitizeColor(newAgent.color, branch),
    avatarSeed: sanitizeString(newAgent.avatarSeed || newAgent.name, MAX_NAME_LEN, safeId),
    dailyTotal: dailyVal,
    grandTotal: totalVal,
    dailyDepositCount: Math.max(0, safeNum(newAgent.dailyDepositCount, dailyVal !== 0 ? 1 : 0)),
    totalDepositCount: Math.max(0, safeNum(newAgent.totalDepositCount, totalVal !== 0 ? 1 : 0)),
    isPublic: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (newAgent.lastDepositAt?.trim()) {
    docData.lastDepositAt = newAgent.lastDepositAt.trim().slice(0, MAX_LAST_DEPOSIT_LEN);
  }

  try {
    await setDoc(doc(db, 'agents', safeId), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `agents/${safeId}`);
  }
}

export async function updateAgentFirestore(updatedAgent: Agent): Promise<void> {
  const branch = sanitizeBranch(updatedAgent.branch);
  const updateData: Record<string, unknown> = {
    name: sanitizeString(updatedAgent.name, MAX_NAME_LEN, 'Agente'),
    code: sanitizeString(updatedAgent.code, MAX_CODE_LEN, 'AG-01').toUpperCase(),
    branch,
    color: sanitizeColor(updatedAgent.color, branch),
    avatarSeed: sanitizeString(updatedAgent.avatarSeed || updatedAgent.name, MAX_NAME_LEN, updatedAgent.id),
    dailyTotal: safeNum(updatedAgent.dailyTotal, 0),
    grandTotal: safeNum(updatedAgent.grandTotal, 0),
    dailyDepositCount: Math.max(0, safeNum(updatedAgent.dailyDepositCount, 0)),
    totalDepositCount: Math.max(0, safeNum(updatedAgent.totalDepositCount, 0)),
    updatedAt: serverTimestamp(),
  };

  if (updatedAgent.lastDepositAt?.trim()) {
    updateData.lastDepositAt = updatedAgent.lastDepositAt.trim().slice(0, MAX_LAST_DEPOSIT_LEN);
  }

  try {
    await updateDoc(doc(db, 'agents', updatedAgent.id), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `agents/${updatedAgent.id}`);
  }
}

export async function deleteAgentFirestore(agentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'agents', agentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `agents/${agentId}`);
  }
}

export async function resetDailyFirestore(
  branch: 'Retención' | 'Conversión',
  allAgents: Agent[]
): Promise<void> {
  const targets = allAgents.filter((a) => sanitizeBranch(a.branch) === branch);
  try {
    const batch = writeBatch(db);
    for (const ag of targets) {
      batch.update(doc(db, 'agents', ag.id), {
        dailyTotal: 0,
        dailyDepositCount: 0,
        updatedAt: serverTimestamp(),
      });
    }
    if (branch === 'Retención') {
      const todayKey = getLocalDateKey();
      const settingRef = doc(db, 'board_settings', 'retencion_daily');
      const settingSnap = await getDocFromServer(settingRef);
      if (settingSnap.exists()) {
        batch.update(settingRef, {
          lastResetDate: todayKey,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(settingRef, {
          id: 'retencion_daily',
          branch: 'Retención',
          lastResetDate: todayKey,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    await writeLatestBoardEventToBatch(batch, {
      type: 'reset_daily',
      branch,
      agentName: `Reinicio Diario (${branch}) a $0`,
      amount: 0,
      overtake: false,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'agents');
  }
}

export async function resetTotalFirestore(
  branch: 'Retención' | 'Conversión',
  allAgents: Agent[]
): Promise<void> {
  const targets = allAgents.filter((a) => sanitizeBranch(a.branch) === branch);
  try {
    const batch = writeBatch(db);
    for (const ag of targets) {
      batch.update(doc(db, 'agents', ag.id), {
        dailyTotal: 0,
        grandTotal: 0,
        dailyDepositCount: 0,
        totalDepositCount: 0,
        lastDepositAt: deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
    if (branch === 'Retención') {
      const todayKey = getLocalDateKey();
      const settingRef = doc(db, 'board_settings', 'retencion_daily');
      const settingSnap = await getDocFromServer(settingRef);
      if (settingSnap.exists()) {
        batch.update(settingRef, {
          lastResetDate: todayKey,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(settingRef, {
          id: 'retencion_daily',
          branch: 'Retención',
          lastResetDate: todayKey,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    await writeLatestBoardEventToBatch(batch, {
      type: 'reset_total',
      branch,
      agentName: `Reinicio Completo (${branch}) a $0`,
      amount: 0,
      overtake: false,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'agents');
  }
}

export function formatTimestampForDebug(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  return '';
}
