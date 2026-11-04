'use client';

import { Alert, AlertTitle, type SxProps, type Theme } from '@mui/material';
import { useSettings } from '@/contexts/settings-context';

interface DemoDataNoticeProps {
  sx?: SxProps<Theme>;
}

/**
 * 「表示中の名簿・個人情報はすべて架空のテストデータ」である旨の注意書き。
 * 配信（YouTube Live など）でのデモ時に、実在の個人情報と誤認されないよう
 * 各画面のタイトル直下と、個人情報を表示するダイアログに目立つ形で出す。
 * 表示する／しないは設定ページで切り替える（localStorage 管理。既定は表示しない）。
 */
export default function DemoDataNotice({ sx }: DemoDataNoticeProps) {
  const { showDemoDataNotice } = useSettings();

  if (!showDemoDataNotice) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      variant="filled"
      role="note"
      sx={[{ mb: 2, fontWeight: 'bold' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
        表示されている名簿はすべて架空のテストデータです。
      </AlertTitle>
      画面内の氏名・学校名・その他の個人情報はすべて架空であり、実在する人物とは関係ありません。
    </Alert>
  );
}
