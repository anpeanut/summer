import React, { useState, useEffect } from 'react';
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
import FavoriteIcon from '@mui/icons-material/Favorite'; // 新增：关系
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // 新增：特殊
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

function LifeStoryTimeline({ events, isLoading }: LifeStoryTimelineProps) {
  const [visibleEvents, setVisibleEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    setVisibleEvents([]); 

    if (events && events.length > 0) {
      const interval = setInterval(() => {
        setVisibleEvents(prevEvents => {
          if (prevEvents.length < events.length) {
            return [...prevEvents, events[prevEvents.length]];
          } else {
            clearInterval(interval);
            return prevEvents;
          }
        });
      }, 1500); 

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
    return null;
  }

  return (
    <Box sx={{
      flexGrow: 1,
      overflowY: 'auto',
      pr: 2,
    }}>
      {/* 1. position 改为 "right" */}
      <Timeline position="right">
        {visibleEvents.map((item, index) => (
          <div key={index} className="timeline-item-appear">
            <TimelineItem sx={{
              // 关键！通过CSS伪元素选择器，找到TimelineItem内部的占位符并移除
              '&::before': {
                content: 'none',
              },
            }}>
              {/* 2. TimelineOppositeContent 已被移除 */}
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
                    {/* 3. 重排卡片头部 */}
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
      </Timeline>
    </Box>
  );
}

export default LifeStoryTimeline;
