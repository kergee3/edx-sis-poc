'use client';

import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import { useSettings } from '@/contexts/settings-context';
import { FONT_NOTO_SANS_JP, FONT_NOTO_SERIF_JP, type DisplayFont } from '@/theme/fonts';

/**
 * 表示名フォントの設定（localStorage 管理。ナビ位置と同系統で、学校情報の DB 保存とは別）。
 * 生徒一覧の「氏名」やデータ連携の表示名など、JIS 文字の表示名に使うフォントを
 * ゴシック（Noto Sans JP）／明朝（Noto Serif JP）から選ぶ。既定はゴシック。
 * 正式氏名（MJ特有文字）の IPAmjexMincho 表示には影響しない。
 */
export default function DisplayFontSetting() {
  const { displayFont, setDisplayFont } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayFont(event.target.value as DisplayFont);
  };

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FontDownloadIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          表示名のフォント
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        生徒一覧の「氏名」やデータ連携の表示名など、JIS 文字の表示名に使うフォントです。
        正式苗字（IPAmjexMincho）の表示には影響しません。
      </Typography>
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ display: 'none' }}>
          表示名のフォント
        </FormLabel>
        <RadioGroup
          aria-label="display-font"
          name="display-font"
          value={displayFont}
          onChange={handleChange}
        >
          <FormControlLabel
            value="sans"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" sx={{ fontFamily: FONT_NOTO_SANS_JP }}>
                  ゴシック体（Noto Sans JP）
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  既定。画面で読みやすいゴシック体
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="serif"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" sx={{ fontFamily: FONT_NOTO_SERIF_JP }}>
                  明朝体（Noto Serif JP）
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  文書・印刷向けの明朝体
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
