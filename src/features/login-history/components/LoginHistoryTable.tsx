'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import type { LoginHistoryDetail, LoginHistoryDetailRow, LoginHistoryView } from '../types';

const TOTAL_COLUMNS = 4;

interface LoginHistoryTableProps {
  items: LoginHistoryView[];
}

export default function LoginHistoryTable({ items }: LoginHistoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        まだログイン履歴はありません。
      </Typography>
    );
  }

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40, p: 0 }} />
            <TableCell
              sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}
            >
              日時
            </TableCell>
            <TableCell
              sx={{ fontWeight: 'bold', width: '1px', whiteSpace: 'nowrap', px: 1 }}
            >
              OS(Browser)
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', px: 1 }}>場所(IP)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const isOpen = expandedIds.has(item.id);
            return (
              <Fragment key={item.id}>
                <TableRow
                  hover
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                >
                  <TableCell sx={{ width: 40, p: 0, textAlign: 'center' }}>
                    {isOpen ? (
                      <KeyboardArrowUpIcon fontSize="small" />
                    ) : (
                      <KeyboardArrowDownIcon fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        columnGap: 0.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{item.loggedInAtDate}</span>
                      <span>{item.loggedInAtTime}</span>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        wordBreak: { xs: 'break-word', sm: 'normal' },
                      }}
                    >
                      {item.osLabel && <span>{item.osLabel}</span>}
                      {item.browserLabel && <span>{item.browserLabel}</span>}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        wordBreak: 'break-all',
                      }}
                    >
                      {item.locationLabel && <span>{item.locationLabel}</span>}
                      {item.ipLabel && <span>{item.ipLabel}</span>}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={TOTAL_COLUMNS} sx={{ p: 0, borderBottom: isOpen ? undefined : 0 }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <DetailPanel detail={item.detail} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DetailPanel({ detail }: { detail: LoginHistoryDetail }) {
  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
      <DetailSection title="クライアントで取得した情報" rows={detail.client} />
      <Box sx={{ mt: 2 }}>
        <DetailSection title="サーバーで取得した情報" rows={detail.server} />
      </Box>
    </Box>
  );
}

function DetailSection({ title, rows }: { title: string; rows: LoginHistoryDetailRow[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    width: '1px',
                    pr: 1,
                  }}
                >
                  {row.label}
                </TableCell>
                <TableCell sx={{ wordBreak: 'break-word', pl: 1 }}>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
