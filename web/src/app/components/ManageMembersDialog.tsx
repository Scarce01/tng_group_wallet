import { useState } from 'react';
import { AddMemberDialog } from './AddMemberDialog';
import { ApprovalSettingsDialog } from './ApprovalSettingsDialog';
import { AutoSplitRulesDialog } from './AutoSplitRulesDialog';

interface Member {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
  phone?: string;
  inviteStatus?: 'joined' | 'pending' | 'declined';
}

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  members: Member[];
  poolBalance: number;
  hasTransactions: boolean;
}

export function ManageMembersDialog({
  open,
  onOpenChange,
  poolName,
  members,
  poolBalance,
  hasTransactions
}: ManageMembersDialogProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showApprovalSettings, setShowApprovalSettings] = useState(false);
  const [showAutoSplitRules, setShowAutoSplitRules] = useState(false);
  const [pendingInvites] = useState([
    { id: '1', name: 'Lisa Wong', phone: '+60 11-234 5678', sentAt: '2 hours ago' },
    { id: '2', name: 'David Lee', phone: '+60 12-987 6543', sentAt: '1 day ago' },
  ]);

  const handleAddMember = (phone: string, method: 'invite' | 'sms') => {
    console.log(`Adding member with ${method}:`, phone);
  };

  const joinedMembers = members.filter(m => m.status === 'paid' || m.inviteStatus === 'joined');

  if (!open) return null;

  return (
    <>
      {/* ── Full-screen overlay scoped inside the 402×917 phone frame ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Dark top area — tappable to close */}
        <div
          style={{ height: '120px', background: 'rgba(0,0,0,0.45)', flexShrink: 0 }}
          onClick={() => onOpenChange(false)}
        />

        {/* ── White bottom sheet ── */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 16px 16px 16px',
              flexShrink: 0,
            }}
          >
            {/* Back arrow */}
            <button
              onClick={() => onOpenChange(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="#101828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Title */}
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#101828' }}>
              Manage Contributors
            </p>

            {/* Close X */}
            <button
              onClick={() => onOpenChange(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 16px 28px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* ── Pool Info Card ── */}
            <div
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(152.64deg, rgb(0,89,189) 24.52%, rgb(23,123,175) 100%)',
                padding: '20px 20px 18px 20px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Pool Name label + Active badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#DBEAFE' }}>
                  Pool Name
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '0.8px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '2.8px 8.8px',
                  }}
                >
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', lineHeight: '16px', color: '#fff' }}>
                    {joinedMembers.length} Active
                  </p>
                </div>
              </div>

              {/* Pool name */}
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: '28px', color: '#fff', marginBottom: '8px' }}>
                {poolName}
              </p>

              {/* Shield + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3333 8.66667C13.3333 12 11 13.6667 8.22667 14.6333C8.08144 14.6825 7.92369 14.6802 7.78 14.6267C5 13.6667 2.66667 12 2.66667 8.66667V4C2.66667 3.82319 2.7369 3.65362 2.86193 3.5286C2.98695 3.40357 3.15652 3.33333 3.33333 3.33333C4.66667 3.33333 6.33333 2.53333 7.49333 1.52C7.63457 1.39933 7.81424 1.33303 8 1.33303C8.18576 1.33303 8.36543 1.39933 8.50667 1.52C9.67333 2.54 11.3333 3.33333 12.6667 3.33333C12.8435 3.33333 13.013 3.40357 13.1381 3.5286C13.2631 3.65362 13.3333 3.82319 13.3333 4V8.66667Z" stroke="#DBEAFE" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#DBEAFE' }}>
                  Family Shared Pool (Transparent)
                </p>
              </div>
            </div>

            {/* ── Add Contributor Button ── */}
            <button
              onClick={() => setShowAddMember(true)}
              style={{
                position: 'relative',
                width: '100%',
                height: '56px',
                borderRadius: '28px',
                backgroundImage: 'linear-gradient(171.616752deg, rgb(17, 115, 178) 0%, rgb(0, 85, 214) 100%)',
                boxShadow: '0px 4px 16px 0px rgba(0,90,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.8841 12.5 10 12.5H5C4.11595 12.5 3.2681 12.8512 2.64298 13.4763C2.01786 14.1014 1.66667 14.9493 1.66667 15.8333V17.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 9.16667C9.34095 9.16667 10.8333 7.67428 10.8333 5.83333C10.8333 3.99238 9.34095 2.5 7.5 2.5C5.65905 2.5 4.16667 3.99238 4.16667 5.83333C4.16667 7.67428 5.65905 9.16667 7.5 9.16667Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.8333 6.66667V11.6667" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.3333 9.16667H13.3333" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '16px', lineHeight: '24px', color: '#fff', whiteSpace: 'nowrap' }}>
                Add Contributor
              </span>
            </button>

            {/* ── Pending Invites ── */}
            {pendingInvites.length > 0 && (
              <div
                style={{
                  borderRadius: '16px',
                  background: '#ECF2FE',
                  border: '1px solid #0055D6',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.667" stroke="#0055D6" strokeWidth="1.333"/>
                    <path d="M8 4V8L10.6667 9.33333" stroke="#0055D6" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#0055D6' }}>
                    PENDING INVITES ({pendingInvites.length})
                  </p>
                </div>

                {/* Invite rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        height: '83px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.06)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Left: avatar + info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#4DA3FF',
                            display: 'flex',
                            alignItems: 'stretch',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ flex: 1, background: 'linear-gradient(135deg, rgb(0,85,214) 14.583%, rgb(64,138,217) 84.375%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#fff' }}>
                              {invite.name.charAt(0)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#1A1A1A' }}>
                            {invite.name}
                          </p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#6B7280' }}>
                            {invite.phone}
                          </p>
                        </div>
                      </div>

                      {/* Right: pending badge + time */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ background: '#FEF9C2', borderRadius: '8px', padding: '2px 8px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '10px', lineHeight: '16px', color: '#854D0E' }}>
                            Pending
                          </p>
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '10px', lineHeight: '16px', color: '#9CA3AF' }}>
                          {invite.sentAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Active Members ── */}
            <div
              style={{
                borderRadius: '16px',
                background: '#ECF2FE',
                border: '1px solid #0055D6',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Section header */}
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#0055D6' }}>
                ACTIVE MEMBERS ({joinedMembers.length})
              </p>

              {/* Member rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {joinedMembers.map((member, idx) => (
                  <div
                    key={member.id}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      height: '83px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.06)',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Left: avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#4DA3FF',
                          display: 'flex',
                          alignItems: 'stretch',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ flex: 1, background: 'linear-gradient(135deg, rgb(0,85,214) 14.583%, rgb(64,138,217) 84.375%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#fff' }}>
                            {member.name.charAt(0)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', lineHeight: '24px', color: '#1A1A1A' }}>
                            {member.name}
                          </p>
                          {idx === 0 && (
                            /* Admin badge — no border, exactly matching Figma Badge1 */
                            <div style={{ background: '#EFF6FF', borderRadius: '8px', padding: '0 8px', height: '15.988px', display: 'flex', alignItems: 'center' }}>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '10px', lineHeight: '16px', color: '#045BCF', whiteSpace: 'nowrap' }}>Admin</p>
                            </div>
                          )}
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#6B7280' }}>
                          Contributed RM {member.contribution.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Joined pill — exact Figma Container19/20 spec */}
                    <div
                      style={{
                        background: '#ECFDF5',
                        borderRadius: '26843500px',
                        height: '23.988px',
                        width: '62.375px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        padding: '4px 10px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C3.77834 1.16667 1.16667 3.77834 1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333Z" stroke="#10B981" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.25 7L6.41667 8.16667L8.75 5.83333" stroke="#10B981" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: '#059669', whiteSpace: 'nowrap' }}>
                        Joined
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Settings Buttons ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setShowApprovalSettings(true)}
                style={{
                  width: '100%',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 17px',
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#1A1A1A' }}>
                  Approval Settings
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button
                onClick={() => setShowAutoSplitRules(true)}
                style={{
                  width: '100%',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 17px',
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', lineHeight: '20px', color: '#1A1A1A' }}>
                  Auto-Split Rules
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        poolName={poolName}
        currentMembers={joinedMembers.length}
        poolBalance={poolBalance}
        hasTransactions={hasTransactions}
        onAddMember={handleAddMember}
      />

      <ApprovalSettingsDialog
        open={showApprovalSettings}
        onOpenChange={setShowApprovalSettings}
        poolName={poolName}
      />

      <AutoSplitRulesDialog
        open={showAutoSplitRules}
        onOpenChange={setShowAutoSplitRules}
        poolName={poolName}
        memberCount={joinedMembers.length}
      />
    </>
  );
}