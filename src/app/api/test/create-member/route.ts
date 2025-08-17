import { NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function POST() {
  try {
    console.log('Testing member creation...');
    
    // Test data that matches the form structure
    const testMemberData = {
      firstName: 'Test',
      lastName: 'Member',
      email: 'test.member@example.com',
      phone: '+1-555-0123',
      membershipStatus: 'active' as const,
      joinDate: new Date().toISOString().split('T')[0],
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+1-555-0456',
        relationship: 'Spouse'
      },
      medicalConditions: 'None',
      fitnessGoals: 'General fitness and weight loss',
      preferredTrainingTimes: ['morning', 'evening']
    };

    console.log('Attempting to create member with data:', testMemberData);

    const { data: member, error } = await memberService.createMember(testMemberData);

    if (error) {
      console.error('Member creation failed:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error,
          message: 'Failed to create test member',
          testData: testMemberData
        },
        { status: 400 }
      );
    }

    console.log('Member created successfully:', member);

    // Clean up - delete the test member
    if (member?.id) {
      const { success: deleteSuccess } = await memberService.deleteMember(member.id);
      console.log('Test member cleanup:', deleteSuccess ? 'successful' : 'failed');
    }

    return NextResponse.json({
      success: true,
      message: 'Member creation test successful',
      createdMember: member,
      testData: testMemberData
    });
  } catch (error) {
    console.error('Unexpected error during member creation test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}