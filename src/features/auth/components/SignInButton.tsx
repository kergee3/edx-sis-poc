import { Button, Stack } from '@mui/material';
import { signInWithGoogle, signInWithLine } from '../actions';

interface SignInButtonProps {
  /** ボタンの並び。既定は縦並び。横並びにしたい場合は 'row'（狭い画面では折り返す）。 */
  direction?: 'row' | 'column';
}

export default function SignInButton({ direction = 'column' }: SignInButtonProps) {
  return (
    <Stack
      direction={direction}
      spacing={1.5}
      useFlexGap
      sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
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
