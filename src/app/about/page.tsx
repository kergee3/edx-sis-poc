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
} from '@mui/icons-material';
import AppFooter from '@/components/layout/AppFooter';

const techStack = [
  {
    title: 'フロントエンド',
    items: ['Next.js', 'React', 'TypeScript', 'Material-UI'],
  },
  { title: 'データベース', items: ['Drizzle ORM', 'Turso / SQLite'] },
  { title: '認証', items: ['Auth.js', 'Google', 'LINE'] },
  { title: 'Web フォント', items: ['IPAmjexMincho', 'Noto Sans JP', 'Noto Serif JP'] },
  { title: 'インフラ', items: ['Vercel'] },
] as const;

/**
 * 外部参照している技術仕様の一次資料。詳細な索引（版・取得日・ライセンス等）は
 * docs/design/external-references.md を参照。リンクは deep file ではなく
 * 掲載元ページを優先（原典の最新版を辿れるように）。
 */
const referencedSpecs = [
  {
    name: '就学事務システム（学齢簿編製等）標準仕様書【第4.0版】',
    issuer: '文部科学省',
    url: 'https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1309979_00014.htm',
  },
  {
    name: '初等中等教育におけるシステム間連携のための相互運用標準モデル Ver.6.00',
    issuer: 'ICT CONNECT 21',
    url: 'https://ictconnect21.jp/document/eportal/',
  },
  {
    name: 'OneRoster Japan Profile',
    issuer: '一般社団法人 日本1EdTech協会',
    url: 'https://www.1edtechjapan.org/orjpp',
  },
  {
    name: 'MJ文字情報一覧表',
    issuer: '文字情報技術促進協議会（IPA）',
    url: 'https://moji.or.jp/mojikiban/mjlist/',
  },
  {
    name: 'MJ縮退マップ',
    issuer: '文字情報技術促進協議会（IPA）',
    url: 'https://moji.or.jp/mojikiban/map/',
  },
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
                secondary="生徒名簿の表示・管理（転入・転出・編集）、在学証明書の発行、表示名（姓）の JIS X 0213 マッピング、OneRoster 出力。氏名は IPAmjexMincho で表示します。"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            参照技術仕様
          </Typography>
          <Box component="ul" sx={{ pl: 3, my: 1 }}>
            {referencedSpecs.map((spec) => (
              <Typography key={spec.name} component="li" variant="body2" sx={{ mb: 1 }}>
                <Link href={spec.url} target="_blank" rel="noopener noreferrer">
                  {spec.name}
                </Link>
                <Typography component="span" color="text.secondary">
                  {' '}— {spec.issuer}
                </Typography>
              </Typography>
            ))}
          </Box>
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

        <AppFooter />
      </CardContent>
    </Card>
  );
}
