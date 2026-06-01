import { Box, Card, CardContent, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AppFooter from '@/components/layout/AppFooter';
import HomePlaceholder from '@/features/home/components/HomePlaceholder';
import { auth } from '@/server/auth/config';

export default async function HomePage() {
  const session = await auth();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HomeIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            ホーム
          </Typography>
        </Box>

        <HomePlaceholder userName={session?.user?.name ?? null} />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
