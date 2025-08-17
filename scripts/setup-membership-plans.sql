-- Insert sample membership plans
INSERT INTO membership_plans (name, description, price, duration, features, is_active) VALUES
(
  'Basic Monthly',
  'Perfect for getting started with your fitness journey',
  29.99,
  'monthly',
  ARRAY['Gym access during regular hours', 'Basic equipment use', 'Locker room access', 'Free initial fitness assessment'],
  true
),
(
  'Premium Monthly',
  'Enhanced experience with additional perks',
  59.99,
  'monthly',
  ARRAY['24/7 gym access', 'All equipment including premium machines', 'Group fitness classes', 'Locker room with towel service', 'Free personal training consultation', 'Guest passes (2/month)'],
  true
),
(
  'Elite Monthly',
  'Ultimate fitness experience with premium services',
  99.99,
  'monthly',
  ARRAY['24/7 gym access', 'VIP area access', 'Unlimited group classes', 'Premium locker room with amenities', 'Monthly personal training session', 'Nutritional consultation', 'Priority booking', 'Unlimited guest passes'],
  true
),
(
  'Basic Quarterly',
  'Three months of basic access with savings',
  79.99,
  'quarterly',
  ARRAY['Gym access during regular hours', 'Basic equipment use', 'Locker room access', 'Free initial fitness assessment', 'Quarterly progress review'],
  true
),
(
  'Premium Quarterly',
  'Three months of premium features at a discounted rate',
  159.99,
  'quarterly',
  ARRAY['24/7 gym access', 'All equipment including premium machines', 'Group fitness classes', 'Locker room with towel service', 'Free personal training consultation', 'Guest passes (2/month)', 'Quarterly body composition analysis'],
  true
),
(
  'Basic Annual',
  'Full year of fitness with maximum savings',
  299.99,
  'annual',
  ARRAY['Gym access during regular hours', 'Basic equipment use', 'Locker room access', 'Free initial fitness assessment', 'Quarterly progress reviews', 'Annual health screening'],
  true
),
(
  'Premium Annual',
  'Complete yearly package with premium benefits',
  599.99,
  'annual',
  ARRAY['24/7 gym access', 'All equipment including premium machines', 'Unlimited group fitness classes', 'Locker room with towel service', 'Monthly personal training session', 'Guest passes (2/month)', 'Quarterly body composition analysis', 'Annual nutritional consultation'],
  true
),
(
  'Elite Annual',
  'The ultimate yearly fitness package',
  999.99,
  'annual',
  ARRAY['24/7 gym access', 'VIP area access', 'Unlimited group classes', 'Premium locker room with amenities', 'Bi-weekly personal training sessions', 'Monthly nutritional consultation', 'Priority booking', 'Unlimited guest passes', 'Annual health screening', 'Fitness gear allowance'],
  true
);