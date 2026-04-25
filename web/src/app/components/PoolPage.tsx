import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, QrCode, Gift, Shield, Users, ChevronLeft, ChevronRight,
  ArrowDownLeft, ArrowUpRight, LayoutGrid, X, TrendingUp,
  GraduationCap, Home, Utensils, ShoppingCart, Zap, Wallet, Bot
} from 'lucide-react';
import { PoolScanPayDialog } from './PoolScanPayDialog';
import { AiAdvisorDialog } from './AiAdvisorDialog';
import { AiAdvisorIcon } from './AiAdvisorIcon';
import { useAgentBrief, useAgentContext } from '../../api/hooks';

/** Local storage key for "user dismissed today's tip for this pool". */
function dismissalKey(poolId: string): string {
  return `tng_advice_dismissed_${poolId}`;
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Map an Open-Meteo weather code or condition string to a single emoji. */
function weatherEmoji(weather: unknown): string | null {
  if (!weather || typeof weather !== 'object') return null;
  const w = weather as { code?: number; condition?: string; description?: string };
  const code = w.code;
  if (typeof code === 'number') {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 99) return '⛈️';
  }
  const text = (w.condition ?? w.description ?? '').toString().toLowerCase();
  if (/storm|thunder/.test(text)) return '⛈️';
  if (/rain|shower|drizzle/.test(text)) return '🌧️';
  if (/snow/.test(text)) return '❄️';
  if (/cloud/.test(text)) return '⛅';
  if (/clear|sun/.test(text)) return '☀️';
  return null;
}

export interface PoolMember {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
}

export interface PoolData {
  id: string;
  name: string;
  recommendedContribution: number;
  currentBalance: number;
  members: PoolMember[];
  color?: string;
  photo?: string;
}

export interface PoolTransaction {
  id: string;
  poolId: string;
  type: 'contribution' | 'spending';
  description: string;
  amount: number;
  person: string;
  timestamp: string;
  location?: string;
  category?: string;
  notes?: string;
}

interface PoolPageProps {
  pools: PoolData[];
  transactions: PoolTransaction[];
  initialPoolId?: string | null;
  onCreatePool: () => void;
  onContribute: (poolId: string) => void;
  onNavigateToScamCheck: () => void;
  onManageMembers: (poolId: string) => void;
  onShowReport: (poolId: string) => void;
  onReviewFreeze: (poolId: string) => void;
  onSmartCall: (poolId: string) => void;
  onTopUpVotingPower: (poolId: string) => void;
}

// Category icons
const categoryIcon = (cat?: string) => {
  if (!cat) return <Wallet size={14} color="#6B7280" />;
  const c = cat.toLowerCase();
  if (c.includes('edu') || c.includes('school')) return <GraduationCap size={14} color="#005AFF" />;
  if (c.includes('house') || c.includes('rent')) return <Home size={14} color="#005AFF" />;
  if (c.includes('food') || c.includes('restoran')) return <Utensils size={14} color="#F97316" />;
  if (c.includes('grocer') || c.includes('mart')) return <ShoppingCart size={14} color="#059669" />;
  if (c.includes('util') || c.includes('electric') || c.includes('bill')) return <Zap size={14} color="#EAB308" />;
  if (c.includes('grant') || c.includes('aid')) return <Gift size={14} color="#8B5CF6" />;
  return <TrendingUp size={14} color="#6B7280" />;
};

// Card width constants
const CARD_W = 322;
const CARD_H = 182;
const CARD_GAP = 12;
const STEP = CARD_W + CARD_GAP;       // 334px per card step
const START_X = (402 - CARD_W) / 2;  // 40px start offset to center first card

export function PoolPage({
  pools,
  transactions,
  initialPoolId,
  onCreatePool,
  onContribute,
  onNavigateToScamCheck,
  onManageMembers,
  onShowReport,
  onReviewFreeze,
  onSmartCall,
  onTopUpVotingPower,
}: PoolPageProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialPoolId) {
      const idx = pools.findIndex(p => p.id === initialPoolId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [detailKey, setDetailKey] = useState(0); // for re-triggering animation
  const [showAllCards, setShowAllCards] = useState(false);
  const [showScanPay, setShowScanPay] = useState(false);
  const [showAiAdvisor, setShowAiAdvisor] = useState(false);
  // "Daily" dismissal — stored as YYYY-MM-DD in localStorage so the card
  // pops back the next calendar day.
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);

  // Active pool reference for the proactive advice card. Computed inline so
  // it's available before the activePool variable proper (further down).
  const activePoolForAdvice = pools[activeIndex];
  const briefQuery = useAgentBrief(activePoolForAdvice?.id);
  const contextQuery = useAgentContext(activePoolForAdvice?.id);

  // Hydrate dismissal state from localStorage when pool changes
  useEffect(() => {
    if (!activePoolForAdvice) return;
    const stored = localStorage.getItem(dismissalKey(activePoolForAdvice.id));
    setDismissedDate(stored);
  }, [activePoolForAdvice?.id]);

  const adviceText = (() => {
    const raw = briefQuery.data?.brief ?? briefQuery.data?.text ?? briefQuery.data?.answer;
    if (!raw) return null;
    // First sentence only — keep the card short
    const first = raw.split(/(?<=[.!?])\s+/)[0]?.trim();
    return first && first.length > 0 ? first : null;
  })();

  const weatherIcon = weatherEmoji(contextQuery.data?.weather);
  const isDismissedToday = dismissedDate === todayStr();
  const handleDismissAdvice = () => {
    if (!activePoolForAdvice) return;
    const today = todayStr();
    localStorage.setItem(dismissalKey(activePoolForAdvice.id), today);
    setDismissedDate(today);
  };
  const touchStartX = useRef<number | null>(null);
  const isAnimating = useRef(false);

  // Sync if initialPoolId changes (e.g. user clicked from home)
  useEffect(() => {
    if (initialPoolId) {
      const idx = pools.findIndex(p => p.id === initialPoolId);
      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
        setDetailKey(k => k + 1);
      }
    }
  }, [initialPoolId]);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= pools.length || isAnimating.current) return;
    isAnimating.current = true;
    setActiveIndex(idx);
    setDetailKey(k => k + 1);
    setTimeout(() => { isAnimating.current = false; }, 380);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 42) {
      if (dx < 0) goTo(activeIndex + 1); // swipe left → next
      else goTo(activeIndex - 1);         // swipe right → prev
    }
    touchStartX.current = null;
  };

  const activePool = pools[activeIndex] || null;
  const poolTxs = activePool ? transactions.filter(t => t.poolId === activePool.id) : [];
  const trackTranslateX = START_X - activeIndex * STEP;

  if (pools.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onCreatePool}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0, 90, 255, 0.1)', border: '1.5px solid rgba(0, 90, 255, 0.2)', color: '#005AFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={20} />
          </button>
        </div>
        {/* Empty state */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Wallet size={32} color="#005AFF" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>No Pools Yet</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 28px', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: '20px' }}>
            Create your first pool to start managing shared family funds
          </p>
          <button
            onClick={onCreatePool}
            style={{ height: 52, paddingInline: 32, borderRadius: 999, background: '#005AFF', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Create First Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px 20px', flexShrink: 0, gap: 8 }}>
        <button
          onClick={() => setShowAllCards(true)}
          style={{
            height: 36, paddingInline: 14, borderRadius: 999,
            background: 'rgba(0, 90, 255, 0.1)', border: '1px solid rgba(0, 90, 255, 0.2)',
            color: '#005AFF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <LayoutGrid size={14} /> View All
        </button>
        <button
          onClick={onCreatePool}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0, 90, 255, 0.1)', border: '1px solid rgba(0, 90, 255, 0.2)',
            color: '#005AFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── CARD CAROUSEL ── */}
      <div style={{ position: 'relative', paddingBottom: 4, flexShrink: 0 }}>
        {/* Overflow clip container */}
        <div
          style={{ overflow: 'hidden', width: '100%', paddingTop: 12, paddingBottom: 12 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding track */}
          <div
            style={{
              display: 'flex',
              gap: CARD_GAP,
              transform: `translateX(${trackTranslateX}px)`,
              transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          >
            {pools.map((pool, i) => {
              const isActive = i === activeIndex;
              const hasPhoto = !!pool.photo;
              const cardBg = pool.color || 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)';
              const originalAmount = pool.members.reduce((s, m) => s + m.contribution, 0);
              const progress = originalAmount > 0 ? Math.round((pool.currentBalance / originalAmount) * 100) : 0;

              return (
                <div
                  key={pool.id}
                  onClick={() => { if (!isActive) goTo(i); }}
                  style={{
                    minWidth: CARD_W,
                    height: CARD_H,
                    borderRadius: 22,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isActive ? 'default' : 'pointer',
                    transform: isActive ? 'scale(1)' : 'scale(0.92)',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.38s ease, box-shadow 0.38s ease',
                    boxShadow: isActive
                      ? '0px 16px 40px rgba(0, 90, 255, 0.32), 0 4px 12px rgba(0,0,0,0.12)'
                      : '0px 4px 12px rgba(0,0,0,0.14)',
                    background: hasPhoto ? '#111' : cardBg,
                    flexShrink: 0,
                    userSelect: 'none',
                  }}
                >
                  {/* Photo background with blur */}
                  {hasPhoto && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <img
                        src={pool.photo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px)', transform: 'scale(1.15)' }}
                        alt=""
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,60,0.45)' }} />
                    </div>
                  )}

                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: -28, right: -28, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -20, left: '30%', width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

                  {/* Card content */}
                  <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top row: name + members badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '0.8px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>POOL</p>
                        <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '3px 0 0', fontFamily: 'Inter, sans-serif' }}>{pool.name}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.16)', borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                        <Users size={11} color="rgba(255,255,255,0.9)" />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{pool.members.length}</span>
                      </div>
                    </div>

                    {/* Balance */}
                    <div>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: '0 0 2px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.3px' }}>Balance</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
                        RM {pool.currentBalance.toFixed(2)}
                      </p>
                      {/* Mini progress bar */}
                      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#FDDC00', borderRadius: 2, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* Scan & Pay — only on active card */}
                    {isActive ? (
                      <button
                        onClick={e => { e.stopPropagation(); setShowScanPay(true); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          background: 'rgba(255,255,255,0.18)',
                          border: '1px solid rgba(255,255,255,0.32)',
                          borderRadius: 12, height: 38, cursor: 'pointer',
                          color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.26)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                      >
                        <QrCode size={15} />
                        Scan &amp; Pay
                      </button>
                    ) : (
                      <div style={{ height: 38 }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left arrow */}
        {activeIndex > 0 && (
          <button
            onClick={() => goTo(activeIndex - 1)}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)', zIndex: 10,
              transition: 'transform 0.15s',
            }}
          >
            <ChevronLeft size={18} color="#005AFF" />
          </button>
        )}
        {/* Right arrow */}
        {activeIndex < pools.length - 1 && (
          <button
            onClick={() => goTo(activeIndex + 1)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)', zIndex: 10,
              transition: 'transform 0.15s',
            }}
          >
            <ChevronRight size={18} color="#005AFF" />
          </button>
        )}

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10 }}>
          {pools.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === activeIndex ? 22 : 6,
                height: 6, borderRadius: 3,
                background: i === activeIndex ? '#005AFF' : '#CBD5E1',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── POOL DETAIL SECTION (animated on card change) ── */}
      <div
        key={detailKey}
        className="pool-detail-animate"
        style={{ flex: 1, padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {activePool && (
          <>
            {/* Balance info strip */}
            <div
              style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px',
                display: 'flex', gap: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>Balance</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#005AFF', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>RM {activePool.currentBalance.toFixed(0)}</p>
              </div>
              <div style={{ width: 1, background: '#F3F4F6', margin: '0 12px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>Contributors</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>{activePool.members.length} people</p>
              </div>
              <div style={{ width: 1, background: '#F3F4F6', margin: '0 12px' }} />
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>Each</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
                  RM {activePool.members.length > 0 ? (activePool.currentBalance / activePool.members.length).toFixed(0) : 0}
                </p>
              </div>
            </div>

            {/* Quick actions: 1 button */}
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Contribute */}
              <button
                onClick={() => onContribute(activePool.id)}
                className="press-scale"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px', borderRadius: 16, background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color="#005AFF" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}>Contribute to Pool</span>
              </button>
            </div>

            {/* Transactions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>Transactions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      height: 6, width: 6, borderRadius: '50%',
                      background: activePool.color
                        ? (activePool.color.includes('059669') ? '#059669' : activePool.color.includes('D97706') || activePool.color.includes('F97316') ? '#F97316' : activePool.color.includes('5B21B6') || activePool.color.includes('8B5CF6') ? '#8B5CF6' : '#005AFF')
                        : '#005AFF',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{activePool.name}</span>
                </div>
              </div>

              {poolTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontFamily: 'Inter, sans-serif' }}>No transactions yet for this pool</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {poolTxs.map((tx, idx) => (
                    <div
                      key={tx.id}
                      style={{
                        background: '#fff', borderRadius: 14, padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        animation: `fadeSlideUp 0.28s cubic-bezier(0.4,0,0.2,1) ${idx * 0.05}s both`,
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: tx.type === 'contribution' ? '#ECFDF5' : '#FEF2F2',
                        }}
                      >
                        {tx.type === 'contribution'
                          ? <ArrowDownLeft size={17} color="#059669" />
                          : <ArrowUpRight size={17} color="#DC2626" />
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          {/* Person avatar */}
                          <div
                            style={{
                              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #0055D6, #4DA3FF)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{tx.person.charAt(0)}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                            {tx.person} · {tx.timestamp}
                          </span>
                          {tx.category && (
                            <>
                              <span style={{ color: '#D1D5DB', fontSize: 10 }}>·</span>
                              {categoryIcon(tx.category)}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, margin: 0, fontFamily: 'Inter, sans-serif',
                          color: tx.type === 'contribution' ? '#059669' : '#DC2626',
                        }}>
                          {tx.type === 'contribution' ? '+' : '−'}RM {tx.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manage members link */}
            <button
              onClick={() => onManageMembers(activePool.id)}
              style={{
                width: '100%', height: 46, borderRadius: 999,
                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                color: '#005AFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Users size={16} /> Manage Members
            </button>
          </>
        )}
      </div>
      </div>

      {/* ── VIEW ALL CARDS BOTTOM SHEET ── */}
      {showAllCards && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setShowAllCards(false)}
        >
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              background: '#F5F7FA', borderRadius: '24px 24px 0 0',
              padding: '20px 16px 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.14)',
              maxHeight: '72vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', margin: 0, fontFamily: 'Inter, sans-serif' }}>All Pools</p>
              <button
                onClick={() => setShowAllCards(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: '#E5E7EB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="#374151" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pools.map((p, i) => {
                const hasPhoto = !!p.photo;
                const cardBg = p.color || 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)';
                const originalAmount = p.members.reduce((s, m) => s + m.contribution, 0);
                const progress = originalAmount > 0 ? Math.round((p.currentBalance / originalAmount) * 100) : 0;
                const isSelected = i === activeIndex;

                return (
                  <div
                    key={p.id}
                    onClick={() => { goTo(i); setShowAllCards(false); }}
                    style={{
                      borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 20px rgba(0,90,255,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                      border: isSelected ? '2px solid #005AFF' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        padding: '16px 18px',
                        background: hasPhoto ? '#111' : cardBg,
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {hasPhoto && (
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)', transform: 'scale(1.1)' }} alt="" />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,60,0.45)' }} />
                        </div>
                      )}
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.8px', fontWeight: 600 }}>POOL</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '2px 0', fontFamily: 'Inter, sans-serif' }}>{p.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={10} color="rgba(255,255,255,0.7)" />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>{p.members.length} members</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Inter, sans-serif' }}>RM {p.currentBalance.toFixed(0)}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>{progress}% remaining</p>
                        </div>
                      </div>
                      {/* Progress */}
                      <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#FDDC00', borderRadius: 2 }} />
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ background: '#005AFF', height: 3 }} />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setShowAllCards(false); onCreatePool(); }}
              style={{
                marginTop: 16, width: '100%', height: 48, borderRadius: 999,
                background: '#005AFF', border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Plus size={16} /> Create New Pool
            </button>
          </div>
        </div>
      )}

      {/* ── SCAN & PAY DIALOG ── */}
      <PoolScanPayDialog
        open={showScanPay}
        onOpenChange={setShowScanPay}
        pool={activePool}
      />

      {/* ── AI ADVISOR MODAL ── */}
      {showAiAdvisor && activePool && (
        <AiAdvisorDialog
          open={showAiAdvisor}
          onOpenChange={setShowAiAdvisor}
          poolId={activePool.id}
          poolName={activePool.name}
          onTopUpNow={() => {
            setShowAiAdvisor(false);
            setTimeout(() => onTopUpVotingPower(activePool.id), 140);
          }}
          onReviewFreeze={() => {
            setShowAiAdvisor(false);
            setTimeout(() => onReviewFreeze(activePool.id), 140);
          }}
          onSmartCall={() => {
            setShowAiAdvisor(false);
            setTimeout(() => onSmartCall(activePool.id), 140);
          }}
        />
      )}

      {/* ── AI ADVISOR CHARACTER ── */}
      {activePool && (
        <>
          <style>
            {`
              @keyframes floatCharacter {
                0% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-10px) rotate(-3deg); }
                66% { transform: translateY(-5px) rotate(3deg); }
                100% { transform: translateY(0px) rotate(0deg); }
              }
              @keyframes shadowPulse {
                0% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(0.6); opacity: 0.2; }
                100% { transform: scale(1); opacity: 0.6; }
              }
              @keyframes alertBlink {
                0% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                50% { opacity: 0.6; transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
              }
              .ai-character-container {
                position: absolute;
                bottom: 85px;
                right: 20px;
                z-index: 40;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .ai-character {
                font-size: 46px;
                line-height: 1;
                filter: drop-shadow(0 0 16px rgba(0, 90, 255, 0.85));
                animation: floatCharacter 4s ease-in-out infinite;
                transform-origin: bottom center;
              }
              .ai-shadow {
                width: 32px;
                height: 6px;
                background: rgba(0, 90, 255, 0.4);
                border-radius: 50%;
                margin-top: 6px;
                filter: blur(2px);
                animation: shadowPulse 4s ease-in-out infinite;
              }
              .ai-alert-dot {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #EF4444;
                border: 2px solid #F5F7FA;
                animation: alertBlink 2s infinite;
                z-index: 2;
              }
              .ai-advice-card {
                position: absolute;
                bottom: 110px;
                right: 90px;
                z-index: 41;
                max-width: 220px;
                padding: 10px 14px;
                background: #005AFF;
                color: #ffffff;
                border-radius: 12px;
                font-size: 12px;
                line-height: 1.45;
                font-weight: 500;
                font-family: Inter, sans-serif;
                box-shadow: 0 6px 20px rgba(0, 90, 255, 0.35);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 6px;
              }
              .ai-advice-card-dismiss {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #1f2937;
                color: #ffffff;
                border: none;
                cursor: pointer;
                font-size: 12px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
              }
            `}
          </style>
          {adviceText && !isDismissedToday && !showAiAdvisor && (
            <div
              className="ai-advice-card"
              onClick={() => setShowAiAdvisor(true)}
              role="button"
              aria-label="Open AI advisor"
            >
              <span>
                {weatherIcon && <span style={{ marginRight: 6 }}>{weatherIcon}</span>}
                {adviceText}
              </span>
              <button
                className="ai-advice-card-dismiss"
                onClick={(e) => { e.stopPropagation(); handleDismissAdvice(); }}
                aria-label="Dismiss for today"
                title="Dismiss for today (will return tomorrow)"
              >
                ×
              </button>
            </div>
          )}
          <div
            onClick={() => setShowAiAdvisor(true)}
            className="ai-character-container press-scale"
          >
            <div style={{ position: 'relative' }}>
              <div className="ai-character" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AiAdvisorIcon size={56} />
              </div>
              <div className="ai-alert-dot" />
            </div>
            <div className="ai-shadow" />
          </div>
        </>
      )}
    </div>
  );
}