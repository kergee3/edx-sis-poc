import { Box, Typography } from '@mui/material';

export default function StudentsPlaceholder() {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        在籍する生徒の一覧を表示します。名簿への追加（転入）・削除（転出）、一覧内での情報編集、
        在学証明書・成績証明書の発行ができます。
      </Typography>
      <Typography variant="body2" color="text.secondary">
        氏名は IPAmjexMincho Web フォントで表示するため、MJ特有文字（戸籍漢字等）も正しく表示されます。
        （この機能はこれから開発します。この画面は仮の説明です）
      </Typography>
    </Box>
  );
}
