from .base_source import BaseDataSource
from typing import Dict, Any, Optional, List
import logging
import requests
import zipfile
import io
import os
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
    CACHE_DIR = Path("app/static/shapefile_cache")  # 修改：缓存目录重命名为shapefile_cache
    
    def fetch_data(self, country_code: Optional[str] = None, resolution: str = "110m") -> Dict[str, Any]:
        """获取国家边界数据（从Shapefile解析）"""
        self._log_fetch("Natural Earth", country_code)
        
        # 创建缓存目录
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # 获取Shapefile路径（从缓存或下载）
        shp_path = self._get_shapefile_path(resolution)
        if not shp_path:
            return {}
        
        # 如果请求特定国家，从Shapefile提取单个国家数据
        if country_code:
            return self._extract_country(shp_path, normalize_country_code(country_code))
        
        # 获取完整数据集（所有国家）
        return self._extract_all_countries(shp_path)
    
    def _get_shapefile_path(self, resolution: str) -> Optional[str]:
        """获取Shapefile主文件(.shp)路径（从缓存或下载）"""
        # Shapefile文件名前缀（无扩展名）
        base_filename = f"ne_{resolution}_admin_0_countries"
        zip_url = f"{self.BASE_URL}/{resolution}_cultural/{base_filename}.zip"
        shp_path = self.CACHE_DIR / f"{base_filename}.shp"
        
        # 检查缓存中是否存在完整的Shapefile文件集（.shp, .shx, .dbf等）
        required_extensions = ['.shp', '.shx', '.dbf', '.prj']
        if all((self.CACHE_DIR / f"{base_filename}{ext}").exists() for ext in required_extensions):
            return str(shp_path)
        
        # 缓存不存在，下载并解压Shapefile
        if not self._download_and_extract_shapefile(zip_url, base_filename):
            return None
            
        return str(shp_path)
    
    def _download_and_extract_shapefile(self, url: str, base_filename: str) -> bool:
        """下载并解压Shapefile文件集"""
        logger.info(f"Downloading Shapefile from {url}")
        try:
            response = self.client.get(url, stream=True)
            response.raise_for_status()
            
            # 解压所有文件到缓存目录
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                # 验证Shapefile必需文件是否存在
                required_files = [f"{base_filename}{ext}" for ext in ['.shp', '.shx', '.dbf']]
                if not all(file in z.namelist() for file in required_files):
                    logger.error("Shapefile缺少必需文件(.shp, .shx, .dbf)")
                    return False
                
                # 解压所有文件
                z.extractall(self.CACHE_DIR)
                logger.info(f"Shapefile解压完成，保存至{self.CACHE_DIR}")
                return True
        except Exception as e:
            logger.error(f"Shapefile下载/解压失败: {str(e)}")
            return False
    
    def _extract_all_countries(self, shp_path: str) -> Dict[str, Any]:
        """从Shapefile提取所有国家数据，转换为GeoJSON FeatureCollection"""
        try:
            sf = shapefile.Reader(shp_path, encoding='latin-1')  # 处理编码问题
            fields = [f[0] for f in sf.fields[1:]]  # 获取属性字段名（排除删除标记字段）
            features = []
            
            # 遍历所有国家记录
            for record, shape in zip(sf.iterRecords(), sf.iterShapes()):
                attributes = dict(zip(fields, record))
                country_feature = self._create_country_feature(attributes, shape)
                if country_feature:
                    features.append(country_feature)
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
        except Exception as e:
            logger.error(f"提取所有国家数据失败: {str(e)}")
            return {}
    
    def _extract_country(self, shp_path: str, country_code: str) -> Dict[str, Any]:
        """从Shapefile提取单个国家数据"""
        try:
            sf = shapefile.Reader(shp_path, encoding='latin-1')
            fields = [f[0] for f in sf.fields[1:]]
            
            # 遍历记录查找匹配国家代码的记录
            for record, shape in zip(sf.iterRecords(), sf.iterShapes()):
                attributes = dict(zip(fields, record))
                # Natural Earth使用ISO_A2作为2位国家代码，ISO_A3作为3位代码
                if attributes.get('ISO_A2') == country_code or attributes.get('ISO_A3') == country_code:
                    return self._create_country_feature(attributes, shape)
            
            logger.warning(f"国家代码 {country_code} 未在Shapefile中找到")
            return {}
        except Exception as e:
            logger.error(f"提取国家 {country_code} 数据失败: {str(e)}")
            return {}
    
    def _create_country_feature(self, attributes: Dict[str, Any], shape: shapefile.Shape) -> Optional[Dict[str, Any]]:
        """将Shapefile记录转换为GeoJSON Feature"""
        try:
            # 转换Shapefile几何对象为GeoJSON格式
            geometry = self._shape_to_geojson(shape)
            if not geometry:
                logger.warning(f"无法解析几何数据: {attributes.get('NAME')}")
                return None
            
            # 构建Feature对象
            return {
                "type": "Feature",
                "properties": {
                    "country_id": attributes.get('ISO_A2') or attributes.get('ISO_A3', ''),
                    "name": attributes.get('NAME', ''),
                    "official_name": attributes.get('NAME_OFF', ''),
                    "iso_a2": attributes.get('ISO_A2', ''),
                    "iso_a3": attributes.get('ISO_A3', ''),
                    "region": attributes.get('REGION_WB', ''),  # 世界银行区域分类
                    "population": attributes.get('POP_EST', 0),  # 估计人口
                    "area_km2": attributes.get('AREA_KM2', 0)  # 面积（平方公里）
                },
                "geometry": geometry
            }
        except Exception as e:
            logger.error(f"转换国家数据失败: {str(e)}，属性数据: {attributes}")
            return None
    
    def _shape_to_geojson(self, shape: shapefile.Shape) -> Optional[Dict[str, Any]]:
        """将Shapefile几何对象转换为GeoJSON几何格式"""
        try:
            # 处理多边形（单个多边形）
            if shape.shapeType == shapefile.POLYGON:
                return {
                    "type": "Polygon",
                    "coordinates": [shape.points[i:i+shape.parts[j+1]] 
                                   for j, i in enumerate(shape.parts[:-1])]
                }
            
            # 处理多多边形（国家包含多个多边形，如岛屿）
            elif shape.shapeType == shapefile.MULTIPOLYGON:
                polygons = []
                parts = shape.parts
                for i in range(len(parts) - 1):
                    start_idx = parts[i]
                    end_idx = parts[i+1]
                    polygons.append([shape.points[start_idx:end_idx]])  # 注意嵌套列表结构
                return {"type": "MultiPolygon", "coordinates": polygons}
            
            # 其他几何类型（点、线等，暂不支持）
            else:
                logger.warning(f"不支持的几何类型: {shape.shapeType}")
                return None
                
        except Exception as e:
            logger.error(f"几何数据转换失败: {str(e)}")
            return None