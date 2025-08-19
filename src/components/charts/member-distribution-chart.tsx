'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { MemberDistribution } from '@/lib/services/member-service';
import { useMemberDistribution } from '@/lib/hooks/use-members-modern';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MemberDistribution;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium">{data.status}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{data.count} members ({data.percentage}%)</p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: { payload?: Array<{ payload: MemberDistribution }> }) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => {
        const data = entry.payload;
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.status}</span>
            <span className="text-muted-foreground">
              {data.count} ({data.percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function MemberDistributionChart() {
  const { data: distribution = [], isLoading, error } = useMemberDistribution();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalMembers = distribution.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load distribution data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (distribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No members found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Member Distribution
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Total: {totalMembers} members
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="count"
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {distribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={hoveredIndex === index ? 'hsl(var(--border))' : 'transparent'}
                    strokeWidth={hoveredIndex === index ? 2 : 0}
                    style={{
                      filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t">
          {distribution.map((item, index) => (
            <div 
              key={index} 
              className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.status}</span>
              </div>
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-xs text-muted-foreground">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}