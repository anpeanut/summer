import React, { useState, useEffect } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Card, CardContent, Typography, CircularProgress, Chip, Box } from '@mui/material';
import { LifeEvent } from '../types';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import StarIcon from '@mui/icons-material/Star';
import PublicIcon from '@mui/icons-material/Public';
import { TimelineDotProps } from '@mui/lab/TimelineDot';

type LifeStoryTimelineProps = {
  events: LifeEvent[] | null;
  isLoading: boolean;
};

const categoryIcons: { [key: string]: React.ReactElement } = {
  Education: <SchoolIcon />,
  Career: <WorkIcon />,
  Family: <FamilyRestroomIcon />,
  Milestone: <StarIcon />,
  Generic: <PublicIcon />,
};

const categoryColors: { [key: string]: TimelineDotProps['color'] } = {
    Education: 'primary',
    Career: 'success',
    Family: 'secondary',
    Milestone: 'warning',
    Generic: 'info',
  };

function LifeStoryTimeline({ events, isLoading }: LifeStoryTimelineProps) {
  const [visibleEvents, setVisibleEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    // 当外部传入的events变化时（即获取到新故事时），触发此effect
    setVisibleEvents([]); // 1. 立刻清空上一次的故事

    if (events && events.length > 0) {
      // 2. 设置一个定时器，逐个显示新故事的事件
      const interval = setInterval(() => {
        setVisibleEvents(prevEvents => {
          if (prevEvents.length < events.length) {
            // 如果还有未显示的事件，则添加下一个
            return [...prevEvents, events[prevEvents.length]];
          } else {
            // 所有事件都已显示，清除定时器
            clearInterval(interval);
            return prevEvents;
          }
        });
      }, 1500); // 每1.5秒显示一个事件

      // 3. 组件卸载或events变化时，清理定时器，防止内存泄漏
      return () => clearInterval(interval);
    }
  }, [events]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (visibleEvents.length === 0) {
    return null; // 如果没有可见事件，则不渲染任何内容
  }

  return (
    // 用一个Box将Timeline包裹起来，并赋予它滚动和伸缩的能力
    <Box sx={{
      flexGrow: 1, // 该Box会占据父容器（sidebar）的所有剩余垂直空间
      overflowY: 'auto', // 当内容超出高度时，仅在该Box内部显示垂直滚动条
      pr: 2, // 在右侧留出一些空间，防止滚动条与内容重叠
    }}>
      <Timeline position="alternate">
        {visibleEvents.map((item, index) => (
          <div key={index} className="timeline-item-appear">
            <TimelineItem>
              <TimelineOppositeContent
                sx={{ m: 'auto 0' }}
            align="right"
            variant="body2"
            color="text.secondary"
          >
            {item.year} (年龄 {item.age})
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineConnector />
            <TimelineDot color={categoryColors[item.category] || 'grey'}>
              {categoryIcons[item.category] || <PublicIcon />}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="span">
                  {item.category}
                </Typography>
                <Chip label={item.category} size="small" color={categoryColors[item.category] as any || 'default'} sx={{ ml: 1 }}/>
                <Typography>{item.event}</Typography>
              </CardContent>
            </Card>
          </TimelineContent>
            </TimelineItem>
          </div>
        ))}
      </Timeline>
    </Box>
  );
}

export default LifeStoryTimeline;
