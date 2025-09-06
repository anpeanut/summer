import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { Card, CardContent, Typography, CircularProgress, Chip, Box } from '@mui/material';
import { LifeEvent } from '../types';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';
import PublicIcon from '@mui/icons-material/Public';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { TimelineDotProps } from '@mui/lab/TimelineDot';

type LifeStoryTimelineProps = {
  events: LifeEvent[] | null;
  isLoading: boolean;
};

const categoryIcons: { [key: string]: React.ReactElement } = {
  Education: <SchoolIcon />,
  Career: <WorkIcon />,
  Relationship: <FavoriteIcon />,
  Milestone: <StarIcon />,
  WorldEvent: <PublicIcon />,
  Special: <HelpOutlineIcon />,
};

const categoryColors: { [key: string]: TimelineDotProps['color'] } = {
    Education: 'primary',
    Career: 'success',
    Relationship: 'error',
    Milestone: 'warning',
    WorldEvent: 'info',
    Special: 'grey',
  };

// 该组件现在是一个纯粹的“展示性组件”
function LifeStoryTimeline({ events, isLoading }: LifeStoryTimelineProps) {
  // 内部的 useState 和 useEffect 已被移除

  // 如果事件为空或null，且不在加载中，则不渲染任何内容
  if ((!events || events.length === 0) && !isLoading) {
    return null;
  }

  return (
    <Box sx={{
      flexGrow: 1,
      overflowY: 'auto',
      pr: 2,
    }}>
      <Timeline position="right">
        {/* 直接遍历从 props 接收的 events */}
        {events && events.map((item) => (
          // 关键性能优化：使用 item.year (或其它唯一标识) 作为 key
          <div key={item.year} className="timeline-item-appear">
            <TimelineItem sx={{
              '&::before': {
                content: 'none',
              },
            }}>
              <TimelineSeparator>
                <TimelineConnector />
                <TimelineDot color={categoryColors[item.category] || 'grey'}>
                  {categoryIcons[item.category] || <PublicIcon />}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card 
                  elevation={2}
                  sx={{
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip label={item.category} size="small" color={categoryColors[item.category] as any || 'default'} sx={{ mr: 1.5 }}/>
                      <Typography variant="body2" color="text.secondary">
                        {item.year} (年龄 {item.age})
                      </Typography>
                    </Box>
                    <Typography variant="body1">{item.event}</Typography>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          </div>
        ))}
        
        {/* 当正在加载时，在时间线末尾显示一个小圈圈 */}
        {isLoading && (
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot color="grey" variant="outlined">
                <CircularProgress size={20} />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent />
          </TimelineItem>
        )}
      </Timeline>
    </Box>
  );
}

// 推荐：使用 React.memo 包装，避免不必要的重渲染
export default React.memo(LifeStoryTimeline);
