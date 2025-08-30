// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import jwt from 'jsonwebtoken';

// const SECRET_KEY = process.env.JWT_SECRET!;

// const publicPaths = ['/login', '/registerUX', '/api/login', '/api/register'];

// export function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   if (publicPaths.some(path => pathname.startsWith(path))) {
//     return NextResponse.next();
//   }

//   const token = req.cookies.get('token')?.value;

//   if (!token) {
//     const loginUrl = new URL('/login', req.url);
//     return NextResponse.redirect(loginUrl);
//   }

//   try {
//     jwt.verify(token, SECRET_KEY);
//     return NextResponse.next();
//   } catch (err) {
//     const loginUrl = new URL('/login', req.url);
//     const res = NextResponse.redirect(loginUrl);
//     res.cookies.set('token', '', { path: '/', maxAge: 0 });
//     return res;
//   }
// }

// export const config = {
//   matcher: ['/homePage', '/clients/:path*', '/tasks/:path*'],
// };
