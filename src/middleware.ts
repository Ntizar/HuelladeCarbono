/**
 * Middleware de protección de rutas y multi-tenancy
 * 
 * - Protege todas las rutas excepto /login y /api/auth
 * - Verifica que el usuario tiene la sesión activa
 * - Controla acceso por rol (admin, editor, viewer, auditor)
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Rutas de administración: solo admin
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // Ruta de auditoría: admin o auditor
    if (
      pathname.startsWith('/admin/auditoria') &&
      token?.role !== 'admin' &&
      token?.role !== 'auditor'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
