import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import AppFooter from '@/components/layout/AppFooter';
import SignInButton from '@/features/auth/components/SignInButton';
import SchoolProfileForm from '@/features/settings/components/SchoolProfileForm';
import NavigationPositionSetting from '@/features/settings/components/NavigationPositionSetting';
import { auth } from '@/server/auth/config';
import { getSchoolProfileForUser } from '@/server/services/user-preferences';

export default async function SettingsPage() {
  const session = await auth();
  const profile = session?.user?.id
    ? await getSchoolProfileForUser(session.user.id, session.user.name ?? null)
    : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            設定
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          アプリケーションの各種設定を行います
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box component="section" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              学校情報
            </Typography>
          </Box>
          {profile ? (
            <SchoolProfileForm initial={profile} />
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                学校情報を設定するにはサインインが必要です。
              </Typography>
              <SignInButton />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <NavigationPositionSetting />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
