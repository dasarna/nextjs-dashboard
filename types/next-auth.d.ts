// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role?: 'admin' | 'web_user' | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin' | 'web_user';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'admin' | 'web_user';
  }
}
