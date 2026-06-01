import { Box, Card, CardContent, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PageContentSkeleton from '@/components/layout/PageContentSkeleton';

export default function HomeLoading() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HomeIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            ホーム
          </Typography>
        </Box>
        <PageContentSkeleton rows={3} />
      </CardContent>
    </Card>
  );
}
