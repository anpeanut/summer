import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

type FetchButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  text: string; // 按钮上显示的文字
};

function FetchButton({ onClick, isLoading, text }: FetchButtonProps) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={isLoading}
      // 增加外边距，使其与下方的卡片分开
      sx={{ position: 'relative', minHeight: '36.5px', mb: 2 }}
    >
      {/* 加载时显示菊花图，否则显示来自props的文字 */}
      {isLoading ? (
        <CircularProgress
          size={24}
          sx={{
            color: 'primary.light',
            position: 'absolute',
          }}
        />
      ) : (
        text
      )}
    </Button>
  );
}

export default FetchButton;
