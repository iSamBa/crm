import { supabase } from '@/lib/supabase/client';

export async function testMemberAccess() {
  console.log('=== Testing Member Access ===');
  
  // Check authentication
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', session?.user?.id ? 'Authenticated' : 'Not authenticated');
  console.log('Session error:', sessionError);
  
  if (session?.user) {
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    
    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    console.log('User role data:', userData);
    console.log('User role error:', userError);
  }
  
  // Test direct member query
  console.log('Testing direct member query...');
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, first_name, last_name')
    .limit(5);
  
  console.log('Members query result:', { members, error: memberError });
  
  // Test with RLS bypass (if service role available)
  console.log('Testing member count...');
  const { count, error: countError } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });
  
  console.log('Member count result:', { count, error: countError });
  
  console.log('=== End Test ===');
}

// Call this function in the browser console to debug
// testMemberAccess();