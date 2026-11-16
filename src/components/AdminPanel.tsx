import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  Search, 
  Check, 
  X, 
  Palette, 
  Building2, 
  ShieldAlert,
  Users,
  DollarSign,
  Sparkles,
  RotateCcw,
  LogIn,
  LogOut,
  Lock
} from 'lucide-react';
import { Agent, DepositMethod } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useFirebase } from '../contexts/FirebaseContext';

interface AdminPanelProps {
  agents: Agent[];
  currentArea?: 'Retención' | 'Conversión';
  onConfirmDeposit: (
    agentId: string,
    amount: number,
    method?: DepositMethod,
    reference?: string
  ) => void;
  onAddAgent: (newAgent: Agent) => void;
  onUpdateAgent: (updatedAgent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  onResetDaily: () => void;
  onResetTotal: () => void;
  onSimulateDeposit: () => void;
  onBackToBoard: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#6366F1', // Indigo
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  agents,
  currentArea = 'Retención',
  onConfirmDeposit,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onResetDaily,
  onResetTotal,
  onSimulateDeposit,
  onBackToBoard,
}) => {
  const { authReady, isAdmin, adminUsername, authError, isSigningIn, loginWithCredentials, logout } = useFirebase();

  // Admin login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Area filter for agent selector in deposit form
  const [depositAreaFilter, setDepositAreaFilter] = useState<'Todas' | 'Retención' | 'Conversión'>(currentArea);

  // Filtered agents for deposit selection
  const depositAgents = agents.filter(
    (a) => depositAreaFilter === 'Todas' || a.branch === depositAreaFilter
  );

  // Deposit entry form state
  const [selectedAgentId, setSelectedAgentId] = useState<string>(depositAgents[0]?.id || agents[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositError, setDepositError] = useState<string | null>(null);

  // Agent Management state
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);

  // Form states (for both create & edit agent)
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBranch, setFormBranch] = useState<string>(currentArea);
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formDaily, setFormDaily] = useState('0');
  const [formTotal, setFormTotal] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync selectedAgentId if empty or not in depositAgents
  useEffect(() => {
    if (!depositAgents.some((a) => a.id === selectedAgentId) && depositAgents.length > 0) {
      setSelectedAgentId(depositAgents[0].id);
    }
  }, [depositAgents, selectedAgentId]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(loginUser, loginPassword);
  };

  const currentDepositAgent = agents.find((a) => a.id === selectedAgentId);
  const parsedDepositAmount = parseFloat(depositAmount) || 0;
  const isNegativeInput = depositAmount.trim().startsWith('-') || parsedDepositAmount < 0;

  const handleAddPreset = (val: number) => {
    const current = parseFloat(depositAmount) || 0;
    const next = isNegativeInput ? current - val : current + val;
    setDepositAmount(String(next));
    setDepositError(null);
  };

  const handleToggleSign = () => {
    if (!depositAmount.trim()) {
      setDepositAmount('-');
    } else if (depositAmount.trim() === '-') {
      setDepositAmount('');
    } else {
      const val = parseFloat(depositAmount);
      if (!isNaN(val)) {
        setDepositAmount(String(-val));
      }
    }
    setDepositError(null);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setDepositError('Por favor selecciona un agente');
      return;
    }
    if (isNaN(parsedDepositAmount) || parsedDepositAmount === 0) {
      setDepositError('El monto debe ser distinto de 0 (positivo o negativo)');
      return;
    }

    onConfirmDeposit(selectedAgentId, parsedDepositAmount, 'Efectivo');
    setDepositAmount('');
    setDepositError(null);
  };

  const startCreate = () => {
    setEditingAgent(null);
    setFormName('');
    const targetBranch = currentArea || 'Retención';
    const isConv = targetBranch === 'Conversión';
    const prefix = isConv ? 'CV' : 'AG';
    const existingInBranch = agents.filter((a) => a.branch === targetBranch).length;
    setFormCode(`${prefix}-${String(existingInBranch + 1).padStart(2, '0')}`);
    setFormBranch(targetBranch);
    setFormColor(isConv ? '#10B981' : COLOR_OPTIONS[agents.length % COLOR_OPTIONS.length]);
    setFormDaily('0');
    setFormTotal('0');
    setFormError(null);
    setIsCreating(true);
  };

  const startEdit = (agent: Agent) => {
    setIsCreating(false);
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormCode(agent.code);
    setFormBranch(agent.branch);
    setFormColor(agent.color);
    setFormDaily(String(agent.dailyTotal));
    setFormTotal(String(agent.grandTotal));
    setFormError(null);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingAgent(null);
    setFormError(null);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre del agente es obligatorio.');
      return;
    }

    const dailyVal = parseFloat(formDaily) || 0;
    const totalVal = parseFloat(formTotal) || 0;

    if (editingAgent) {
      const updated: Agent = {
        ...editingAgent,
        name: formName.trim(),
        code: formCode.trim() || editingAgent.code,
        branch: formBranch.trim() || editingAgent.branch,
        color: formColor,
        dailyTotal: dailyVal,
        grandTotal: totalVal,
      };
      onUpdateAgent(updated);
    } else {
      const newAgent: Agent = {
        id: `ag-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim() || `AG-${String(agents.length + 1).padStart(2, '0')}`,
        branch: formBranch.trim() || 'Retención',
        color: formColor,
        avatarSeed: formName.trim(),
        dailyTotal: dailyVal,
        grandTotal: totalVal,
        dailyDepositCount: dailyVal > 0 ? 1 : 0,
        totalDepositCount: totalVal > 0 ? 1 : 0,
        lastDepositAt: dailyVal > 0 ? new Date().toISOString() : undefined,
      };
      onAddAgent(newAgent);
    }

    closeForm();
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletingAgent = agents.find((a) => a.id === deletingAgentId);

  // Guard 1: Auth loading
  if (!authReady) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-300 font-semibold">Verificando sesión de administrador...</p>
      </div>
    );
  }

  // Guard 2: Username & Password login form (admin / admin)
  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto my-10 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={onBackToBoard}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tabla de Posiciones</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-extrabold text-white">Acceso de Administrador</h2>
          <p className="text-xs text-slate-400">
            Ingresa tus credenciales para registrar depósitos y gestionar agentes.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="•••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          {authError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-center">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSigningIn ? 'Ingresando...' : 'Ingresar'}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={onBackToBoard}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold mb-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tabla de Posiciones</span>
          </button>
          <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conectado como <strong className="text-emerald-400">{adminUsername || 'admin'}</strong> · Guardado permanente en la nube
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>

          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Agente</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ÁREA DE INGRESAR DEPÓSITOS Y CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Deposit Entry Card (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ingresar Depósito
                </h3>
                <p className="text-[11px] text-slate-400">
                  Registra fondos para cualquier agente (sonará dinero de monedas 🪙)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSimulateDeposit}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Prueba rápida de sonido y notificación"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular Depósito</span>
            </button>
          </div>

          <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Agent Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Seleccionar Agente *
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['Retención', 'Conversión', 'Todas'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setDepositAreaFilter(filter)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          depositAreaFilter === filter
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  value={selectedAgentId}
                  onChange={(e) => {
                    setSelectedAgentId(e.target.value);
                    setDepositError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-colors"
                >
                  {depositAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.code} - Área: {ag.branch})
                    </option>
                  ))}
                </select>

                {currentDepositAgent && (
                  <div className="mt-2 p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
                    <span>Acumulado actual:</span>
                    <span className="font-mono text-slate-200 font-semibold tabular-nums">
                      Hoy: {formatCurrency(currentDepositAgent.dailyTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Monto del Depósito ($) * <span className="text-[10px] font-normal text-slate-400 normal-case">(Acepta negativos)</span>
                </label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base ${isNegativeInput ? 'text-rose-400' : 'text-amber-400'}`}>
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 100000 o -50000"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        setDepositError(null);
                      }}
                      className={`w-full bg-slate-950 border rounded-xl pl-8 pr-3 py-2.5 text-base font-mono font-bold placeholder-slate-600 outline-none transition-colors ${
                        isNegativeInput
                          ? 'border-rose-500/60 text-rose-300 focus:border-rose-400'
                          : 'border-slate-700 text-white focus:border-amber-500'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSign}
                    className={`px-3 py-2.5 rounded-xl font-mono font-bold text-sm border transition-colors cursor-pointer shrink-0 ${
                      isNegativeInput
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title="Cambiar entre positivo (+) y negativo (-)"
                  >
                    +/−
                  </button>
                </div>

                {/* Preset shortcuts */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleAddPreset(val)}
                      className={`px-2 py-1 text-xs rounded-lg font-mono border transition-colors cursor-pointer ${
                        isNegativeInput
                          ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      {isNegativeInput ? '-' : '+'}{formatCurrency(val).replace('$ ', '')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDepositAmount('')}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {depositError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {depositError}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isNegativeInput
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/10'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isNegativeInput
                  ? `Registrar Saldo Negativo (${parsedDepositAmount < 0 ? formatCurrency(parsedDepositAmount) : '-'})`
                  : 'Registrar Depósito'}
              </span>
            </button>
          </form>
        </div>

        {/* Reset Actions Card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Controles de Saldo
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Reinicio seguro de depósitos con confirmación in-app
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onResetDaily}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reiniciar Depósitos Diarios a $0</span>
            </button>

            <button
              type="button"
              onClick={onResetTotal}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Reiniciar Depósitos Totales a $0</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: GESTIÓN DE AGENTES */}
      <div className="space-y-4">
        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar agente por nombre, código o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 self-end sm:self-center">
            <Users className="w-4 h-4 text-blue-400" />
            <span>
              Total de agentes registrados:{' '}
              <strong className="text-white font-bold">{agents.length}</strong>
            </span>
          </div>
        </div>

        {/* Agents Management Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Agente</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Área</th>
                  <th className="py-3 px-4 text-right">Depósitos Diarios</th>
                  <th className="py-3 px-4 text-right">Depósitos Totales</th>
                  <th className="py-3 px-4 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      No se encontraron agentes. Pulsa "+ Nuevo Agente" para crear uno.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Agent Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-slate-300 shrink-0 bg-slate-800 border border-slate-700/80"
                          >
                            {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="font-bold text-white truncate">{agent.name}</span>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {agent.code}
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{agent.branch}</span>
                        </div>
                      </td>

                      {/* Daily amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-xs text-slate-200 tabular-nums">
                        {formatCurrency(agent.dailyTotal)}
                      </td>

                      {/* Total amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-amber-300 tabular-nums">
                        {formatCurrency(agent.grandTotal)}
                      </td>

                      {/* Action buttons: Edit & Delete */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(agent)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar Agente"
                          >
                            <Pencil className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => setDeletingAgentId(agent.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Eliminar Agente"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal / Form for Add / Edit Agent */}
      {(isCreating || editingAgent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {editingAgent ? <Pencil className="w-4 h-4 text-blue-400" /> : <UserPlus className="w-4 h-4 text-emerald-400" />}
                <span>{editingAgent ? 'Editar Agente' : 'Añadir Nuevo Agente'}</span>
              </h3>
              <button
                onClick={closeForm}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Ej. Roberto Gómez"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Código de Agente
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="AG-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Área
                  </label>
                  <select
                    value={formBranch === 'Conversión' ? 'Conversión' : 'Retención'}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="Retención">Retención</option>
                    <option value="Conversión">Conversión</option>
                  </select>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>Color Distintivo</span>
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        formColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Balance adjustment */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Monto Diario ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formDaily}
                    onChange={(e) => setFormDaily(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Monto Total Acumulado ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  {formError}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {editingAgent ? 'Guardar Cambios' : 'Crear Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">¿Eliminar Agente?</h3>
                <span className="text-[11px] text-slate-400">Esta acción no se puede deshacer</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              ¿Estás seguro de que deseas eliminar al agente{' '}
              <strong className="text-white font-bold">{deletingAgent.name}</strong> ({deletingAgent.code})?
              Se eliminará permanentemente de la tabla de posiciones.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingAgentId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAgent(deletingAgent.id);
                  setDeletingAgentId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
