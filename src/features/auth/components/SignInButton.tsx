import { Button, Stack } from '@mui/material';
import { signInWithGoogle, signInWithLine } from '../actions';

export default function SignInButton() {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <form action={signInWithGoogle}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ textTransform: 'none' }}
        >
          Google でログイン
        </Button>
      </form>
      <form action={signInWithLine}>
        <Button
          type="submit"
          variant="contained"
          sx={{
            textTransform: 'none',
            bgcolor: '#06C755',
            color: '#fff',
            '&:hover': { bgcolor: '#05B14C' },
          }}
        >
          LINE でログイン
        </Button>
      </form>
    </Stack>
  );
}
