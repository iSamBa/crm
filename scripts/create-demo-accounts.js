import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoUsers = [
  {
    email: 'admin@fitness.com',
    password: 'password123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890'
  },
  {
    email: 'trainer@fitness.com',
    password: 'password123',
    role: 'trainer',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1234567891',
    trainerData: {
      specializations: ['Weight Training', 'HIIT', 'Nutrition'],
      certifications: ['NASM-CPT', 'Precision Nutrition Level 1'],
      hourlyRate: 75.00,
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [{ start: '09:00', end: '15:00' }]
      }
    }
  }
];

const demoMembers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1234567892',
    membershipStatus: 'active',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+1234567893',
      relationship: 'Spouse'
    },
    fitnessGoals: 'Lose 20 pounds and build muscle',
    preferredTrainingTimes: ['morning', 'evening'],
    joinDate: new Date().toISOString()
  },
  {
    firstName: 'Emily',
    lastName: 'Smith',
    email: 'emily.smith@email.com',
    phone: '+1234567894',
    membershipStatus: 'active',
    emergencyContact: {
      name: 'Mike Smith',
      phone: '+1234567895',
      relationship: 'Husband'
    },
    fitnessGoals: 'Improve overall fitness and flexibility',
    preferredTrainingTimes: ['afternoon'],
    joinDate: new Date().toISOString()
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@email.com',
    phone: '+1234567896',
    membershipStatus: 'frozen',
    fitnessGoals: 'Build strength and endurance',
    preferredTrainingTimes: ['evening'],
    joinDate: new Date().toISOString()
  }
];

async function createDemoAccounts() {
  console.log('Creating demo accounts...');

  for (const user of demoUsers) {
    try {
      console.log(`Creating ${user.role}: ${user.email}`);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName
        }
      });

      if (authError) {
        console.error(`Error creating auth user for ${user.email}:`, authError);
        continue;
      }

      const userId = authData.user.id;
      console.log(`Created auth user with ID: ${userId}`);

      // Insert user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.email,
          role: user.role,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone
        });

      if (userError) {
        console.error(`Error creating user profile for ${user.email}:`, userError);
        continue;
      }

      // Create role-specific data
      if (user.role === 'trainer' && user.trainerData) {
        const { error: trainerError } = await supabase
          .from('trainers')
          .insert({
            id: userId,
            specializations: user.trainerData.specializations,
            certifications: user.trainerData.certifications,
            hourly_rate: user.trainerData.hourlyRate,
            availability: user.trainerData.availability
          });

        if (trainerError) {
          console.error(`Error creating trainer profile for ${user.email}:`, trainerError);
        } else {
          console.log(`Created trainer profile for ${user.email}`);
        }
      }


      console.log(`✅ Successfully created ${user.role}: ${user.email}`);

    } catch (error) {
      console.error(`Unexpected error creating ${user.email}:`, error);
    }
  }
}

async function createMembershipPlans() {
  console.log('Creating membership plans...');

  const plans = [
    {
      name: 'Basic',
      description: 'Access to gym facilities and group classes',
      price: 29.99,
      duration: 'monthly',
      features: ['Gym Access', 'Group Classes', 'Locker Room']
    },
    {
      name: 'Premium',
      description: 'Everything in Basic plus personal training sessions',
      price: 79.99,
      duration: 'monthly',
      features: ['Everything in Basic', '2 Personal Training Sessions', 'Nutrition Consultation', 'Progress Tracking']
    },
    {
      name: 'VIP',
      description: 'Unlimited access with premium amenities',
      price: 149.99,
      duration: 'monthly',
      features: ['Everything in Premium', 'Unlimited Personal Training', 'VIP Lounge Access', 'Meal Planning', 'Recovery Services']
    }
  ];

  for (const plan of plans) {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .insert(plan);

      if (error) {
        console.error(`Error creating plan ${plan.name}:`, error);
      } else {
        console.log(`✅ Created membership plan: ${plan.name}`);
      }
    } catch (error) {
      console.error(`Unexpected error creating plan ${plan.name}:`, error);
    }
  }
}

async function createDemoMembers() {
  console.log('Creating demo members...');

  for (const member of demoMembers) {
    try {
      console.log(`Creating member: ${member.firstName} ${member.lastName}`);

      const { error: memberError } = await supabase
        .from('members')
        .insert({
          first_name: member.firstName,
          last_name: member.lastName,
          email: member.email,
          phone: member.phone,
          membership_status: member.membershipStatus,
          emergency_contact: member.emergencyContact,
          fitness_goals: member.fitnessGoals,
          preferred_training_times: member.preferredTrainingTimes,
          join_date: member.joinDate
        });

      if (memberError) {
        console.error(`Error creating member ${member.firstName} ${member.lastName}:`, memberError);
      } else {
        console.log(`✅ Created member: ${member.firstName} ${member.lastName}`);
      }

    } catch (error) {
      console.error(`Unexpected error creating member ${member.firstName} ${member.lastName}:`, error);
    }
  }
}

async function main() {
  try {
    await createMembershipPlans();
    await createDemoAccounts();
    await createDemoMembers();
    
    console.log('\n🎉 Demo accounts created successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('👑 Admin: admin@fitness.com / password123');
    console.log('💪 Trainer: trainer@fitness.com / password123');
    console.log('\nDemo Members (managed by admin):');
    console.log('🏃 John Doe - john.doe@email.com');
    console.log('🏃 Emily Smith - emily.smith@email.com');
    console.log('🏃 Mike Johnson - mike.johnson@email.com');
    console.log('\nYou can now start the development server with: npm run dev');
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();