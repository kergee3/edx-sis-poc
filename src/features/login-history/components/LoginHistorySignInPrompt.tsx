import { Box, Typography } from '@mui/material';
import SignInButton from '@/features/auth/components/SignInButton';

export default function LoginHistorySignInPrompt() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        ログイン履歴を表示するにはサインインが必要です。
      </Typography>
      <SignInButton />
    </Box>
  );
}
