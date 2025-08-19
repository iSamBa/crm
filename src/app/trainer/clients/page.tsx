'use client';

import { useState } from 'react';
import { TrainerLayout } from '@/components/layout/trainer-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { useTrainerSessions } from '@/lib/hooks/use-member-sessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  User,
  Calendar,
  Mail
} from 'lucide-react';

export default function TrainerClientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all sessions for this trainer to extract unique clients
  const { data: sessions = [], isLoading } = useTrainerSessions(user?.id || null);

  if (!user) {
    return (
      <TrainerLayout>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Please log in to view your clients.</p>
          </CardContent>
        </Card>
      </TrainerLayout>
    );
  }

  // Extract unique clients from sessions
  const clients = sessions
    .filter((session) => session.member)
    .reduce((acc, session) => {
      const member = session.member!;
      if (!acc.some(client => client.id === member.id)) {
        // Count sessions for this client
        const clientSessions = sessions.filter(s => s.member?.id === member.id);
        const upcomingSessions = clientSessions.filter(s => 
          s.status === 'scheduled' || s.status === 'confirmed'
        );
        const completedSessions = clientSessions.filter(s => s.status === 'completed');
        
        acc.push({
          ...member,
          totalSessions: clientSessions.length,
          upcomingSessions: upcomingSessions.length,
          completedSessions: completedSessions.length,
          lastSession: clientSessions
            .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0]
        });
      }
      return acc;
    }, [] as any[]);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <TrainerLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </TrainerLayout>
    );
  }

  return (
    <TrainerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Clients</h1>
          <p className="text-muted-foreground">
            Manage your training clients and their progress
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredClients.length} of {clients.length} clients
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {clients.length === 0 ? 'No Clients Yet' : 'No Clients Found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clients.length === 0 
                  ? 'Start training clients to see them here.'
                  : 'Try adjusting your search terms.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {client.firstName} {client.lastName}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.email}</span>
                    </div>
                  </div>

                  {/* Session Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-primary">{client.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-green-600">{client.completedSessions}</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{client.upcomingSessions}</div>
                      <div className="text-xs text-muted-foreground">Upcoming</div>
                    </div>
                  </div>

                  {/* Last Session */}
                  {client.lastSession && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last: {new Date(client.lastSession.scheduledDate).toLocaleDateString()}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={
                          client.lastSession.status === 'completed' 
                            ? 'border-green-200 text-green-700' 
                            : 'border-blue-200 text-blue-700'
                        }
                      >
                        {client.lastSession.status}
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TrainerLayout>
  );
}