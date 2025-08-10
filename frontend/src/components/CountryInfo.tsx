import React from 'react';
import { Card, CardContent, Typography, CardActions, Button } from '@mui/material';
import { CountryDataExtended } from '../types'; // 使用扩展类型

type CountryInfoProps = {
  data: CountryDataExtended | null;
  onGenerateStory: () => void; // "开启人生故事"按钮的回调函数
  isStoryLoading: boolean;     // 故事是否正在加载
};

function CountryInfo({ data, onGenerateStory, isStoryLoading }: CountryInfoProps) {
  // 如果还没有“投胎”，显示欢迎信息
  if (!data) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            欢迎来到人生重开模拟器
          </Typography>
          <Typography variant="h6">
            点击下方按钮，开始你的新人生
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 如果已经“投胎”，显示国家信息和“开启人生”按钮
  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          你的出生地: {data.name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          首都: {data.capital}
        </Typography>
        <Typography variant="body2">
          人口: {data.population.toLocaleString()}
        </Typography>
        <Typography variant="body2">
          人均GDP: ${data.gdpPerCapita.toLocaleString()}
        </Typography>
        <Typography variant="body2">
          主要产业: {data.mainIndustries.join(', ')}
        </Typography>
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={onGenerateStory}
          disabled={isStoryLoading}
        >
          {isStoryLoading ? '正在生成...' : '开启我的人生故事'}
        </Button>
      </CardActions>
    </Card>
  );
}

export default CountryInfo;
