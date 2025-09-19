import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip, Snackbar } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import GitHubIcon from '@mui/icons-material/GitHub';
import ShareIcon from '@mui/icons-material/Share'; // 1. 导入分享图标

function Header() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const onGitHubClick = () => {
    window.open('https://github.com/anpeanut/summer', '_blank');
  };

  const onShareClick = () => {
    navigator.clipboard.writeText(window.location.origin)
      .then(() => {
        setSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <AppBar position="static" elevation={3} sx={{ background: 'linear-gradient(to bottom, #0D47A1, #4878bfff)' }}>
      <Toolbar>
        <PublicIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="div">
          投胎模拟器
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="分享网站">
          <IconButton
            color="inherit"
            aria-label="share website"
            onClick={onShareClick}
          >
            <ShareIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="GitHub仓库">
          <IconButton
            color="inherit"
            aria-label="github repository"
            onClick={onGitHubClick}
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="网站链接已复制到剪贴板"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </AppBar>
  );
}

export default Header;
