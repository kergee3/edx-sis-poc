import { Box, Card, CardContent, Typography } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountPanel from '@/features/auth/components/AccountPanel';

export default function AccountPage() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountCircleIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ mb: 0 }}>
            アカウント
          </Typography>
        </Box>
        <AccountPanel />
      </CardContent>
    </Card>
  );
}
