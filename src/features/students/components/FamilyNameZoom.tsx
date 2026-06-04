'use client';

import { useCallback, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Box, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FONT_MJ } from '@/theme/fonts';

interface FamilyNameZoomProps {
  /** トリガーに表示する内容（'←'・正式苗字・氏名の苗字部分など） */
  children: ReactNode;
  /** 60px・IPAmjexMincho で拡大表示する正式苗字 */
  familyName: string;
  /** トリガーのフォント（正式苗字セルは MJ、氏名セルは通常フォント） */
  fontFamily?: string;
}

/** クリップボードに書き込む（非対応・非セキュアコンテキストでは execCommand にフォールバック）。 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // フォールバックへ
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * 苗字をホバー/クリック/タップで 60px・MJフォントに拡大表示する。
 * - ホバー中はツールチップで一時表示し、離れると消える
 * - クリック/タップで Popover を開いて固定。中の文字はテキスト選択でき、コピーボタンも備える
 */
export default function FamilyNameZoom({ children, familyName, fontFamily }: FamilyNameZoomProps) {
  const [hovering, setHovering] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const pinned = anchorEl !== null;

  const close = useCallback(() => {
    setAnchorEl(null);
    setCopied(false);
  }, []);

  const toggle = useCallback((el: HTMLElement) => {
    setCopied(false);
    setAnchorEl((prev) => (prev ? null : el));
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => toggle(e.currentTarget),
    [toggle],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(e.currentTarget);
      }
    },
    [toggle],
  );

  const handleCopy = useCallback(async () => {
    if (await copyText(familyName)) setCopied(true);
  }, [familyName]);

  return (
    <>
      <Tooltip
        open={hovering && !pinned}
        arrow
        placement="top"
        disableHoverListener
        disableFocusListener
        disableTouchListener
        title={
          <Typography
            component="span"
            sx={{ fontFamily: FONT_MJ, fontSize: '60px', lineHeight: 1.2, display: 'block', px: 1 }}
          >
            {familyName}
          </Typography>
        }
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: 1,
              borderColor: 'divider',
              boxShadow: 4,
              maxWidth: 'none',
              p: 0.5,
            },
          },
          arrow: { sx: { color: 'background.paper' } },
        }}
      >
        <Box
          component="span"
          role="button"
          tabIndex={0}
          aria-label={`${familyName} を拡大表示`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            fontFamily,
            textDecoration: 'underline dotted',
            textUnderlineOffset: '0.2em',
            textDecorationColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {children}
        </Box>
      </Tooltip>

      <Popover
        open={pinned}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 1, border: 1, borderColor: 'divider' } } }}
      >
        <Stack alignItems="center" spacing={0.5}>
          {/* 拡大表示。テキスト選択でコピー可能 */}
          <Typography
            component="span"
            sx={{
              fontFamily: FONT_MJ,
              fontSize: '60px',
              lineHeight: 1.2,
              display: 'block',
              px: 1,
              userSelect: 'text',
            }}
          >
            {familyName}
          </Typography>
          <Tooltip title={copied ? 'コピーしました' : '正式苗字をコピー'} placement="bottom">
            <IconButton
              size="small"
              onClick={handleCopy}
              aria-label={`正式苗字「${familyName}」をコピー`}
            >
              {copied ? (
                <CheckIcon fontSize="small" color="success" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Popover>
    </>
  );
}
