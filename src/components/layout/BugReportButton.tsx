'use client';

import { IconButton, Tooltip } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useEffect, useRef, useState } from 'react';
import type { SessionUserView } from '@/features/auth/types';
import BugReportDialog from './BugReportDialog';

interface BugReportButtonProps {
  user: SessionUserView;
}

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.85;

function canvasToJpegBlob(source: HTMLCanvasElement): Promise<Blob | null> {
  const longest = Math.max(source.width, source.height);
  let target: HTMLCanvasElement = source;
  if (longest > MAX_DIM) {
    const scale = MAX_DIM / longest;
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(source.width * scale);
    scaled.height = Math.round(source.height * scale);
    const ctx = scaled.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0, scaled.width, scaled.height);
      target = scaled;
    }
  }
  return new Promise((resolve) => {
    target.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY);
  });
}

export default function BugReportButton({ user }: BugReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const releasePreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  };

  useEffect(() => {
    return () => releasePreview();
  }, []);

  if (!user || user.isGuest) return null;

  const handleClick = async () => {
    if (capturing || open) return;
    setCapturing(true);
    setCaptureError(null);
    releasePreview();
    setPreviewUrl(null);
    setScreenshot(null);

    try {
      const { domToCanvas } = await import('modern-screenshot');
      const canvas = await domToCanvas(document.body, {
        scale: 1,
        backgroundColor: '#ffffff',
      });
      const blob = await canvasToJpegBlob(canvas);
      if (blob) {
        const url = URL.createObjectURL(blob);
        previewRef.current = url;
        setScreenshot(blob);
        setPreviewUrl(url);
      } else {
        setCaptureError('スクリーンショットを生成できませんでした。テキストのみで送信できます。');
      }
    } catch (err) {
      console.error('[BugReport] screenshot capture failed:', err);
      setCaptureError('スクリーンショットの取得に失敗しました。テキストのみで送信できます。');
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    releasePreview();
    setPreviewUrl(null);
    setScreenshot(null);
    setCaptureError(null);
  };

  return (
    <>
      <Tooltip title="バグ報告 / 改善提案">
        <span>
          <IconButton
            color="inherit"
            onClick={() => void handleClick()}
            disabled={capturing}
            aria-label="バグ報告"
          >
            <BugReportIcon />
          </IconButton>
        </span>
      </Tooltip>
      <BugReportDialog
        open={open}
        screenshot={screenshot}
        screenshotPreviewUrl={previewUrl}
        captureError={captureError}
        onClose={handleClose}
      />
    </>
  );
}
