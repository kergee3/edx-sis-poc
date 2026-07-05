'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/** 出力ボタン 1 種の定義。 */
interface ExportTarget {
  /** 内部識別子（進行中判定用）。 */
  key: string;
  /** ボタン表示名。 */
  label: string;
  /** ダウンロード用 Route Handler の URL。 */
  url: string;
  /** Content-Disposition が取れない場合のフォールバック名。 */
  fallbackFileName: string;
}

const TARGETS: readonly ExportTarget[] = [
  {
    key: 'oneroster',
    label: 'OneRoster出力',
    url: '/api/students/oneroster',
    fallbackFileName: 'oneroster.zip',
  },
  {
    key: 'excel',
    label: 'Excel出力',
    url: '/api/students/export',
    fallbackFileName: 'roster.xlsx',
  },
];

/** 処理結果（成功時のダイアログ表示に使う）。 */
interface ExportResult {
  label: string;
  fileName: string;
}

/**
 * Content-Disposition ヘッダからファイル名を取り出す。
 * RFC 5987 の filename*（UTF-8）を優先し、無ければ ascii の filename、
 * どちらも取れなければフォールバック名を返す。
 */
function parseFileName(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // デコードに失敗したら ascii フォールバックへ
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ?? fallback;
}

/**
 * 生徒名簿の出力ボタン群（OneRoster / Excel）。
 * fetch でファイルを取得し、こちら側でダウンロードを起動することで
 * 実際のファイル名を把握し、完了後に保存先とファイル名を示すメッセージボックスを出す。
 */
export default function ExportButtons() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<{ label: string; message: string } | null>(null);

  async function handleExport(target: ExportTarget) {
    setBusyKey(target.key);
    try {
      const res = await fetch(target.url);
      if (!res.ok) {
        throw new Error(`サーバがエラーを返しました（HTTP ${res.status}）。`);
      }
      const blob = await res.blob();
      const fileName = parseFileName(
        res.headers.get('Content-Disposition'),
        target.fallbackFileName,
      );

      // 取得した blob をこちら側でダウンロード起動する（ファイル名を確定させるため）。
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setResult({ label: target.label, fileName });
    } catch (e) {
      setError({
        label: target.label,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {TARGETS.map((target) => {
          const busy = busyKey === target.key;
          return (
            <Button
              key={target.key}
              variant="outlined"
              size="small"
              disabled={busyKey !== null}
              startIcon={
                busy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : target.key === 'oneroster' ? (
                  <ImportExportIcon />
                ) : (
                  <FileDownloadIcon />
                )
              }
              onClick={() => handleExport(target)}
              sx={{ textTransform: 'none' }}
            >
              {target.label}
            </Button>
          );
        })}
      </Box>

      {/* 成功メッセージボックス（保存先とファイル名を表示）。 */}
      <Dialog open={result !== null} onClose={() => setResult(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          出力が完了しました
        </DialogTitle>
        <DialogContent>
          {result && (
            <Stack spacing={1.5}>
              <DialogContentText component="div">
                {result.label}のファイルを保存しました。
              </DialogContentText>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ファイル名
                </Typography>
                <Typography sx={{ wordBreak: 'break-all', fontWeight: 600 }}>
                  {result.fileName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  保存先
                </Typography>
                <Typography>
                  ブラウザの既定のダウンロード先（通常は「ダウンロード」フォルダ）
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResult(null)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* 失敗メッセージボックス。 */}
      <Dialog open={error !== null} onClose={() => setError(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorOutlineIcon color="error" />
          出力に失敗しました
        </DialogTitle>
        <DialogContent>
          {error && (
            <DialogContentText component="div">
              {error.label}の処理でエラーが発生しました。
              <br />
              {error.message}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setError(null)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
