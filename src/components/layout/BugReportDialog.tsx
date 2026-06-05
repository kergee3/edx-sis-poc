'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { submitBugReportAction, type SubmitBugReportError } from '@/features/bug-report/actions';

export interface BugReportDialogProps {
  open: boolean;
  /** ボタン側でキャプチャ済みの JPEG Blob (失敗時は null) */
  screenshot: Blob | null;
  /** プレビュー用のオブジェクト URL (screenshot と対) */
  screenshotPreviewUrl: string | null;
  /** キャプチャ自体が失敗した場合のメッセージ。null なら表示しない */
  captureError: string | null;
  onClose: () => void;
}

const ERROR_MESSAGES: Record<SubmitBugReportError, string> = {
  unauthorized: 'ログインが必要です。',
  invalid_input: '入力内容に誤りがあります。',
  github_failed: 'GitHub への登録に失敗しました。時間をおいて再試行してください。',
  unknown: '不明なエラーが発生しました。',
};

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; issueUrl: string; issueNumber: number }
  | { status: 'error'; message: string };

export default function BugReportDialog({
  open,
  screenshot,
  screenshotPreviewUrl,
  captureError,
  onClose,
}: BugReportDialogProps) {
  const [kind, setKind] = useState<'bug' | 'enhancement'>('bug');
  const [body, setBody] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });

  const busy = submit.status === 'submitting';
  const trimmedBody = body.trim();
  const canSubmit = !busy && trimmedBody.length > 0 && trimmedBody.length <= 2000;

  const handleClose = () => {
    if (busy) return;
    setKind('bug');
    setBody('');
    setSubmit({ status: 'idle' });
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmit({ status: 'submitting' });

    let screenshotBlobUrl: string | null = null;
    if (screenshot) {
      // スクショ送信は best-effort。Blob への直 PUT がブロック/失敗すると
      // @vercel/blob は既定で 10 回リトライ(指数バックオフ ≈ 17 分)し UI が固まる。
      // 15 秒で abort() してテキストのみの起票にフォールバックする。
      // 注: AbortSignal.timeout() は "TimeoutError" を投げ SDK にリトライ継続されるため不可。
      //     controller.abort()（理由なし）の "AbortError" でないとリトライが止まらない。
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const filename = `bug-reports/${crypto.randomUUID()}.jpg`;
        const result = await upload(filename, screenshot, {
          access: 'public',
          handleUploadUrl: '/api/bug-report/upload',
          contentType: 'image/jpeg',
          abortSignal: controller.signal,
        });
        screenshotBlobUrl = result.url;
      } catch (err) {
        // Blob 失敗・タイムアウト時はスクショなしで Issue だけ作る
        console.error('[BugReport] blob upload failed:', err);
        screenshotBlobUrl = null;
      } finally {
        clearTimeout(timer);
      }
    }

    const result = await submitBugReportAction({
      kind,
      body: trimmedBody,
      screenshotBlobUrl,
      contextUrl: window.location.href,
      userAgent: navigator.userAgent.slice(0, 500),
      viewport: { w: window.innerWidth, h: window.innerHeight },
    });

    if (result.ok) {
      setSubmit({
        status: 'success',
        issueUrl: result.issueUrl,
        issueNumber: result.issueNumber,
      });
    } else {
      setSubmit({ status: 'error', message: ERROR_MESSAGES[result.error] });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" disableEscapeKeyDown={busy}>
      <DialogTitle>バグ報告 / 改善提案</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {captureError ? <Alert severity="warning">{captureError}</Alert> : null}

          <FormControl>
            <FormLabel id="bug-report-kind-label">種別</FormLabel>
            <RadioGroup
              row
              aria-labelledby="bug-report-kind-label"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'bug' | 'enhancement')}
            >
              <FormControlLabel value="bug" control={<Radio />} label="バグ報告" />
              <FormControlLabel value="enhancement" control={<Radio />} label="改善提案" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="内容"
            placeholder="再現手順 / 期待する挙動 / 実際の挙動 など"
            multiline
            minRows={4}
            maxRows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            inputProps={{ maxLength: 2000 }}
            helperText={`${body.length} / 2000`}
            fullWidth
            disabled={busy}
          />

          {screenshotPreviewUrl ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                添付される画面 (送信時に自動で含まれます)
              </Typography>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreviewUrl}
                alt="screenshot preview"
                style={{
                  width: '100%',
                  maxHeight: 240,
                  objectFit: 'contain',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 4,
                  background: '#fff',
                }}
              />
            </Box>
          ) : null}

          {submit.status === 'error' ? <Alert severity="error">{submit.message}</Alert> : null}
          {submit.status === 'success' ? (
            <Alert severity="success">
              Issue #{submit.issueNumber} を作成しました:{' '}
              <Link href={submit.issueUrl} target="_blank" rel="noopener noreferrer">
                {submit.issueUrl}
              </Link>
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          {submit.status === 'success' ? '閉じる' : 'キャンセル'}
        </Button>
        {submit.status !== 'success' ? (
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {busy ? '送信中…' : '送信'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
