import React, { useState, useRef } from 'react';
import { Bot, Lightbulb, Sparkles, Upload, Check, Image } from 'lucide-react';

const CARD_COLORS: { id: string; gradient: string; label: string }[] = [
  { id: 'blue',   gradient: 'linear-gradient(135deg, #0059BD 0%, #1777B1 100%)', label: 'Ocean Blue' },
  { id: 'navy',   gradient: 'linear-gradient(135deg, #0A2463 0%, #2B5BE8 100%)', label: 'Deep Navy' },
  { id: 'purple', gradient: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)', label: 'Violet' },
  { id: 'green',  gradient: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)', label: 'Emerald' },
  { id: 'orange', gradient: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)', label: 'Sunset' },
  { id: 'teal',   gradient: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)', label: 'Teal' },
];

interface CreatePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePool: (pool: { name: string; recommendedContribution: number; color?: string; photo?: string }) => void;
}

export function CreatePoolDialog({ open, onOpenChange, onCreatePool }: CreatePoolDialogProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [contributionType, setContributionType] = useState<'equal' | 'smart' | 'custom'>('smart');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].gradient);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [usePhoto, setUsePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoDataUrl(result);
      setUsePhoto(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (name) {
      onCreatePool({
        name,
        recommendedContribution: contributionType === 'smart' ? 75 : parseFloat(targetAmount) || 0,
        color: usePhoto ? undefined : selectedColor,
        photo: usePhoto ? photoDataUrl || undefined : undefined,
      });
      // Reset
      setName('');
      setTargetAmount('');
      setContributionType('smart');
      setSelectedColor(CARD_COLORS[0].gradient);
      setPhotoDataUrl(null);
      setUsePhoto(false);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const isValid = name.trim() !== '';
  const previewBg = usePhoto && photoDataUrl ? undefined : selectedColor;

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
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '28px 20px 28px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0px -4px 24px rgba(0,0,0,0.12)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
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

        <p style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', margin: '0 0 20px', lineHeight: '28px' }}>
          Create Smart Pool
        </p>

        {/* ── Card Preview ── */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              height: 120, borderRadius: 18, position: 'relative', overflow: 'hidden',
              background: usePhoto && photoDataUrl ? '#111' : previewBg,
            }}
          >
            {usePhoto && photoDataUrl && (
              <div style={{ position: 'absolute', inset: 0 }}>
                <img src={photoDataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)', transform: 'scale(1.1)' }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,60,0.4)' }} />
              </div>
            )}
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -16, right: -16, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
              <div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', margin: 0, letterSpacing: '0.8px', fontWeight: 600 }}>POOL</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '3px 0 0' }}>{name || 'Pool Name'}</p>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Card preview</p>
            </div>
          </div>
        </div>

        {/* ── Card Style ── */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 12px' }}>Card Style</p>

          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {CARD_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedColor(c.gradient); setUsePhoto(false); }}
                title={c.label}
                style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  background: c.gradient,
                  border: !usePhoto && selectedColor === c.gradient ? '2.5px solid #005AFF' : '2.5px solid transparent',
                  outline: !usePhoto && selectedColor === c.gradient ? '2px solid rgba(0,90,255,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  padding: 0,
                  boxShadow: !usePhoto && selectedColor === c.gradient ? '0 0 0 3px rgba(0,90,255,0.18)' : 'none',
                }}
              >
                {!usePhoto && selectedColor === c.gradient && <Check size={14} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>

          {/* Upload photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', height: 44, borderRadius: 12,
              border: `1.5px ${usePhoto ? 'solid #005AFF' : 'dashed #CBD5E1'}`,
              background: usePhoto ? '#EFF6FF' : '#FAFAFA',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', color: usePhoto ? '#005AFF' : '#6B7280',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {usePhoto ? <Image size={16} /> : <Upload size={16} />}
            {usePhoto && photoDataUrl ? 'Photo uploaded · tap to change' : 'Upload photo as background'}
          </button>
        </div>

        {/* Pool Purpose */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>Pool Purpose</p>
          <input
            type="text"
            placeholder="e.g. Monthly Groceries"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', height: 52, borderRadius: 16,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              padding: '0 16px', fontSize: 14, color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#005AFF'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Target Amount */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>Target Amount (Optional)</p>
          <input
            type="number"
            placeholder="RM 1000"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            style={{
              width: '100%', height: 52, borderRadius: 16,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              padding: '0 16px', fontSize: 14, color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#005AFF'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
          />
        </div>

        {/* Contribution Type */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: '0 0 12px' }}>Contribution Type</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" name="ct" checked={contributionType === 'equal'} onChange={() => setContributionType('equal')} style={{ width: 18, height: 18, accentColor: '#005AFF', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>Equal Split</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" name="ct" checked={contributionType === 'smart'} onChange={() => setContributionType('smart')} style={{ width: 18, height: 18, accentColor: '#005AFF', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Smart Split <Sparkles size={14} color="#EFCD01" strokeWidth={2} fill="#EFCD01" />
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" name="ct" checked={contributionType === 'custom'} onChange={() => setContributionType('custom')} style={{ width: 18, height: 18, accentColor: '#005AFF', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>Custom</span>
            </label>
          </div>
        </div>

        {/* AI Suggestion */}
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 16, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ marginTop: 2 }}><Bot size={16} color="#0369A1" strokeWidth={2} /></div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', margin: '0 0 4px' }}>AI Suggestion</p>
            <p style={{ fontSize: 12, color: '#075985', margin: 0, lineHeight: '18px' }}>Based on your family income, we recommend RM 75 per member</p>
          </div>
        </div>

        {/* AI Insight */}
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 16, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ marginTop: 2 }}><Lightbulb size={16} color="#D97706" strokeWidth={2} /></div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', margin: '0 0 4px' }}>AI Insight</p>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: '18px' }}>Contributions are adjusted based on income to ensure fairness for all members</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{ flex: 1, height: 52, borderRadius: 999, border: '1.5px solid #005AFF', background: '#fff', fontSize: 15, fontWeight: 700, color: '#005AFF', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            style={{ flex: 1, height: 52, borderRadius: 999, border: 'none', background: isValid ? '#005AFF' : '#A0AEC0', fontSize: 15, fontWeight: 700, color: '#fff', cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s' }}
          >
            Create Pool
          </button>
        </div>
      </div>
    </div>
  );
}
