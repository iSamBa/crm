import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  Award, 
  TrendingUp
} from 'lucide-react';
import { TrainerStats } from '@/lib/services/trainer-service';

interface TrainerStatsCardsProps {
  stats?: TrainerStats;
}

// Server Component for trainer statistics display
export function TrainerStatsCards({ stats }: TrainerStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gray-200 h-8 w-16 rounded animate-pulse"></div>
              <p className="text-xs text-muted-foreground mt-1 bg-gray-200 h-4 w-24 rounded animate-pulse"></p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTrainers}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.newThisMonth} new this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTrainers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalTrainers > 0 
              ? Math.round((stats.activeTrainers / stats.totalTrainers) * 100)
              : 0
            }% active rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averageHourlyRate.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">
            Per hour average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Certifications</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCertifications}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalTrainers > 0 
              ? (stats.totalCertifications / stats.totalTrainers).toFixed(1)
              : 0
            } avg. per trainer
          </p>
        </CardContent>
      </Card>
    </div>
  );
}