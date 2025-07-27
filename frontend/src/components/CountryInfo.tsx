import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CountryData } from '../services/countryService';

type CountryInfoProps = {
  data: CountryData | null;
};

// 根据传入的国家数据显示信息，如果数据为 null，则显示提示信息
function CountryInfo({ data }: CountryInfoProps) {
  if (!data) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography color="text.secondary">请点击按钮获取你的出生点</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {data.name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {data.capital}
        </Typography>
        <Typography variant="body2">
          人口: {data.population.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default CountryInfo;
