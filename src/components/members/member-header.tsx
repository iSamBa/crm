import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { Member } from '@/types';
import { MemberForm } from './member-form';

interface MemberHeaderProps {
  member: Member;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  onMemberUpdated: () => void;
}

export function MemberHeader({ 
  member, 
  isEditDialogOpen, 
  setIsEditDialogOpen, 
  onMemberUpdated 
}: MemberHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{member.firstName} {member.lastName}</h1>
        <p className="text-muted-foreground">Member Details & Management</p>
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
            </DialogHeader>
            <MemberForm member={member} onSuccess={onMemberUpdated} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}