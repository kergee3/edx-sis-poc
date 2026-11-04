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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useSettings } from '@/contexts/settings-context';

/**
 * 「架空のテストデータ」注意書きの表示設定（localStorage 管理。ナビ位置・表示名フォントと同系統）。
 * 配信でのデモ時に、各画面のタイトル直下へ注意書きを出すかを選ぶ。既定は表示しない。
 */
export default function DemoDataNoticeSetting() {
  const { showDemoDataNotice, setShowDemoDataNotice } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowDemoDataNotice(event.target.value === 'show');
  };

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ReportProblemIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          「架空のテストデータ」の表示
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        各画面のタイトルの下に、表示中の名簿・個人情報がすべて架空のテストデータである旨を目立つように表示します。
        配信や録画でデモを行うときに使います。
      </Typography>
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ display: 'none' }}>
          「架空のテストデータ」の表示
        </FormLabel>
        <RadioGroup
          aria-label="demo-data-notice"
          name="demo-data-notice"
          value={showDemoDataNotice ? 'show' : 'hide'}
          onChange={handleChange}
        >
          <FormControlLabel
            value="show"
            control={<Radio />}
            label={<Typography variant="body1">表示する</Typography>}
          />
          <FormControlLabel
            value="hide"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">表示しない</Typography>
                <Typography variant="caption" color="text.secondary">
                  既定
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
