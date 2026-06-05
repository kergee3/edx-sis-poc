'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  GlobalStyles,
  Typography,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import SailingTwoToneIcon from '@mui/icons-material/SailingTwoTone';
import { FONT_MJ } from '@/theme/fonts';
import type { CertificateView } from '../types';

/** 苗字と名前の間の全角スペース。 */
const FULLWIDTH_SPACE = '　';

/** 印影の朱色（朱肉）。 */
const VERMILION = '#d7000f';

interface EnrollmentCertificateButtonProps {
  certificate: CertificateView;
}

/**
 * 証明書本体だけを印刷する @media print ルール。
 * Dialog は body 直下の portal に出るため、可視性で対象を絞り左上へ再配置する。
 */
const printStyles = (
  <GlobalStyles
    styles={{
      '@media print': {
        'body *': { visibility: 'hidden' },
        '.certificate-print-root, .certificate-print-root *': { visibility: 'visible' },
        '.certificate-print-root': {
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          margin: 0,
          padding: '24px',
          boxShadow: 'none',
        },
      },
    }}
  />
);

/** 証明書の 1 行（見出し＋値）。 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, py: 0.75 }}>
      <Typography component="span" sx={{ minWidth: '5em', fontWeight: 'bold' }}>
        {label}
      </Typography>
      <Typography component="span">{children}</Typography>
    </Box>
  );
}

/**
 * 在籍証明ボタン。押すと在籍証明書ダイアログを開く。
 * 証明書には学校名・住所・校長氏名・発行日（本日・和暦）を含む。
 */
export default function EnrollmentCertificateButton({
  certificate,
}: EnrollmentCertificateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {printStyles}
      <Button
        variant="outlined"
        size="small"
        startIcon={<DescriptionIcon />}
        onClick={() => setOpen(true)}
        sx={{ whiteSpace: 'nowrap' }}
      >
        在籍証明
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {/* 印刷対象。これ以外（操作ボタン・背景）は @media print で非表示にする。 */}
          <Box className="certificate-print-root" sx={{ px: { xs: 1, sm: 3 }, py: 2 }}>
            <Typography variant="body2" color="text.secondary" align="right" sx={{ mb: 1 }}>
              {certificate.certificateNumber}
            </Typography>
            <Typography
              variant="h4"
              component="h2"
              align="center"
              sx={{ letterSpacing: '0.5em', mb: 4, fontWeight: 'bold' }}
            >
              在籍証明書
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Row label="氏名">
                <Box
                  component="span"
                  sx={{ fontFamily: FONT_MJ, fontSize: '1.6rem', lineHeight: 1.3 }}
                >
                  {certificate.officialFamilyName}
                  {FULLWIDTH_SPACE}
                  {certificate.officialGivenName}
                </Box>
              </Row>
              <Row label="生年月日">{certificate.birthDateWareki}</Row>
              <Row label="性別">{certificate.sexLabel}</Row>
              <Row label="学年・組">{certificate.gradeClassLabel}</Row>
            </Box>

            <Typography sx={{ mb: 5, lineHeight: 2 }}>
              上記の者は、本校に在籍していることを証明します。
            </Typography>

            {/* 発行日・学校名・校長名（証明者）。右寄せで証書の体裁に。 */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ mb: 2 }}>{certificate.issueDateWareki}</Typography>
              <Typography sx={{ mb: 0.5 }}>{certificate.schoolAddress}</Typography>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {certificate.schoolName}
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}
              >
                <Typography sx={{ fontWeight: 'bold' }}>
                  校長　{certificate.principalName}
                </Typography>
                {/* 職印（朱色） */}
                <SailingTwoToneIcon
                  aria-label="校長の印"
                  sx={{ fontSize: 52, color: VERMILION }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>閉じる</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
            印刷
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
