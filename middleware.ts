import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET!;

// rutas públicas (no requieren login)
const publicPaths = ['/', '/login', '/registerUX', '/api/login', '/api/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // si la ruta es pública -> deja pasar
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // obtener token de cookies
  const token = req.cookies.get('token')?.value;

  if (!token) {
    // si no hay token -> redirige a login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // verificar token
    jwt.verify(token, SECRET_KEY);
    return NextResponse.next();
  } catch (err) {
    // si token inválido -> borrar cookie y mandar a login
    const loginUrl = new URL('/login', req.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('token', '', { path: '/', maxAge: 0 });
    return res;
  }
}

// definir qué rutas están protegidas
export const config = {
  matcher: [
    '/home/:path*',
    '/clients/:path*',
    '/tasks/:path*',
    '/calculadora/:path*', // si también quieres proteger calculadora
  ],
};
