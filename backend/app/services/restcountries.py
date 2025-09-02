from .base_source import BaseDataSource
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class RestCountriesSource(BaseDataSource):
    BASE_URL = "https://restcountries.com/v3.1"
    
    def fetch_data(self, country_code: str = None) -> Dict[str, Any]:
        """获取国家基本信息"""
        self._log_fetch("REST Countries", country_code)
        
        endpoint = f"/alpha/{country_code}" if country_code else "/all"
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            data = self.client.get(url)
            return self._transform(data[0] if country_code else data)
        except Exception as e:
            logger.error(f"REST Countries fetch failed: {str(e)}")
            return {}
    
    def _transform(self, data: Any) -> Dict[str, Any]:
        """转换数据为标准格式"""
        if isinstance(data, list):
            return [self._transform_country(c) for c in data]
        return self._transform_country(data)
    
    def _transform_country(self, country: Dict) -> Dict:
        """转换单个国家数据"""
        return {
            "id": country.get("cca2", ""),
            "name": country.get("name", {}).get("common", ""),
            "population": country.get("population", 0),
            "capital": country.get("capital", [""])[0],
            "longitude": country.get("latlng", [0, 0])[1],
            "latitude": country.get("latlng", [0, 0])[0],
            "languages": list(country.get("languages", {}).values()),
            "timezones": country.get("timezones", []),
            "demographics": {
                "population": country.get("population"),
                "gini": next(iter(country.get("gini", {}).values()), None)
            }
        }