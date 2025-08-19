'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Heart,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  FileText,
  Camera,
  Activity,
  Plus
} from 'lucide-react';
import { Member } from '@/types';
import { memberService } from '@/lib/services/member-service';
import { MemberForm } from '@/components/members/member-form';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { dateFormatters, dateUtils } from '@/lib/utils/date-formatting';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  const fetchMember = async () => {
    try {
      const { data, error } = await memberService.getMemberById(memberId);

      if (error) {
        console.error('Error fetching member:', error);
        router.push('/admin/members');
        return;
      }

      setMember(data);
    } catch (error) {
      console.error('Error fetching member:', error);
      router.push('/admin/members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberUpdated = () => {
    setIsEditDialogOpen(false);
    fetchMember();
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Member not found</h2>
        <p className="text-muted-foreground mb-4">The member you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/admin/members">
          <Button>Back to Members</Button>
        </Link>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{member.firstName} {member.lastName}</h1>
            <p className="text-muted-foreground">Member Details & Management</p>
          </div>
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
              <MemberForm member={member} onSuccess={handleMemberUpdated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Member Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{member.firstName} {member.lastName}</p>
                    <Badge className={getStatusColor(member.membershipStatus)}>
                      {member.membershipStatus}
                    </Badge>
                  </div>
                </div>
                
                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {dateFormatters.shortDate(member.joinDate)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {member.emergencyContact && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Emergency Contact
                    </h4>
                    <div className="text-sm space-y-1 pl-6">
                      <p><strong>{member.emergencyContact.name}</strong></p>
                      <p>{member.emergencyContact.phone}</p>
                      <p className="text-muted-foreground">{member.emergencyContact.relationship}</p>
                    </div>
                  </div>
                )}

                {member.fitnessGoals && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Fitness Goals
                    </h4>
                    <p className="text-sm text-muted-foreground pl-6">{member.fitnessGoals}</p>
                  </div>
                )}

                {member.preferredTrainingTimes && member.preferredTrainingTimes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Preferred Training Times
                    </h4>
                    <div className="flex flex-wrap gap-1 pl-6">
                      {member.preferredTrainingTimes.map((time, index) => (
                        <Badge key={index} variant="outline">{time}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm font-medium">
                  {dateUtils.daysBetween(member.joinDate, new Date())} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sessions</span>
                <span className="text-sm font-medium">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month</span>
                <span className="text-sm font-medium">6 visits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Visit</span>
                <span className="text-sm font-medium">2 days ago</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Take Progress Photo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Checked in to gym</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment processed - $89</p>
                      <p className="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Session completed with Sarah</p>
                      <p className="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent>
                {member.medicalConditions ? (
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                    <p className="text-sm">{member.medicalConditions}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No medical conditions reported</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Subscriptions</h3>
              <p className="text-sm text-muted-foreground">Manage member subscriptions and plans</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Subscription</DialogTitle>
                </DialogHeader>
                <SubscriptionForm 
                  memberId={memberId} 
                  onSuccess={() => {
                    // Close dialog and refresh data
                    window.location.reload();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
          <SubscriptionList memberId={memberId} />
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Payment history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Session management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Progress tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Member Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Note management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}