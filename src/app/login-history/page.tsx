import { Box, Card, CardContent, Typography } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { auth } from '@/server/auth/config';
import { listRecentLoginsForUser } from '@/server/services/login-history';
import { toView } from '@/features/login-history/services/format';
import LoginHistoryTable from '@/features/login-history/components/LoginHistoryTable';
import LoginHistorySignInPrompt from '@/features/login-history/components/LoginHistorySignInPrompt';

export default async function LoginHistoryPage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HistoryIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ mb: 0 }}>
            ログイン履歴
          </Typography>
        </Box>

        {session?.user?.id ? (
          <LoginHistoryTable
            items={(await listRecentLoginsForUser(session.user.id)).map(toView)}
          />
        ) : (
          <LoginHistorySignInPrompt />
        )}
      </CardContent>
    </Card>
  );
}
