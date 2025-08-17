import { NextRequest, NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      searchTerm: searchParams.get('search') || undefined,
      joinDateFrom: searchParams.get('joinDateFrom') || undefined,
      joinDateTo: searchParams.get('joinDateTo') || undefined,
      hasEmergencyContact: searchParams.get('hasEmergencyContact') ? 
        searchParams.get('hasEmergencyContact') === 'true' : undefined,
    };

    const { data: members, error } = await memberService.getMembers(filters);

    if (error) {
      return NextResponse.json(
        { error, message: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('API Error - GET /api/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data: member, error } = await memberService.createMember(body);

    if (error) {
      return NextResponse.json(
        { error, message: 'Failed to create member' },
        { status: 400 }
      );
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('API Error - POST /api/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}