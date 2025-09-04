from .base_source import BaseDataSource
from typing import Dict, List, Any
import logging
from functools import reduce 

logger = logging.getLogger(__name__)

class RestCountriesSource(BaseDataSource):
    BASE_URL = "https://restcountries.com/v3.1"
    field_groups = [
            # 第1组：核心基础字段（Country表主字段）
            "cca2,name,population,capital,latlng,region,subregion,flags",
            # 第2组：扩展信息字段（关联表字段）
            "cca2,geometry,medianAge,gdp,languages,currencies,landlocked,area,timezones,gini"
    ]
    
    def fetch_data(self, country_code: str = None) -> Dict[str, Any]:
        """获取国家基本信息"""
        self._log_fetch("REST Countries", country_code)
        
        print("Fetching data...(restcountries)")

        endpoint = f"/alpha/{country_code}" if country_code else "/all"
        url = f"{self.BASE_URL}{endpoint}"

        all_batches: List[List[Dict]] = []
        
        try:
            for fields in self.field_groups:
                print(f"Fetching fields: {fields}")
                batch_data = self.client.get(url + f"?fields={fields}")
                print(type(batch_data))
                if country_code and isinstance(batch_data, list):
                    batch_data = batch_data[0] if batch_data else {}
                all_batches.append(batch_data)
                logger.debug(f"Fetched {len(batch_data) if isinstance(batch_data, list) else 1} items for {fields}")
            #data = self.client.get(url)
            merged_data = self._merge_batches(all_batches, country_code)

            return self._transform(merged_data)
        
        except Exception as e:
            logger.error(f"REST Countries fetch failed: {str(e)}")
            return {}
        
    def _merge_batches(self, batches: List[Any], is_single: bool) -> Any:
        """
        合并多个字段组的请求结果

        Args:
            batches: 多个字段组的响应数据列表
            is_single: 是否为单国家请求（True则合并字典，False则合并列表）

        Returns:
            合并后的完整数据（单国家为字典，多国家为列表）
        """
        if is_single:
            # 单国家：合并多个字典（每个字段组返回一个字典）
            return reduce(self._merge_dicts, batches, {})
        else:
            # 多国家：按cca2合并列表中每个国家的多个批次数据
            # 先将批次数据转换为 {cca2: 数据} 的映射表列表
            print("Merging batches for multiple countries")
            batch_maps = []
            for batch in batches:
                if not isinstance(batch, list):
                    logger.warning(f"Skipping invalid batch data (expected list, got {type(batch)})")
                    continue
                if not batch:  # 检查空列表
                    logger.warning("Received empty batch data")
                    continue
                # 创建当前批次的cca2映射表
                batch_map = {}
                for country in batch:
                    cca2 = country.get("cca2")
                    if cca2:  # 确保有cca2字段
                        batch_map[cca2] = country
                batch_maps.append(batch_map)

            if not batch_maps:  # 所有批次都无效
                logger.error("All batches were invalid or empty")
                return []

            # 合并所有批次的映射表
            print("Combining batch maps")
            merged_map: Dict[str, Dict] = {}
            for bm in batch_maps:
                for cca2, country_data in bm.items():
                    if cca2 not in merged_map:
                        merged_map[cca2] = {}
                    # 合并当前国家的字段数据
                    merged_map[cca2] = self._merge_dicts(merged_map[cca2], country_data)

            # 转换回列表格式
            return list(merged_map.values())
    
    @staticmethod
    def _merge_dicts(a: Dict, b: Dict) -> Dict:
        """递归合并两个字典（处理嵌套结构）"""
        print(f"Merging dicts")
        merged = a.copy()
        for key, value in b.items():
            if isinstance(value, dict) and key in merged and isinstance(merged[key], dict):
                # 嵌套字典递归合并
                merged[key] = RestCountriesSource._merge_dicts(merged[key], value)
            else:
                # 基本类型直接覆盖（后序批次可能覆盖前序，需确保字段组无重复字段）
                merged[key] = value
        return merged
 

    def _transform(self, data: Any) -> Dict[str, Any]:
        """转换数据为标准格式"""
        print("Transforming data...")
        if isinstance(data, list):
            return [self._transform_country(c) for c in data]
        return self._transform_country(data)
    
    def _transform_country(self, country: Dict) -> Dict:
        """转换单个国家数据"""
        print(f"Transforming country: {country.get('cca2')}")
        try:
            return {
                "id": country.get("cca2", ""),
                "name": country.get("name", {}).get("common", ""),
                "population": country.get("population", 0),
                "capital": country.get("capital", [""])[0] if len(country.get("capital")) > 0 else "",
                "longitude": country.get("latlng", [0, 0])[1] if len(country.get("latlng", [])) > 1 else 0,
                "latitude": country.get("latlng", [0, 0])[0] if len(country.get("latlng", [])) > 1 else 0,
                "languages": list(country.get("languages", {}).values()),
                "timezones": country.get("timezones", []),
                "demographics": {
                    "population": country.get("population"),
                    "gini": next(iter(country.get("gini", {}).values()), None)
                }
            }
        except Exception as e:
            logger.error(f"Error transforming country data: {str(e)}")
            print(country)
            raise