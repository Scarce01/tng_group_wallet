import React, { useState } from 'react';
import { Bot, Lightbulb, Sparkles } from 'lucide-react';

interface CreatePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePool: (pool: { name: string; recommendedContribution: number }) => void;
}

export function CreatePoolDialog({ open, onOpenChange, onCreatePool }: CreatePoolDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [contributionType, setContributionType] = useState<'equal' | 'smart' | 'custom'>('smart');

  const handleCreate = () => {
    if (name) {
      onCreatePool({
        name,
        recommendedContribution: contributionType === 'smart' ? 75 : parseFloat(targetAmount) || 0,
      });
      setName('');
      setTargetAmount('');
      setContributionType('smart');
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const isValid = name.trim() !== '';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 'auto',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '28px 20px 28px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0px -4px 24px rgba(0,0,0,0.12)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 28, height: 28, borderRadius: '50%',
            background: '#F3F4F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M9 1L1 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M1 1L9 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title */}
        <p style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', margin: '0 0 24px', lineHeight: '28px' }}>
          Create Smart Family Pool
        </p>

        {/* Pool Purpose */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>
            Pool Purpose
          </p>
          <input
            type="text"
            placeholder="Monthly Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              padding: '0 16px',
              fontSize: 14,
              color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0055D6'; e.target.style.background = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Target Amount (Optional) */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>
            Target Amount (Optional)
          </p>
          <input
            type="number"
            placeholder="RM 1000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              padding: '0 16px',
              fontSize: 14,
              color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0055D6'; e.target.style.background = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Contribution Type */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 12px' }}>
            Contribution Type
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Equal Split */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="contributionType"
                checked={contributionType === 'equal'}
                onChange={() => setContributionType('equal')}
                style={{ width: 18, height: 18, accentColor: '#0055D6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>Equal Split</span>
            </label>

            {/* AI Smart Split */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="contributionType"
                checked={contributionType === 'smart'}
                onChange={() => setContributionType('smart')}
                style={{ width: 18, height: 18, accentColor: '#0055D6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Smart Split
                <Sparkles size={14} color="#EFCD01" strokeWidth={2} fill="#EFCD01" />
              </span>
            </label>

            {/* Custom */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="contributionType"
                checked={contributionType === 'custom'}
                onChange={() => setContributionType('custom')}
                style={{ width: 18, height: 18, accentColor: '#0055D6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>Custom</span>
            </label>
          </div>
        </div>

        {/* AI Suggestion box */}
        <div
          style={{
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ marginTop: 2 }}>
            <Bot size={16} color="#0369A1" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', margin: '0 0 4px' }}>
              AI Suggestion
            </p>
            <p style={{ fontSize: 12, color: '#075985', margin: 0, lineHeight: '18px' }}>
              Based on your family income, we recommend RM 75 per member
            </p>
          </div>
        </div>

        {/* AI Insight box */}
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ marginTop: 2 }}>
            <Lightbulb size={16} color="#D97706" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', margin: '0 0 4px' }}>
              AI Insight
            </p>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: '18px' }}>
              Contributions are adjusted based on income to ensure fairness for all members
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Cancel */}
          <button
            onClick={() => onOpenChange(false)}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              border: '1.5px solid #0055D6',
              background: '#fff',
              fontSize: 15,
              fontWeight: 700,
              color: '#0055D6',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
          {/* Create Smart Pool */}
          <button
            onClick={handleCreate}
            disabled={!isValid}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              border: 'none',
              background: isValid ? '#0055D6' : '#A0AEC0',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
          >
            Create Smart Pool
          </button>
        </div>
      </div>
    </div>
  );
}
