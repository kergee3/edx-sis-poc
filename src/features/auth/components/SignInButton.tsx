import { Button, Stack, Typography } from '@mui/material';
import { signInWithGoogle, signInWithLine, signInAsGuestAction } from '../actions';

interface SignInButtonProps {
  /** ボタンの並び。既定は縦並び。横並びにしたい場合は 'row'（狭い画面では折り返す）。 */
  direction?: 'row' | 'column';
}

export default function SignInButton({ direction = 'column' }: SignInButtonProps) {
  return (
    <Stack spacing={1}>
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
        <form action={signInAsGuestAction}>
          <Button type="submit" variant="outlined" sx={{ textTransform: 'none' }}>
            ゲストとして始める
          </Button>
        </form>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        ゲストはアカウント登録なしですぐ試せます（データはこのブラウザだけに保存され、他の端末には引き継げません）。
      </Typography>
    </Stack>
  );
}
