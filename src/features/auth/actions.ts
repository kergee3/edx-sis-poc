'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/server/auth/config';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/home' });
}

export async function signInWithLine() {
  await signIn('line', { redirectTo: '/home' });
}

export async function signInAsGuestAction() {
  await signIn('guest', { redirectTo: '/home' });
}

export async function signOutAction() {
  await signOut({ redirect: false });
  // signOut の redirectTo はソフトナビゲーションになり、RootLayout のキャッシュ
  // (= UserMenu に渡る user prop) が古い認証状態のまま残るため、明示的に layout
  // 全体を revalidate してからリダイレクトする。
  revalidatePath('/', 'layout');
  redirect('/home');
}
