import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import LINE from 'next-auth/providers/line';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getTursoDb } from '@/server/db/turso/client';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/server/db/turso/schema/auth';
import { env } from '@/lib/env';
import { recordLogin } from '@/server/services/login-history';
import { insertGuestUser } from '@/server/repositories/users';

/**
 * Auth.js v5 の構成はリクエスト時に評価される関数として渡す。
 * env / DB アクセスを import 時に発火させず、ビルド時のエラーを避けるため。
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const config: NextAuthConfig = {
    adapter: DrizzleAdapter(getTursoDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    // ローカル/セルフホストでホスト検証を通すため明示的に信頼する。
    // Vercel 上では自動で true になるが、ローカル (localhost) では既定で false のため
    // 未設定だと UntrustedHost エラーになる。
    trustHost: true,
    session: { strategy: 'jwt' },
    secret: env.AUTH_SECRET,
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
      LINE({
        clientId: env.AUTH_LINE_ID,
        clientSecret: env.AUTH_LINE_SECRET,
      }),
      // ワンクリックでアカウント登録なしに試せる「ゲストログイン」。OAuth と違い
      // 外部IDが無いため、authorize() 内で users 行を直接払い出す
      // （Credentials プロバイダはアダプタの createUser を自動実行しない）。
      Credentials({
        id: 'guest',
        name: 'ゲスト',
        credentials: {},
        async authorize() {
          const guest = await insertGuestUser();
          return { id: guest.id, name: guest.name, email: null, image: null, isGuest: true };
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.isGuest = user.isGuest ?? false;
        }
        return token;
      },
      session({ session, token }) {
        if (token.id && session.user) {
          session.user.id = token.id as string;
          session.user.isGuest = Boolean(token.isGuest);
        }
        return session;
      },
    },
    events: {
      async signIn({ user, account }) {
        if (user?.id) {
          await recordLogin(user.id, account?.provider ?? null);
        }
      },
    },
  };
  return config;
});
