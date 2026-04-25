import { useState } from 'react';
import svgPaths from '../../imports/Profile/svg-l4tnxfp784';
import { CreditCard, Phone, CheckCircle2, MessageCircle, Mail } from 'lucide-react';

// ─── Shared types ─────────────────────────────────────────────────────────────
type Screen =
  | 'profile'
  | 'account'
  | 'notifications'
  | 'privacy'
  | 'payment'
  | 'help'
  | 'appsettings';

// ─── Back arrow ───────────────────────────────────────────────────────────────
function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11.5 4L6.5 9L11.5 14" stroke="#005AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── Screen wrapper ───────────────────────────────────────────────────────────
function ScreenWrapper({
  title,
  onBack,
  children,
  bg = '#EBF3FD',
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          padding: '52px 20px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
          background: bg,
        }}
      >
        <BackButton onBack={onBack} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101828', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '0 20px 100px' }}>{children}</div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: value ? '#005AFF' : '#D1D5DB',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', top: 3,
          left: value ? 23 : 3,
          width: 22, height: 22, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ─── Card container ───────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden', ...style,
      }}
    >
      {children}
    </div>
  );
}

function Row({
  children,
  border = true,
}: {
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: '16px',
        borderBottom: border ? '1px solid #F3F4F6' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      {children}
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────
function InputField({
  label, value, onChange, type = 'text', placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 14px',
          borderRadius: 12, border: '1.5px solid #E5E7EB',
          fontSize: 14, color: '#101828', background: '#FAFAFA',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif',
        }}
        onFocus={e => { e.target.style.borderColor = '#005AFF'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; }}
      />
    </div>
  );
}

// ─── Save / primary button ─────────────────────────────────────────────────────
function PrimaryBtn({
  label, onClick, color = '#005AFF', fullWidth = true,
}: {
  label: string; onClick: () => void; color?: string; fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 24px',
        background: color, color: '#fff',
        border: 'none', borderRadius: 14,
        fontSize: 15, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        boxShadow: `0 4px 16px ${color}44`,
      }}
    >
      {label}
    </button>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        background: '#101828', color: '#fff',
        padding: '10px 20px', borderRadius: 24,
        fontSize: 13, fontWeight: 500,
        opacity: visible ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 0.3s', whiteSpace: 'nowrap', zIndex: 999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {msg}
    </div>
  );
}

function useToast() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const show = (m: string) => {
    setMsg(m); setVisible(true);
    setTimeout(() => setVisible(false), 2200);
  };
  return { visible, msg, show };
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Account Settings
// ══════════════════════════════════════════════════════════════════════════════
function AccountSettings({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('Ahmad');
  const [email, setEmail] = useState('ahmad@email.com');
  const [phone, setPhone] = useState('+60 12-345 6789');
  const [dob, setDob] = useState('1995-06-15');
  const toast = useToast();

  return (
    <ScreenWrapper title="Account Settings" onBack={onBack}>
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #005AFF, #0080FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
            boxShadow: '0 4px 20px rgba(0,90,255,0.3)',
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>A</span>
        </div>
        <button
          style={{
            fontSize: 13, fontWeight: 600, color: '#005AFF',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          Change Photo
        </button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: 16 }}>
          <InputField label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <InputField label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
          <InputField label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+60 12-345 6789" />
          <div style={{ marginBottom: 0 }}>
            <InputField label="Date of Birth" value={dob} onChange={setDob} type="date" />
          </div>
        </div>
      </Card>

      <PrimaryBtn label="Save Changes" onClick={() => toast.show('Profile updated successfully!')} />
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Notifications
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({
    paymentReceived: true,
    paymentSent: true,
    tripReminders: true,
    memberActivity: true,
    poolUpdates: true,
    promotions: false,
    weeklyReport: true,
    appUpdates: false,
  });
  const toast = useToast();

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const groups = [
    {
      title: 'Payments',
      items: [
        { key: 'paymentReceived', label: 'Payment Received', desc: 'When someone pays into your pool' },
        { key: 'paymentSent', label: 'Payment Sent', desc: 'Confirmation when you pay' },
      ],
    },
    {
      title: 'Group Activity',
      items: [
        { key: 'tripReminders', label: 'Trip Reminders', desc: 'Upcoming trip notifications' },
        { key: 'memberActivity', label: 'Member Activity', desc: 'When members join or leave' },
        { key: 'poolUpdates', label: 'Pool Updates', desc: 'Changes to pool budget or goals' },
      ],
    },
    {
      title: 'General',
      items: [
        { key: 'promotions', label: 'Promotions & Offers', desc: 'Exclusive TNG deals' },
        { key: 'weeklyReport', label: 'Weekly Report', desc: 'Your spending summary' },
        { key: 'appUpdates', label: 'App Updates', desc: 'New features and improvements' },
      ],
    },
  ];

  return (
    <ScreenWrapper title="Notifications" onBack={onBack}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {group.title}
          </p>
          <Card>
            {group.items.map((item, i) => (
              <Row key={item.key} border={i < group.items.length - 1}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>{item.desc}</p>
                </div>
                <Toggle
                  value={settings[item.key as keyof typeof settings]}
                  onChange={() => { toggle(item.key as keyof typeof settings); toast.show('Preferences saved'); }}
                />
              </Row>
            ))}
          </Card>
        </div>
      ))}
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Privacy & Security
// ══════════════════════════════════════════════════════════════════════════════
function PrivacySecurity({ onBack }: { onBack: () => void }) {
  const [faceId, setFaceId] = useState(true);
  const [twoFa, setTwoFa] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const toast = useToast();

  const handlePin = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 5) {
      const el = document.getElementById(`pin-${idx + 1}`);
      if (el) (el as HTMLInputElement).focus();
    }
  };

  return (
    <ScreenWrapper title="Privacy & Security" onBack={onBack}>
      {/* Quick toggles */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Authentication</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Face ID / Fingerprint</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Unlock app with biometrics</p>
          </div>
          <Toggle value={faceId} onChange={v => { setFaceId(v); toast.show(v ? '🔐 Biometrics enabled' : 'Biometrics disabled'); }} />
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Two-Factor Authentication</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Extra security via SMS OTP</p>
          </div>
          <Toggle value={twoFa} onChange={v => { setTwoFa(v); toast.show(v ? '2FA enabled' : '2FA disabled'); }} />
        </Row>
      </Card>

      {/* Change PIN */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>PIN</p>
      <Card style={{ marginBottom: 20 }}>
        {!showPin ? (
          <button
            onClick={() => setShowPin(true)}
            style={{
              width: '100%', padding: 16, background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Change PIN</p>
              <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Update your 6-digit security PIN</p>
            </div>
            <span style={{ color: '#99A1AF', fontSize: 16 }}>›</span>
          </button>
        ) : (
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#101828', marginBottom: 14, textAlign: 'center' }}>Enter New PIN</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
              {pin.map((d, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="password"
                  maxLength={1}
                  value={d}
                  onChange={e => handlePin(i, e.target.value)}
                  style={{
                    width: 42, height: 48, borderRadius: 10,
                    border: d ? '2px solid #005AFF' : '1.5px solid #E5E7EB',
                    textAlign: 'center', fontSize: 20, fontWeight: 700,
                    outline: 'none', background: '#FAFAFA',
                    color: '#101828',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowPin(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1.5px solid #E5E7EB', background: '#fff',
                  fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPin(false);
                  setPin(['', '', '', '', '', '']);
                  toast.show('🔒 PIN updated successfully!');
                }}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  border: 'none', background: '#005AFF',
                  fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}
              >
                Save PIN
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Privacy */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Privacy</p>
      <Card style={{ marginBottom: 20 }}>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Hide Balance</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Mask balance on home screen</p>
          </div>
          <Toggle value={hideBalance} onChange={v => { setHideBalance(v); toast.show(v ? '🙈 Balance hidden' : 'Balance visible'); }} />
        </Row>
      </Card>

      {/* Active sessions */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Active Sessions</p>
      <Card style={{ marginBottom: 20 }}>
        {[
          { device: 'iPhone 15 Pro', location: 'Kuala Lumpur, MY', time: 'Now', current: true },
          { device: 'Chrome – MacBook', location: 'Petaling Jaya, MY', time: '2 hrs ago', current: false },
        ].map((s, i, arr) => (
          <Row key={i} border={i < arr.length - 1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: s.current ? '#EBF3FF' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {s.current ? '📱' : '💻'}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#101828', margin: 0 }}>{s.device}</p>
                <p style={{ fontSize: 11, color: '#6A7282', margin: '2px 0 0' }}>{s.location} · {s.time}</p>
              </div>
            </div>
            {s.current ? (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#16A34A',
                background: '#F0FDF4', padding: '3px 8px', borderRadius: 20,
              }}>Current</span>
            ) : (
              <button
                onClick={() => toast.show('Session ended')}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#EF4444',
                  background: '#FEF2F2', border: 'none', borderRadius: 8,
                  padding: '4px 10px', cursor: 'pointer',
                }}
              >
                End
              </button>
            )}
          </Row>
        ))}
      </Card>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Payment Methods
// ══════════════════════════════════════════════════════════════════════════════
function PaymentMethods({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState([
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/27', color: '#005AFF', icon: 'card', bank: 'Maybank' },
    { id: 2, type: 'Mastercard', last4: '8765', expiry: '09/26', color: '#EB001B', icon: 'card', bank: 'CIMB' },
  ]);
  const [banks] = useState([
    { id: 1, name: 'Maybank2u', account: '•••• 1234', icon: '🏦' },
    { id: 2, name: 'FPX Online', account: 'All banks', icon: '🔗' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const toast = useToast();

  const removeCard = (id: number) => {
    setCards(c => c.filter(x => x.id !== id));
    toast.show('Card removed');
  };

  return (
    <ScreenWrapper title="Payment Methods" onBack={onBack}>
      {/* Cards */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Saved Cards</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {cards.map(card => (
          <div
            key={card.id}
            style={{
              borderRadius: 16, padding: '16px 18px',
              background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)`,
              boxShadow: `0 4px 20px ${card.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{card.bank} {card.type}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '4px 0', letterSpacing: 2 }}>
                •••• •••• •••• {card.last4}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Exp {card.expiry}</p>
            </div>
            <button
              onClick={() => removeCard(card.id)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: '#fff', cursor: 'pointer', fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Banks */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Linked Banks</p>
      <Card style={{ marginBottom: 20 }}>
        {banks.map((b, i) => (
          <Row key={b.id} border={i < banks.length - 1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {b.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>{b.name}</p>
                <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>{b.account}</p>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', background: '#F0FDF4', padding: '3px 8px', borderRadius: 20 }}>Active</span>
          </Row>
        ))}
      </Card>

      {/* Add Card */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%', padding: 16, borderRadius: 16,
            border: '2px dashed #CBD5E1', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#005AFF',
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span> Add New Card
        </button>
      ) : (
        <Card>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#101828', marginBottom: 14 }}>Add New Card</p>
            <InputField label="Card Number" value={newCard.number} onChange={v => setNewCard(s => ({ ...s, number: v }))} placeholder="1234 5678 9012 3456" />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <InputField label="Expiry" value={newCard.expiry} onChange={v => setNewCard(s => ({ ...s, expiry: v }))} placeholder="MM/YY" />
              </div>
              <div style={{ flex: 1 }}>
                <InputField label="CVV" value={newCard.cvv} onChange={v => setNewCard(s => ({ ...s, cvv: v }))} placeholder="•••" type="password" />
              </div>
            </div>
            <InputField label="Cardholder Name" value={newCard.name} onChange={v => setNewCard(s => ({ ...s, name: v }))} placeholder="As on card" />
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const added = { id: Date.now(), type: 'Visa', last4: newCard.number.slice(-4) || '0000', expiry: newCard.expiry || 'MM/YY', color: '#6366F1', icon: 'card', bank: 'New' };
                  setCards(c => [...c, added]);
                  setShowAdd(false);
                  setNewCard({ number: '', expiry: '', cvv: '', name: '' });
                  toast.show('Card added successfully!');
                }}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#005AFF', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
              >
                Add Card
              </button>
            </div>
          </div>
        </Card>
      )}
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: Help & Support
// ══════════════════════════════════════════════════════════════════════════════
function HelpSupport({ onBack }: { onBack: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketMsg, setTicketMsg] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const toast = useToast();

  const faqs = [
    { q: 'How do I create a group pool?', a: 'Tap the "+" button on the home screen, choose "Create Pool", set a name and budget, then invite your travel companions.' },
    { q: 'Can I split expenses unequally?', a: 'Yes! When logging an expense, tap "Custom Split" to assign specific amounts or percentages to each member.' },
    { q: 'How do I withdraw from a pool?', a: 'Go to the pool, tap "Manage" → "Withdraw Funds". Funds are transferred to your TNG e-wallet within 1 business day.' },
    { q: 'What currencies are supported?', a: 'Currently Malaysian Ringgit (MYR) only. Multi-currency support is coming in Q3 2026.' },
    { q: 'Is my money safe in a pool?', a: 'Yes. All pool funds are secured by TNG Digital\'s licensed e-money safeguarding, covered under BNM regulations.' },
  ];

  return (
    <ScreenWrapper title="Help & Support" onBack={onBack}>
      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { icon: <MessageCircle className="w-6 h-6" style={{ color: '#0055D6' }} />, label: 'Live Chat', sub: 'Avg 2 min reply' },
          { icon: <Phone className="w-6 h-6" style={{ color: '#0055D6' }} />, label: 'Call Us', sub: '1800-88-1233' },
          { icon: <Mail className="w-6 h-6" style={{ color: '#0055D6' }} />, label: 'Email', sub: '24h response' },
        ].map((a, i) => (
          <button
            key={i}
            onClick={() => toast.show(`Opening ${a.label}...`)}
            style={{
              flex: 1, padding: '14px 8px', borderRadius: 14,
              background: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>{a.label}</span>
            <span style={{ fontSize: 10, color: '#6A7282' }}>{a.sub}</span>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>FAQs</p>
      <Card style={{ marginBottom: 20 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#101828', flex: 1, paddingRight: 8 }}>{f.q}</span>
              <span style={{ color: '#99A1AF', fontSize: 16, transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
            </button>
            {openFaq === i && (
              <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 13, color: '#4A5565', lineHeight: 1.6 }}>{f.a}</p>
            )}
          </div>
        ))}
      </Card>

      {/* Submit ticket */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Submit a Ticket</p>
      {!showTicket ? (
        <button
          onClick={() => setShowTicket(true)}
          style={{
            width: '100%', padding: 16, borderRadius: 16,
            border: '2px dashed #CBD5E1', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#005AFF',
          }}
        >
          <span>📝</span> Write to us
        </button>
      ) : (
        <Card>
          <div style={{ padding: 16 }}>
            <textarea
              value={ticketMsg}
              onChange={e => setTicketMsg(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              style={{
                width: '100%', padding: 12, borderRadius: 12,
                border: '1.5px solid #E5E7EB', fontSize: 13, color: '#101828',
                background: '#FAFAFA', resize: 'none', outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowTicket(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => { setShowTicket(false); setTicketMsg(''); toast.show('📨 Ticket submitted! We\'ll reply within 24h'); }}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#005AFF', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
              >
                Submit
              </button>
            </div>
          </div>
        </Card>
      )}
      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: App Settings
// ══════════════════════════════════════════════════════════════════════════════
function AppSettingsScreen({ onBack }: { onBack: () => void }) {
  const [currency, setCurrency] = useState('MYR');
  const [language, setLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [autoLock, setAutoLock] = useState('1 min');
  const toast = useToast();

  return (
    <ScreenWrapper title="App Settings" onBack={onBack}>
      {/* Display */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Display</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Dark Mode</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Switch to dark theme</p>
          </div>
          <Toggle value={darkMode} onChange={v => { setDarkMode(v); toast.show(v ? '🌙 Dark mode on' : '☀️ Light mode on'); }} />
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Compact View</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Show more content on screen</p>
          </div>
          <Toggle value={compactView} onChange={v => { setCompactView(v); toast.show('View updated'); }} />
        </Row>
      </Card>

      {/* Preferences */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Preferences</p>
      <Card style={{ marginBottom: 20 }}>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Currency</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Default display currency</p>
          </div>
          <select
            value={currency}
            onChange={e => { setCurrency(e.target.value); toast.show(`Currency set to ${e.target.value}`); }}
            style={{
              fontSize: 13, fontWeight: 600, color: '#005AFF',
              background: '#EBF3FF', border: 'none', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option>MYR</option>
            <option>USD</option>
            <option>SGD</option>
            <option>EUR</option>
          </select>
        </Row>
        <Row>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Language</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>App display language</p>
          </div>
          <select
            value={language}
            onChange={e => { setLanguage(e.target.value); toast.show(`Language set to ${e.target.value}`); }}
            style={{
              fontSize: 13, fontWeight: 600, color: '#005AFF',
              background: '#EBF3FF', border: 'none', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option>English</option>
            <option>Bahasa Malaysia</option>
            <option>中文</option>
            <option>தமிழ்</option>
          </select>
        </Row>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Auto-Lock</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Lock app when idle</p>
          </div>
          <select
            value={autoLock}
            onChange={e => { setAutoLock(e.target.value); toast.show(`Auto-lock: ${e.target.value}`); }}
            style={{
              fontSize: 13, fontWeight: 600, color: '#005AFF',
              background: '#EBF3FF', border: 'none', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option>30 sec</option>
            <option>1 min</option>
            <option>5 min</option>
            <option>Never</option>
          </select>
        </Row>
      </Card>

      {/* System */}
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6A7282', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>System</p>
      <Card style={{ marginBottom: 20 }}>
        <Row border={false}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', margin: 0 }}>Haptic Feedback</p>
            <p style={{ fontSize: 12, color: '#6A7282', margin: '2px 0 0' }}>Vibration on interactions</p>
          </div>
          <Toggle value={haptics} onChange={v => { setHaptics(v); toast.show(v ? 'Haptics enabled' : 'Haptics disabled'); }} />
        </Row>
      </Card>

      {/* App info */}
      <Card>
        {[
          { label: 'App Version', value: '3.2.1 (Build 204)' },
          { label: 'Terms of Service', value: '›' },
          { label: 'Privacy Policy', value: '›' },
        ].map((item, i, arr) => (
          <button
            key={i}
            onClick={() => toast.show(`Opening ${item.label}...`)}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>{item.label}</span>
            <span style={{ fontSize: 13, color: item.value === '›' ? '#99A1AF' : '#6A7282', fontWeight: item.value === '›' ? 700 : 400 }}>{item.value}</span>
          </button>
        ))}
      </Card>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => toast.show('Clearing cache...')}
          style={{
            width: '100%', padding: 14, borderRadius: 14,
            border: '1.5px solid #E5E7EB', background: '#fff',
            fontSize: 14, fontWeight: 600, color: '#6A7282', cursor: 'pointer',
          }}
        >
          Clear Cache
        </button>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </ScreenWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG Icons (from Figma import)
// ══════════════════════════════════════════════════════════════════════════════
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 19.997 19.997" fill="none">
      <path d={svgPaths.p26cd2ec0} stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
      <path d={svgPaths.p242e1d80} stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
      <path d="M17.4974 9.99849H7.49887" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66641" />
    </svg>
  );
}
function IconAccountSettings() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d={svgPaths.p84d4a00} fill="#ECF2FE" />
      <path d={svgPaths.p5c9d480} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
      <path d={svgPaths.p17b8c500} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
    </svg>
  );
}
function IconNotifications() {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ECF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d={svgPaths.p25877f40} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        <path d={svgPaths.p1c3efea0} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
      </svg>
    </div>
  );
}
function IconPrivacy() {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ECF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d={svgPaths.pb666180} fill="#0055D6" />
      </svg>
    </div>
  );
}
function IconPayment() {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ECF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
        <path d={svgPaths.p2c1b2700} fill="#0055D6" />
      </svg>
    </div>
  );
}
function IconHelp() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d={svgPaths.p84d4a00} fill="#ECF2FE" />
      <path d={svgPaths.p25e16a00} fill="#0055D6" />
    </svg>
  );
}
function IconAppSettings() {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ECF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d={svgPaths.ped54800} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        <path d={svgPaths.p3b27f100} stroke="#0055D6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
      </svg>
    </div>
  );
}

function Chevron() {
  return <span style={{ fontSize: 16, color: '#99A1AF', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>›</span>;
}

function SettingsItem({ icon, label, subtitle, onClick }: { icon: React.ReactNode; label: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 72, background: '#fff',
        borderRadius: 16, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10), 0px 1px 2px 0px rgba(0,0,0,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flexShrink: 0 }}>{icon}</div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#101828', margin: 0, lineHeight: '20px' }}>{label}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#6A7282', margin: '2px 0 0', lineHeight: '16px' }}>{subtitle}</p>
        </div>
      </div>
      <Chevron />
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ProfilePage
// ══════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
  const [screen, setScreen] = useState<Screen>('profile');
  const toast = useToast();

  if (screen === 'account') return <AccountSettings onBack={() => setScreen('profile')} />;
  if (screen === 'notifications') return <NotificationsScreen onBack={() => setScreen('profile')} />;
  if (screen === 'privacy') return <PrivacySecurity onBack={() => setScreen('profile')} />;
  if (screen === 'payment') return <PaymentMethods onBack={() => setScreen('profile')} />;
  if (screen === 'help') return <HelpSupport onBack={() => setScreen('profile')} />;
  if (screen === 'appsettings') return <AppSettingsScreen onBack={() => setScreen('profile')} />;

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#EBF3FD', fontFamily: 'Inter, sans-serif' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0', height: 44 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#101828', letterSpacing: '-0.24px' }}>12:30</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="17" height="11" viewBox="0 0 17 10.667" fill="none"><path d={svgPaths.p26d17600} fill="#101828" /></svg>
          <svg width="16" height="11" viewBox="0 0 15.333 11" fill="none"><path d={svgPaths.p39712400} fill="#101828" /></svg>
          <div style={{ border: '1px solid rgba(16,24,40,0.4)', borderRadius: 2.5, width: 22, height: 11, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
            <div style={{ background: '#101828', borderRadius: 1.2, width: 17, height: 7 }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '28px 20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#101828', margin: 0, lineHeight: '32px' }}>Profile</h1>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#4A5565', margin: '8px 0 0', lineHeight: '20px' }}>Manage your account settings</p>
      </div>

      {/* User card */}
      <div
        style={{
          margin: '20px 20px 0',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0px 8px 24px 0px rgba(0,90,255,0.15)',
          background: 'radial-gradient(ellipse at 50% 50%, #064187 0%, #0059BD 47%, #0A6EB6 74%, #1483AE 100%)',
          position: 'relative', height: 202,
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '55%', background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'absolute', top: 29, left: 29, right: 29 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>A</span>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, lineHeight: '28px' }}>Amanda</p>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#DBEAFE', margin: 0, lineHeight: '20px' }}>013-865 XXXXX</p>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 109, left: 29, right: 29, borderTop: '0.8px solid rgba(255,255,255,0.20)', paddingTop: 16, display: 'flex' }}>
          {[{ val: '2', label: 'Active Pools' }, { val: '24', label: 'Transactions' }, { val: '5', label: 'Family Members' }].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1, textAlign: 'center',
                borderLeft: i > 0 ? '0.8px solid rgba(255,255,255,0.20)' : 'none',
                borderRight: i < 2 ? '0.8px solid rgba(255,255,255,0.20)' : 'none',
              }}
            >
              <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, lineHeight: '32px' }}>{s.val}</p>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#DBEAFE', margin: 0, lineHeight: '16px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings list */}
      <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SettingsItem icon={<IconAccountSettings />} label="Account Settings" subtitle="Update your profile" onClick={() => setScreen('account')} />
        <SettingsItem icon={<IconNotifications />} label="Notifications" subtitle="Manage alerts" onClick={() => setScreen('notifications')} />
        <SettingsItem icon={<IconPrivacy />} label="Privacy & Security" subtitle="Keep your account safe" onClick={() => setScreen('privacy')} />
        <SettingsItem icon={<IconPayment />} label="Payment Methods" subtitle="Manage cards & banks" onClick={() => setScreen('payment')} />
        <SettingsItem icon={<IconHelp />} label="Help & Support" subtitle="Get assistance" onClick={() => setScreen('help')} />
        <SettingsItem icon={<IconAppSettings />} label="App Settings" subtitle="Preferences" onClick={() => setScreen('appsettings')} />
      </div>

      {/* Log Out button */}
      <div style={{ padding: '24px 20px 100px' }}>
        <button
          onClick={() => toast.show('👋 Logging out...')}
          style={{
            width: '100%', padding: 16, borderRadius: 16,
            border: '1.5px solid #FEE2E2', background: '#fff',
            fontSize: 14, fontWeight: 700, color: '#EF4444',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <LogoutIcon />
          <span className="text-[#0055d6]">Log Out</span>
        </button>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
