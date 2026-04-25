import { useState } from 'react';
import { Wallet, Users, QrCode, AlertTriangle, CheckCircle2, Clock, Calculator, Shield, CreditCard, DollarSign, ShoppingCart, Bot, Lightbulb, TrendingDown, ArrowDown } from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  currentBalance: number;
  members: { id: string; name: string }[];
}

interface PayWithPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pools: Pool[];
}

type PaymentStep = 'select' | 'amount' | 'preview' | 'approval' | 'success' | 'fallback';
type RiskLevel = 'low' | 'medium' | 'high';

/* ── Shared close-button SVG ── */
function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
    >
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
        <path d="M1 1L9 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 1L1 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ── Shared sheet header row ── */
function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0 24px' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a', margin: 0 }}>
        {title}
      </p>
      <CloseBtn onClick={onClose} />
    </div>
  );
}

/* ── Blue gradient card (same as Grant Details card) ── */
function BlueCard({ label, title, col1Label, col1Value, col2Label, col2Value }: {
  label: string; title: string;
  col1Label: string; col1Value: string;
  col2Label: string; col2Value: string;
}) {
  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
      padding: '18px 20px',
      marginBottom: '20px',
    }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: '16px', marginTop: 0 }}>
        {title}
      </p>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{col1Label}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>{col1Value}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{col2Label}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>{col2Value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Section label (same as "ELIGIBLE AMOUNT" label) ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#1a1a1a', letterSpacing: '0.8px', marginBottom: '8px', marginTop: 0 }}>
      {children}
    </p>
  );
}

/* ── Primary CTA button (same pill as "Claim RM 200 Now") ── */
function PillButton({ onClick, disabled, children, color = '#0055D6' }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: '48px',
        borderRadius: '30px',
        background: disabled ? '#94A3B8' : color,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        lineHeight: '24px',
        color: '#fff',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {children}
    </button>
  );
}

/* ── Yellow info box (same as Gemini AI Token Explainer) ── */
function YellowBox({ icon, title, body }: { icon?: string; title: string; body: string }) {
  return (
    <div style={{
      borderRadius: '16px',
      background: '#FFFBE5',
      border: '0.8px solid #FDE68A',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
    }}>
      {icon && <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}>{icon}</span>}
      <div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', marginBottom: '4px', marginTop: 0 }}>
          {title}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F', margin: 0 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export function PayWithPoolDialog({ open, onOpenChange, pools }: PayWithPoolDialogProps) {
  const [step, setStep] = useState<PaymentStep>('select');
  const [paymentSource, setPaymentSource] = useState<'personal' | 'group'>('group');
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools.length > 0 ? pools[0].id : '');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('Restoran ABC');
  const [approvalsReceived, setApprovalsReceived] = useState(0);

  const selectedPool = pools.find(p => p.id === selectedPoolId) || pools[0];
  const poolBalance = selectedPool?.currentBalance || 0;
  const poolName = selectedPool?.name || '';
  const memberCount = selectedPool?.members.length || 0;

  const getRiskLevel = (amt: number): { level: RiskLevel; approvalsNeeded: number } => {
    if (amt <= 50) return { level: 'low', approvalsNeeded: 0 };
    if (amt <= 200) return { level: 'medium', approvalsNeeded: 1 };
    return { level: 'high', approvalsNeeded: 2 };
  };

  const amountNum = parseFloat(amount) || 0;
  const splitAmount = amountNum / (memberCount || 1);
  const risk = getRiskLevel(amountNum);
  const isBalanceSufficient = amountNum <= poolBalance;

  const handlePayment = () => {
    if (risk.level === 'low') setStep('success');
    else setStep('approval');
  };

  const handleApproval = () => {
    const newApprovals = approvalsReceived + 1;
    setApprovalsReceived(newApprovals);
    if (newApprovals >= risk.approvalsNeeded) setStep('success');
  };

  const handleReset = () => {
    setStep('select');
    setAmount('');
    setApprovalsReceived(0);
    setPaymentSource('group');
    setSelectedPoolId(pools.length > 0 ? pools[0].id : '');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={handleClose}
    >
      {/* Bottom sheet */}
      <div
        style={{ borderRadius: '24px 24px 0 0', background: '#fff', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── STEP: Select Payment Source ── */}
        {step === 'select' && (
          <div>
            <SheetHeader title="Choose Payment Source" onClose={handleClose} />
            <div style={{ padding: '20px 22px 28px 22px' }}>

              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginTop: 0, marginBottom: 0 }}>SCAN & PAY</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginTop: 0, marginBottom: 0 }}>Family Wallet</p>
                  <Wallet size={20} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>My Balance</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>RM 248</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Pool Balance</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>RM {poolBalance.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <SectionLabel>PAYMENT METHOD</SectionLabel>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {/* Personal Wallet option */}
                <button
                  onClick={() => setPaymentSource('personal')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderRadius: '16px',
                    border: `2px solid ${paymentSource === 'personal' ? '#0055D6' : '#E5E7EB'}`,
                    background: paymentSource === 'personal' ? '#ECF2FE' : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ padding: '10px', background: '#F3F4F6', borderRadius: '12px', flexShrink: 0 }}>
                    <Wallet style={{ width: 18, height: 18, color: '#374151' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', margin: 0 }}>Personal Wallet</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: '#6B7280', margin: 0 }}>Pay with your own balance</p>
                  </div>
                  {paymentSource === 'personal' && (
                    <CheckCircle2 style={{ width: 20, height: 20, color: '#0055D6', flexShrink: 0 }} />
                  )}
                </button>

                {/* Family Pool option */}
                <button
                  onClick={() => setPaymentSource('group')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderRadius: '16px',
                    border: `2px solid ${paymentSource === 'group' ? '#0055D6' : '#E5E7EB'}`,
                    background: paymentSource === 'group' ? '#ECF2FE' : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ padding: '10px', background: 'linear-gradient(135deg, #015ABE, #1375B1)', borderRadius: '12px', flexShrink: 0 }}>
                    <Users style={{ width: 18, height: 18, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', margin: 0 }}>Family Pool</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: '#6B7280', margin: 0 }}>Split with family members</p>
                  </div>
                  {paymentSource === 'group' && (
                    <CheckCircle2 style={{ width: 20, height: 20, color: '#0055D6', flexShrink: 0 }} />
                  )}
                </button>
              </div>

              {/* Pool selection */}
              {paymentSource === 'group' && pools.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <SectionLabel>SELECT POOL</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pools.map((pool) => (
                      <button
                        key={pool.id}
                        onClick={() => setSelectedPoolId(pool.id)}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '16px', textAlign: 'left', cursor: 'pointer',
                          border: `2px solid ${selectedPoolId === pool.id ? '#0055D6' : '#E5E7EB'}`,
                          background: selectedPoolId === pool.id ? '#ECF2FE' : '#fff', transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', margin: 0 }}>{pool.name}</p>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: '#6B7280', margin: 0 }}>{pool.members.length} members</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0055D6', margin: 0 }}>RM {pool.currentBalance.toFixed(0)}</p>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '11px', color: '#6B7280', margin: 0 }}>Balance</p>
                            </div>
                            {selectedPoolId === pool.id && (
                              <CheckCircle2 style={{ width: 20, height: 20, color: '#0055D6' }} />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                borderRadius: '16px',
                background: '#FFFBE5',
                border: '0.8px solid #FDE68A',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  <Bot size={16} color="#92400E" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', marginBottom: '4px', marginTop: 0 }}>
                    AI Scam Check Active
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F', margin: 0 }}>
                    Your payment is being scanned in real-time. AI Guardian will alert you if the merchant or amount looks suspicious.
                  </p>
                </div>
              </div>

              <PillButton onClick={() => setStep('amount')} disabled={paymentSource === 'group' && !selectedPoolId}>
                Continue →
              </PillButton>
            </div>
          </div>
        )}

        {/* ── STEP: Enter Amount ── */}
        {step === 'amount' && (
          <div>
            <SheetHeader title="Payment Details" onClose={handleClose} />
            <div style={{ padding: '20px 22px 28px 22px' }}>

              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
                  STEP 2 OF 3
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: 0, marginTop: 0 }}>
                    {paymentSource === 'group' ? poolName : 'Personal Wallet'}
                  </p>
                  {paymentSource === 'group' ? <DollarSign size={20} color="#fff" strokeWidth={2} /> : <CreditCard size={20} color="#fff" strokeWidth={2} />}
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Balance</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>RM {paymentSource === 'group' ? poolBalance.toFixed(0) : '248'}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{paymentSource === 'group' ? 'Members' : 'Source'}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>{paymentSource === 'group' ? `${memberCount} people` : 'My Wallet'}</p>
                  </div>
                </div>
              </div>

              <SectionLabel>MERCHANT NAME</SectionLabel>
              <div style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                padding: '0 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                height: '52px',
              }}>
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px',
                    color: '#101828', background: 'transparent', border: 'none', outline: 'none', width: '100%',
                  }}
                  placeholder="e.g., Restoran ABC"
                />
              </div>

              <SectionLabel>AMOUNT (RM)</SectionLabel>
              <div style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                height: '72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                gap: '4px',
              }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', color: '#0055D6' }}>RM</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '36px', lineHeight: '40px',
                    color: '#0055D6', background: 'transparent', border: 'none', outline: 'none',
                    width: '140px', textAlign: 'center',
                  }}
                  placeholder="0.00"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  borderRadius: '999px', border: '1.5px solid #0055D6', color: '#0055D6',
                  background: '#ECF2FE', fontSize: '13px', fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, padding: '8px 16px', cursor: 'pointer',
                }}>
                  <QrCode style={{ width: 15, height: 15 }} />
                  Scan QR Code
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep('select')}
                  style={{
                    flex: 1, height: '48px', borderRadius: '30px',
                    border: '1.6px solid #0055D6', background: '#fff',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px',
                    color: '#0055D6', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={!amount || amountNum <= 0}
                  style={{
                    flex: 1, height: '48px', borderRadius: '30px',
                    background: !amount || amountNum <= 0 ? '#94A3B8' : '#0055D6',
                    border: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    fontSize: '16px', color: '#fff', cursor: !amount || amountNum <= 0 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Preview & Smart Check ── */}
        {step === 'preview' && (
          <div>
            <SheetHeader title="Review & Pay" onClose={handleClose} />
            <div style={{ padding: '20px 22px 28px 22px' }}>

              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
                  CONFIRM PAYMENT
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: 0, marginTop: 0 }}>
                    {merchant}
                  </p>
                  <ShoppingCart size={20} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Total Amount</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>RM {amountNum.toFixed(2)}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{paymentSource === 'group' ? 'Per Member' : 'From'}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>{paymentSource === 'group' ? `RM ${splitAmount.toFixed(2)}` : 'Personal'}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Bot size={14} color="#1a1a1a" strokeWidth={2} />
                <SectionLabel>SMART RISK CHECK</SectionLabel>
              </div>
              <div style={{
                borderRadius: '16px',
                background: risk.level === 'low' ? '#ECF9F1' : risk.level === 'medium' ? '#FFFBE5' : '#FFF1F2',
                border: `1.6px solid ${risk.level === 'low' ? '#6EE7B7' : risk.level === 'medium' ? '#FDE68A' : '#FCA5A5'}`,
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <div style={{ marginTop: '1px', flexShrink: 0 }}>
                  {risk.level === 'low'
                    ? <CheckCircle2 style={{ width: 14, height: 14, color: '#059669' }} />
                    : <AlertTriangle style={{ width: 14, height: 14, color: risk.level === 'medium' ? '#D97706' : '#DC2626' }} />
                  }
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {risk.level === 'low' ? (
                      <CheckCircle2 size={14} color="#065F46" strokeWidth={2} />
                    ) : (
                      <AlertTriangle size={14} color={risk.level === 'medium' ? '#92400E' : '#991B1B'} strokeWidth={2} />
                    )}
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: risk.level === 'low' ? '#065F46' : risk.level === 'medium' ? '#92400E' : '#991B1B', marginTop: 0, marginBottom: 0 }}>
                      {risk.level === 'low' ? 'Low Risk — Auto-approved' : risk.level === 'medium' ? 'Medium Risk' : 'High Risk'}
                    </p>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: risk.level === 'low' ? '#047857' : risk.level === 'medium' ? '#78350F' : '#B91C1C', margin: 0 }}>
                    {risk.level === 'low' && 'Payment will process instantly with no approval required.'}
                    {risk.level === 'medium' && `Needs ${risk.approvalsNeeded} approval from a family member before processing.`}
                    {risk.level === 'high' && `Requires ${risk.approvalsNeeded} approvals. Large transactions need family consent.`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TrendingDown size={14} color="#1a1a1a" strokeWidth={2} />
                <SectionLabel>SPLIT PREVIEW</SectionLabel>
              </div>
              <div style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                height: '72px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0055D6', textAlign: 'center', margin: 0 }}>
                  {memberCount} members → RM {splitAmount.toFixed(2)} each
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '4px', marginBottom: 0 }}>
                  Auto-deducted from pool balance
                </p>
              </div>

              {!isBalanceSufficient && (
                <div style={{
                  borderRadius: '16px', background: '#FFF1F2', border: '1.6px solid #FCA5A5',
                  padding: '14px 16px', marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={12} color="#991B1B" strokeWidth={2} />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#991B1B', marginTop: 0, marginBottom: 0 }}>
                      Insufficient Pool Balance
                    </p>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: '#B91C1C', margin: 0 }}>
                    Pool has RM {poolBalance.toFixed(2)}, need RM {amountNum.toFixed(2)}.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep('amount')}
                  style={{
                    flex: 1, height: '48px', borderRadius: '30px',
                    border: '1.6px solid #0055D6', background: '#fff',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px',
                    color: '#0055D6', cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!isBalanceSufficient}
                  style={{
                    flex: 1, height: '48px', borderRadius: '30px',
                    background: !isBalanceSufficient ? '#94A3B8' : '#0055D6',
                    border: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    fontSize: '16px', color: '#fff', cursor: !isBalanceSufficient ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Pay from Pool
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Approval Waiting ── */}
        {step === 'approval' && (
          <div>
            <SheetHeader title="Waiting for Family" onClose={handleClose} />
            <div style={{ padding: '20px 22px 28px 22px' }}>

              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
                  APPROVAL NEEDED
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: '16px', marginTop: 0 }}>
                  RM {amountNum.toFixed(2)} at {merchant}
                </p>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Approvals</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>{approvalsReceived} / {risk.approvalsNeeded}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Risk Level</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>
                        {risk.level === 'medium' ? 'Medium' : 'High'}
                      </p>
                      <AlertTriangle size={16} color={risk.level === 'medium' ? '#FDE68A' : '#FCA5A5'} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '999px' }}>
                  <Clock style={{ width: 44, height: 44, color: '#D97706' }} className="animate-pulse" />
                </div>
              </div>

              <SectionLabel>APPROVAL PROGRESS</SectionLabel>
              <div style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#101828', margin: 0 }}>Family Approvals</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0055D6', margin: 0 }}>{approvalsReceived} / {risk.approvalsNeeded}</p>
                </div>
                <div style={{ height: '8px', background: '#DBEAFE', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0055D6', borderRadius: '999px', transition: 'width 0.3s', width: `${(approvalsReceived / risk.approvalsNeeded) * 100}%` }} />
                </div>
              </div>

              <div style={{
                borderRadius: '16px',
                background: '#FFFBE5',
                border: '0.8px solid #FDE68A',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  <Clock size={16} color="#92400E" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', marginBottom: '4px', marginTop: 0 }}>
                    Waiting for family approval
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F', margin: 0 }}>
                    You are paying RM {amountNum.toFixed(2)} at {merchant}. Your family members will receive a notification to approve this payment.
                  </p>
                </div>
              </div>

              <PillButton onClick={handleApproval} color="#16A34A">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <CheckCircle2 size={16} color="#fff" strokeWidth={2} />
                  Approve (Demo)
                </div>
              </PillButton>

              <button
                onClick={() => setStep('fallback')}
                style={{
                  width: '100%', height: '44px', borderRadius: '30px',
                  border: '1.6px solid #E5E7EB', background: '#fff',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
                  color: '#6B7280', cursor: 'pointer', marginTop: '10px',
                }}
              >
                Pay with Personal Wallet Instead
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && (
          <div>
            <SheetHeader title="Payment Successful" onClose={handleClose} />
            <div style={{ padding: '0 22px 40px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              <div style={{ marginTop: '32px', marginBottom: '20px' }}>
                <svg width="77" height="77" viewBox="0 0 77 77" fill="none">
                  <circle cx="38.5" cy="38.5" r="36" stroke="#10B981" strokeWidth="3.5" />
                  <path d="M24 39.5L33.5 49L53 29" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', lineHeight: '32px', color: '#1a1a1a', textAlign: 'center', marginBottom: '8px', marginTop: 0 }}>
                RM {amountNum.toFixed(2)} Paid!
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280', textAlign: 'center', marginBottom: '28px', marginTop: 0 }}>
                Payment to {merchant} was successful.
              </p>

              {/* Summary pill */}
              <div style={{
                width: '100%', borderRadius: '16px', background: '#ECFDF5',
                border: '0.8px solid #6EE7B7', padding: '14px 16px',
                marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <div style={{ marginTop: 1 }}>
                  <CheckCircle2 size={20} color="#059669" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#065F46', marginBottom: '4px', marginTop: 0 }}>Auto-Split Complete</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '18px', color: '#059669', margin: 0 }}>
                    {memberCount} members each contributed RM {splitAmount.toFixed(2)}. Pool balance: RM {(poolBalance - amountNum).toFixed(2)}.
                  </p>
                </div>
              </div>

              <div style={{
                width: '100%', borderRadius: '16px', background: '#FFFBE5',
                border: '0.8px solid #FDE68A', padding: '14px 16px',
                marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <div style={{ marginTop: 1 }}>
                  <Lightbulb size={16} color="#78350F" strokeWidth={2} />
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '18px', color: '#78350F', margin: 0 }}>
                  Transaction logged automatically in your family history. Tap Done to return.
                </p>
              </div>

              <PillButton onClick={handleClose}>Done</PillButton>
            </div>
          </div>
        )}

        {/* ── STEP: Fallback — Personal Wallet ── */}
        {step === 'fallback' && (
          <div>
            <SheetHeader title="Personal Wallet" onClose={handleClose} />
            <div style={{ padding: '20px 22px 28px 22px' }}>

              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
                  ALTERNATIVE PAYMENT
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: 0, marginTop: 0 }}>
                    Pay with Personal Wallet
                  </p>
                  <Wallet size={20} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Amount</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>RM {amountNum.toFixed(2)}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Status</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>Pending</p>
                      <Clock size={16} color="#fff" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                borderRadius: '16px',
                background: '#FFFBE5',
                border: '0.8px solid #FDE68A',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  <Clock size={16} color="#92400E" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', marginBottom: '4px', marginTop: 0 }}>
                    Approval timeout or rejected
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F', margin: 0 }}>
                    Family approval was not received in time. You can pay from your personal wallet and request reimbursement later.
                  </p>
                </div>
              </div>

              <SectionLabel>PAYMENT AMOUNT</SectionLabel>
              <div style={{
                borderRadius: '16px', background: '#ECF2FE', border: '1.6px solid #0055D6',
                height: '72px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '36px', lineHeight: '40px', color: '#0055D6', textAlign: 'center', margin: 0 }}>
                  RM {amountNum.toFixed(2)}
                </p>
              </div>

              <PillButton onClick={() => setStep('success')}>
                Pay RM {amountNum.toFixed(2)} Now
              </PillButton>

              <button
                onClick={() => setStep('preview')}
                style={{
                  width: '100%', height: '44px', borderRadius: '30px',
                  border: '1.6px solid #0055D6', background: '#fff',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
                  color: '#0055D6', cursor: 'pointer', marginTop: '10px',
                }}
              >
                ← Back to Pool Payment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}