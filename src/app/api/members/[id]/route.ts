import { NextRequest, NextResponse } from 'next/server';
import { memberService } from '@/lib/services/member-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: member, error } = await memberService.getMemberById(id);

    if (error) {
      return NextResponse.json(
        { error, message: 'Failed to fetch member' },
        { status: error.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('API Error - GET /api/members/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = { ...body, id };
    
    const { data: member, error } = await memberService.updateMember(updateData);

    if (error) {
      return NextResponse.json(
        { error, message: 'Failed to update member' },
        { status: 400 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('API Error - PUT /api/members/[id]:', error);
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
    const { data, error } = await memberService.deleteMember(id);

    if (error || !data?.success) {
      return NextResponse.json(
        { error: error || 'Failed to delete member', message: 'Failed to delete member' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error - DELETE /api/members/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}