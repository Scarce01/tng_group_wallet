import { useState } from 'react';
import { useUiData } from '../api/useUiData';
import { useContribute, useCreatePool, useCreateSpendRequest, useLogout, useMyTransactions, useVote } from '../api/hooks';
import { useRealtimeSync } from '../api/useRealtimeSync';
import { CreatePoolDialog } from './components/CreatePoolDialog';
import { NewSpendingRequestDialog } from './components/NewSpendingRequestDialog';
import { TransactionDetailDialog } from './components/TransactionDetailDialog';
import { PayWithPoolDialog } from './components/PayWithPoolDialog';
import { ManageMembersDialog } from './components/ManageMembersDialog';
import { TransactionFilterDropdown } from './components/TransactionFilterDropdown';
import { ContributeToPoolDialog } from './components/ContributeToPoolDialog';
import { PoolReportDialog } from './components/PoolReportDialog';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProfilePage } from './components/ProfilePage';
import { LayakPage } from './components/LayakPage';
import { ScamCheckPage } from './components/ScamCheckPage';
import { Wallet, Plus, Users, TrendingUp, Bell, Settings, Shield, Gift, Home, GraduationCap, ShoppingCart, Zap, Building2, Utensils, Sparkles } from 'lucide-react';
import svgPaths from '../imports/CardDetails/svg-3xzeber0v2';
import navSvgPaths from '../imports/Container-3/svg-lc0haplezl';
import CreatePoolButton from '../imports/Button-1/Button-2096-218';
import scanPayButtonSvgPaths from '../imports/Button-1-1/svg-f46060bysf';
import figmaHomeSvgPaths from '../imports/App-1/svg-wu2qq70riw';

interface Pool {
  id: string;
  name: string;
  recommendedContribution: number;
  currentBalance: number;
  members: Member[];
}

interface Member {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
}

interface SpendingRequest {
  id: string;
  description: string;
  amount: number;
  requester: string;
  votes: {
    approved: number;
    total: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  isLarge?: boolean;
  approvers: string[];
}

interface Transaction {
  id: string;
  poolId: string;
  type: 'contribution' | 'spending';
  description: string;
  amount: number;
  person: string;
  timestamp: string;
  location?: string;
  category?: string;
  approvers?: string[];
  contributors?: { name: string; amount: number }[];
  notes?: string;
  remainingBalance?: number;
}

type TabView = 'home' | 'split' | 'analytics' | 'profile' | 'layak' | 'scamcheck';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>('home');
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showPayWithPool, setShowPayWithPool] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [viewingPoolId, setViewingPoolId] = useState<string | null>(null);

  // === BACKEND DATA (replaces hardcoded mocks) ============================
  const ui = useUiData();
  const currentUser = ui.me?.displayName ?? '';

  // Live updates: subscribe to all of my pools so vote/balance/spend events
  // trigger React Query invalidation across the app (no manual refresh).
  useRealtimeSync(ui.backendPools.map((p) => p.id));

  // Personal cross-pool transactions (Recent Transactions card on Home tab).
  const myTxQ = useMyTransactions(10);
  const myRecentTransactions = (myTxQ.data ?? []).slice(0, 3);

  // Empty fallback so UI renders during initial load instead of crashing on
  // pool[0].members access.
  const FALLBACK_POOL: Pool = {
    id: '__loading__',
    name: 'Loading…',
    recommendedContribution: 0,
    currentBalance: 0,
    members: [],
  };
  const pools: Pool[] = ui.pools.length > 0 ? ui.pools : [FALLBACK_POOL];
  const pool = pools[0];

  const setPools = (_: unknown) => { /* no-op — React Query is the source of truth */ };

  // Mutations — invalidate React Query caches on success.
  const contributeFor = useContribute(selectedPoolId ?? undefined);
  const createSpendFor = useCreateSpendRequest(viewingPoolId ?? selectedPoolId ?? pool.id);
  const voteOnPool = useVote(viewingPoolId ?? selectedPoolId ?? pool.id);
  const createPoolM = useCreatePool();
  const logoutM = useLogout();

  const spendingRequests: SpendingRequest[] = ui.spendingRequests;
  const setSpendingRequests = (_: unknown) => { /* no-op — managed by React Query */ };

  const transactions: Transaction[] = ui.transactions;

  const splits = pool.members.map((member) => {
    const totalSpent = 850;
    const perPerson = totalSpent / pool.members.length;
    return {
      name: member.name,
      contributed: member.contribution,
      spent: perPerson,
      balance: member.contribution - perPerson,
    };
  });

  const handleCreatePool = (newPool: { name: string; recommendedContribution: number }) => {
    const target = newPool.recommendedContribution > 0
      ? (newPool.recommendedContribution * 4).toFixed(2) // assume ~4 members
      : undefined;
    createPoolM.mutate({
      type: 'FAMILY',
      name: newPool.name,
      targetAmount: target,
    });
  };

  const handleContribute = (amount: number) => {
    if (!selectedPoolId) return;
    contributeFor.mutate(
      { amount: amount.toFixed(2) },
      {
        onError: (e: Error) => {
          // eslint-disable-next-line no-alert
          alert(`Could not contribute: ${e.message}`);
        },
      }
    );
  };

  const handleVote = (requestId: string, approved: boolean) => {
    voteOnPool.mutate(
      { spendRequestId: requestId, decision: approved ? 'APPROVE' : 'REJECT' },
      {
        onError: (e: Error) => {
          // eslint-disable-next-line no-alert
          alert(`Could not vote: ${e.message}`);
        },
      }
    );
  };

  const handleCreateRequest = (request: { description: string; amount: number }) => {
    if (!viewingPoolId && !selectedPoolId && !pool.id) return;
    createSpendFor.mutate(
      {
        amount: request.amount.toFixed(2),
        title: request.description.slice(0, 100),
        description: request.description.length > 100 ? request.description : undefined,
        // Default category — the create dialog can be enhanced later to pick one.
        // We use the wide-net "OTHER_FAMILY" since this UI is family-pool centric.
        category: 'OTHER_FAMILY',
      },
      {
        onError: (e: Error) => {
          // eslint-disable-next-line no-alert
          alert(`Could not create request: ${e.message}`);
        },
      }
    );
  };

  const totalContributed = pool.members.reduce((sum, m) => sum + m.contribution, 0);

  // Calculate total personal balance across all pools (current balances)
  const totalPersonalBalance = pools.reduce((sum, p) => sum + p.currentBalance, 0);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative" style={{ maxWidth: '402px', maxHeight: '917px', margin: '0 auto', background: 'linear-gradient(to bottom, #BEDCFF 0%, #F5F7FA 28.846%)' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="h-full overflow-y-auto pb-20" style={{ background: 'transparent' }}>
              {/* Header with Greeting */}
              <div className="px-5 pt-8 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #005AFF 0%, #4DA3FF 100%)' }}
                    >
                      <span className="text-lg font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{(currentUser || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Good morning,</p>
                      <h1 className="text-lg font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{currentUser || '—'}</h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: '#FFFFFF' }}
                      onClick={() => logoutM.mutate()}
                      title="Log out"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                        <path d={figmaHomeSvgPaths.p1c3efea0} stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={figmaHomeSvgPaths.p25877f40} stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Personal Balance Card with Actions Inside */}
                <div
                  className="overflow-hidden relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(0,90,255,0.15)]"
                  style={{
                    height: '189px',
                    backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 362 189\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(18.1 9.45 -36.2 18.9 181 94.5)\\'><stop stop-color=\\'rgba(6,65,135,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,89,189,1)\\' offset=\\'0.47115\\'/><stop stop-color=\\'rgba(10,110,182,1)\\' offset=\\'0.73558\\'/><stop stop-color=\\'rgba(20,131,174,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
                  }}
                >
                  {/* Top overlay gradient */}
                  <div
                    className="absolute h-[202px] left-0 top-0 w-full"
                    style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 372 202\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -40.197 -43.027 0 372 0)\\'><stop stop-color=\\'rgba(255,255,255,0.1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(128,128,128,0.05)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }}
                  />

                  <div className="absolute h-[153.575px] left-[32px] top-[15px] right-[32px]">
                    {/* Wallet Balance Label */}
                    <div className="absolute content-stretch flex h-[15.988px] items-start left-0 top-0 right-0">
                      <p className="flex-1 font-semibold leading-[16px] relative text-[12px] text-[rgba(255,255,255,0.7)]" style={{ fontFamily: 'Open Sans, sans-serif', fontVariationSettings: "'wdth' 100" }}>
                        Total Family Funds
                      </p>
                    </div>

                    {/* Balance Amount */}
                    <div className="absolute h-[40px] left-0 top-[23.99px] right-0">
                      <p className="absolute font-bold leading-[40px] left-0 text-[36px] text-white top-[-2px] whitespace-nowrap" style={{ fontFamily: 'Open Sans, sans-serif', fontVariationSettings: "'wdth' 100" }}>
                        RM {ui.totalPersonalBalance.toFixed(2)}
                      </p>
                    </div>

                    {/* Active Pools Indicator */}
                    <div className="absolute content-stretch flex gap-[8px] h-[15.988px] items-center left-0 top-[67.99px] right-0">
                      <div className="bg-[#05df72] rounded-full shrink-0 size-[8px]" />
                      <div className="h-[15.988px] relative shrink-0">
                        <p className="font-normal leading-[16px] relative text-[12px] text-[rgba(255,255,255,0.9)] whitespace-nowrap" style={{ fontFamily: 'Open Sans, sans-serif', fontVariationSettings: "'wdth' 100" }}>
                          Active pools: {pools.filter((p) => p.id !== '__loading__').length}
                        </p>
                      </div>
                    </div>

                    {/* Scan & Pay Button */}
                    <button
                      onClick={() => setShowPayWithPool(true)}
                      className="absolute bg-[rgba(255,255,255,0.15)] content-stretch flex gap-[8px] items-center justify-center left-0 px-[100.6px] py-[12.8px] rounded-[16px] top-[98px] right-0 press-scale"
                      style={{ position: 'relative' }}
                    >
                      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                      <div className="relative shrink-0 size-[20px]">
                        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                          <g>
                            <path d={scanPayButtonSvgPaths.pf942a70} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                            <path d={scanPayButtonSvgPaths.p3de9ee00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                            <path d={scanPayButtonSvgPaths.pbdf4440} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                            <path d={scanPayButtonSvgPaths.p1fb905c0} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          </g>
                        </svg>
                      </div>
                      <div className="h-[20px] relative shrink-0 w-[69.6px]">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                          <p className="-translate-x-1/2 absolute font-['Open_Sans:SemiBold',sans-serif] font-semibold leading-[20px] left-[35px] text-[14px] text-center text-white top-[-0.2px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                            Scan & Pay
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* This Month Summary */}
              <div className="px-5 mb-6">
                <div className="floating-card" style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  height: '148.8px'
                }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>This Month</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Income</span>
                      <span className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>RM 900</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Used</span>
                      <span className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>RM 700</span>
                    </div>
                    <div className="pt-2.5 border-t flex items-center justify-between" style={{ borderColor: '#F3F4F6', borderTopWidth: '0.8px' }}>
                      <span className="text-xs font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>Left</span>
                      <span className="text-lg font-bold" style={{ color: '#0055D6', fontFamily: 'Inter, sans-serif' }}>RM 200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Government Aid + Scam Check Row */}
              <div className="px-5 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Aid Ready */}
                  <div
                    onClick={() => setActiveTab('layak')}
                    className="floating-card press-scale cursor-pointer"
                    style={{
                      background: '#DBE7FF',
                      borderRadius: '14px',
                      padding: '14.8px 12.8px 0.8px 12.8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      height: '153.563px'
                    }}
                  >
                    <div className="text-center">
                      <div className="mb-2 flex items-center justify-center">
                        <Gift className="w-8 h-8" style={{ color: '#0055D6' }} />
                      </div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#101828', fontFamily: 'Inter, sans-serif' }}>Aid Ready</p>
                      <p className="text-lg font-bold mb-2" style={{ color: '#101828', fontFamily: 'Inter, sans-serif' }}>RM 200</p>
                      <button className="w-full text-xs font-bold py-1.5 rounded-lg" style={{ background: '#0055D6', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                        Claim
                      </button>
                    </div>
                  </div>

                  {/* Scam Check */}
                  <div
                    onClick={() => setActiveTab('scamcheck')}
                    className="floating-card" style={{
                    background: '#DBE7FF',
                    borderRadius: '14px',
                    padding: '0 13px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    height: '153.563px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <div className="text-center" style={{ marginTop: '17.2px', flex: 1 }}>
                      <div className="mb-2 flex items-center justify-center">
                        <Shield className="w-8 h-8" style={{ color: '#0055D6' }} />
                      </div>
                      <p className="text-xs font-bold mb-2" style={{ color: '#101828', fontFamily: 'Inter, sans-serif' }}>Scam Check</p>
                      <div className="flex items-center justify-center gap-1.5 mb-6">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                        <p className="text-[10px] font-semibold" style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}>No scam detected</p>
                      </div>
                    </div>
                    <button className="w-full text-xs font-bold py-1.5 rounded-lg mb-4" style={{ background: '#0055D6', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                      Check
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Pools Section */}
              <div className="px-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>Active Family Pools</h2>
                  <button
                    onClick={() => setActiveTab('split')}
                    className="text-xs font-bold"
                    style={{ color: '#005AFF', fontFamily: 'Inter, sans-serif' }}
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {pools.filter((p) => p.id !== '__loading__').map((p, idx) => {
                    const target = p.recommendedContribution > 0 ? p.recommendedContribution * (p.members.length || 1) : 0;
                    const progressPct = target > 0 ? Math.min(100, (p.currentBalance / target) * 100) : 0;
                    const Icon = idx === 0 ? GraduationCap : Home;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setViewingPoolId(p.id);
                          setActiveTab('split');
                        }}
                        className="floating-card press-scale cursor-pointer"
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '16px',
                          padding: '16px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                          minHeight: '93.988px'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Icon className="w-4 h-4" style={{ color: '#005AFF' }} />
                              <h3 className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{p.name}</h3>
                            </div>
                            <p className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{p.members.length} member{p.members.length === 1 ? '' : 's'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold" style={{ color: '#005AFF', fontFamily: 'Inter, sans-serif' }}>RM {p.currentBalance.toFixed(2)}</p>
                            {target > 0 && (
                              <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>of RM {target.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: '6px', background: '#EEF2F7', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            className="progress-fill"
                            style={{
                              height: '100%',
                              background: '#FDDC00',
                              borderRadius: '3px',
                              width: `${progressPct}%`,
                              transition: 'width 0.6s ease'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {pools.filter((p) => p.id !== '__loading__').length === 0 && (
                    <div className="text-center py-6 text-sm" style={{ color: '#6B7280' }}>
                      You're not in any pool yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions Section — wired to /users/me/transactions */}
              <div className="px-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>Recent Transaction</h2>
                  <button
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full press-scale"
                    style={{ background: '#0055D6' }}
                    onClick={() => setActiveTab('split')}
                  >
                    <span className="text-xs font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>All Transactions</span>
                    <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                      <path d={figmaHomeSvgPaths.p1d8d0700} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2.5" style={{ marginBottom: '24px' }}>
                  {myRecentTransactions.length === 0 && (
                    <div
                      className="text-center py-6 text-sm"
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {myTxQ.isLoading ? 'Loading transactions…' : 'No transactions yet.'}
                    </div>
                  )}
                  {myRecentTransactions.map((t) => {
                    const amount = Number(t.amount);
                    const isIn = t.direction === 'IN';
                    const sign = isIn ? '+' : '−';
                    const color = isIn ? '#0055D6' : '#1A1A1A';
                    const ts = new Date(t.createdAt);
                    const now = new Date();
                    const sameDay =
                      ts.getFullYear() === now.getFullYear() &&
                      ts.getMonth() === now.getMonth() &&
                      ts.getDate() === now.getDate();
                    const subtitle = sameDay
                      ? 'Today'
                      : ts.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
                    return (
                      <div
                        key={t.id}
                        className="press-scale cursor-pointer"
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '61.987px',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate mb-0.5" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>
                            {t.description || (isIn ? 'Money in' : 'Money out')}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>{subtitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-base font-bold" style={{ color, fontFamily: 'Inter, sans-serif' }}>
                            {sign}RM {amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Pool Tab */}
          {activeTab === 'split' && (
            <div className="h-full overflow-y-auto pb-20" style={{ background: 'transparent' }}>
              {!viewingPoolId ? (
                // Pool List View
                <>
                  {/* Header — Figma exact */}
                  <div style={{ background: 'linear-gradient(156.384604deg, rgb(0, 89, 189) 24.519%, rgb(23, 123, 175) 100%)', paddingBottom: 24 }}>
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-8 pt-3 h-11">
                      <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '-0.24px' }}>12:30</span>
                      <div className="flex items-center gap-2">
                        <svg width="17" height="11" viewBox="0 0 17 10.667" fill="white"><path d={svgPaths.p26d17600} fill="white" /></svg>
                        <svg width="16" height="11" viewBox="0 0 15.333 10.9999" fill="white"><path d={svgPaths.p39712400} fill="white" /></svg>
                        <div className="relative flex items-center">
                          <div className="border border-white/40 rounded-[2.5px] w-[22px] h-[11px] flex items-center pl-[2px]">
                            <div className="bg-white rounded-[1.2px] w-[17px] h-[7px]" />
                          </div>
                          <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 bg-white/40 rounded-[1px] w-[2px] h-[4px]" />
                        </div>
                      </div>
                    </div>
                    {/* Nav icons (doc + gear) */}
                    <div className="flex items-center justify-end px-5 pt-1 gap-1">
                      <div className="rounded-full size-9 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                          <path d={svgPaths.p26091d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          <path d={svgPaths.p1d33bb00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          <path d="M4.16667 10H10.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          <path d="M4.16667 13.3333H10.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          <path d="M4.16667 6.66667H7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        </svg>
                      </div>
                      <div className="rounded-full size-9 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                          <path d={svgPaths.p1f3cfb80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                          <path d={svgPaths.p2314a170} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        </svg>
                      </div>
                    </div>
                    {/* Title */}
                    <div style={{ padding: '12px 30px 0' }}>
                      <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: '32px', fontFamily: 'Inter, sans-serif', margin: 0 }}>My Pools</p>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: '20px', fontFamily: 'Inter, sans-serif', marginTop: 4, marginBottom: 0 }}>Manage your group wallets</p>
                    </div>
                  </div>

                  {/* Pool Cards */}
                  <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pools.map((poolItem) => {
                      const originalAmount = poolItem.members.reduce((sum, m) => sum + m.contribution, 0);
                      const currentBalance = poolItem.currentBalance;
                      const spentAmount = originalAmount - currentBalance;
                      const spentPercentage = (spentAmount / originalAmount) * 100;

                      return (
                        <div
                          key={poolItem.id}
                          onClick={() => setViewingPoolId(poolItem.id)}
                          className="press-scale cursor-pointer"
                          style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.08)' }}
                        >
                          {/* Pool Header Row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                              <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', lineHeight: '28px', margin: 0, fontFamily: 'Inter, sans-serif' }}>{poolItem.name}</p>
                              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: '20px', margin: 0, fontFamily: 'Inter, sans-serif' }}>{poolItem.members.length} members</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 24, fontWeight: 700, color: '#045BCF', lineHeight: '32px', margin: 0, fontFamily: 'Inter, sans-serif' }}>RM {currentBalance.toFixed(0)}</p>
                              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: '16px', margin: 0, fontFamily: 'Inter, sans-serif' }}>Current Balance</p>
                            </div>
                          </div>

                          {/* Spending Progress */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Spent</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{spentPercentage.toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 8, background: '#EEF2F7', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#F9D801', borderRadius: 4, width: `${spentPercentage}%`, transition: 'width 0.6s ease' }} />
                            </div>
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>
                              RM {spentAmount.toFixed(0)} spent of RM {originalAmount.toFixed(0)} original
                            </p>
                          </div>

                          {/* Avatars + Manage */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {poolItem.members.slice(0, 4).map((member, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundImage: 'linear-gradient(135deg, rgb(3,87,214) 0%, rgb(63,137,217) 100%)',
                                    border: '1.6px solid #fff',
                                    marginLeft: i === 0 ? 0 : -8,
                                    fontSize: 12, fontWeight: 700, color: '#fff',
                                    fontFamily: 'Inter, sans-serif',
                                    position: 'relative', zIndex: 4 - i,
                                  }}
                                >
                                  {member.name.charAt(0)}
                                </div>
                              ))}
                              {poolItem.members.length > 4 && (
                                <div
                                  style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: '#EEF2F7',
                                    border: '1.6px solid #fff',
                                    marginLeft: -8,
                                    fontSize: 12, fontWeight: 700, color: '#6B7280',
                                    fontFamily: 'Inter, sans-serif',
                                  }}
                                >
                                  +{poolItem.members.length - 4}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPoolId(poolItem.id); setShowManageMembers(true); }}
                              style={{ fontSize: 14, fontWeight: 700, color: '#045BCF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            >
                              Manage →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Create New Pool Button */}
                  <div style={{ padding: '20px 20px 20px' }}>
                    <button
                      onClick={() => setShowCreatePool(true)}
                      className="press-scale"
                      style={{ width: '100%', height: 46, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
                    >
                      <CreatePoolButton />
                    </button>
                  </div>
                </>
              ) : (
                // Pool Detail View - Refined to match Figma CardDetails exactly
                <>
                  {(() => {
                    const selectedPool = pools.find(p => p.id === viewingPoolId) || pool;
                    const originalAmount = selectedPool.members.reduce((sum, m) => sum + m.contribution, 0);
                    const currentBalance = selectedPool.currentBalance;
                    const spentAmount = originalAmount - currentBalance;
                    const spentPercentage = originalAmount > 0 ? (spentAmount / originalAmount) * 100 : 0;

                    return (
                      <div className="h-full overflow-y-auto" style={{ background: '#F5F7FA' }}>

                        {/* ── Blue Gradient Header ── */}
                        <div
                          className="relative"
                          style={{ background: 'linear-gradient(152.642892deg, rgb(0, 89, 189) 24.519%, rgb(23, 123, 175) 100%)' }}
                        >
                          {/* Status Bar */}
                          <div className="flex items-center justify-between px-6 pt-3 h-11">
                            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '-0.24px' }}>12:30</span>
                            <div className="flex items-center gap-2">
                              {/* Cellular */}
                              <svg width="17" height="11" viewBox="0 0 17 10.667" fill="white">
                                <path d={svgPaths.p26d17600} fill="white" />
                              </svg>
                              {/* Wifi */}
                              <svg width="16" height="11" viewBox="0 0 15.333 10.9999" fill="white">
                                <path d={svgPaths.p39712400} fill="white" />
                              </svg>
                              {/* Battery */}
                              <div className="relative flex items-center">
                                <div className="border border-white/40 rounded-[2.5px] w-[22px] h-[11px] flex items-center pl-[2px]">
                                  <div className="bg-white rounded-[1.2px] w-[17px] h-[7px]" />
                                </div>
                                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 bg-white/40 rounded-[1px] w-[2px] h-[4px]" />
                              </div>
                            </div>
                          </div>

                          {/* Navigation Row */}
                          <div className="flex items-center justify-between px-5 pt-1 pb-0">
                            <button
                              onClick={() => setViewingPoolId(null)}
                              className="rounded-full size-9 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                                <path d={svgPaths.p37c3e100} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              </svg>
                            </button>
                            <div className="flex items-center gap-1">
                              {/* Report / Document icon */}
                              <button
                                onClick={() => {
                                  setSelectedPoolId(selectedPool.id);
                                  setShowReportDialog(true);
                                }}
                                className="rounded-full size-9 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                                  <path d={svgPaths.p26091d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                  <path d={svgPaths.p1d33bb00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                  <path d="M4.16667 10H10.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                  <path d="M4.16667 13.3333H10.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                  <path d="M4.16667 6.66667H7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                </svg>
                              </button>
                              {/* Settings / Gear icon */}
                              <button
                                onClick={() => {
                                  setSelectedPoolId(selectedPool.id);
                                  setShowManageMembers(true);
                                }}
                                className="rounded-full size-9 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                                  <path d={svgPaths.p1f3cfb80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                  <path d={svgPaths.p2314a170} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Pool Title */}
                          <div className="px-[30px] pt-3 pb-14">
                            <h1 className="text-2xl font-bold text-white leading-8 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {selectedPool.name}
                            </h1>
                            <p className="text-sm text-white/80 leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Manage contributors &amp; split details
                            </p>
                          </div>
                        </div>

                        {/* ── White Summary Card (overlaps header) ── */}
                        <div className="px-4">
                          <div
                            className="bg-white rounded-[24px] pt-6 px-6 pb-5 relative z-10"
                            style={{ boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.08)', border: '0.8px solid rgba(255,255,255,0.2)', marginTop: '-40px' }}
                          >
                            {/* Row 1: Original Amount | Current Balance */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="text-xs text-[#6b7280] mb-1 leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>Original Amount</p>
                                <p className="text-2xl font-bold text-[#1a1a1a] leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  RM {originalAmount.toFixed(0)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[#6b7280] mb-1 leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>Current Balance</p>
                                <p className="text-2xl font-bold text-[#045bcf] leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  RM {currentBalance.toFixed(0)}
                                </p>
                              </div>
                            </div>

                            {/* Total Spent Box */}
                            <div
                              className="rounded-2xl px-3 pt-3 pb-3 mb-4"
                              style={{ background: '#ECF2FE', border: '0.8px solid #1476B1' }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-[#045bcf] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Total Spent
                                </span>
                                <span className="text-lg font-bold text-[#045bcf] leading-7" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  RM {spentAmount.toFixed(0)}
                                </span>
                              </div>
                              <p className="text-xs text-[#045bcf] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {selectedPool.members.length} members • Flexible contributions
                              </p>
                            </div>

                            {/* Spending Progress */}
                            <div className="mb-5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#6b7280] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Spending Progress
                                </span>
                                <span className="text-xs font-semibold text-[#1a1a1a] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {spentPercentage.toFixed(0)}% Spent
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EEF2F7' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${spentPercentage}%`,
                                    background: 'linear-gradient(177.638777deg, rgb(210, 176, 2) 0%, rgb(248, 214, 0) 100%)',
                                    transition: 'width 0.6s ease'
                                  }}
                                />
                              </div>
                              <p className="mt-1.5 text-xs text-[#9ca3af] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                RM {spentAmount.toFixed(0)} spent • RM {currentBalance.toFixed(0)} remaining
                              </p>
                            </div>

                            {/* + Contribute Button */}
                            <button
                              onClick={() => {
                                setSelectedPoolId(selectedPool.id);
                                setShowContributeDialog(true);
                              }}
                              className="w-full h-12 rounded-[30px] flex items-center justify-center gap-2 press-scale"
                              style={{ background: '#0055D6' }}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                                <path d="M4.16667 10H15.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                <path d="M10 4.16667V15.8333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              </svg>
                              <span className="font-bold text-base text-white leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Contribute
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* ── Contributors Section ── */}
                        <div className="px-[31px] pt-6 pb-2">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-[#1a1a1a] leading-7" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Contributors
                            </h2>
                            <div
                              className="rounded-lg px-2 py-0.5 flex items-center justify-center"
                              style={{ background: '#EFF6FF', border: '0.8px solid #0055D6' }}
                            >
                              <span className="text-[10px] font-bold text-[#045bcf] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {selectedPool.members.length} members
                              </span>
                            </div>
                          </div>

                          {/* Member Cards */}
                          <div className="space-y-3">
                            {selectedPool.members.map((member, index) => {
                              const isAdmin = index === 0;
                              return (
                                <div
                                  key={member.id}
                                  className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between"
                                  style={{ boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.05)' }}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div
                                      className="size-12 rounded-full flex items-center justify-center shrink-0"
                                      style={{ background: 'linear-gradient(135deg, #0055D6 14.583%, #408AD9 84.375%)' }}
                                    >
                                      <span className="font-bold text-base text-white leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        {member.name.charAt(0)}
                                      </span>
                                    </div>

                                    {/* Info */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-bold text-base text-[#1a1a1a] leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                                          {member.name}
                                        </p>
                                        {isAdmin && (
                                          <div
                                            className="rounded-lg px-2 h-4 flex items-center justify-center"
                                            style={{ background: '#EFF6FF' }}
                                          >
                                            <span className="text-[10px] font-semibold text-[#045bcf]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                              Admin
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#6b7280] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                        Contributed RM {member.contribution.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Paid Badge */}
                                  <div
                                    className="rounded-full px-2.5 py-1 flex items-center gap-1 shrink-0"
                                    style={{ background: '#ECFDF5' }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                                      <path d={svgPaths.pc012c00} stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                                      <path d={svgPaths.p24f94f00} stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                                    </svg>
                                    <span className="text-xs font-bold text-[#059669] leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      Paid
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ── Add Contributor Button ── */}
                        <div className="px-5 pt-5 pb-24">
                          <button
                            onClick={() => {
                              setSelectedPoolId(selectedPool.id);
                              setShowManageMembers(true);
                            }}
                            className="w-full h-14 rounded-full flex items-center justify-center gap-2 press-scale"
                            style={{ background: 'linear-gradient(171.347458deg, rgb(17, 115, 178) 0%, rgb(0, 85, 214) 100%)', boxShadow: '0px 4px 16px rgba(0,85,214,0.3)' }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                              <path d={svgPaths.p25397b80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              <path d={svgPaths.p2c4f400} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              <path d="M15.8333 6.66667V11.6667" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              <path d="M18.3333 9.16667H13.3333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                            </svg>
                            <span className="font-semibold text-base text-white leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Add Contributor
                            </span>
                          </button>
                        </div>

                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto" style={{ background: '#050C18' }}>
              <AnalyticsDashboard />
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <ProfilePage />
          )}

          {activeTab === 'layak' && (
            <LayakPage onBack={() => setActiveTab('home')} />
          )}

          {activeTab === 'scamcheck' && (
            <ScamCheckPage onBack={() => setActiveTab('home')} />
          )}
        </div>

        {/* Bottom Navigation */}
        <div
          className="nav-bar fixed bottom-0 left-0 right-0"
          style={{
            maxWidth: '402px',
            margin: '0 auto',
            background: '#FFFFFF',
            boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.04)',
            padding: '12px 8px',
            zIndex: 50
          }}
        >
          <div className="h-[60px] relative w-full">
            {/* Home Button */}
            <button
              onClick={() => setActiveTab('home')}
              className="absolute content-stretch flex flex-col gap-[4px] h-[60px] items-center left-0 p-[8px] top-0 w-[20%] transition-all"
              style={{ opacity: activeTab === 'home' ? 1 : 0.6 }}
            >
              <div className="flex-[1_0_0] min-h-px relative w-[24px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-[12.5%_8.33%_33.33%_12.5%]">
                    <div className="absolute inset-[-7.69%_-5.26%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 15">
                        <path d={navSvgPaths.p13f3c500} stroke={activeTab === 'home' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[20.83%_12.5%_12.5%_12.5%]">
                    <div className="absolute inset-[-6.25%_-5.56%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
                        <path d={navSvgPaths.p15cf0c00} stroke={activeTab === 'home' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[16px] relative shrink-0">
                <p className="font-semibold leading-[16px] not-italic text-[12px] text-center whitespace-nowrap" style={{ color: activeTab === 'home' ? '#005AFF' : '#9CA3AF', fontWeight: activeTab === 'home' ? 600 : 500 }}>
                  Home
                </p>
              </div>
            </button>

            {/* Pool Button */}
            <button
              onClick={() => setActiveTab('split')}
              className="absolute content-stretch flex flex-col gap-[4px] h-[60px] items-center left-[20%] p-[8px] top-0 w-[20%] transition-all"
              style={{ opacity: activeTab === 'split' ? 1 : 0.6 }}
            >
              <div className="flex-[1_0_0] min-h-px relative w-[24px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-[62.5%_33.33%_12.5%_8.33%]">
                    <div className="absolute inset-[-16.67%_-7.14%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
                        <path d={navSvgPaths.p11b86180} stroke={activeTab === 'split' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[12.5%_45.83%_54.17%_20.83%]">
                    <div className="absolute inset-[-12.5%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                        <path d={navSvgPaths.pb08b100} stroke={activeTab === 'split' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[63.04%_8.33%_12.5%_79.17%]">
                    <div className="absolute inset-[-17.04%_-33.33%_-17.04%_-33.34%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00024 7.87024">
                        <path d={navSvgPaths.p19976900} stroke={activeTab === 'split' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[13.04%_20.8%_54.67%_66.67%]">
                    <div className="absolute inset-[-12.91%_-33.25%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.00808 9.75048">
                        <path d={navSvgPaths.p29500900} stroke={activeTab === 'split' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[16px] relative shrink-0">
                <p className="font-medium leading-[16px] not-italic text-[12px] text-center whitespace-nowrap" style={{ color: activeTab === 'split' ? '#005AFF' : '#9CA3AF', fontWeight: activeTab === 'split' ? 600 : 500 }}>
                  Pool
                </p>
              </div>
            </button>

            {/* Layak Button */}
            <button
              onClick={() => setActiveTab('layak')}
              className="absolute content-stretch flex flex-col gap-[4px] h-[60px] items-center left-[40%] p-[8px] top-0 w-[20%] transition-all"
              style={{ opacity: activeTab === 'layak' ? 1 : 0.6 }}
            >
              <div className="flex-[1_0_0] min-h-px relative w-[24px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-[8.33%_16.67%_8.32%_16.67%]">
                    <div className="absolute inset-[-5%_-6.25%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22.0034">
                        <path d={navSvgPaths.p27979bf0} stroke={activeTab === 'layak' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[16px] relative shrink-0">
                <p className="font-medium leading-[16px] not-italic text-[12px] text-center whitespace-nowrap" style={{ color: activeTab === 'layak' ? '#005AFF' : '#9CA3AF', fontWeight: activeTab === 'layak' ? 600 : 500 }}>
                  Layak
                </p>
              </div>
            </button>

            {/* Analytics Button */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="absolute content-stretch flex flex-col gap-[4px] h-[60px] items-center left-[60%] p-[8px] top-0 w-[20%] transition-all"
              style={{ opacity: activeTab === 'analytics' ? 1 : 0.6 }}
            >
              <div className="flex-[1_0_0] min-h-px relative w-[24px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-[29.17%_7%_29.17%_9.67%]">
                    <div className="absolute inset-[-10%_-5%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 12">
                        <path d="M21 1L12.5 9.5L7.5 4.5L1 11" stroke={activeTab === 'analytics' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[29.17%_7%_45.83%_68%]">
                    <div className="absolute inset-[-16.67%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                        <path d="M1 1H7V7" stroke={activeTab === 'analytics' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[16px] relative shrink-0">
                <p className="font-medium leading-[16px] not-italic text-[12px] text-center whitespace-nowrap" style={{ color: activeTab === 'analytics' ? '#005AFF' : '#9CA3AF', fontWeight: activeTab === 'analytics' ? 600 : 500 }}>
                  Analytics
                </p>
              </div>
            </button>

            {/* Profile Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className="absolute content-stretch flex flex-col gap-[4px] h-[60px] items-center left-[80%] p-[8px] top-0 w-[20%] transition-all"
              style={{ opacity: activeTab === 'profile' ? 1 : 0.6 }}
            >
              <div className="flex-[1_0_0] min-h-px relative w-[24px]">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <div className="absolute inset-[8.33%_12.43%]">
                    <div className="absolute inset-[-5%_-5.54%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0352 22">
                        <path d={navSvgPaths.p2eb1aa00} stroke={activeTab === 'profile' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[37.5%]">
                    <div className="absolute inset-[-16.67%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                        <path d={navSvgPaths.p1e531d00} stroke={activeTab === 'profile' ? '#005AFF' : '#9CA3AF'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[16px] relative shrink-0">
                <p className="font-medium leading-[16px] not-italic text-[12px] text-center whitespace-nowrap" style={{ color: activeTab === 'profile' ? '#005AFF' : '#9CA3AF', fontWeight: activeTab === 'profile' ? 600 : 500 }}>
                  Profile
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <CreatePoolDialog
        open={showCreatePool}
        onOpenChange={setShowCreatePool}
        onCreatePool={handleCreatePool}
      />

      <NewSpendingRequestDialog
        open={showNewRequest}
        onOpenChange={setShowNewRequest}
        onCreateRequest={handleCreateRequest}
      />

      <TransactionDetailDialog
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />

      <PayWithPoolDialog
        open={showPayWithPool}
        onOpenChange={setShowPayWithPool}
        pools={pools}
      />

      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={(open) => {
          setShowManageMembers(open);
          if (!open) setSelectedPoolId(null);
        }}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || '' : pool.name}
        members={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members || [] : pool.members}
        poolBalance={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members.reduce((sum, m) => sum + m.contribution, 0) || 0 : totalContributed}
        hasTransactions={selectedPoolId ? transactions.filter(t => t.poolId === selectedPoolId).length > 0 : transactions.length > 0}
      />

      <ContributeToPoolDialog
        open={showContributeDialog}
        onOpenChange={(open) => {
          setShowContributeDialog(open);
          if (!open) setSelectedPoolId(null);
        }}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || '' : pool.name}
        currentBalance={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.currentBalance || 0 : pool.currentBalance}
        recommendedContribution={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.recommendedContribution || 0 : pool.recommendedContribution}
        memberCount={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members.length || 0 : pool.members.length}
        onContribute={handleContribute}
      />

      <PoolReportDialog
        open={showReportDialog}
        onOpenChange={(open) => {
          setShowReportDialog(open);
          if (!open) setSelectedPoolId(null);
        }}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || '' : pool.name}
        recommendedContribution={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.recommendedContribution || 0 : pool.recommendedContribution}
        currentBalance={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.currentBalance || 0 : pool.currentBalance}
        members={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members || [] : pool.members}
        transactions={selectedPoolId ? transactions.filter(t => t.poolId === selectedPoolId) : transactions}
        createdDate="13 Apr 2026"
      />
    </div>
  );
}