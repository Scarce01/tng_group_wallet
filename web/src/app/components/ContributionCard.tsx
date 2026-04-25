import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { CheckCircle2, Clock } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  contribution: number;
  status: 'paid' | 'pending';
}

interface ContributionCardProps {
  members: Member[];
  targetPerPerson: number;
}

export function ContributionCard({ members, targetPerPerson }: ContributionCardProps) {
  const totalContributed = members.reduce((sum, m) => sum + m.contribution, 0);
  const totalTarget = targetPerPerson * members.length;

  return (
    <Card className="border-0 shadow-lg rounded-3xl">
      <CardHeader className="pb-3 bg-white">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-bold text-gray-900">Member Contributions</span>
          <span className="text-sm font-bold text-blue-600">
            RM{totalContributed.toFixed(2)} / RM{totalTarget.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 bg-gray-50 pb-4">
        <Progress value={(totalContributed / totalTarget) * 100} className="h-2.5" />
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-blue-100">
                  <AvatarFallback className="text-base font-bold text-blue-700">{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    RM{member.contribution.toFixed(2)} / RM{targetPerPerson.toFixed(2)}
                  </p>
                </div>
              </div>
              {member.status === 'paid' ? (
                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-green-700">PAID</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-700">PENDING</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
