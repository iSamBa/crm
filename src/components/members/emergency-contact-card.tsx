import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User } from 'lucide-react';
import { Member } from '@/types';

interface EmergencyContactCardProps {
  member: Member;
}

export function EmergencyContactCard({ member }: EmergencyContactCardProps) {
  if (!member.emergencyContact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No emergency contact information provided
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{member.emergencyContact.name}</p>
              <p className="text-sm text-muted-foreground">{member.emergencyContact.relationship}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{member.emergencyContact.phone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}