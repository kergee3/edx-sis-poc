import { Box, Typography } from '@mui/material';

interface HomePlaceholderProps {
  userName: string | null;
}

export default function HomePlaceholder({ userName }: HomePlaceholderProps) {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {userName ? `${userName} さん、ようこそ。` : 'ようこそ。'}
        文字情報基盤(MJ)の漢字を Web フォントとして表示するデモアプリです。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ここはホーム画面です。教育（証明書発行）・行政（証明書発行）の各機能はこれから開発します。
        （この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
