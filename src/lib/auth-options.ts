/**
 * NextAuth.js Configuración - Autenticación para el SaaS de Huella de Carbono
 * 
 * Implementa login con email + password (hash bcrypt en users.csv)
 * Roles: admin (todo), editor (crear/editar), viewer (solo lectura), auditor (ver log)
 */

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { readCSV } from '@/lib/db/csv-handler';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const users = await readCSV<any>('users');
        const user = users.find(
          (u: any) => u.email === credentials.email && u.activo === true
        );
        
        if (!user) return null;
        
        // Para demo: aceptar 'demo123' como password
        const isValidPassword =
          credentials.password === 'demo123' ||
          (user.password_hash && await bcrypt.compare(credentials.password, user.password_hash));
        
        if (!isValidPassword) return null;
        
        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          role: user.rol,
          orgId: user.organizacion_id,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
        token.plan = (user as any).plan;
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).orgId = token.orgId;
        (session.user as any).plan = token.plan;
        (session.user as any).userId = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET || 'huella-carbono-secret-dev-key-2024',
};
