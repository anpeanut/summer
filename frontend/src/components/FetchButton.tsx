import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

type FetchButtonProps = {
  onClick: () => void;
  isLoading: boolean;
};

function FetchButton({ onClick, isLoading }: FetchButtonProps) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={isLoading}
      // 添加最小高度以防止加载时布局变化
      sx={{ position: 'relative', minHeight: '36.5px' }}
    >
      {/* 加载时显示菊花图，否则显示文字 */}
      {isLoading ? (
        <CircularProgress
          size={24}
          sx={{
            color: 'primary.light',
            position: 'absolute',
          }}
        />
      ) : (
        '获取一个随机国家'
      )}
    </Button>
  );
}

export default FetchButton;
