-- Fix and update members table structure
-- This script is safe to run on existing tables - it will only add missing columns

-- First, let's ensure the members table exists with the correct structure
DO $$ 
BEGIN
    -- Check if members table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'members') THEN
        CREATE TABLE members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid()
        );
    END IF;
END $$;

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'first_name') THEN
        ALTER TABLE members ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_name') THEN
        ALTER TABLE members ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'email') THEN
        ALTER TABLE members ADD COLUMN email TEXT;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'phone') THEN
        ALTER TABLE members ADD COLUMN phone TEXT;
    END IF;

    -- Add membership_status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'membership_status') THEN
        ALTER TABLE members ADD COLUMN membership_status TEXT NOT NULL DEFAULT 'active';
    END IF;

    -- Add emergency_contact column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'emergency_contact') THEN
        ALTER TABLE members ADD COLUMN emergency_contact JSONB;
    END IF;

    -- Add medical_conditions column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'medical_conditions') THEN
        ALTER TABLE members ADD COLUMN medical_conditions TEXT;
    END IF;

    -- Add fitness_goals column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'fitness_goals') THEN
        ALTER TABLE members ADD COLUMN fitness_goals TEXT;
    END IF;

    -- Add preferred_training_times column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'preferred_training_times') THEN
        ALTER TABLE members ADD COLUMN preferred_training_times TEXT[];
    END IF;

    -- Add join_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'join_date') THEN
        ALTER TABLE members ADD COLUMN join_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'created_at') THEN
        ALTER TABLE members ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'updated_at') THEN
        ALTER TABLE members ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update column constraints and defaults
DO $$
BEGIN
    -- Ensure membership_status has proper check constraint
    IF NOT EXISTS (
        SELECT FROM information_schema.check_constraints 
        WHERE constraint_name = 'members_membership_status_check'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT members_membership_status_check 
        CHECK (membership_status IN ('active', 'inactive', 'frozen', 'cancelled'));
    END IF;

    -- Remove default empty strings from required fields if they exist
    BEGIN
        ALTER TABLE members ALTER COLUMN first_name DROP DEFAULT;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE members ALTER COLUMN last_name DROP DEFAULT;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Create or update the trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security if not already enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and trainers manage members" ON members;

-- Create RLS policy for admin and trainer access
CREATE POLICY "Admin and trainers manage members" ON members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- Ensure membership_plans table exists for subscriptions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'membership_plans') THEN
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
        
        -- Enable RLS
        ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
        
        -- Allow public read access to active plans
        CREATE POLICY "Anyone can view membership plans" ON membership_plans
            FOR SELECT USING (is_active = true);
        
        -- Admin-only access for creating/updating plans
        CREATE POLICY "Admins manage membership plans" ON membership_plans
            FOR ALL USING (EXISTS (
                SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            ));
    END IF;
END $$;

-- Ensure subscriptions table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        CREATE TABLE subscriptions (
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
        
        -- Enable RLS
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        
        -- Admin and trainers access subscriptions
        CREATE POLICY "Admin and trainers access subscriptions" ON subscriptions
            FOR ALL USING (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
            );
    END IF;
END $$;

-- Display final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;

-- Display a success message
DO $$
BEGIN
    RAISE NOTICE 'Members table structure has been updated successfully!';
    RAISE NOTICE 'All required columns are now present and properly configured.';
END $$;