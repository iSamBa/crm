import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, Heart, AlertTriangle, User } from 'lucide-react';
import { Member } from '@/types';
import { mediumDate } from '@/lib/utils/date-formatting';

interface MemberInfoCardProps {
  member: Member;
}

export function MemberInfoCard({ member }: MemberInfoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Member Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{member.firstName} {member.lastName}</h3>
                <Badge className={getStatusColor(member.membershipStatus)}>
                  {member.membershipStatus.charAt(0).toUpperCase() + member.membershipStatus.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {member.email && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
              )}
              
              {member.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Inscrit le {mediumDate(member.joinDate)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {member.fitnessGoals && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Fitness Goals</span>
                </div>
                <p className="text-sm text-muted-foreground">{member.fitnessGoals}</p>
              </div>
            )}

            {member.medicalConditions && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Medical Conditions</span>
                </div>
                <p className="text-sm text-muted-foreground">{member.medicalConditions}</p>
              </div>
            )}

            {member.preferredTrainingTimes && member.preferredTrainingTimes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Preferred Training Times</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.preferredTrainingTimes.map((time, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}