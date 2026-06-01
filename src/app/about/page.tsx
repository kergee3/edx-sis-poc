'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material';
import {
  PhoneIphone,
  Tablet,
  Computer,
  Info as InfoIcon,
  Checklist as ChecklistIcon,
  Repeat as RepeatIcon,
  WorkOutline as WorkOutlineIcon,
} from '@mui/icons-material';
import AppFooter from '@/components/layout/AppFooter';

const techStack = [
  {
    title: 'フロントエンド',
    items: ['Next.js', 'React', 'TypeScript', 'Material-UI'],
  },
  { title: 'データベース', items: ['Drizzle ORM', 'Turso / SQLite'] },
  { title: '認証', items: ['Auth.js', 'Google', 'LINE'] },
  { title: 'インフラ', items: ['Vercel'] },
] as const;

export default function AboutPage() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ fontSize: 32, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
            About
          </Typography>
        </Box>

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            概要
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            todo は、いろいろな「やることリスト」を管理する Web アプリです。
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            主な機能
          </Typography>
          <List>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <ChecklistIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="やること"
                secondary="期限・優先度・タグを付けて日々のタスクを管理。"
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <RepeatIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="いつもの"
                secondary="毎日・曜日別・定期的など、習慣化した行動の管理と実施記録。"
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <WorkOutlineIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="もちもの"
                secondary="旅行・出勤などの持ち物セットをチェックボックスのリストで管理。"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            対応デバイス
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Computer />
              </ListItemIcon>
              <ListItemText primary="Windows PC / macOS / Chromebook" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PhoneIphone />
              </ListItemIcon>
              <ListItemText primary="iPhone / Android スマートフォン" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Tablet />
              </ListItemIcon>
              <ListItemText primary="iPad / Android タブレット" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            使用技術
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {techStack.map((group) => (
              <Box key={group.title}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {group.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {group.items.map((label) => (
                    <Chip key={label} label={label} color="primary" />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <AppFooter />
      </CardContent>
    </Card>
  );
}
