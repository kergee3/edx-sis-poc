import { Box, Typography } from '@mui/material';

interface HomePlaceholderProps {
  userName: string | null;
}

export default function HomePlaceholder({ userName }: HomePlaceholderProps) {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        SIS-PoC（Student Information System - Proof of Concept）は、校務支援システムの実証実験アプリです。
        文字情報基盤(MJ)の漢字を扱う IPAmjexMincho Web フォントを活かし、
        氏名に現れる、JIS X 0213 外の文字情報基盤の文字も正しく表示します。
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {userName ? `${userName} さん、ようこそ。` : 'ようこそ。'}
        ログインすると、あなたは小さな離島にある小さな中学校の校長先生になります。
        校長はワンオペで全校生徒に対する先生と事務を兼ね、校務を行います
        （生徒定員 25 名・各学年 4 名で初期 12 名が在籍）。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        「生徒一覧」で名簿の管理（転入・転出・編集）や在学証明書・成績証明書の発行を、
        「データ連携」で学齢簿インポートや OneRoster の入出力を行います。
        （各機能はこれから開発します。この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
