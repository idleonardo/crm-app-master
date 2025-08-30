import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const body: { token: string; newPassword: string } = await req.json();
    const { token, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log("Hola Mundo")

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExp: null },
    });

    // Agregamos la URL de redirección al login
    return NextResponse.json(
      { message: 'Contraseña actualizada', redirect: '/' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error al actualizar la contraseña' },
      { status: 500 }
    );
  }
}

