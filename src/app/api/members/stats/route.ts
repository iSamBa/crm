import { NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function GET() {
  try {
    const { data: stats, error } = await memberService.getMemberStats();

    if (error) {
      return NextResponse.json(
        { error, message: 'Failed to fetch member statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('API Error - GET /api/members/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}