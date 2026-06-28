import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AppFooter from '@/components/layout/AppFooter';
import GakureiboImport from '@/features/interop/components/GakureiboImport';
import SignInButton from '@/features/auth/components/SignInButton';
import { listGakureiboRecords, type GakureiboRecord } from '@/server/services/gakureibo-import';
import { logger } from '@/lib/logging';
import { auth } from '@/server/auth/config';

export default async function InteropPage() {
  const session = await auth();

  let records: GakureiboRecord[] | null = null;
  let loadFailed = false;
  if (session?.user?.id) {
    try {
      records = await listGakureiboRecords(session.user.id);
    } catch (err) {
      loadFailed = true;
      logger.error('interop.list_gakureibo.failed', {
        userId: session.user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SyncAltIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            データ連携(工事中)
          </Typography>
        </Box>

        {session?.user?.id ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              学齢簿（PoC: マスタ名簿）から 1 件ずつ取り込み、正式氏名（MJ文字）の「氏（姓）」を
              JIS X 0213 の文字へ対応付けて表示名に保存します。0213 にない字は代表字・異体字の候補から選びます。
            </Typography>
            {loadFailed ? (
              <Alert severity="error">学齢簿データの読み込みに失敗しました。</Alert>
            ) : (
              <GakureiboImport records={records ?? []} />
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              データ連携を利用するにはサインインが必要です。
            </Typography>
            <SignInButton />
          </Box>
        )}

        <AppFooter />
      </CardContent>
    </Card>
  );
}
