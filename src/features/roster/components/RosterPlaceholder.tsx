import { Box, Typography } from '@mui/material';

export default function RosterPlaceholder() {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        氏名・住所・学歴などの名簿情報を管理する機能です。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        文字情報基盤(MJ)のフォントを使って氏名・住所などを表示します。
        （この機能はこれから開発します。この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
