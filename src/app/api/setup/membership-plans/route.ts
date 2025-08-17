import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const membershipPlans = [
  {
    name: 'Basic Monthly',
    description: 'Perfect for getting started with your fitness journey',
    price: 29.99,
    duration: 'monthly',
    features: [
      'Gym access during regular hours',
      'Basic equipment use',
      'Locker room access',
      'Free initial fitness assessment'
    ],
    is_active: true
  },
  {
    name: 'Premium Monthly',
    description: 'Enhanced experience with additional perks',
    price: 59.99,
    duration: 'monthly',
    features: [
      '24/7 gym access',
      'All equipment including premium machines',
      'Group fitness classes',
      'Locker room with towel service',
      'Free personal training consultation',
      'Guest passes (2/month)'
    ],
    is_active: true
  },
  {
    name: 'Elite Monthly',
    description: 'Ultimate fitness experience with premium services',
    price: 99.99,
    duration: 'monthly',
    features: [
      '24/7 gym access',
      'VIP area access',
      'Unlimited group classes',
      'Premium locker room with amenities',
      'Monthly personal training session',
      'Nutritional consultation',
      'Priority booking',
      'Unlimited guest passes'
    ],
    is_active: true
  },
  {
    name: 'Basic Quarterly',
    description: 'Three months of basic access with savings',
    price: 79.99,
    duration: 'quarterly',
    features: [
      'Gym access during regular hours',
      'Basic equipment use',
      'Locker room access',
      'Free initial fitness assessment',
      'Quarterly progress review'
    ],
    is_active: true
  },
  {
    name: 'Premium Quarterly',
    description: 'Three months of premium features at a discounted rate',
    price: 159.99,
    duration: 'quarterly',
    features: [
      '24/7 gym access',
      'All equipment including premium machines',
      'Group fitness classes',
      'Locker room with towel service',
      'Free personal training consultation',
      'Guest passes (2/month)',
      'Quarterly body composition analysis'
    ],
    is_active: true
  },
  {
    name: 'Basic Annual',
    description: 'Full year of fitness with maximum savings',
    price: 299.99,
    duration: 'annual',
    features: [
      'Gym access during regular hours',
      'Basic equipment use',
      'Locker room access',
      'Free initial fitness assessment',
      'Quarterly progress reviews',
      'Annual health screening'
    ],
    is_active: true
  },
  {
    name: 'Premium Annual',
    description: 'Complete yearly package with premium benefits',
    price: 599.99,
    duration: 'annual',
    features: [
      '24/7 gym access',
      'All equipment including premium machines',
      'Unlimited group fitness classes',
      'Locker room with towel service',
      'Monthly personal training session',
      'Guest passes (2/month)',
      'Quarterly body composition analysis',
      'Annual nutritional consultation'
    ],
    is_active: true
  },
  {
    name: 'Elite Annual',
    description: 'The ultimate yearly fitness package',
    price: 999.99,
    duration: 'annual',
    features: [
      '24/7 gym access',
      'VIP area access',
      'Unlimited group classes',
      'Premium locker room with amenities',
      'Bi-weekly personal training sessions',
      'Monthly nutritional consultation',
      'Priority booking',
      'Unlimited guest passes',
      'Annual health screening',
      'Fitness gear allowance'
    ],
    is_active: true
  }
];

export async function POST() {
  try {
    // Check if plans already exist
    const { data: existingPlans, error: checkError } = await supabase
      .from('membership_plans')
      .select('id')
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check existing plans', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingPlans && existingPlans.length > 0) {
      return NextResponse.json(
        { message: 'Membership plans already exist' },
        { status: 200 }
      );
    }

    // Insert membership plans
    const { data, error } = await supabase
      .from('membership_plans')
      .insert(membershipPlans)
      .select();

    if (error) {
      console.error('Error creating membership plans:', error);
      return NextResponse.json(
        { error: 'Failed to create membership plans', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Membership plans created successfully',
      plans: data
    });
  } catch (error) {
    console.error('API Error - POST /api/setup/membership-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}