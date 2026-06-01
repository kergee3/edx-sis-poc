import { Button } from '@mui/material';
import { signOutAction } from '../actions';

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outlined" color="secondary">
        サインアウト
      </Button>
    </form>
  );
}
