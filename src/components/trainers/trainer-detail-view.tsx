'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Award, 
  Calendar,
  Clock,
  Users,
  Target,
  Edit
} from 'lucide-react';
import { getTrainerByIdServer, ServerTrainer } from '@/app/admin/trainers/actions';

interface TrainerDetailViewProps {
  trainerId: string;
  onBack: () => void;
}

export function TrainerDetailView({ trainerId, onBack }: TrainerDetailViewProps) {
  const [trainer, setTrainer] = useState<ServerTrainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainer = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getTrainerByIdServer(trainerId);
        
        if (result.error) {
          setError(result.error);
        } else {
          setTrainer(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trainer');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainer();
  }, [trainerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load trainer details</p>
        <Button onClick={onBack} className="mt-4">
          Back to Trainers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                {trainer.firstName[0]}{trainer.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{trainer.firstName} {trainer.lastName}</h2>
                <p className="text-muted-foreground">{trainer.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Trainer</Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date(trainer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Trainer
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{trainer.email}</p>
                  </div>
                </div>
                
                {trainer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{trainer.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hourly Rate</p>
                    <p className="text-sm text-muted-foreground">${trainer.hourlyRate}/hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trainer.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainer.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {trainer.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No certifications added</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Active Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Sessions This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">0h</p>
                    <p className="text-sm text-muted-foreground">Hours This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">$0</p>
                    <p className="text-sm text-muted-foreground">Earnings This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Session management will be integrated here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Availability schedule will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Performance analytics will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}