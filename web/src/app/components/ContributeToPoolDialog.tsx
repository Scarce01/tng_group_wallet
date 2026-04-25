import { useState } from 'react';
import { Bot } from 'lucide-react';
import svgPaths from '../../imports/CardDetails-1-2/svg-vlq2w7jgqg';

interface ContributeToPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  currentBalance: number;
  recommendedContribution: number;
  memberCount: number;
  onContribute: (amount: number) => void;
}

type Step = 'amount' | 'confirm' | 'success';

/* ── Close (×) button icon ── */
function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
    >
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
        <path d={svgPaths.p30908200} stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p48af40} stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ── Small green paid check icon (14px) ── */
function PaidIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d={svgPaths.pc012c00} stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p24f94f00} stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
    </svg>
  );
}

/* ── Large success check circle (77×77) from Figma paths ── */
function SuccessCircleIcon() {
  return (
    <svg width="77" height="77" viewBox="0 0 77 77" fill="none">
      <path
        d={svgPaths.p9c22600}
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={svgPaths.p1ea90100}
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContributeToPoolDialog({
  open,
  onOpenChange,
  poolName,
  currentBalance,
  recommendedContribution,
  memberCount,
  onContribute,
}: ContributeToPoolDialogProps) {
  const [step, setStep] = useState<Step>('amount');

  const handleClose = () => {
    setStep('amount');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onContribute(recommendedContribution);
    setStep('success');
  };

  if (!open) return null;

  const newBalance = currentBalance + recommendedContribution;

  return (
    /* Dark overlay — scoped inside the 402×917 phone container */
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
    >
      {/* Bottom sheet */}
      <div
        className="relative w-full bg-white"
        style={{ borderRadius: '24px 24px 0 0' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ═══════════════════════════════════════════
            STEP 1 — Join Pool (amount)
        ═══════════════════════════════════════════ */}
        {step === 'amount' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0 24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a' }}>
                Join Pool
              </p>
              <CloseBtn onClick={handleClose} />
            </div>

            <div style={{ padding: '20px 22px 28px 22px' }}>
              {/* Blue pool info card */}
              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                padding: '18px 20px',
                marginBottom: '20px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>Joining</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: '16px' }}>{poolName}</p>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)' }}>Current Balance</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff' }}>RM {currentBalance}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)' }}>{memberCount} Members</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff' }}>AI Suggested</p>
                  </div>
                </div>
              </div>

              {/* Label */}
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#1a1a1a', letterSpacing: '0.8px', marginBottom: '8px' }}>
                RECOMMENDED CONTRIBUTION
              </p>

              {/* Amount box */}
              <div style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                height: '119px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '36px', lineHeight: '40px', color: '#0055D6', textAlign: 'center' }}>
                  RM {recommendedContribution}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280', textAlign: 'center', marginTop: '4px' }}>
                  Calculated based on your recent income
                </p>
              </div>

              {/* Policy notice */}
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
                <div style={{ marginTop: '1px', flexShrink: 0 }}>
                  <Bot size={16} color="#D97706" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Bot size={14} color="#92400E" strokeWidth={2} />
                    AI Budget Advisor
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F' }}>
                    Contributing RM {recommendedContribution} to this fund is safe for your current balance and keeps the family on track for this month's goal.
                  </p>
                </div>
              </div>

              {/* Continue */}
              <button
                onClick={() => setStep('confirm')}
                style={{ width: '100%', height: '48px', borderRadius: '30px', background: '#0055D6', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            STEP 2 — Confirm Contribution
        ═══════════════════════════════════════════ */}
        {step === 'confirm' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setStep('amount')} style={{ lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 13L5 8L10 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a' }}>Confirm Contribution</p>
              </div>
              <CloseBtn onClick={handleClose} />
            </div>

            <div style={{ padding: '20px 22px 28px 22px' }}>
              {/* Summary card */}
              <div style={{ borderRadius: '16px', background: '#EFF6FF', border: '0.8px solid #BFDBFE', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#1a1a1a', marginBottom: '16px' }}>Contribution Summary</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280' }}>Pool</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#1a1a1a' }}>{poolName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280' }}>Contribution Amount</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#1a1a1a' }}>RM {recommendedContribution}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280' }}>Payment Method</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#1a1a1a' }}>Personal Wallet</span>
                </div>

                <div style={{ borderTop: '0.8px solid #BFDBFE', marginBottom: '16px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280' }}>New Pool Balance</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '22px', lineHeight: '28px', color: '#045BCF' }}>RM {newBalance}</span>
                </div>
              </div>

              {/* Green equal-sharing notice */}
              <div style={{ borderRadius: '9999px', background: '#ECFDF5', border: '0.8px solid #6EE7B7', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ flexShrink: 0, lineHeight: 0 }}>
                  <PaidIcon />
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#059669' }}>
                  AI-suggested contribution based on family income patterns
                </p>
              </div>

              <button
                onClick={handleConfirm}
                style={{ width: '100%', height: '48px', borderRadius: '30px', background: '#0055D6', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Confirm Contribution
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            STEP 3 — Success  (matches Figma screenshot)
        ═══════════════════════════════════════════ */}
        {step === 'success' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 0 24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a' }}>
                Success
              </p>
              <CloseBtn onClick={handleClose} />
            </div>

            {/* Body */}
            <div style={{ padding: '0 22px 32px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Large green circle with checkmark (Figma paths) */}
              <div style={{ marginTop: '28px', marginBottom: '20px', lineHeight: 0 }}>
                <SuccessCircleIcon />
              </div>

              {/* Title */}
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '24px',
                lineHeight: '32px',
                color: '#1a1a1a',
                textAlign: 'center',
                marginBottom: '8px',
              }}>
                Successfully Joined!
              </p>

              {/* Subtitle */}
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '24px',
              }}>
                You've contributed RM {recommendedContribution} to {poolName}
              </p>

              {/* New Pool Balance card */}
              <div style={{
                width: '100%',
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1.6px solid #0055D6',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: '4px',
                }}>
                  New Pool Balance
                </p>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '36px',
                  lineHeight: '40px',
                  color: '#045BCF',
                  textAlign: 'center',
                }}>
                  RM {newBalance}
                </p>
              </div>

              {/* Equal contribution notice — pill shape */}
              <div style={{
                width: '100%',
                borderRadius: '9999px',
                background: '#ECFDF5',
                border: '0.8px solid #6EE7B7',
                padding: '10px 16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '28px',
              }}>
                <div style={{ flexShrink: 0, lineHeight: 0 }}>
                  <PaidIcon />
                </div>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#059669',
                }}>
                  Smart contribution aligned with family budget goals
                </p>
              </div>

              {/* Done button */}
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '30px',
                  background: '#0055D6',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
