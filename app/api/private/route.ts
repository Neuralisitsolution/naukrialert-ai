import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const role = (session.user as any).role;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (role === 'PRIVATE_MEMBER') {
      const privateMemberId = (session.user as any).privateMemberId;
      if (!privateMemberId) {
        return NextResponse.json({ error: 'No private member linked to this account' }, { status: 404 });
      }

      const member = await prisma.privateMember.findUnique({
        where: { id: privateMemberId },
      });

      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      return NextResponse.json(member);
    }

    if (role !== 'OWNER') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const members = await prisma.privateMember.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        trips: {
          select: { totalAmount: true, date: true },
        },
        payments: {
          select: { amount: true, date: true },
        },
      },
    });

    const result = members.map((member) => {
      const thisMonthCredit = member.trips
        .filter((t) => t.date >= monthStart && t.date < monthEnd)
        .reduce((sum, t) => sum + t.totalAmount, 0);

      const thisMonthPayments = member.payments
        .filter((p) => p.date >= monthStart && p.date < monthEnd)
        .reduce((sum, p) => sum + p.amount, 0);

      const totalTrips = member.trips.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalPayments = member.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalOutstanding = totalTrips - totalPayments;

      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        address: member.address,
        notes: member.notes,
        isActive: member.isActive,
        createdAt: member.createdAt,
        thisMonthCredit,
        thisMonthPayments,
        totalOutstanding,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Private GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch private members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if ((session.user as any).role !== 'OWNER') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, address, notes, email, password } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let userId: string | null = null;

    // Create a login account if email and password are provided
    if (email?.trim() && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (existingUser) {
        return NextResponse.json({ error: 'This email is already in use' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          role: 'PRIVATE_MEMBER',
          phone: phone?.trim() || null,
        },
      });
      userId = user.id;
    }

    const member = await prisma.privateMember.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        userId,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Private POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email is already linked to another member' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create private member' },
      { status: 500 }
    );
  }
}
