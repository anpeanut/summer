import React from 'react';
import { Card, CardContent, Typography, CardActions, Button, Alert } from '@mui/material';
import { CountryData, Metadata, LifeEvent } from '../types'; // 1. 导入 LifeEvent

type CountryInfoProps = {
  data: CountryData | null;
  metadata: Metadata | null;
  onGenerateStory: () => void;
  isStoryLoading: boolean;
  lifeStory: LifeEvent[] | null; // 2. 接收 lifeStory prop
};

function CountryInfo({ data, metadata, onGenerateStory, isStoryLoading, lifeStory }: CountryInfoProps) {
  if (!data) {
    return (
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            欢迎来到人生重开模拟器
          </Typography>
          <Typography variant="h6">
            点击按钮，开始你的新人生
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 3. 从新的数据结构中安全地提取信息
  const gdp = data.storySeed?.environment?.gdp_per_capita;
  const industries = data.storySeed?.environment?.main_industries;
  const lifeExpectancy = data.storySeed?.milestones?.life_expectancy;
  const showCompletenessWarning = metadata?.dataCompleteness != null && metadata.dataCompleteness < 0.6;

  // 3. 动态计算按钮文本和状态
  const getButtonState = () => {
    if (lifeStory && lifeStory.length > 0) {
      return { text: '重新生成你的人生故事', disabled: false };
    }
    if (isStoryLoading) {
      return { text: '正在生成...', disabled: true };
    }
    return { text: '开启我的人生故事', disabled: false };
  };

  const { text: buttonText, disabled: isButtonDisabled } = getButtonState();

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
        {gdp && (
          <Typography variant="body2">
            人均GDP: ${gdp.toLocaleString()}
          </Typography>
        )}
        {industries && industries.length > 0 && (
          <Typography variant="body2">
            主要产业: {industries.join(', ')}
          </Typography>
        )}
        {lifeExpectancy && (
          <Typography variant="body2">
            预期寿命: {lifeExpectancy} 岁
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ flexDirection: 'column', alignItems: 'flex-start', px: 2, pb: 2 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={onGenerateStory}
          disabled={isButtonDisabled} // 使用动态状态
          fullWidth
        >
          {buttonText} {/* 使用动态文本 */}
        </Button>
        {showCompletenessWarning && (
          <Alert severity="warning" sx={{ mt: 1.5, width: '100%', boxSizing: 'border-box' }}>
            部分数据缺失，故事生成可能不够精确。
          </Alert>
        )}
      </CardActions>
    </Card>
  );
}

export default CountryInfo;
