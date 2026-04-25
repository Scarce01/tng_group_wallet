import { useEffect, useState } from 'react';
import { usePools, usePoolTransactions, useSpendRequests } from '../api/hooks';
import type {
  Pool as ApiPool,
  PoolMember as ApiPoolMember,
  Transaction as ApiTransaction,
  SpendRequest as ApiSpendRequest,
} from '../api/client';
import { CreatePoolDialog } from './components/CreatePoolDialog';
import { NewSpendingRequestDialog } from './components/NewSpendingRequestDialog';
import { TransactionDetailDialog } from './components/TransactionDetailDialog';
import { ManageMembersDialog } from './components/ManageMembersDialog';
import { TransactionFilterDropdown } from './components/TransactionFilterDropdown';
import { ContributeToPoolDialog } from './components/ContributeToPoolDialog';
import { PoolReportDialog } from './components/PoolReportDialog';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProfilePage } from './components/ProfilePage';
import { ScanPage } from './components/ScanPage';
import { ScamCheckPage } from './components/ScamCheckPage';
import { PoolPage } from './components/PoolPage';
import { FreezePoolSheet } from './components/FreezePoolSheet';
import { SmartCallSheet } from './components/SmartCallSheet';
import { QrScannerDialog } from './components/QrScannerDialog';
import { Wallet, Plus, Users, TrendingUp, Bell, Settings, Shield, Gift, Home, GraduationCap, ShoppingCart, Zap, Building2, Utensils, Sparkles } from 'lucide-react';
import svgPaths from '../imports/CardDetails/svg-3xzeber0v2';
import navSvgPaths from '../imports/Container-3/svg-lc0haplezl';
import CreatePoolButton from '../imports/Button-1/Button-2096-218';
import scanPayButtonSvgPaths from '../imports/Button-1-1/svg-f46060bysf';
import figmaHomeSvgPaths from '../imports/App-1/svg-wu2qq70riw';

import { motion as Motion, AnimatePresence } from 'motion/react';

interface Pool {
  id: string;
  name: string;
  recommendedContribution: number;
  currentBalance: number;
  members: Member[];
  color?: string;
  photo?: string;
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

type TabView = 'home' | 'split' | 'analytics' | 'profile' | 'scamcheck' | 'scan';

// Color palette for backend-sourced pools (cycles by index)
const POOL_GRADIENTS = [
  'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)',
  'linear-gradient(135deg, #0A2463 0%, #2B5BE8 100%)',
  'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
  'linear-gradient(135deg, #7C2D12 0%, #F97316 100%)',
  'linear-gradient(135deg, #581C87 0%, #A855F7 100%)',
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.getDate()} ${d.toLocaleString('en-MY', { month: 'short' })}, ${time}`;
}

function adaptApiSpendRequest(r: ApiSpendRequest): SpendingRequest {
  const approveVotes = (r.votes ?? []).filter((v) => v.decision === 'APPROVE');
  const totalVotes = (r.votes ?? []).length;
  const status: SpendingRequest['status'] =
    r.status === 'APPROVED' || r.status === 'EXECUTED' ? 'approved'
    : r.status === 'REJECTED' || r.status === 'EXPIRED' || r.status === 'CANCELLED' ? 'rejected'
    : 'pending';
  return {
    id: r.id,
    description: r.title || r.description || 'Spend request',
    amount: Number(r.amount ?? 0) || 0,
    requester: r.requester?.displayName ?? 'Unknown',
    votes: { approved: approveVotes.length, total: Math.max(totalVotes, 1) },
    status,
    isLarge: r.isEmergency || Number(r.amount ?? 0) >= 500,
    approvers: approveVotes.map((v) => (v as unknown as { user?: { displayName?: string } }).user?.displayName ?? 'Member'),
  };
}

function adaptApiTransaction(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    poolId: t.poolId ?? '',
    type: t.direction === 'IN' ? 'contribution' : 'spending',
    description: t.description,
    amount: Number(t.amount ?? 0) || 0,
    person: t.user?.displayName ?? 'Unknown',
    timestamp: formatTimestamp(t.createdAt),
    remainingBalance: Number(t.balanceAfter ?? 0) || undefined,
  };
}

function adaptApiPool(p: ApiPool, idx: number): Pool {
  return {
    id: p.id,
    name: p.name,
    recommendedContribution: Number(p.targetAmount ?? 0) || 0,
    currentBalance: Number(p.currentBalance ?? 0) || 0,
    color: POOL_GRADIENTS[idx % POOL_GRADIENTS.length],
    members: ((p as unknown as { members?: ApiPoolMember[] }).members ?? []).map((m) => ({
      id: m.id,
      name: m.user?.displayName ?? '?',
      contribution: 0, // requires per-pool /members fetch with contributedTotal
      status: m.isActive ? 'paid' : 'pending',
    })),
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>('split');
  const [isStackExpanded, setIsStackExpanded] = useState(false);
  const [activePoolId, setActivePoolId] = useState<string>('1');
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentUser] = useState('Amanda');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [viewingPoolId, setViewingPoolId] = useState<string | null>(null);

  // ── Time filter for Recent Transactions ──
  const [timeFilter, setTimeFilter] = useState<string>('All Time');
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  // ── AI Advisor action sheet states ──
  const [showFreezeSheet, setShowFreezeSheet] = useState(false);
  const [showSmartCallSheet, setShowSmartCallSheet] = useState(false);
  const [contributeVotingPowerMode, setContributeVotingPowerMode] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [appToast, setAppToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3200);
  };

  const [pools, setPools] = useState<Pool[]>([
    {
      id: '1',
      name: 'Education',
      recommendedContribution: 75,
      currentBalance: 200,
      color: 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)',
      members: [
        { id: '1', name: 'Amanda', contribution: 75, status: 'paid' },
        { id: '2', name: 'Ahmad', contribution: 75, status: 'paid' },
        { id: '3', name: 'Fatimah', contribution: 75, status: 'paid' },
        { id: '4', name: 'Razak', contribution: 75, status: 'paid' },
      ],
    },
    {
      id: '2',
      name: 'House',
      recommendedContribution: 400,
      currentBalance: 500,
      color: 'linear-gradient(135deg, #0A2463 0%, #2B5BE8 100%)',
      members: [
        { id: '1', name: 'Amanda', contribution: 400, status: 'paid' },
        { id: '2', name: 'Ahmad', contribution: 400, status: 'paid' },
      ],
    },
    {
      id: '3',
      name: 'Groceries',
      recommendedContribution: 200,
      currentBalance: 150,
      color: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
      members: [
        { id: '1', name: 'Amanda', contribution: 100, status: 'paid' },
        { id: '2', name: 'Ahmad', contribution: 100, status: 'paid' },
        { id: '3', name: 'Fatimah', contribution: 50, status: 'pending' },
      ],
    },
  ]);

  // ── Sync pool list from backend (Phase 2b) ────────────────────────────────
  // Local fallback pools above are seed data only. When the API responds, we
  // replace them with real pools. setPools is preserved so optimistic
  // updates from CreatePoolDialog/ContributeToPoolDialog still work; mutations
  // (Phase 2c) will invalidate the query and re-sync via this effect.
  const poolsQuery = usePools();
  useEffect(() => {
    if (poolsQuery.data && poolsQuery.data.length > 0) {
      const adapted = poolsQuery.data.map(adaptApiPool);
      setPools(adapted);
      // Reset activePoolId to first real pool (hardcoded '1' won't exist after sync)
      setActivePoolId((prev) => (adapted.some(p => p.id === prev) ? prev : adapted[0].id));
    }
  }, [poolsQuery.data]);

  // ── Sync transactions for active pool from backend (Phase 2c) ─────────────
  // The backend exposes /pools/{id}/transactions (per-pool); switching active
  // pool refetches. Only the active pool's tx list is live; other pools fall
  // back to seed data baked into the initial useState above until visited.
  const txQuery = usePoolTransactions(activePoolId);
  useEffect(() => {
    if (txQuery.data) {
      const live = txQuery.data.map(adaptApiTransaction);
      setTransactions((prev) => {
        const others = prev.filter((t) => t.poolId !== activePoolId);
        return [...live, ...others];
      });
    }
  }, [txQuery.data, activePoolId]);

  // ── Sync spending requests for active pool from backend (Phase 2d) ────────
  const spendQuery = useSpendRequests(activePoolId);
  useEffect(() => {
    if (spendQuery.data) {
      setSpendingRequests(spendQuery.data.map(adaptApiSpendRequest));
    }
  }, [spendQuery.data]);

  // For compatibility with existing code that uses 'pool'
  const pool = pools[0];

  const [spendingRequests, setSpendingRequests] = useState<SpendingRequest[]>([
    {
      id: '1',
      description: 'Hotel booking - 3 nights at Langkawi Beach Resort',
      amount: 600,
      requester: 'Sarah',
      votes: { approved: 3, total: 5 },
      status: 'pending',
      isLarge: true,
      approvers: ['Ahmad', 'Kumar', 'Wei Ling'],
    },
    {
      id: '2',
      description: 'Rental car for 3 days',
      amount: 200,
      requester: 'Kumar',
      votes: { approved: 4, total: 5 },
      status: 'approved',
      approvers: ['Ahmad', 'Sarah', 'Wei Ling', 'Farah'],
    },
    {
      id: '3',
      description: 'Welcome dinner at seafood restaurant',
      amount: 150,
      requester: 'Wei Ling',
      votes: { approved: 2, total: 5 },
      status: 'pending',
      approvers: ['Ahmad', 'Sarah'],
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    // Education Fund Transactions (Pool ID: '1')
    {
      id: '1',
      poolId: '1',
      type: 'contribution',
      description: 'STR Grant → Added to Edu Pool',
      amount: 150,
      person: 'Grant',
      timestamp: 'Today, 10:30 AM',
      category: 'Grant',
      notes: 'Government aid automatically added to Education pool'
    },
    {
      id: '2',
      poolId: '1',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 75,
      person: 'Amanda',
      timestamp: '20 Apr, 9:00 AM',
    },
    {
      id: '3',
      poolId: '1',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 75,
      person: 'Ahmad',
      timestamp: '20 Apr, 9:00 AM',
    },
    {
      id: '4',
      poolId: '1',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 75,
      person: 'Fatimah',
      timestamp: '20 Apr, 9:00 AM',
    },
    {
      id: '5',
      poolId: '1',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 75,
      person: 'Razak',
      timestamp: '20 Apr, 9:00 AM',
    },

    // Household Transactions (Pool ID: '2')
    {
      id: '6',
      poolId: '2',
      type: 'contribution',
      description: 'Cleaning Job',
      amount: 50,
      person: 'Amanda',
      timestamp: 'Yesterday, 8:45 AM',
      category: 'Income',
    },
    {
      id: '7',
      poolId: '2',
      type: 'spending',
      description: '99 Speedmart',
      amount: 45,
      person: 'Ahmad',
      timestamp: '19 Apr, 3:30 PM',
      location: '99 Speedmart Taman Melati',
      category: 'Groceries',
    },
    {
      id: '8',
      poolId: '2',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 400,
      person: 'Amanda',
      timestamp: '18 Apr, 10:00 AM',
    },
    {
      id: '9',
      poolId: '2',
      type: 'contribution',
      description: 'Initial contribution',
      amount: 400,
      person: 'Ahmad',
      timestamp: '18 Apr, 10:00 AM',
    },
    {
      id: '10',
      poolId: '2',
      type: 'spending',
      description: 'Electric Bill',
      amount: 85,
      person: 'Amanda',
      timestamp: '17 Apr, 2:15 PM',
      location: 'TNB Online',
      category: 'Utilities',
    },
    {
      id: '11',
      poolId: '2',
      type: 'spending',
      description: 'Wet Market',
      amount: 70,
      person: 'Ahmad',
      timestamp: '16 Apr, 7:00 AM',
      location: 'Pasar Pagi Wangsa Maju',
      category: 'Groceries',
    },
    // Groceries Pool Transactions (Pool ID: '3')
    {
      id: '12',
      poolId: '3',
      type: 'contribution',
      description: 'Monthly contribution',
      amount: 100,
      person: 'Amanda',
      timestamp: '22 Apr, 9:00 AM',
      category: 'Contribution',
    },
    {
      id: '13',
      poolId: '3',
      type: 'contribution',
      description: 'Monthly contribution',
      amount: 100,
      person: 'Ahmad',
      timestamp: '22 Apr, 9:00 AM',
      category: 'Contribution',
    },
    {
      id: '14',
      poolId: '3',
      type: 'spending',
      description: 'Giant Hypermarket',
      amount: 88,
      person: 'Amanda',
      timestamp: '23 Apr, 5:00 PM',
      location: 'Giant Wangsa Maju',
      category: 'Groceries',
    },
    {
      id: '15',
      poolId: '3',
      type: 'spending',
      description: 'Aeon Supermarket',
      amount: 62,
      person: 'Ahmad',
      timestamp: '24 Apr, 11:30 AM',
      location: 'Aeon Mid Valley',
      category: 'Groceries',
    },
  ]);

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

  const handleCreatePool = (newPool: { name: string; recommendedContribution: number; color?: string; photo?: string }) => {
    const createdPool: Pool = {
      id: Date.now().toString(),
      name: newPool.name,
      recommendedContribution: newPool.recommendedContribution,
      currentBalance: 0,
      members: [],
      color: newPool.color,
      photo: newPool.photo,
    };
    setPools(prev => [...prev, createdPool]);
  };

  const handleContribute = (amount: number) => {
    if (selectedPoolId) {
      setPools(prev => prev.map(p => {
        if (p.id === selectedPoolId) {
          // Check if current user already contributed
          const existingMember = p.members.find(m => m.name === currentUser);

          if (existingMember) {
            // Don't allow contributing again - user already contributed
            return p;
          } else {
            // Add new member
            return {
              ...p,
              currentBalance: p.currentBalance + amount,
              members: [
                ...p.members,
                {
                  id: Date.now().toString(),
                  name: currentUser,
                  contribution: amount,
                  status: 'paid' as const
                }
              ]
            };
          }
        }
        return p;
      }));
    }
  };

  const handleVote = (requestId: string, approved: boolean) => {
    setSpendingRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const newApproved = approved ? req.votes.approved + 1 : req.votes.approved;
          const newApprovers = [...req.approvers, currentUser];
          const newStatus =
            newApproved >= 3
              ? 'approved'
              : req.votes.total - newApprovers.length < 3 - newApproved
              ? 'rejected'
              : 'pending';

          return {
            ...req,
            votes: { ...req.votes, approved: newApproved },
            approvers: newApprovers,
            status: newStatus,
          };
        }
        return req;
      })
    );
  };

  const handleCreateRequest = (request: { description: string; amount: number }) => {
    const isLarge = request.amount > 400;
    const newRequest: SpendingRequest = {
      id: Date.now().toString(),
      description: request.description,
      amount: request.amount,
      requester: currentUser,
      votes: { approved: 0, total: pool.members.length },
      status: 'pending',
      isLarge,
      approvers: [],
    };
    setSpendingRequests((prev) => [newRequest, ...prev]);
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
            (() => {
              const activePool = pools.find(p => p.id === activePoolId) || pools[0];
              const activeTransactions = transactions.filter(t => t.poolId === activePool.id);
              const income = activePool.members.reduce((s, m) => s + m.contribution, 0) || activePool.currentBalance + 200;
              const used = activeTransactions.filter(t => t.type === 'spending').reduce((s, t) => s + t.amount, 0) || 150;
              const percentage = Math.min((used / (income || 1)) * 100, 100);

              return (
                <div className="h-full overflow-y-auto pb-20" style={{ background: 'transparent' }}>
                  {/* ── HEADER ── */}
                  <div className="px-5 pt-8 pb-2 relative z-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: 'linear-gradient(135deg, #005AFF 0%, #4DA3FF 100%)' }}
                        >
                          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{currentUser.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Good morning,</p>
                          <h1 className="text-lg font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{currentUser} 👋</h1>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="w-10 h-10 rounded-full flex items-center justify-center relative"
                          style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                        >
                          <Bell className="w-5 h-5" style={{ color: '#6B7280' }} />
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#005AFF' }} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── CARD STACK HERO SECTION ── */}
                  <div className="px-5 mt-4 relative z-10">
                    <div 
                      className="relative w-full transition-all duration-500" 
                      style={{ height: isStackExpanded ? `${pools.length * 150 + 60}px` : '210px' }}
                    >
                      {pools.map((poolItem, index) => {
                        const isActive = poolItem.id === activePoolId;
                        const others = pools.filter(p => p.id !== activePoolId);
                        const otherIndex = others.findIndex(p => p.id === poolItem.id);
                        
                        const isTop = isActive;
                        
                        let yPos = isTop ? 0 : 25 + otherIndex * 20;
                        let scale = isTop ? 1 : 0.95 - otherIndex * 0.05;
                        let zIndex = isTop ? 40 : 30 - otherIndex;
                        let opacity = isTop ? 1 : 1 - otherIndex * 0.2;
                        
                        if (isStackExpanded) {
                          yPos = index * 150; 
                          scale = 1;
                          zIndex = pools.length - index; 
                          opacity = 1;
                        }
                        
                        return (
                          <Motion.div
                            key={poolItem.id}
                            layout
                            onClick={() => {
                              if (isStackExpanded) {
                                setActivePoolId(poolItem.id);
                                setIsStackExpanded(false);
                              } else if (!isTop) {
                                setIsStackExpanded(true);
                                setActivePoolId(poolItem.id);
                              } else {
                                setIsStackExpanded(true);
                              }
                            }}
                            initial={false}
                            animate={{ y: yPos, scale, zIndex, opacity }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="absolute top-0 left-0 w-full rounded-[24px] overflow-hidden shadow-[0px_8px_32px_0px_rgba(0,0,0,0.12)] cursor-pointer"
                            style={{
                              height: '190px',
                              background: poolItem.id === '1' 
                                ? `url(https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxmYW1pbHl8ZW58MXx8fHwxNzc3MDkxNzc0fDA&ixlib=rb-4.1.0&q=80&w=1080) center/cover` 
                                : poolItem.color || 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)',
                            }}
                          >
                            <div className="absolute inset-0" style={{ background: poolItem.id === '1' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)', backdropFilter: poolItem.id === '1' ? 'blur(8px)' : 'none' }} />
                            <div className="absolute" style={{ width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -60, right: -40 }} />
                            
                            <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
                              <div>
                                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Open Sans, sans-serif' }}>
                                  {poolItem.name} Pool
                                </p>
                                <p className="font-bold text-white" style={{ fontSize: '34px', lineHeight: '1.15', fontFamily: 'Open Sans, sans-serif' }}>
                                  RM {poolItem.currentBalance.toFixed(2)}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex -space-x-1.5">
                                    {poolItem.members.slice(0, 3).map((m, i) => (
                                      <div key={i} className="w-5 h-5 rounded-full border border-white flex items-center justify-center bg-[#005AFF] text-[9px] text-white font-bold shadow-sm">
                                        {m.name.charAt(0)}
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Open Sans, sans-serif' }}>
                                    {poolItem.members.length} Contributors
                                  </p>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {(isTop && !isStackExpanded) && (
                                  <Motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }} 
                                    className="flex gap-3"
                                  >
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setActiveTab('scan'); }}
                                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] press-scale"
                                      style={{ background: 'rgba(255,255,255,0.18)', border: '0.8px solid rgba(255,255,255,0.25)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                                        <path d={scanPayButtonSvgPaths.pf942a70} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                        <path d={scanPayButtonSvgPaths.p3de9ee00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                        <path d={scanPayButtonSvgPaths.pbdf4440} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                        <path d={scanPayButtonSvgPaths.p1fb905c0} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                      </svg>
                                      <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Open Sans, sans-serif' }}>Scan & Pay</span>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); }}
                                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] press-scale"
                                      style={{ background: 'rgba(255,255,255,0.18)', border: '0.8px solid rgba(255,255,255,0.25)' }}
                                    >
                                      <Wallet className="w-4 h-4 text-white" />
                                      <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Open Sans, sans-serif' }}>Top Up</span>
                                    </button>
                                  </Motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </Motion.div>
                        );
                      })}
                    </div>

                    {!isStackExpanded && (
                      <div className="flex justify-center mt-2 relative z-50">
                        <button 
                          onClick={() => setIsStackExpanded(true)}
                          className="text-[10px] font-bold px-3 py-1 rounded-full press-scale"
                          style={{ color: '#005AFF', background: '#EEF4FF' }}
                        >
                          View All Pools ↓
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DYNAMIC CONTENT based on active pool */}
                  <AnimatePresence mode="wait">
                    {!isStackExpanded && (
                      <Motion.div
                        key={activePoolId}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-0"
                      >
                        {/* ── THIS MONTH BUDGET ── */}
                        <div className="px-5 mb-5">
                          <div className="rounded-[16px] p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{activePool.name} Budget</h3>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EEF4FF', color: '#005AFF', fontFamily: 'Inter, sans-serif' }}>This Month</span>
                            </div>
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                                  <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Collected</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>RM {income}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                                  <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Used</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>RM {used}</span>
                              </div>
                            </div>
                            <div className="mb-3" style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${percentage}%`, background: percentage > 85 ? '#EF4444' : 'linear-gradient(90deg, #005AFF, #4DA3FF)', borderRadius: '3px', transition: 'width 0.6s ease, background 0.6s ease' }} />
                            </div>
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: '0.8px solid #F3F4F6' }}>
                              <span className="text-xs font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>Current Balance</span>
                              <span className="font-bold" style={{ color: '#005AFF', fontFamily: 'Inter, sans-serif', fontSize: '18px' }}>RM {activePool.currentBalance}</span>
                            </div>
                          </div>
                        </div>

                        {/* ── RECENT TRANSACTIONS ── */}
                        <div className="px-5 mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>Recent Transactions</h2>
                            {/* Time filter button + dropdown */}
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setShowTimeFilter(o => !o)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full press-scale"
                                style={{ background: '#005AFF', transition: 'background 0.15s' }}
                              >
                                <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'Inter, sans-serif', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {timeFilter === 'All Time' ? 'All' : timeFilter}
                                </span>
                                <svg
                                  width="8" height="5" viewBox="0 0 8 5" fill="none"
                                  style={{ transform: showTimeFilter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                                >
                                  <path d={figmaHomeSvgPaths.p1d8d0700} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                                </svg>
                              </button>

                              {/* Dropdown menu */}
                              {showTimeFilter && (
                                <>
                                  {/* Invisible backdrop to close on outside click */}
                                  <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 48 }}
                                    onClick={() => setShowTimeFilter(false)}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 'calc(100% + 6px)',
                                      right: 0,
                                      zIndex: 49,
                                      background: '#FFFFFF',
                                      borderRadius: 14,
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                                      border: '1px solid rgba(0,90,255,0.1)',
                                      overflow: 'hidden',
                                      minWidth: 168,
                                    }}
                                  >
                                    {[
                                      { label: 'All Time',                  sub: 'All transactions' },
                                      { label: 'This Month',                sub: 'April 2026' },
                                      { label: 'Last Month',                sub: 'March 2026' },
                                      { label: 'Last 90 Days',              sub: 'Jan – Apr 2026' },
                                    ].map(({ label, sub }, i, arr) => {
                                      const isActive = timeFilter === label;
                                      return (
                                        <button
                                          key={label}
                                          onClick={() => { setTimeFilter(label); setShowTimeFilter(false); }}
                                          style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '11px 14px',
                                            background: isActive ? 'rgba(0,90,255,0.06)' : 'transparent',
                                            border: 'none',
                                            borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.12s',
                                          }}
                                        >
                                          <div>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#005AFF' : '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>
                                              {label}
                                            </p>
                                            <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
                                              {sub}
                                            </p>
                                          </div>
                                          {isActive && (
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                                              <path d="M2.5 7L5.5 10L11.5 4" stroke="#005AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {activeTransactions.length > 0 ? activeTransactions.map((tx) => {
                              const positive = tx.type === 'contribution';
                              return (
                                <div
                                  key={tx.id}
                                  onClick={() => setSelectedTransaction(tx)}
                                  className="flex items-center gap-3 rounded-[12px] px-3 py-3 press-scale cursor-pointer"
                                  style={{ background: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                >
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: positive ? '#ECFDF5' : '#FFFBEB' }}>
                                    {positive ? <Plus className="w-4 h-4 text-emerald-500" /> : <ShoppingCart className="w-4 h-4 text-amber-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate" style={{ color: '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>{tx.description || tx.category}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm" style={{ background: '#DBE7FF', color: '#005AFF' }}>
                                        {tx.person?.charAt(0) || 'A'}
                                      </div>
                                      <p className="text-[10px]" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{tx.person} • {tx.timestamp ? tx.timestamp.split(',')[0] : 'Today'}</p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-sm flex-shrink-0" style={{ color: positive ? '#10B981' : '#1A1A1A', fontFamily: 'Inter, sans-serif' }}>
                                    {positive ? '+' : '−'}RM {tx.amount}
                                  </p>
                                </div>
                              );
                            }) : (
                              <div className="py-6 text-center rounded-[12px]" style={{ background: '#FFFFFF', border: '1px dashed #E5E7EB' }}>
                                <p className="text-xs text-gray-500 font-medium">No transactions for this pool.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()
          )}

          {/* Pool Tab */}
          {activeTab === 'split' && (
            <div className="h-full overflow-hidden" style={{ background: 'transparent' }}>
              <PoolPage
                pools={pools}
                transactions={transactions}
                initialPoolId={viewingPoolId}
                onCreatePool={() => setShowCreatePool(true)}
                onContribute={(poolId) => { setSelectedPoolId(poolId); setContributeVotingPowerMode(false); setShowContributeDialog(true); }}
                onNavigateToScamCheck={() => setActiveTab('scamcheck')}
                onManageMembers={(poolId) => { setSelectedPoolId(poolId); setShowManageMembers(true); }}
                onShowReport={(poolId) => { setSelectedPoolId(poolId); setShowReportDialog(true); }}
                onTopUpVotingPower={(poolId) => { setSelectedPoolId(poolId); setContributeVotingPowerMode(true); setShowContributeDialog(true); }}
                onReviewFreeze={(poolId) => { setSelectedPoolId(poolId); setShowFreezeSheet(true); }}
                onSmartCall={(poolId) => { setSelectedPoolId(poolId); setShowSmartCallSheet(true); }}
              />
            </div>
          )}

          {/* Pool Tab OLD - removed */}
          {false && activeTab === 'split_old' && (
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

          {/* Scam Check Tab */}
          {activeTab === 'scamcheck' && (
            <ScamCheckPage onBack={() => setActiveTab('home')} />
          )}
        </div>

        {/* Bottom Navigation */}
        {activeTab !== 'scan' && (
        <div
          className="nav-bar absolute bottom-0 left-0 right-0"
          style={{
            maxWidth: '402px',
            margin: '0 auto',
            background: '#FFFFFF',
            boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.04)',
            padding: '12px 8px',
            zIndex: 40
          }}
        >
          <div className="flex w-full h-[60px]">
            {/* Home Button */}
            <button
              onClick={() => setActiveTab('home')}
              className="flex-1 flex flex-col gap-[4px] h-[60px] items-center justify-center p-[8px] transition-all"
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
              className="flex-1 flex flex-col gap-[4px] h-[60px] items-center justify-center p-[8px] transition-all"
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

            {/* Analytics Button */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex-1 flex flex-col gap-[4px] h-[60px] items-center justify-center p-[8px] transition-all"
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
              className="flex-1 flex flex-col gap-[4px] h-[60px] items-center justify-center p-[8px] transition-all"
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
        )}
      </div>

      <CreatePoolDialog
        open={showCreatePool}
        onOpenChange={setShowCreatePool}
        onCreatePool={handleCreatePool}
        onJoinGroup={() => {
          setShowCreatePool(false);
          setTimeout(() => setShowQrScanner(true), 120);
        }}
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

      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={(open) => {
          setShowManageMembers(open);
          if (!open) setSelectedPoolId(null);
        }}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || '' : pool.name}
        poolId={selectedPoolId || pool.id}
        members={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members || [] : pool.members}
        poolBalance={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members.reduce((sum, m) => sum + m.contribution, 0) || 0 : totalContributed}
        hasTransactions={selectedPoolId ? transactions.filter(t => t.poolId === selectedPoolId).length > 0 : transactions.length > 0}
      />

      <ContributeToPoolDialog
        open={showContributeDialog}
        votingPowerMode={contributeVotingPowerMode}
        onOpenChange={(open) => {
          setShowContributeDialog(open);
          if (!open) { setSelectedPoolId(null); setContributeVotingPowerMode(false); }
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

      <AnimatePresence>
        {activeTab === 'scan' && (
          <ScanPage onBack={() => setActiveTab('home')} />
        )}
      </AnimatePresence>

      {/* ── FREEZE POOL SHEET (full-frame overlay, covers nav bar) ── */}
      <FreezePoolSheet
        open={showFreezeSheet}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || 'Pool' : 'Pool'}
        onClose={() => { setShowFreezeSheet(false); setSelectedPoolId(null); }}
        onFreezeSuccess={() => {
          setShowFreezeSheet(false);
          setSelectedPoolId(null);
          showToast('🔒 Pool Isolated. Members notified.');
        }}
      />

      {/* ── SMART CALL SHEET (full-frame overlay, covers nav bar) ── */}
      <SmartCallSheet
        open={showSmartCallSheet}
        poolName={selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.name || 'Pool' : 'Pool'}
        members={(selectedPoolId ? pools.find(p => p.id === selectedPoolId)?.members || [] : pool.members) as any}
        onClose={() => { setShowSmartCallSheet(false); setSelectedPoolId(null); }}
        onSendSuccess={() => {
          setShowSmartCallSheet(false);
          setSelectedPoolId(null);
          showToast('📱 Smart Call sent! Members will be notified shortly.');
        }}
      />

      {/* ── IN-APP TOAST (highest z-index, inside phone frame) ── */}
      {appToast && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 220,
            maxWidth: 340,
            animation: 'toastSlideDown 0.3s cubic-bezier(0.32,0.72,0,1) both',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{appToast.split(' ')[0]}</span>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: '18px' }}>
            {appToast.slice(appToast.indexOf(' ') + 1)}
          </p>
        </div>
      )}

      <style>{`
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <QrScannerDialog
        open={showQrScanner}
        onOpenChange={setShowQrScanner}
      />
    </div>
  );
}