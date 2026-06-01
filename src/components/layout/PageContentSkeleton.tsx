import { Box, Skeleton } from '@mui/material';

interface PageContentSkeletonProps {
  rows?: number;
}

export default function PageContentSkeleton({ rows = 5 }: PageContentSkeletonProps) {
  return (
    <Box>
      <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={40}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}
