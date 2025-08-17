-- Create the database tables for the fitness studio CRM

-- Users table (extends Supabase auth.users) - Only for authenticated users (admin, trainer)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table (standalone, no authentication required)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_status TEXT NOT NULL CHECK (membership_status IN ('active', 'inactive', 'frozen', 'cancelled')) DEFAULT 'active',
  emergency_contact JSONB,
  medical_conditions TEXT,
  fitness_goals TEXT,
  preferred_training_times TEXT[],
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainers table (for trainer-specific data)
CREATE TABLE IF NOT EXISTS trainers (
  id UUID REFERENCES users(id) PRIMARY KEY,
  specializations TEXT[],
  certifications TEXT[],
  hourly_rate DECIMAL(10,2),
  availability JSONB
);

-- Membership plans
CREATE TABLE IF NOT EXISTS membership_plans (
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
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) NOT NULL,
  plan_id UUID REFERENCES membership_plans(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'frozen', 'expired')) DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash', 'bank_transfer')) DEFAULT 'card',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Training sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) NOT NULL,
  trainer_id UUID REFERENCES trainers(id),
  type TEXT NOT NULL CHECK (type IN ('personal', 'group', 'class')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  notes TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Body measurements
CREATE TABLE IF NOT EXISTS body_measurements (
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
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes
  session_type TEXT CHECK (session_type IN ('gym', 'class', 'personal_training'))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to customize these based on your security requirements)

-- Users can read their own data and admins can read all
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Members are managed by admin and trainers only (no member authentication)
CREATE POLICY "Admin and trainers manage members" ON members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Trainers access own data" ON trainers
  FOR ALL USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow public read access to membership plans
CREATE POLICY "Anyone can view membership plans" ON membership_plans
  FOR SELECT USING (is_active = true);

-- Admin-only access for creating/updating plans
CREATE POLICY "Admins manage membership plans" ON membership_plans
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admin and trainers manage all member-related data
CREATE POLICY "Admin and trainers access subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Admin and trainers access payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Access training sessions" ON training_sessions
  FOR ALL USING (
    trainer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin and trainers access body measurements" ON body_measurements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Admin and trainers access attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );