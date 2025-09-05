from .base_source import BaseDataSource
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class WorldBankSource(BaseDataSource):
    BASE_URL = "https://api.worldbank.org/v2"
    
    def fetch_data(self, country_code: str) -> Dict[str, Any]:
        """获取世界银行数据"""
        self._log_fetch("World Bank", country_code)
        
        indicators = {
            "economy": {
                "gdp": "NY.GDP.PCAP.CD",  # 人均GDP
                "gdp_growth": "NY.GDP.MKTP.KD.ZG",  # GDP增长率
                "internet_penetration": "IT.NET.USER.ZS"  # 新增：互联网普及率
            },
            "demographics": {
                "urban_population": "SP.URB.TOTL.IN.ZS",  # 城市人口比例
                "life_expectancy": "SP.DYN.LE00.IN",  # 预期寿命
                "birth_rate": "SP.DYN.CBRT.IN",           # 出生率 (每千人)
                "median_age": "SP.POP.TOTL.MA.ZS",         # 中位年龄
                "gender_ratio": "SP.POP.BRTH.MF"      # 女性比例
            },
            "education": {
                "literacy_rate": "SE.ADT.LITR.ZS"  # 识字率
            }
        }
        
        result = {"country_id": country_code}
        
        for category, inds in indicators.items():
            result[category] = {}
            for key, indicator in inds.items():
                try:
                    url = f"{self.BASE_URL}/country/{country_code}/indicator/{indicator}"
                    data = self.client.get(url, params={"format": "json", "per_page": 1})
                    if data and len(data) > 1 and data[1]:
                        result[category][key] = data[1][0].get("value")
                except Exception as e:
                    logger.warning(f"Failed to fetch {indicator} for {country_code}: {str(e)}")
        
        return result