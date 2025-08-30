import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET!;

function getTokenFromRequest(req: NextRequest) {
  const cookie = req.cookies.get('token');
  if (cookie?.value) return cookie.value;

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];

  return null;
}

function verifyToken(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET_KEY) as { userId: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { client: { userId: user.userId } },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { title, description, clientId } = await req.json();
  const task = await prisma.task.create({
    data: { title, description, clientId },
  });

  return NextResponse.json(task, { status: 201 });
}
