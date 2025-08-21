import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Clock, FileText, Camera, Activity, Plus } from 'lucide-react';
import { Member } from '@/types';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { MemberSessionsList } from './member-sessions-list';

interface MemberTabsProps {
  member: Member;
  onSubscriptionUpdated: () => void;
}

export function MemberTabs({ member, onSubscriptionUpdated }: MemberTabsProps) {
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionDialogOpen(false);
    onSubscriptionUpdated();
  };

  return (
    <Tabs defaultValue="subscriptions" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="subscriptions" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Subscriptions</span>
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Payments</span>
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Sessions</span>
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Progress</span>
        </TabsTrigger>
        <TabsTrigger value="photos" className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Photos</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscriptions" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Member Subscriptions</h3>
          <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[50vw] max-w-[50vw] min-w-[1200px] h-[95vh] overflow-y-auto p-6" style={{ width: '50vw', maxWidth: '50vw' }}>
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
              </DialogHeader>
              <SubscriptionForm 
                memberId={member.id} 
                onSuccess={handleSubscriptionSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
        <SubscriptionList memberId={member.id} />
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment History</h3>
          <p className="text-gray-500 mb-4">Payment tracking functionality coming soon</p>
        </div>
      </TabsContent>

      <TabsContent value="sessions">
        <MemberSessionsList memberId={member.id} />
      </TabsContent>

      <TabsContent value="progress" className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking</h3>
          <p className="text-gray-500 mb-4">Progress and body measurements coming soon</p>
        </div>
      </TabsContent>

      <TabsContent value="photos" className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Photos</h3>
          <p className="text-gray-500 mb-4">Photo management functionality coming soon</p>
        </div>
      </TabsContent>

      <TabsContent value="notes" className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Member Notes</h3>
          <p className="text-gray-500 mb-4">Notes and comments functionality coming soon</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}