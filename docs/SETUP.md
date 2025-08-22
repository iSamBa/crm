# Setup Guide

## Quick Start

1. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then update `.env.local` with your Supabase credentials.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database tables**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and execute the SQL from `scripts/setup-database.sql`

4. **Create demo accounts**
   ```bash
   npm run setup-demo
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Demo Accounts

After running `npm run setup-demo`, you can log in with:

- **👑 Admin**: admin@fitness.com / password123
- **💪 Trainer**: trainer@fitness.com / password123  
- **🏃 Member**: member@fitness.com / password123

## Database Setup Details

The setup script creates:

### Tables
- `users` - Base user profiles with roles
- `members` - Member-specific data (fitness goals, emergency contacts)
- `trainers` - Trainer-specific data (specializations, hourly rates)
- `membership_plans` - Subscription plan definitions
- `subscriptions` - Member subscription records
- `payments` - Payment transaction history
- `training_sessions` - Scheduled and completed sessions
- `body_measurements` - Member progress tracking
- `attendance` - Check-in/check-out records

### Demo Data Created
- 3 membership plans (Basic $29.99, Premium $79.99, VIP $149.99)
- 3 user accounts with proper role assignments
- Sample trainer with specializations and availability
- Sample member with fitness goals and emergency contact

### Row Level Security (RLS)
Basic RLS policies are included:
- Users can access their own data
- Trainers can access their clients' data
- Admins have full access to all data
- Public read access to active membership plans

## Next Steps

1. **Test the application** - Log in with different roles to see the various dashboards
2. **Customize the database** - Modify tables and policies as needed
3. **Implement features** - Start building CRUD operations for members, sessions, etc.
4. **Set up Stripe** - Add payment processing when ready
5. **Configure email** - Set up SMTP for notifications

## Troubleshooting

- **Database connection issues**: Verify your Supabase URL and keys in `.env.local`
- **RLS policy errors**: Check that users have proper roles assigned
- **Demo account creation fails**: Ensure Supabase service role key has admin permissions