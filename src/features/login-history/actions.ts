'use server';

import { auth } from '@/server/auth/config';
import { enrichLatestLogin } from '@/server/services/login-history';
import { clientEnrichmentSchema, type ClientEnrichment } from './schema/enrichment';

export async function enrichLatestLoginAction(input: ClientEnrichment): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const parsed = clientEnrichmentSchema.safeParse(input);
  if (!parsed.success) return;

  await enrichLatestLogin(session.user.id, parsed.data);
}
