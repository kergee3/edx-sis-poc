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
  Link,
} from '@mui/material';
import {
  PhoneIphone,
  Tablet,
  Computer,
  Info as InfoIcon,
  Home as HomeIcon,
  PeopleAlt as PeopleAltIcon,
  SyncAlt as SyncAltIcon,
} from '@mui/icons-material';
import AppFooter from '@/components/layout/AppFooter';

const techStack = [
  {
    title: 'フロントエンド',
    items: ['Next.js', 'React', 'TypeScript', 'Material-UI'],
  },
  { title: 'データベース', items: ['Drizzle ORM', 'Turso / SQLite'] },
  { title: '認証', items: ['Auth.js', 'Google', 'LINE'] },
  { title: 'Web フォント', items: ['IPAmjexMincho'] },
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
            SIS-PoC（Student Information System - Proof of Concept）は、
            <Link href="https://ipamjexmincho.shumy.app/" target="_blank" rel="noopener noreferrer">
              IPAmjexMincho Web フォント
            </Link>
            を活かした校務支援システムの実証実験（PoC）です。小さな離島の小さな中学校を舞台に、
            ログインした校長先生がワンオペで全校生徒の先生と事務を兼ねて校務を行います
            （生徒定員 25 名・各学年 4 名で初期 12 名が在籍）。氏名に現れる、
            JIS X 0213 外の文字情報基盤の文字も正しく表示するのが眼目です。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            認証（Google / LINE）・ログイン履歴・右上のユーザーメニューは実装済みです。
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
                <HomeIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="ホーム"
                secondary="アプリの位置づけと説明。ログイン後は校長として校務支援システムを操作します。"
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <PeopleAltIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="生徒一覧"
                secondary="生徒名簿の表示・管理（転入・転出・編集）、在学証明書・成績証明書の発行。氏名は IPAmjexMincho で表示します。（一覧表示を実装済み。管理・証明書は開発中）"
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <SyncAltIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="データ連携"
                secondary="学齢簿からのインポート、OneRoster に沿ったインポート・エクスポート。（開発中）"
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
