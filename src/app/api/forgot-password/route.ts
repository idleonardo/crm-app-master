import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import crypto from "crypto";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Recuperación de contraseña",
      html: `<p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    return NextResponse.json({ message: "Correo de recuperación enviado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en forgot-password" }, { status: 500 });
  }
}
