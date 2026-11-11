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
  timestamp: string; // ISO string
  method: DepositMethod;
  reference?: string;
  notes?: string;
}

export type RankingView = 'daily' | 'total';

export interface Top1OvertakeEvent {
  agent: Agent;
  previousLeaderName?: string;
  newAmount: number;
  view: RankingView;
  timestamp: number;
}
