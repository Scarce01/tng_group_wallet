import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface SplitData {
  name: string;
  contributed: number;
  spent: number;
  balance: number;
}

interface SplitCalculatorProps {
  splits: SplitData[];
}

export function SplitCalculator({ splits }: SplitCalculatorProps) {
  return (
    <Card className="border-0 shadow-lg rounded-3xl">
      <CardHeader className="pb-3 bg-white">
        <CardTitle className="text-base font-bold text-gray-900">Smart Split Tracker</CardTitle>
        <p className="text-xs text-gray-500 mt-1 font-medium">See who owes what</p>
      </CardHeader>
      <CardContent className="pt-0 bg-gray-50 pb-4">
        <div className="space-y-2">
          {splits.map((split, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100">
                  <AvatarFallback className="text-base font-bold text-blue-700">{split.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{split.name}</p>
                  <p className="text-xs text-gray-500 truncate font-medium">
                    Paid: RM{split.contributed.toFixed(2)} • Spent: RM{split.spent.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {split.balance > 0 ? (
                  <div className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full">
                    +RM{split.balance.toFixed(0)}
                  </div>
                ) : split.balance < 0 ? (
                  <div className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1.5 rounded-full">
                    -RM{Math.abs(split.balance).toFixed(0)}
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-600 text-sm font-bold px-3 py-1.5 rounded-full">SETTLED</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
