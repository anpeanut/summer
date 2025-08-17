import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box'; // 1. 导入Box组件

type FetchButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  text: string; // 1. 添加 text prop
};

function FetchButton({ onClick, isLoading, text }: FetchButtonProps) {
  return (
    // 2. 使用Box组件作为flex容器
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Button
        variant="contained"
        onClick={onClick}
        disabled={isLoading}
        // 移除外边距mb，因为它现在由Box容器处理
        sx={{ position: 'relative', minHeight: '36.5px' }}
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
          text // 2. 使用 text prop
        )}
      </Button>
    </Box>
  );
}

export default FetchButton;
