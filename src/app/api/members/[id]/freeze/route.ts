import { NextRequest, NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await memberService.freezeMembership(id);

    if (error || !data?.success) {
      return NextResponse.json(
        { error: error || 'Failed to freeze membership', message: 'Failed to freeze membership' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Membership frozen successfully' 
    });
  } catch (error) {
    console.error('API Error - POST /api/members/[id]/freeze:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await memberService.unfreezeMembership(id);

    if (error || !data?.success) {
      return NextResponse.json(
        { error: error || 'Failed to unfreeze membership', message: 'Failed to unfreeze membership' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Membership unfrozen successfully' 
    });
  } catch (error) {
    console.error('API Error - DELETE /api/members/[id]/freeze:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}