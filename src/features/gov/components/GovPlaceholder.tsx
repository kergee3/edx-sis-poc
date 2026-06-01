import { Box, Typography } from '@mui/material';

export default function GovPlaceholder() {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        住民票・出生証明書など、行政関連の証明書を発行する機能です。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        文字情報基盤(MJ)のフォントを使って氏名・住所などを表示します。
        （この機能はこれから開発します。この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
