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
import DefaultRosterSetting from '@/features/settings/components/DefaultRosterSetting';
import DisplayFontSetting from '@/features/settings/components/DisplayFontSetting';
import NavigationPositionSetting from '@/features/settings/components/NavigationPositionSetting';
import MjMappingSourceSetting from '@/features/settings/components/MjMappingSourceSetting';
import { auth } from '@/server/auth/config';
import {
  getSchoolProfileForUser,
  getMjMappingSourceForUser,
} from '@/server/services/user-preferences';
import { listRosterSheetNames } from '@/server/services/roster-master';

export default async function SettingsPage() {
  const session = await auth();
  const profile = session?.user?.id
    ? await getSchoolProfileForUser(session.user.id, session.user.name ?? null)
    : null;
  const mjMappingSource = session?.user?.id
    ? await getMjMappingSourceForUser(session.user.id)
    : null;

  // 名簿初期化のシート選択肢（先頭が既定）。読み込みに失敗しても設定ページは表示する。
  let rosterSheetNames: string[] = [];
  if (profile) {
    try {
      rosterSheetNames = await listRosterSheetNames();
    } catch {
      rosterSheetNames = [];
    }
  }

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

        {profile && (
          <>
            <Divider sx={{ my: 3 }} />
            <DefaultRosterSetting sheetNames={rosterSheetNames} />
          </>
        )}

        {mjMappingSource && (
          <>
            <Divider sx={{ my: 3 }} />
            <MjMappingSourceSetting initial={mjMappingSource} />
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <DisplayFontSetting />

        <Divider sx={{ my: 3 }} />

        <NavigationPositionSetting />

        <AppFooter />
      </CardContent>
    </Card>
  );
}
