import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ThumbsUp, ThumbsDown, AlertTriangle, Clock } from 'lucide-react';

interface SpendingRequest {
  id: string;
  description: string;
  amount: number;
  requester: string;
  votes: {
    approved: number;
    total: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  isLarge?: boolean;
  approvers: string[];
}

interface SpendingRequestCardProps {
  request: SpendingRequest;
  onVote: (requestId: string, approved: boolean) => void;
  currentUser: string;
}

export function SpendingRequestCard({ request, onVote, currentUser }: SpendingRequestCardProps) {
  const hasVoted = request.approvers.includes(currentUser);
  const votePercentage = (request.votes.approved / request.votes.total) * 100;

  const getRiskLevel = () => {
    if (request.amount > 500) return { level: 'High', color: 'bg-red-50 text-red-700 border-red-200' };
    if (request.amount > 200) return { level: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { level: 'Low', color: 'bg-green-50 text-green-700 border-green-200' };
  };

  const risk = getRiskLevel();

  return (
    <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="pb-3 bg-white">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="space-y-1.5 flex-1">
            <CardTitle className="text-sm leading-tight font-bold text-gray-900">{request.description}</CardTitle>
            <p className="text-2xl font-bold text-blue-600">RM {request.amount.toFixed(2)}</p>
          </div>
          <Badge
            className={`text-xs flex-shrink-0 rounded-full px-3 py-1 font-semibold ${
              request.status === 'approved'
                ? 'bg-green-100 text-green-700 border-green-200'
                : request.status === 'rejected'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-orange-100 text-orange-700 border-orange-200'
            }`}
          >
            {request.status === 'pending' ? 'PENDING' : request.status === 'approved' ? 'APPROVED' : 'REJECTED'}
          </Badge>
        </div>
        <Badge className={`text-xs w-fit rounded-full px-3 py-1 border font-semibold ${risk.color}`}>
          {risk.level.toUpperCase()} RISK
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 bg-gray-50 pb-4">
        {request.isLarge && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-orange-50 border-2 border-orange-200">
            <div className="p-1.5 bg-orange-100 rounded-full">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-orange-900">Large Transaction Detected</p>
              <p className="text-xs text-orange-700">Requires majority approval</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 bg-blue-100">
              <AvatarFallback className="text-sm text-blue-700 font-bold">{request.requester.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-gray-900">{request.requester}</p>
              <p className="text-xs text-gray-500">Requested by</p>
            </div>
          </div>
          {request.status === 'pending' && (
            <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-bold text-orange-600">5m</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-gray-900">Approval Progress</span>
            <span className="text-sm font-bold text-blue-600">
              {request.votes.approved}/{request.votes.total}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
              style={{ width: `${votePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">
            {request.votes.approved >= 3 ? '✓ Approval threshold reached' : `${3 - request.votes.approved} more vote${3 - request.votes.approved > 1 ? 's' : ''} needed`}
          </p>
        </div>

        {request.status === 'pending' && !hasVoted && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-11 rounded-2xl border-2 border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-bold"
              onClick={() => onVote(request.id, false)}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              <span className="text-sm">Reject</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg font-bold"
              onClick={() => onVote(request.id, true)}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              <span className="text-sm">Approve</span>
            </Button>
          </div>
        )}

        {hasVoted && request.status === 'pending' && (
          <div className="text-center py-3 bg-blue-50 rounded-2xl border-2 border-blue-100">
            <p className="text-sm font-bold text-blue-700">✓ You've approved this request</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
