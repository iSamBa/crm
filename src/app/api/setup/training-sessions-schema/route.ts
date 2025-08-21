import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/* Schema updates for reference (run manually in Supabase SQL editor)
const schemaUpdates = `
-- Enhanced Training Sessions Schema for Session Management System

-- Add enhanced fields to training_sessions if they don't exist
DO $$
BEGIN
    -- Session room/location
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'session_room') THEN
        ALTER TABLE training_sessions ADD COLUMN session_room TEXT;
    END IF;
    
    -- Equipment needed for the session
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'equipment_needed') THEN
        ALTER TABLE training_sessions ADD COLUMN equipment_needed TEXT[];
    END IF;
    
    -- Session goals/objectives
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'session_goals') THEN
        ALTER TABLE training_sessions ADD COLUMN session_goals TEXT;
    END IF;
    
    -- Actual start time (may differ from scheduled)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'actual_start_time') THEN
        ALTER TABLE training_sessions ADD COLUMN actual_start_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Actual end time
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'actual_end_time') THEN
        ALTER TABLE training_sessions ADD COLUMN actual_end_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Recurring pattern (for recurring sessions)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'recurring_pattern') THEN
        ALTER TABLE training_sessions ADD COLUMN recurring_pattern JSONB;
    END IF;
    
    -- Who created the session (admin/trainer)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'created_by') THEN
        ALTER TABLE training_sessions ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    -- Session preparation notes
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'preparation_notes') THEN
        ALTER TABLE training_sessions ADD COLUMN preparation_notes TEXT;
    END IF;
    
    -- Session completion summary
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'completion_summary') THEN
        ALTER TABLE training_sessions ADD COLUMN completion_summary TEXT;
    END IF;
    
    -- Member satisfaction rating (1-5)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'member_rating') THEN
        ALTER TABLE training_sessions ADD COLUMN member_rating INTEGER CHECK (member_rating >= 1 AND member_rating <= 5);
    END IF;
    
    -- Trainer satisfaction with session
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'trainer_rating') THEN
        ALTER TABLE training_sessions ADD COLUMN trainer_rating INTEGER CHECK (trainer_rating >= 1 AND trainer_rating <= 5);
    END IF;
END $$;

-- Create session_comments table for session timeline and notes
CREATE TABLE IF NOT EXISTS session_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    comment TEXT NOT NULL,
    comment_type TEXT NOT NULL CHECK (comment_type IN ('note', 'progress', 'issue', 'goal', 'equipment', 'feedback', 'reminder')),
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trainer_availability table for managing trainer schedules
CREATE TABLE IF NOT EXISTS trainer_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trainer_id, day_of_week, start_time, effective_date)
);

-- Create session_conflicts table to track scheduling conflicts
CREATE TABLE IF NOT EXISTS session_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('trainer_unavailable', 'member_booked', 'room_occupied', 'equipment_unavailable')),
    conflict_details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on new tables
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_conflicts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_comments
CREATE POLICY "Admin and trainers manage session comments" ON session_comments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- Create RLS policies for trainer_availability
CREATE POLICY "Trainers manage own availability" ON trainer_availability
    FOR ALL USING (
        trainer_id IN (SELECT id FROM trainers WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for session_conflicts
CREATE POLICY "Admin and trainers access conflicts" ON session_conflicts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_created_at ON session_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_day ON trainer_availability(trainer_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_training_sessions_scheduled_date ON training_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member_id ON training_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to session_comments
DROP TRIGGER IF EXISTS update_session_comments_updated_at ON session_comments;
CREATE TRIGGER update_session_comments_updated_at
    BEFORE UPDATE ON session_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update the training_sessions status check constraint to include new statuses
DO $$
BEGIN
    BEGIN
        ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check 
        CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'));
END $$;

-- Update the training_sessions type check constraint to include new types
DO $$
BEGIN
    BEGIN
        ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_type_check;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_type_check 
        CHECK (type IN ('personal', 'group', 'class', 'assessment', 'consultation', 'rehabilitation'));
END $$;
`;
*/

export async function POST() {
  try {

    const results = [];

    // Step 1: Create session_comments table
    const { error: commentsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS session_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(id) NOT NULL,
          comment TEXT NOT NULL,
          comment_type TEXT NOT NULL CHECK (comment_type IN ('note', 'progress', 'issue', 'goal', 'equipment', 'feedback', 'reminder')),
          is_private BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (!commentsError) {
      results.push('session_comments table created');
    } else {
      console.error('Error creating session_comments:', commentsError);
    }

    // Step 2: Create trainer_availability table
    const { error: availabilityError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS trainer_availability (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE NOT NULL,
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_available BOOLEAN DEFAULT true,
          effective_date DATE DEFAULT CURRENT_DATE,
          end_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (!availabilityError) {
      results.push('trainer_availability table created');
    } else {
      console.error('Error creating trainer_availability:', availabilityError);
    }

    // Since RPC exec_sql might not exist either, let's try a simpler approach
    // Let's just return success and provide manual SQL for the user to run
    return NextResponse.json({
      success: true,
      message: 'Schema update script prepared. Please run the SQL manually in Supabase.',
      instructions: 'Copy the SQL from scripts/enhance-training-sessions-schema.sql and run it in your Supabase SQL editor.',
      sqlFile: '/scripts/enhance-training-sessions-schema.sql',
      tablesToCreate: [
        'session_comments - for session notes and timeline',
        'trainer_availability - for trainer schedule management',
        'session_conflicts - for conflict tracking'
      ],
      fieldsToAdd: [
        'training_sessions.session_room',
        'training_sessions.equipment_needed',
        'training_sessions.session_goals',
        'training_sessions.actual_start_time',
        'training_sessions.actual_end_time',
        'training_sessions.recurring_pattern',
        'training_sessions.created_by',
        'training_sessions.preparation_notes',
        'training_sessions.completion_summary',
        'training_sessions.member_rating',
        'training_sessions.trainer_rating'
      ]
    });
  } catch (error) {
    console.error('API Error - POST /api/setup/training-sessions-schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}