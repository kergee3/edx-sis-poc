import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/config';

export default async function EnvLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id) redirect('/home');

  return children;
}
