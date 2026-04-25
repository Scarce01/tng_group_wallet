// ─────────────────────────────────────────────────────────────────────────────
// KongsiGo – Single Source of Truth: Pool & User Data
// Imported by: AnalyticsDashboard, ProfilePage, and any future screen
// ─────────────────────────────────────────────────────────────────────────────

// ─── Current logged-in user ───────────────────────────────────────────────────
export const CURRENT_USER = {
  name: 'Amanda',
  maskedName: 'A***a',
  phone: '013-865 XXXXX',
  initials: 'A',
  tngConnected: true,
};

// ─── ZKP masking utility ──────────────────────────────────────────────────────
export function maskName(name: string): string {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

// ─── Pool Report interfaces ───────────────────────────────────────────────────
export interface PoolContributor {
  name: string;
  amount: number;
}

export interface PoolTransaction {
  spender: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface PoolReport {
  contributors: PoolContributor[];
  transactions: PoolTransaction[];
}

// ─── Shared pool data ─────────────────────────────────────────────────────────
export const POOL_REPORT_DATA: Record<string, PoolReport> = {
  education: {
    contributors: [
      { name: 'Amanda',  amount: 75 },
      { name: 'Ahmad',   amount: 75 },
      { name: 'Fatimah', amount: 75 },
      { name: 'Razak',   amount: 75 },
    ],
    transactions: [
      { spender: 'Amanda',  description: 'Yuran Universiti',     amount: 350, timestamp: '15 Apr 2026, 14:32:05' },
      { spender: 'Ahmad',   description: 'Bayaran PTPTN',        amount: 120, timestamp: '14 Apr 2026, 09:17:42' },
      { spender: 'Fatimah', description: 'Buku Teks',            amount: 180, timestamp: '12 Apr 2026, 11:05:18' },
      { spender: 'Razak',   description: 'Pas Bas (Bulanan)',    amount: 120, timestamp: '10 Apr 2026, 08:22:33' },
      { spender: 'Amanda',  description: 'Coursera Subscription', amount: 80, timestamp: '08 Apr 2026, 16:44:51' },
    ],
  },
  house: {
    contributors: [
      { name: 'Amanda',   amount: 400 },
      { name: 'Ahmad',    amount: 400 },
      { name: 'Sarah',    amount: 400 },
      { name: 'Kumar',    amount: 320 },
      { name: 'Wei Ling', amount: 300 },
    ],
    transactions: [
      { spender: 'Ahmad',    description: 'Monthly Rent',           amount: 500, timestamp: '01 Apr 2026, 10:00:00' },
      { spender: 'Amanda',   description: 'Electric Bill (TNB)',     amount: 160, timestamp: '05 Apr 2026, 14:15:22' },
      { spender: 'Sarah',    description: 'Pasar Basah Groceries',   amount: 220, timestamp: '08 Apr 2026, 07:30:45' },
      { spender: 'Kumar',    description: 'Plumbing Repair',         amount: 150, timestamp: '11 Apr 2026, 13:20:08' },
      { spender: 'Wei Ling', description: 'Unifi Broadband',         amount: 100, timestamp: '15 Apr 2026, 09:55:17' },
    ],
  },
  general: {
    contributors: [
      { name: 'Amanda',  amount: 100 },
      { name: 'Ahmad',   amount: 100 },
      { name: 'Fatimah', amount: 50  },
      { name: 'Razak',   amount: 80  },
    ],
    transactions: [
      { spender: 'Amanda',  description: 'Restaurant Dining',       amount: 180, timestamp: '14 Apr 2026, 20:15:30' },
      { spender: 'Ahmad',   description: 'Shopee / Lazada Purchase', amount: 150, timestamp: '12 Apr 2026, 15:42:19' },
      { spender: 'Fatimah', description: 'Guardian Farmasi',         amount: 90,  timestamp: '10 Apr 2026, 11:08:55' },
      { spender: 'Razak',   description: 'Netflix / Disney+',        amount: 60,  timestamp: '07 Apr 2026, 22:30:00' },
      { spender: 'Amanda',  description: 'Food Delivery (GrabFood)', amount: 120, timestamp: '05 Apr 2026, 19:15:42' },
    ],
  },
};

// ─── Pool metadata ────────────────────────────────────────────────────────────
export const POOL_NAMES: Record<string, string> = {
  education: 'Education Pool',
  house:     'House Pool',
  general:   'General Fund',
};

export const POOL_COLORS: Record<string, string> = {
  education: '#00E5FF',
  house:     '#FF8C00',
  general:   '#39FF14',
};

// ─── Auto-Contribution presets (per pool) ────────────────────────────────────
export interface AutoContrib {
  poolId:     string;
  poolName:   string;
  amount:     number;
  dayOfMonth: number;
  active:     boolean;
}

export const DEFAULT_AUTO_CONTRIBS: AutoContrib[] = [
  { poolId: 'education', poolName: 'Education Pool', amount: 75,  dayOfMonth: 1, active: true  },
  { poolId: 'house',     poolName: 'House Pool',     amount: 400, dayOfMonth: 1, active: true  },
  { poolId: 'general',   poolName: 'General Fund',   amount: 100, dayOfMonth: 5, active: false },
];

// ─── Computed user stats ──────────────────────────────────────────────────────
export interface UserStats {
  activePools:   number;
  contributed:   number;  // total contributed this month (RM)
  spent:         number;  // total spent this month (RM)
}

export function getUserStats(userName: string = CURRENT_USER.name): UserStats {
  const poolIds = Object.keys(POOL_REPORT_DATA);

  const activePools = poolIds.filter(id =>
    POOL_REPORT_DATA[id].contributors.some(c => c.name === userName)
  ).length;

  const contributed = poolIds.reduce((sum, id) => {
    const mine = POOL_REPORT_DATA[id].contributors.find(c => c.name === userName);
    return sum + (mine?.amount ?? 0);
  }, 0);

  const spent = poolIds.reduce((sum, id) => {
    const myTxs = POOL_REPORT_DATA[id].transactions.filter(tx => tx.spender === userName);
    return sum + myTxs.reduce((s, tx) => s + tx.amount, 0);
  }, 0);

  return { activePools, contributed, spent };
}

// ─── Per-pool ZKP visibility (default: all visible = masked in reports) ───────
export interface ZKPPoolVisibility {
  poolId:  string;
  visible: boolean; // true = appears masked in reports, false = excluded
}

export const DEFAULT_ZKP_VISIBILITY: ZKPPoolVisibility[] = [
  { poolId: 'education', visible: true  },
  { poolId: 'house',     visible: true  },
  { poolId: 'general',   visible: false },
];
