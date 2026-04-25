import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { X, Download } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
}

interface Transaction {
  id: string;
  poolId: string;
  type: 'contribution' | 'spending';
  description: string;
  amount: number;
  person: string;
  timestamp: string;
}

interface PoolReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  recommendedContribution: number;
  currentBalance: number;
  members: Member[];
  transactions: Transaction[];
  createdDate?: string;
}

export function PoolReportDialog({
  open,
  onOpenChange,
  poolName,
  recommendedContribution,
  currentBalance,
  members,
  transactions,
  createdDate = '13 Apr 2026'
}: PoolReportDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, [open]);

  // Calculate totals
  const totalContributed = members.reduce((sum, m) => sum + m.contribution, 0);
  const totalSpent = totalContributed - currentBalance;
  const perMemberShare = members.length > 0 ? currentBalance / members.length : 0;

  // Get ALL spending transactions, sorted newest first
  const expenses = transactions
    .filter(t => t.type === 'spending')
    .sort((a, b) => b.id.localeCompare(a.id));

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 bg-transparent border-none shadow-none overflow-visible"
        style={{ maxHeight: '90vh', width: 'min(380px, 90vw)', maxWidth: '380px' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Pool Report</DialogTitle>
          <DialogDescription>Financial summary and breakdown</DialogDescription>
        </DialogHeader>

        {/* Close Button */}
        <div className="flex justify-end mb-2 px-4">
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center press-scale hover:scale-110 transition-transform"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: 'none',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Receipt Paper */}
        <div
          className={`receipt-paper ${isAnimating ? 'print-animation' : ''}`}
          style={{
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #FAFAFA 100%)',
            borderRadius: '8px 8px 24px 24px',
            padding: '32px 24px 24px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            maxHeight: '75vh',
            overflowY: 'auto',
            fontFamily: 'monospace',
            position: 'relative'
          }}
        >
          {/* Perforated Edge Effect at Top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, #E5E7EB 8px, #E5E7EB 12px)',
              borderRadius: '8px 8px 0 0'
            }}
          />

          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="text-xs font-bold mb-2"
              style={{ color: '#6B7280', letterSpacing: '2px' }}
            >
              ════════════════════════
            </div>
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: '#1A1A1A', letterSpacing: '1px' }}
            >
              POOL REPORT
            </h2>
            <div
              className="text-xs font-bold"
              style={{ color: '#6B7280', letterSpacing: '2px' }}
            >
              ════════════════════════
            </div>
          </div>

          {/* Pool Name */}
          <div className="text-center mb-6">
            <p className="text-base font-bold" style={{ color: '#1A1A1A' }}>
              {poolName}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Created: {createdDate}
            </p>
          </div>

          {/* Dotted Line */}
          <div
            className="my-4"
            style={{
              borderTop: '1px dashed #D1D5DB',
              height: '1px'
            }}
          />

          {/* Contributions Section */}
          <div className="mb-6">
            <p className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>
              CONTRIBUTIONS
            </p>
            <div className="flex justify-between mb-1">
              <span className="text-sm" style={{ color: '#1A1A1A' }}>Total Pooled</span>
              <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                RM {totalContributed.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>
                {members.length} members × RM {recommendedContribution} each
              </span>
            </div>
          </div>

          {/* Dotted Line */}
          <div
            className="my-4"
            style={{
              borderTop: '1px dashed #D1D5DB',
              height: '1px'
            }}
          />

          {/* Spending Section */}
          <div className="mb-6">
            <p className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>
              SPENDING
            </p>
            <div className="flex justify-between mb-1">
              <span className="text-sm" style={{ color: '#1A1A1A' }}>Total Spent</span>
              <span className="text-sm font-bold" style={{ color: '#FF6B6B' }}>
                -RM {totalSpent.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-xs" style={{ color: '#6B7280' }}>
                Transactions: {expenses.length}
              </span>
            </div>

            {expenses.length > 0 && (
              <>
                <p className="text-xs font-bold mb-2 mt-3" style={{ color: '#6B7280' }}>
                  ALL TRANSACTIONS:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      style={{
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        borderLeft: '3px solid #FF6B6B',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="text-xs" style={{ color: '#1A1A1A', fontWeight: 700, maxWidth: '65%' }}>
                          {expense.description}
                        </span>
                        <span className="text-xs font-bold" style={{ color: '#FF6B6B', flexShrink: 0 }}>
                          -RM {expense.amount.toFixed(0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                          👤 {expense.person}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {expense.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dotted Line */}
          <div
            className="my-4"
            style={{
              borderTop: '1px dashed #D1D5DB',
              height: '1px'
            }}
          />

          {/* Current Status */}
          <div className="mb-6">
            <p className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>
              CURRENT STATUS
            </p>
            <div
              className="p-3 rounded-lg mb-2"
              style={{ background: '#EFF6FF' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#005AFF' }}>Balance Remaining</span>
                <span className="text-xl font-bold" style={{ color: '#005AFF' }}>
                  RM {currentBalance.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>
                Per Member Share
              </span>
              <span className="text-xs font-bold" style={{ color: '#1A1A1A' }}>
                RM {perMemberShare.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Dotted Line */}
          <div
            className="my-4"
            style={{
              borderTop: '1px dashed #D1D5DB',
              height: '1px'
            }}
          />

          {/* Members */}
          <div className="mb-6">
            <p className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>
              MEMBERS ({members.length})
            </p>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: '#10B981' }}>✓</span>
                    <span className="text-sm" style={{ color: '#1A1A1A' }}>
                      {member.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                    RM {member.contribution.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="text-xs font-bold text-center pt-4"
            style={{
              color: '#6B7280',
              letterSpacing: '2px',
              borderTop: '1px dashed #D1D5DB'
            }}
          >
            ════════════════════════
          </div>
          <p className="text-xs text-center mt-2" style={{ color: '#9CA3AF' }}>
            Generated: {today}
          </p>
          <div
            className="text-xs font-bold text-center mt-2"
            style={{ color: '#6B7280', letterSpacing: '2px' }}
          >
            ════════════════════════
          </div>
        </div>

        <style>{`
          @keyframes printSlide {
            0% {
              transform: translateY(-120%);
              opacity: 0;
            }
            60% {
              transform: translateY(2%);
            }
            80% {
              transform: translateY(-1%);
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes fadeInBg {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .print-animation {
            animation: printSlide 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .receipt-paper {
            transform-origin: top center;
          }

          .receipt-paper::-webkit-scrollbar {
            width: 4px;
          }

          .receipt-paper::-webkit-scrollbar-track {
            background: transparent;
          }

          .receipt-paper::-webkit-scrollbar-thumb {
            background: #D1D5DB;
            border-radius: 2px;
          }

          .press-scale {
            transition: transform 0.15s ease;
          }

          .press-scale:active {
            transform: scale(0.96);
          }

          .press-scale:hover {
            transform: scale(1.05);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}