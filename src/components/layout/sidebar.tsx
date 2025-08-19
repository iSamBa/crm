'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-context';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  LogOut,
  UserCheck,
  DollarSign,
  BookOpen,
  TrendingUp,
  Home,
  User,
  Package
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  items: SidebarItem[];
  role: 'admin' | 'trainer';
}

export function Sidebar({ items, role }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const roleConfig = {
    admin: {
      title: 'Admin Portal',
      bgColor: 'bg-gradient-to-br from-primary/10 to-accent/10',
    },
    trainer: {
      title: 'Trainer Portal',
      bgColor: 'bg-gradient-to-br from-primary/10 to-accent/10',
    },
  };

  const config = roleConfig[role];

  return (
    <div className={cn("flex flex-col h-full w-64 border-r", config.bgColor)}>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary">{config.title}</h2>
        <p className="text-sm text-muted-foreground">Fitness Studio CRM</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/${role}/profile`} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const adminNavItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { title: 'Members', href: '/admin/members', icon: Users },
  { title: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { title: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { title: 'Subscription Plans', href: '/admin/subscription-plans', icon: Package },
  { title: 'Payments', href: '/admin/payments', icon: DollarSign },
  { title: 'Trainers', href: '/admin/trainers', icon: UserCheck },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

export const trainerNavItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/trainer/dashboard', icon: Home },
  { title: 'Schedule', href: '/trainer/schedule', icon: Calendar },
  { title: 'Clients', href: '/trainer/clients', icon: Users },
  { title: 'Sessions', href: '/trainer/sessions', icon: BookOpen },
  { title: 'Progress', href: '/trainer/progress', icon: TrendingUp },
];

