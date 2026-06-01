import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import HistoryIcon from '@mui/icons-material/History';
import { auth } from '@/server/auth/config';
import SignInButton from './SignInButton';
import SignOutButton from './SignOutButton';

export default async function AccountPanel() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          サインインしていません。
        </Typography>
        <SignInButton />
      </Box>
    );
  }

  const { user } = session;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={user.image ?? undefined} alt={user.name ?? 'user'} sx={{ width: 56, height: 56 }}>
          {user.name?.[0] ?? user.email?.[0] ?? '?'}
        </Avatar>
        <Box>
          <Typography variant="h6">{user.name ?? '(名前なし)'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email ?? ''}
          </Typography>
        </Box>
      </Stack>

      <Divider />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Link href="/login-history" style={{ textDecoration: 'none' }}>
          <Button component="span" variant="outlined" startIcon={<HistoryIcon />}>
            ログイン履歴へ
          </Button>
        </Link>
        <SignOutButton />
      </Stack>
    </Stack>
  );
}
