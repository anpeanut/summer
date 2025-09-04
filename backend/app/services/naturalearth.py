from .base_source import BaseDataSource
from typing import Dict, Any, Optional
import logging
import requests
import zipfile
import io
import os
from pathlib import Path
from pathlib import Path
import json
import shapefile  # 新增：导入pyshp库解析Shapefile
from shapely.geometry import shape  # 新增：处理几何数据
from shapely.geometry.base import BaseGeometry
from shapely.errors import TopologicalError
from app.utils.data_utils import normalize_country_code

logger = logging.getLogger(__name__)

class NaturalEarthSource(BaseDataSource):
    BASE_URL = "https://naturalearth.s3.amazonaws.com"
    CACHE_DIR = Path("app/static/geojson_cache")
    
    def fetch_data(self, country_code: Optional[str] = None, resolution: str = "110m") -> Dict[str, Any]:
        """获取国家边界GeoJSON数据"""
        self._log_fetch("Natural Earth", country_code)
        
        # 创建缓存目录
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # 如果请求特定国家，先获取完整数据集
        if country_code:
            geojson_path = self._get_geojson_file(resolution)
            if geojson_path:
                return self._extract_country(geojson_path, normalize_country_code(country_code))
            return {}
        
        # 获取完整数据集
        return self._get_geojson_file(resolution)
    
    def _get_geojson_file(self, resolution: str) -> Optional[str]:
        """获取GeoJSON文件路径（从缓存或下载）"""
        filename = f"ne_{resolution}_admin_0_countries.geojson"
        zip_url = f"{self.BASE_URL}/{resolution}_cultural/ne_{resolution}_admin_0_countries.zip"
        geojson_path = self.CACHE_DIR / filename
        
        # 检查缓存
        if not geojson_path.exists():
            if not self._download_and_extract(zip_url):
                return None
                
        return str(geojson_path)
    
    def _download_and_extract(self, url: str) -> bool:
        """下载并解压GeoJSON文件"""
        print("Downloading and extracting GeoJSON...")
        try:
            response = self.client.get(url, stream=True)
            response.raise_for_status()
            
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                # 解压GeoJSON文件
                for file in z.namelist():
                    if file.endswith('.geojson'):
                        print("Extracting file: ", file)
                        z.extract(file, self.CACHE_DIR)
                        return True
        except Exception as e:
            logger.error(f"Download failed: {str(e)}")
        return False
    
    def _extract_country(self, geojson_path: str, country_code: str) -> Dict[str, Any]:
        """从完整数据集中提取单个国家"""
        try:
            with open(geojson_path, 'r') as f:
                data = json.load(f)
                
                for feature in data.get('features', []):
                    props = feature.get('properties', {})
                    # Natural Earth使用ISO_A2作为国家代码
                    if props.get('ISO_A2') == country_code:
                        return {
                            "country_id": country_code,
                            "feature_type": "country_boundary",
                            "geometry_type": feature.get('geometry', {}).get('type'),
                            "coordinates": feature.get('geometry', {}).get('coordinates')
                        }
            
            logger.warning(f"Country {country_code} not found in GeoJSON")
            return {}
        except Exception as e:
            logger.error(f"Error extracting country {country_code}: {str(e)}")
            return {}