import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'contribution' | 'spending';
  description: string;
  amount: number;
  person: string;
  timestamp: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

export function TransactionHistory({ transactions, onTransactionClick }: TransactionHistoryProps) {
  return (
    <Card className="border-0 shadow-lg rounded-3xl">
      <CardHeader className="pb-3 bg-white">
        <CardTitle className="text-base font-bold text-gray-900">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 bg-gray-50 pb-4">
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-98"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    transaction.type === 'contribution'
                      ? 'bg-green-100'
                      : 'bg-blue-100'
                  }`}
                >
                  {transaction.type === 'contribution' ? (
                    <ArrowDownRight className="w-4.5 h-4.5 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4.5 h-4.5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{transaction.description}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {transaction.person} • {transaction.timestamp}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-base font-bold ${
                  transaction.type === 'contribution' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'contribution' ? '+' : '-'}RM {transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
