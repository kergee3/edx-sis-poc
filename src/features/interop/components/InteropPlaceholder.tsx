import { Box, Typography } from '@mui/material';

export default function InteropPlaceholder() {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        他システムとのデータ連携を行います。学齢簿からのインポートや、OneRoster
        （名簿連携の国際規格／日本向け Japan Profile）に沿ったインポート・エクスポートに対応します。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        連携の設計方針は docs/design/ の調査ドキュメントに基づきます。
        （この機能はこれから開発します。この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
