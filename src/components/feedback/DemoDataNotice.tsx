'use client';

import { Alert, AlertTitle, type SxProps, type Theme } from '@mui/material';
import { useSettings } from '@/contexts/settings-context';

/** 日本語と英語の区切り（スラッシュ）。読み上げでは不要なので aria-hidden にする。 */
function BilingualSeparator() {
  return (
    <span aria-hidden="true" style={{ margin: '0 0.6em', opacity: 0.8 }}>
      /
    </span>
  );
}

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
      {/* 海外の視聴者・審査担当にも伝わるよう、各行の横に同じ意味の英語を併記する。 */}
      <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
        表示されている名簿はすべて架空のテストデータです。
        <BilingualSeparator />
        <span lang="en">All roster data shown here is fictitious test data.</span>
      </AlertTitle>
      画面内の氏名・学校名・その他の個人情報はすべて架空であり、実在する人物とは関係ありません。
      <BilingualSeparator />
      <span lang="en">
        All names, school names, and other personal information on this screen are fictitious and
        have no connection to any real person.
      </span>
    </Alert>
  );
}
