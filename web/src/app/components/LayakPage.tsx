import { useState } from 'react';
import { DollarSign, Backpack, Bot, PartyPopper, GraduationCap, CheckCircle2 } from 'lucide-react';
import svgPaths from '../../imports/App-1-1/svg-ve4mdgnspy';

type ModalStep = 'details' | 'success';

export function LayakPage({ onBack }: { onBack: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('details');
  const [claiming, setClaiming] = useState(false);

  const openModal = () => {
    setModalStep('details');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setClaiming(false);
    setModalStep('success');
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #F5F7FA 0%, #FFFFFF 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>

      {/* ── Header — matches Figma design ── */}
      <div
        className="relative"
        style={{ background: 'linear-gradient(167.377deg, rgb(0, 89, 189) 28.712%, rgb(23, 123, 175) 91.772%)' }}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 h-11">
          <span className="text-white text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '-0.24px' }}>12:30</span>
          <div className="flex items-center gap-2">
            {/* Cellular */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="white">
              <rect x="0" y="6" width="3" height="5" rx="0.5" fill="white" />
              <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="white" />
              <rect x="9" y="2" width="3" height="9" rx="0.5" fill="white" />
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="white" />
            </svg>
            {/* Wifi */}
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <path d="M8 8.5C8.69 8.5 9.25 9.06 9.25 9.75S8.69 11 8 11s-1.25-.56-1.25-1.25S7.31 8.5 8 8.5z" fill="white" />
              <path d="M8 5.5c1.38 0 2.63.56 3.54 1.46L12.96 5.54A6.48 6.48 0 008 3.5a6.48 6.48 0 00-4.96 2.04l1.42 1.42A4.48 4.48 0 018 5.5z" fill="white" />
              <path d="M8 2.5c2.21 0 4.21.9 5.66 2.34L15.08 3.42A8.97 8.97 0 008 .5a8.97 8.97 0 00-7.08 2.92l1.42 1.42A6.97 6.97 0 018 2.5z" fill="white" />
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
            onClick={onBack}
            className="rounded-full size-9 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="px-[30px] pt-3 pb-14">
          <h1 className="text-2xl font-bold text-white leading-8 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Eligible Grants
          </h1>
          <p className="text-sm text-white/80 leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Government subsidies &amp; B40 eligibility
          </p>
        </div>
      </div>

      {/* ── Content Container ── */}
      <div style={{
        padding: '20px',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        paddingBottom: '120px',
        position: 'relative',
      }}>

        {/* Background rectangle for Total Available Aid section */}
        <div style={{
          position: 'absolute',
          left: 17,
          top: 105,
          width: 362,
          height: 97,
          background: '#ECF2FE',
          borderRadius: 16,
          zIndex: 0,
        }} />

        {/* Verification Status Card — White background with blue shield */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: '14.8px 16.8px',
          marginBottom: 24,
          boxShadow: '4px 4px 10px 0px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d={svgPaths.p1b228440} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, marginBottom: 3, letterSpacing: '-0.2px' }}>
                MyDigital ID Verified
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  background: '#0055D6',
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0055D6' }}>
                  Identity Secured
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Available Aid - Simple Text */}
        <div style={{
          marginBottom: 36,
          paddingLeft: 12,
          position: 'relative',
          zIndex: 1,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', margin: 0, marginBottom: 6 }}>
            Total Available Aid
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.6px' }}>
              RM 200
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#64748B', margin: 0 }}>
              (this month)
            </p>
          </div>
        </div>

        {/* Ready to Claim Section */}
        <div style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#64748B',
            margin: '0 0 18px 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}>
            Ready to Claim
          </h3>

          {/* Grant Card 1 — STR Phase 2 (Primary) */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20.2px 18.2px',
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '0.8px solid #BEDCFF',
            position: 'relative',
          }}>
            {/* Status Tag - Outline Style */}
            <div style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'transparent',
              border: '0.8px solid #10B981',
              borderRadius: 6,
              padding: '2.8px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: '#10B981',
              letterSpacing: '0.4px',
            }}>
              READY
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4px', width: 36, height: 40 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 3V33" stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d={svgPaths.p3fce8000} stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              </div>
              <div style={{ flex: 1, paddingRight: 50 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 7, letterSpacing: '-0.3px' }}>
                  STR Phase 2
                </div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 10 }}>
                  Based on your income level
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0055D6', lineHeight: 1.4 }}>
                  RM 200 • Verified by B40 Token
                </div>
              </div>
            </div>

            {/* Expected payout text */}
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 12, paddingLeft: 50 }}>
              Expected payout: May 2026
            </div>

            {/* Apply Now button */}
            <button
              onClick={openModal}
              style={{
                width: '100%',
                background: '#0055D6',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '11.55px 18px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Pending Section */}
        <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#94A3B8',
            margin: '0 0 18px 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}>
            Pending
          </h3>

          {/* Grant Card 2 — Bantuan Sekolah (Secondary) */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '18px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            border: '0.8px solid #E2E8F0',
            position: 'relative',
          }}>
            {/* Status Tag - Yellow/Gold */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'transparent',
              border: '0.8px solid #E0C300',
              borderRadius: 6,
              padding: '2.8px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: '#E0C300',
              letterSpacing: '0.4px',
            }}>
              PENDING
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4px', opacity: 0.7, width: 32, height: 36 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d={svgPaths.p2073a200} stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                  <path d="M10.6667 13.3333H21.3333" stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                  <path d="M10.6667 24H21.3333" stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                  <path d={svgPaths.p3964ed80} stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                  <path d={svgPaths.p3efdb280} stroke="#FDDC00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                </svg>
              </div>
              <div style={{ flex: 1, paddingRight: 65 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6, letterSpacing: '-0.3px' }}>
                  Bantuan Sekolah
                </div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 8 }}>
                  Requires student ID verification
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', lineHeight: 1.4 }}>
                  Verifying your eligibility...
                </div>
              </div>
            </div>

            {/* Upload button - Gray */}
            <button
              style={{
                width: '100%',
                background: '#E4E4E4',
                color: '#64748B',
                border: '0.8px solid #CBD5E1',
                borderRadius: 12,
                padding: '10.6px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Upload
            </button>
          </div>
        </div>

        {/* AI Advisor Bottom Banner */}
        <div style={{
          background: '#FFFBE5',
          borderRadius: 12,
          padding: '14.8px 16.8px',
          border: '0.8px solid rgba(0, 85, 214, 0.08)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 5.33333V2.66667H5.33333" stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d={svgPaths.p1ed63c00} stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d="M1.33333 9.33333H2.66667" stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d="M13.3333 9.33333H14.6667" stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d="M10 8.66667V10" stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d="M6 8.66667V10" stroke="#78350F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </svg>
            <p style={{ fontSize: 12, color: '#78350F', margin: 0, lineHeight: 1.6, flex: 1 }}>
              <strong style={{ fontWeight: 600 }}>AI Advisor:</strong> Claiming STR Phase 2 will fully fund your 'Education' pool for this month.
            </p>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          GRANT DETAILS MODAL
          CSS structure is an exact clone of the
          "Join Pool Modal" (ContributeToPoolDialog)
      ══════════════════════════════════════════════ */}
      {showModal && (
        /* Dark overlay */
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
          onClick={closeModal}
        >
          {/* Bottom sheet */}
          <div
            style={{ borderRadius: '24px 24px 0 0', background: '#fff', width: '100%', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── STEP: Details ── */}
            {modalStep === 'details' && (
              <div>
                {/* Modal header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0 24px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a', margin: 0 }}>
                    Grant Details
                  </p>
                  <button
                    onClick={closeModal}
                    style={{ lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 1L1 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div style={{ padding: '20px 22px 28px 22px' }}>

                  {/* Blue header card — same gradient as Join Pool modal */}
                  <div style={{
                    borderRadius: '16px',
                    background: 'linear-gradient(159.56deg, rgb(1,90,190) 0%, rgb(19,117,177) 100%)',
                    padding: '18px 20px',
                    marginBottom: '20px',
                  }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '2px', marginTop: 0 }}>
                      Grant Details
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', margin: 0 }}>
                        STR Phase 2
                      </p>
                      <DollarSign className="w-5 h-5" style={{ color: '#4ADE80' }} />
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Status</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>Verified</p>
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#4ADE80' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Security</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#fff', margin: 0 }}>Zero-Trust</p>
                      </div>
                    </div>
                  </div>

                  {/* Small label — same as "RECOMMENDED CONTRIBUTION" label */}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', lineHeight: '16px', color: '#1a1a1a', letterSpacing: '0.8px', marginBottom: '8px', marginTop: 0 }}>
                    ELIGIBLE AMOUNT (GOV SUBSIDY)
                  </p>

                  {/* Amount box — same #ECF2FE box */}
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
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '36px', lineHeight: '40px', color: '#0055D6', textAlign: 'center', margin: 0 }}>
                      RM 200.00
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280', textAlign: 'center', marginTop: '4px', marginBottom: 0 }}>
                      Ready to be transferred to your Family Wallet
                    </p>
                  </div>

                  {/* Yellow warning box — same #FFFBE5 box */}
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
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5.5" stroke="#D97706" strokeWidth="1" />
                        <path d="M4.8 6.5l1.1 1.1 2.3-2.3" stroke="#D97706" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', marginTop: 0 }}>
                        <Bot className="w-4 h-4" style={{ color: '#D97706' }} />
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#92400E', margin: 0 }}>
                          Gemini AI Token Explainer
                        </p>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#78350F', margin: 0 }}>
                        Your eligibility was mathematically proven using a Soulbound B40 Token. No IC number or personal data was exposed during this verification.
                      </p>
                    </div>
                  </div>

                  {/* Bottom CTA button — same pill shape as "Continue" */}
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '30px',
                      background: claiming ? '#94A3B8' : '#0055D6',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: '#fff',
                      border: 'none',
                      cursor: claiming ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {claiming ? 'Processing...' : 'Claim RM 200 Now'}
                  </button>

                </div>
              </div>
            )}

            {/* ── STEP: Success ── */}
            {modalStep === 'success' && (
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 0 24px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#1a1a1a', margin: 0 }}>
                    Claim Successful
                  </p>
                  <button
                    onClick={closeModal}
                    style={{ lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 1L1 9" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '0 22px 40px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                  {/* Green success circle */}
                  <div style={{ marginTop: '32px', marginBottom: '20px' }}>
                    <svg width="77" height="77" viewBox="0 0 77 77" fill="none">
                      <circle cx="38.5" cy="38.5" r="36" stroke="#10B981" strokeWidth="3.5" />
                      <path d="M24 39.5L33.5 49L53 29" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', lineHeight: '32px', color: '#1a1a1a', textAlign: 'center', marginBottom: '8px', marginTop: 0 }}>
                    RM 200.00 Claimed!
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6b7280', textAlign: 'center', marginBottom: '28px', marginTop: 0 }}>
                    STR Phase 2 has been transferred to your Family Wallet.
                  </p>

                  {/* Summary pill */}
                  <div style={{
                    width: '100%',
                    borderRadius: '16px',
                    background: '#ECFDF5',
                    border: '0.8px solid #6EE7B7',
                    padding: '14px 16px',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <PartyPopper className="w-5 h-5" style={{ color: '#10B981' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '18px', color: '#059669', margin: 0 }}>
                        Your Education Fund
                      </p>
                      <GraduationCap className="w-4 h-4" style={{ color: '#059669' }} />
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '18px', color: '#059669', margin: 0 }}>
                        is now fully funded for this month. Great job!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
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
      )}

    </div>
  );
}