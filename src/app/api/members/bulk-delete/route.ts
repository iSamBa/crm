import { NextRequest, NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid member IDs provided' },
        { status: 400 }
      );
    }

    const { success, error } = await memberService.deleteMembers(ids);

    if (!success) {
      return NextResponse.json(
        { error, message: 'Failed to delete members' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${ids.length} members` 
    });
  } catch (error) {
    console.error('API Error - POST /api/members/bulk-delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}