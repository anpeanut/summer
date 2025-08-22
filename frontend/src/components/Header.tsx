import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public'; // 1. 导入地球图标
import GitHubIcon from '@mui/icons-material/GitHub'; // 1. 导入GitHub图标

function Header() {
  const onGitHubClick = () => {
    window.open('https://github.com/anpeanut/summer', '_blank');
  };

  return (
    <AppBar position="static" elevation={3} sx={{ background:'linear-gradient(to bottom, #0D47A1, #4878bfff)' }}>
    
      
      <Toolbar>
        {/* 2. 左侧图标 */}
        <PublicIcon sx={{ mr: 1.5 }} />
        
        {/* 3. 标题 */}
        <Typography variant="h6" component="div">
          投胎模拟器
        </Typography>

        {/* 4. 增加一个弹簧，将右侧图标推到最右边 */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 5. 右侧图标按钮 */}
        <IconButton
          color="inherit"
          aria-label="github repository"
          onClick={onGitHubClick}
        >
          <GitHubIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
