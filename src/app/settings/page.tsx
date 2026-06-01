'use client';

import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import {
  useSettings,
  type NavigationPosition,
} from '@/contexts/settings-context';
import AppFooter from '@/components/layout/AppFooter';

export default function SettingsPage() {
  const { navigationPosition, setNavigationPosition } = useSettings();

  const handleNavChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNavigationPosition(event.target.value as NavigationPosition);
  };

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

        <Box component="section">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ViewSidebarIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              Navigation Bar の位置
            </Typography>
          </Box>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ display: 'none' }}>
              Navigation Bar の位置
            </FormLabel>
            <RadioGroup
              aria-label="navigation-position"
              name="navigation-position"
              value={navigationPosition}
              onChange={handleNavChange}
            >
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">自動</Typography>
                    <Typography variant="caption" color="text.secondary">
                      デバイスと画面の向きに応じて最適なナビゲーションを表示
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="top"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">上部</Typography>
                    <Typography variant="caption" color="text.secondary">
                      画面上部に Tab 形式のナビゲーション
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="left"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">左横</Typography>
                    <Typography variant="caption" color="text.secondary">
                      画面左側に Sidebar
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="bottom"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">下部</Typography>
                    <Typography variant="caption" color="text.secondary">
                      画面下部に Bottom Navigation
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <AppFooter />
      </CardContent>
    </Card>
  );
}
