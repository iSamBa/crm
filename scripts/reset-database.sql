-- =====================================================
-- FITNESS STUDIO CRM - DATABASE RESET SCRIPT
-- =====================================================
-- This script drops all existing tables and recreates the complete database schema
-- with demo data for 1 admin, 3 trainers, and 10 members

-- =====================================================
-- 1. DROP ALL EXISTING TABLES
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS session_comments CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS session_conflicts CASCADE;
DROP TABLE IF EXISTS trainer_availability CASCADE;
DROP TABLE IF EXISTS body_measurements CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 2. CREATE UPDATED SCHEMA
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (admins and trainers only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'trainer')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainers table (extends users for trainer-specific info)
CREATE TABLE trainers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[],
    certifications TEXT[],
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table (standalone customer records)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_notes TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen', 'cancelled')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership plans
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    features TEXT[],
    max_sessions_per_month INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'frozen')),
    auto_renewal BOOLEAN DEFAULT true,
    custom_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer availability
CREATE TABLE trainer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trainer_id, day_of_week, start_time, end_time)
);

-- Training sessions
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    actual_start_time TIME,
    actual_end_time TIME,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('personal', 'group', 'class')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    goals TEXT,
    achievements TEXT,
    member_rating INTEGER CHECK (member_rating BETWEEN 1 AND 5),
    trainer_rating INTEGER CHECK (trainer_rating BETWEEN 1 AND 5),
    room VARCHAR(100),
    equipment TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly')),
    recurring_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session comments
CREATE TABLE session_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_type VARCHAR(20) DEFAULT 'note' CHECK (comment_type IN ('note', 'progress', 'issue', 'goal', 'equipment', 'feedback', 'reminder')),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session conflicts
CREATE TABLE session_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('trainer_unavailable', 'room_conflict', 'member_conflict', 'equipment_conflict')),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Body measurements
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    measurements JSONB, -- Store various body measurements as JSON
    photos TEXT[], -- Array of photo URLs
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance tracking
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    session_id UUID REFERENCES training_sessions(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_training_sessions_member_id ON training_sessions(member_id);
CREATE INDEX idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_body_measurements_member_id ON body_measurements(member_id);

-- =====================================================
-- 4. SET UP ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins and trainers)
-- Users can read all users, but only admins can modify
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can insert users" ON users FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can update users" ON users FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can delete users" ON users FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Trainers table policies
CREATE POLICY "Authenticated users can read trainers" ON trainers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify trainers" ON trainers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Members table policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read members" ON members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify members" ON members FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Other tables - readable by authenticated users, modifiable by admins
CREATE POLICY "Authenticated users can read membership_plans" ON membership_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify membership_plans" ON membership_plans FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read subscriptions" ON subscriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify subscriptions" ON subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify payments" ON payments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read trainer_availability" ON trainer_availability FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Trainers can manage their availability" ON trainer_availability FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() ->> 'role' = 'trainer' AND trainer_id = auth.uid())
);

CREATE POLICY "Authenticated users can read training_sessions" ON training_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and assigned trainers can modify sessions" ON training_sessions FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() ->> 'role' = 'trainer' AND trainer_id = auth.uid())
);

CREATE POLICY "Authenticated users can read session_comments" ON session_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can add session_comments" ON session_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own comments" ON session_comments FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can read session_conflicts" ON session_conflicts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify session_conflicts" ON session_conflicts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read body_measurements" ON body_measurements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify body_measurements" ON body_measurements FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read attendance" ON attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify attendance" ON attendance FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 5. INSERT DEMO DATA
-- =====================================================

-- Insert membership plans first
INSERT INTO membership_plans (id, name, description, price, duration_months, features, max_sessions_per_month) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Basic', 'Basic membership with gym access', 49.99, 1, ARRAY['Gym Access', 'Locker Room'], 4),
('550e8400-e29b-41d4-a716-446655440002', 'Premium', 'Premium membership with personal training', 99.99, 1, ARRAY['Gym Access', 'Personal Training', 'Nutrition Consultation'], 8),
('550e8400-e29b-41d4-a716-446655440003', 'VIP', 'VIP membership with unlimited access', 149.99, 1, ARRAY['Unlimited Gym Access', 'Unlimited Personal Training', 'Nutrition Plan', 'Massage Therapy'], 999),
('550e8400-e29b-41d4-a716-446655440004', 'Student', 'Discounted membership for students', 29.99, 1, ARRAY['Gym Access', 'Group Classes'], 2);

-- Insert 1 admin user
INSERT INTO users (id, email, first_name, last_name, phone, role, bio) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'admin@fitness.com', 'Alex', 'Rodriguez', '+1-555-0101', 'admin', 'Fitness studio administrator with 10+ years experience in gym management.');

-- Insert 3 trainer users
INSERT INTO users (id, email, first_name, last_name, phone, role, bio) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'sarah.trainer@fitness.com', 'Sarah', 'Johnson', '+1-555-0102', 'trainer', 'Certified personal trainer specializing in strength training and weight loss.'),
('550e8400-e29b-41d4-a716-446655440012', 'mike.trainer@fitness.com', 'Mike', 'Chen', '+1-555-0103', 'trainer', 'Experienced fitness coach with expertise in functional training and rehabilitation.'),
('550e8400-e29b-41d4-a716-446655440013', 'emma.trainer@fitness.com', 'Emma', 'Williams', '+1-555-0104', 'trainer', 'Yoga instructor and wellness coach focused on mind-body connection.');

-- Insert trainer-specific information
INSERT INTO trainers (id, specializations, certifications, experience_years, hourly_rate) VALUES
('550e8400-e29b-41d4-a716-446655440011', ARRAY['Strength Training', 'Weight Loss', 'HIIT'], ARRAY['NASM-CPT', 'ACSM-CPT'], 5, 75.00),
('550e8400-e29b-41d4-a716-446655440012', ARRAY['Functional Training', 'Rehabilitation', 'Sports Performance'], ARRAY['NSCA-CSCS', 'FMS Level 2'], 8, 85.00),
('550e8400-e29b-41d4-a716-446655440013', ARRAY['Yoga', 'Pilates', 'Meditation', 'Wellness Coaching'], ARRAY['RYT-500', 'NPCP-CPT'], 6, 70.00);

-- Insert trainer availability (Monday to Friday, 6 AM to 8 PM for all trainers)
INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time) VALUES
-- Sarah Johnson (Monday to Friday)
('550e8400-e29b-41d4-a716-446655440011', 1, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440011', 2, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440011', 3, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440011', 4, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440011', 5, '06:00:00', '20:00:00'),
-- Mike Chen (Monday to Friday)
('550e8400-e29b-41d4-a716-446655440012', 1, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440012', 2, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440012', 3, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440012', 4, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440012', 5, '06:00:00', '20:00:00'),
-- Emma Williams (Monday to Friday)
('550e8400-e29b-41d4-a716-446655440013', 1, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 2, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 3, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 4, '06:00:00', '20:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 5, '06:00:00', '20:00:00');

-- Insert 10 members
INSERT INTO members (id, first_name, last_name, email, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, join_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'John', 'Doe', 'john.doe@email.com', '+1-555-0201', '1990-05-15', 'male', '123 Main St, City, State 12345', 'Jane Doe', '+1-555-0301', '2024-01-15', 'active'),
('550e8400-e29b-41d4-a716-446655440021', 'Emily', 'Smith', 'emily.smith@email.com', '+1-555-0202', '1988-09-22', 'female', '456 Oak Ave, City, State 12345', 'Tom Smith', '+1-555-0302', '2024-02-01', 'active'),
('550e8400-e29b-41d4-a716-446655440022', 'Michael', 'Brown', 'michael.brown@email.com', '+1-555-0203', '1992-03-10', 'male', '789 Pine Rd, City, State 12345', 'Lisa Brown', '+1-555-0303', '2024-01-20', 'frozen'),
('550e8400-e29b-41d4-a716-446655440023', 'Jessica', 'Davis', 'jessica.davis@email.com', '+1-555-0204', '1995-07-08', 'female', '321 Elm St, City, State 12345', 'Mark Davis', '+1-555-0304', '2024-03-01', 'active'),
('550e8400-e29b-41d4-a716-446655440024', 'David', 'Wilson', 'david.wilson@email.com', '+1-555-0205', '1987-11-30', 'male', '654 Maple Dr, City, State 12345', 'Sarah Wilson', '+1-555-0305', '2024-02-15', 'active'),
('550e8400-e29b-41d4-a716-446655440025', 'Amanda', 'Taylor', 'amanda.taylor@email.com', '+1-555-0206', '1993-01-25', 'female', '987 Cedar Ln, City, State 12345', 'Chris Taylor', '+1-555-0306', '2024-03-10', 'active'),
('550e8400-e29b-41d4-a716-446655440026', 'Ryan', 'Anderson', 'ryan.anderson@email.com', '+1-555-0207', '1991-06-18', 'male', '147 Birch Ave, City, State 12345', 'Kelly Anderson', '+1-555-0307', '2024-01-05', 'active'),
('550e8400-e29b-41d4-a716-446655440027', 'Lauren', 'Thomas', 'lauren.thomas@email.com', '+1-555-0208', '1989-12-03', 'female', '258 Spruce St, City, State 12345', 'James Thomas', '+1-555-0308', '2024-02-20', 'active'),
('550e8400-e29b-41d4-a716-446655440028', 'Kevin', 'Jackson', 'kevin.jackson@email.com', '+1-555-0209', '1994-04-14', 'male', '369 Willow Rd, City, State 12345', 'Monica Jackson', '+1-555-0309', '2024-03-05', 'inactive'),
('550e8400-e29b-41d4-a716-446655440029', 'Stephanie', 'White', 'stephanie.white@email.com', '+1-555-0210', '1986-08-27', 'female', '741 Aspen Dr, City, State 12345', 'Robert White', '+1-555-0310', '2024-01-10', 'active');

-- Insert subscriptions for members
INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, status, auto_renewal) VALUES
-- Active subscriptions
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', '2024-01-15', '2024-02-15', 'active', true),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', '2024-02-01', '2024-03-01', 'active', true),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', '2024-01-20', '2024-02-20', 'frozen', false),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', '2024-03-01', '2024-04-01', 'active', true),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001', '2024-02-15', '2024-03-15', 'active', true),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', '2024-03-10', '2024-04-10', 'active', true),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440004', '2024-01-05', '2024-02-05', 'active', true),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440002', '2024-02-20', '2024-03-20', 'active', true),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440001', '2024-03-05', '2024-04-05', 'cancelled', false),
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440002', '2024-01-10', '2024-02-10', 'active', true);

-- Insert sample payments
INSERT INTO payments (member_id, subscription_id, amount, payment_method, payment_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440020', (SELECT id FROM subscriptions WHERE member_id = '550e8400-e29b-41d4-a716-446655440020' LIMIT 1), 99.99, 'card', '2024-01-15', 'completed'),
('550e8400-e29b-41d4-a716-446655440021', (SELECT id FROM subscriptions WHERE member_id = '550e8400-e29b-41d4-a716-446655440021' LIMIT 1), 49.99, 'bank_transfer', '2024-02-01', 'completed'),
('550e8400-e29b-41d4-a716-446655440022', (SELECT id FROM subscriptions WHERE member_id = '550e8400-e29b-41d4-a716-446655440022' LIMIT 1), 149.99, 'card', '2024-01-20', 'completed'),
('550e8400-e29b-41d4-a716-446655440023', (SELECT id FROM subscriptions WHERE member_id = '550e8400-e29b-41d4-a716-446655440023' LIMIT 1), 99.99, 'cash', '2024-03-01', 'completed'),
('550e8400-e29b-41d4-a716-446655440024', (SELECT id FROM subscriptions WHERE member_id = '550e8400-e29b-41d4-a716-446655440024' LIMIT 1), 49.99, 'card', '2024-02-15', 'completed');

-- Insert sample training sessions
INSERT INTO training_sessions (member_id, trainer_id, session_date, start_time, end_time, session_type, status, notes, goals, room) VALUES
-- Scheduled sessions
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', '2024-08-18', '10:00:00', '11:00:00', 'personal', 'scheduled', 'First session focusing on assessment', 'Assess current fitness level and set goals', 'Room A'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', '2024-08-18', '14:00:00', '15:00:00', 'personal', 'confirmed', 'Focus on functional movement', 'Improve mobility and core strength', 'Room B'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '2024-08-19', '09:00:00', '10:00:00', 'personal', 'scheduled', 'Yoga and wellness session', 'Stress reduction and flexibility', 'Studio 1'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440011', '2024-08-19', '16:00:00', '17:00:00', 'personal', 'scheduled', 'Strength training focus', 'Build upper body strength', 'Room A'),
-- Completed sessions
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440012', '2024-08-16', '11:00:00', '12:00:00', 'personal', 'completed', 'Great progress on squats', 'Improve lower body strength', 'Room B'),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440013', '2024-08-15', '18:00:00', '19:00:00', 'group', 'completed', 'Evening yoga class', 'Group relaxation and flexibility', 'Studio 1'),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440011', '2024-08-14', '08:00:00', '09:00:00', 'personal', 'completed', 'Morning cardio session', 'Cardiovascular improvement', 'Cardio Area');

-- Insert session comments for completed sessions
INSERT INTO session_comments (session_id, user_id, comment_type, content) VALUES
((SELECT id FROM training_sessions WHERE member_id = '550e8400-e29b-41d4-a716-446655440025' AND status = 'completed' LIMIT 1), '550e8400-e29b-41d4-a716-446655440012', 'progress', 'Member showed excellent form on squats, increased weight by 10lbs'),
((SELECT id FROM training_sessions WHERE member_id = '550e8400-e29b-41d4-a716-446655440026' AND status = 'completed' LIMIT 1), '550e8400-e29b-41d4-a716-446655440013', 'feedback', 'Great participation in the group session, very focused'),
((SELECT id FROM training_sessions WHERE member_id = '550e8400-e29b-41d4-a716-446655440027' AND status = 'completed' LIMIT 1), '550e8400-e29b-41d4-a716-446655440011', 'goal', 'Next session will focus on increasing cardio endurance');

-- Insert some body measurements
INSERT INTO body_measurements (member_id, measurement_date, weight, height, body_fat_percentage, notes, recorded_by) VALUES
('550e8400-e29b-41d4-a716-446655440020', '2024-01-15', 180.5, 175.0, 18.5, 'Initial assessment', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', '2024-02-01', 145.2, 162.0, 22.0, 'Starting measurements', '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440023', '2024-03-01', 135.8, 168.0, 19.5, 'Baseline measurements', '550e8400-e29b-41d4-a716-446655440013');

-- Insert attendance records
INSERT INTO attendance (member_id, check_in_time, check_out_time) VALUES
('550e8400-e29b-41d4-a716-446655440020', '2024-08-16 10:00:00+00', '2024-08-16 11:30:00+00'),
('550e8400-e29b-41d4-a716-446655440021', '2024-08-16 14:00:00+00', '2024-08-16 15:45:00+00'),
('550e8400-e29b-41d4-a716-446655440025', '2024-08-16 11:00:00+00', '2024-08-16 12:30:00+00'),
('550e8400-e29b-41d4-a716-446655440026', '2024-08-15 18:00:00+00', '2024-08-15 19:15:00+00'),
('550e8400-e29b-41d4-a716-446655440027', '2024-08-14 08:00:00+00', '2024-08-14 09:30:00+00');

-- =====================================================
-- 6. UPDATE UPDATED_AT TRIGGERS
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_availability_updated_at BEFORE UPDATE ON trainer_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_comments_updated_at BEFORE UPDATE ON session_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_conflicts_updated_at BEFORE UPDATE ON session_conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_body_measurements_updated_at BEFORE UPDATE ON body_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCRIPT COMPLETE
-- =====================================================
-- Database has been reset with:
-- ✅ 1 Admin user (admin@fitness.com)
-- ✅ 3 Trainer users (sarah.trainer@fitness.com, mike.trainer@fitness.com, emma.trainer@fitness.com)
-- ✅ 10 Member records with varied statuses
-- ✅ 4 Membership plans (Basic, Premium, VIP, Student)
-- ✅ Active subscriptions and payment history
-- ✅ Sample training sessions (scheduled, confirmed, completed)
-- ✅ Trainer availability schedules
-- ✅ Body measurements and attendance records
-- ✅ Complete RLS policies for security
-- ✅ Performance indexes
-- ✅ Automatic timestamp triggers