# Fitness Studio CRM

A modern, comprehensive Customer Relationship Management system designed specifically for fitness studios. Built with React 18+, TypeScript, Next.js, and Supabase.

## 🏋️ Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Trainer, Member)
- Secure authentication with Supabase Auth
- Protected routes based on user roles
- Separate portals for different user types

### 👥 Member Management
- Comprehensive member profiles with personal information
- Emergency contacts and medical conditions tracking
- Fitness goals and preferences management
- Member status tracking (active, inactive, frozen, cancelled)
- Body measurements and progress tracking
- Member check-in system

### 💳 Subscription & Membership Plans
- Multiple membership tiers (Basic, Premium, VIP)
- Flexible subscription periods (monthly, quarterly, annual)
- Trial periods and promotional offers
- Automatic renewal tracking
- Membership freeze/pause functionality

### 💰 Payment & Financial Tracking
- Payment history and invoice management
- Outstanding balance tracking
- Multiple payment methods support
- Automatic payment reminders
- Refunds and credits processing
- Financial reporting and analytics

### 🏃 Training & Classes
- Personal training session scheduling
- Trainer assignment and management
- Session notes and feedback system
- Workout plans and programs
- Group class management

### 📊 Analytics & Reporting
- Member retention metrics
- Revenue analytics
- Attendance patterns analysis
- Popular classes/time slots tracking
- Member acquisition trends
- Trainer utilization rates

### 📱 Communication
- Announcements and notifications
- SMS/Email reminders for sessions
- Birthday and milestone messages
- Marketing campaigns
- Member feedback and surveys

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript, Next.js 14+ (App Router)
- **UI Library**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, Auth, Realtime, Storage)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Next.js built-in bundling
- **Package Manager**: npm
- **Icons**: Lucide React
- **Future Integration**: Stripe for payment processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- A Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitness-studio-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase Database**
   
   Create the following tables in your Supabase database:
   
   ```sql
   -- Users table (extends Supabase auth.users)
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'member')),
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     phone TEXT,
     avatar TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Members table (for member-specific data)
   CREATE TABLE members (
     id UUID REFERENCES users(id) PRIMARY KEY,
     membership_status TEXT NOT NULL CHECK (membership_status IN ('active', 'inactive', 'frozen', 'cancelled')),
     emergency_contact JSONB,
     medical_conditions TEXT,
     fitness_goals TEXT,
     preferred_training_times TEXT[],
     join_date DATE NOT NULL DEFAULT CURRENT_DATE
   );
   
   -- Trainers table (for trainer-specific data)
   CREATE TABLE trainers (
     id UUID REFERENCES users(id) PRIMARY KEY,
     specializations TEXT[],
     certifications TEXT[],
     hourly_rate DECIMAL(10,2),
     availability JSONB
   );
   
   -- Membership plans
   CREATE TABLE membership_plans (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     price DECIMAL(10,2) NOT NULL,
     duration TEXT NOT NULL CHECK (duration IN ('monthly', 'quarterly', 'annual')),
     features TEXT[],
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Subscriptions
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id UUID REFERENCES members(id) NOT NULL,
     plan_id UUID REFERENCES membership_plans(id) NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'frozen', 'expired')),
     start_date DATE NOT NULL,
     end_date DATE NOT NULL,
     auto_renew BOOLEAN DEFAULT true,
     price DECIMAL(10,2) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Payments
   CREATE TABLE payments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id UUID REFERENCES members(id) NOT NULL,
     subscription_id UUID REFERENCES subscriptions(id),
     amount DECIMAL(10,2) NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
     payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash', 'bank_transfer')),
     transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     description TEXT
   );
   
   -- Training sessions
   CREATE TABLE training_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id UUID REFERENCES members(id) NOT NULL,
     trainer_id UUID REFERENCES trainers(id),
     type TEXT NOT NULL CHECK (type IN ('personal', 'group', 'class')),
     title TEXT NOT NULL,
     description TEXT,
     scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
     duration INTEGER NOT NULL, -- in minutes
     status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
     notes TEXT,
     cost DECIMAL(10,2),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Body measurements
   CREATE TABLE body_measurements (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id UUID REFERENCES members(id) NOT NULL,
     weight DECIMAL(5,2),
     body_fat DECIMAL(5,2),
     muscle_mass DECIMAL(5,2),
     measurements JSONB,
     photos TEXT[],
     notes TEXT,
     recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Attendance tracking
   CREATE TABLE attendance (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id UUID REFERENCES members(id) NOT NULL,
     check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     check_out_time TIMESTAMP WITH TIME ZONE,
     duration INTEGER, -- in minutes
     session_type TEXT CHECK (session_type IN ('gym', 'class', 'personal_training'))
   );
   ```

5. **Set up Row Level Security (RLS) policies**
   
   Enable RLS on all tables and create appropriate policies based on user roles.

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin portal pages
│   ├── trainer/           # Trainer portal pages
│   ├── member/            # Member portal pages
│   ├── auth/              # Authentication pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects based on role)
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── members/          # Member-related components
│   ├── trainers/         # Trainer-related components
│   ├── subscriptions/    # Subscription components
│   ├── payments/         # Payment components
│   ├── sessions/         # Session components
│   └── common/           # Common shared components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication utilities
│   ├── supabase/         # Supabase client configuration
│   ├── utils/            # General utilities
│   ├── validations/      # Zod validation schemas
│   └── hooks/            # Custom React hooks
├── store/                # Zustand store configuration
├── types/                # TypeScript type definitions
└── constants/            # Application constants
```

## 🔑 Demo Accounts

For testing purposes, you can create these demo accounts in your Supabase database:

- **Admin**: admin@fitness.com / password
- **Trainer**: trainer@fitness.com / password  
- **Member**: member@fitness.com / password

## 🎨 UI/UX Features

- **Clean, energetic design** fitting the fitness industry
- **Mobile-responsive** layout for on-the-go access
- **Role-based navigation** with different layouts for each user type
- **Quick check-in interface** for reception desk use
- **Calendar views** for scheduling and bookings
- **Visual progress charts** and analytics
- **Dark/light mode** support (coming soon)
- **Fast member search** functionality
- **Tablet-optimized** interface for trainers

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript compiler check

# Testing (to be added)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add your environment variables in the Vercel dashboard
3. Deploy automatically on every push to main

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `.next` folder to your hosting provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

### Phase 1 (Current) - Foundation
- [x] Basic authentication and role-based access
- [x] Dashboard layouts for all roles
- [x] Project structure and configuration
- [ ] Member management CRUD operations
- [ ] Basic subscription management

### Phase 2 - Core Features
- [ ] Payment processing with Stripe integration
- [ ] Training session scheduling system
- [ ] Member check-in/check-out functionality
- [ ] Basic reporting and analytics

### Phase 3 - Advanced Features
- [ ] Progress tracking with charts and photos
- [ ] Automated billing and payment reminders
- [ ] SMS/Email notification system
- [ ] Advanced reporting and business intelligence

### Phase 4 - Enhanced Experience
- [ ] Mobile app (React Native)
- [ ] Advanced member portal features
- [ ] Workout plan builder
- [ ] Nutrition tracking integration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search existing [issues](issues/)
3. Create a new issue with detailed information
4. Contact support at support@fitnessstudiocrm.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the clean and consistent icons

---

**Made with ❤️ for the fitness community**
