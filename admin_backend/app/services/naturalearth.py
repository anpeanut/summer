from .base_source import BaseDataSource
from typing import Dict, Any, Optional, List
import logging
import requests
import zipfile
import io
import os
from pathlib import Path
import json
import tempfile
import pickle
from typing import Dict, Any, Optional, List
import shapefile  # 新增：导入pyshp库解析Shapefile
from shapely.geometry import shape  # 新增：处理几何数据
from shapely.geometry.base import BaseGeometry
from shapely.errors import TopologicalError
from app.utils.data_utils import normalize_country_code

logger = logging.getLogger(__name__)

class NaturalEarthSource(BaseDataSource):
    BASE_URL = "https://naturalearth.s3.amazonaws.com"
    CHINA_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000.json"
    CACHE_DIR = Path("app/static/shapefile_cache")  # 修改：缓存目录重命名为shapefile_cache

    def __init__(self):
        self._index_file = None  # 索引临时文件路径
        self._data_file = None   # 数据临时文件路径
        self._index = {}         # 内存中的索引 {country_code: file_position}
        self._loaded = False     # 标记是否已加载索引
    
    def fetch_data(self, country_code: Optional[str] = None, resolution: str = "110m", if_update_all: bool = True) -> Dict[str, Any]:
        """获取国家边界数据（从Shapefile解析）"""
        self._log_fetch("Natural Earth", country_code)
        
        # 创建缓存目录
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # 获取Shapefile路径（从缓存或下载）
        shp_path = self._get_shapefile_path(resolution)
        if not shp_path:
            return {}
        
        if not if_update_all:
            if country_code:
                return self._extract_country(shp_path, country_code)
            return {}

        if not self._loaded:
            self._extract_all_countries(shp_path=shp_path)

        # 如果请求特定国家，从Shapefile提取单个国家数据
        if country_code:
            if country_code.upper() == "CN":
                # 特例：中国使用GeoJSON数据源
                try:
                    response = requests.get(self.CHINA_URL)
                    response.raise_for_status()
                    print("HTTP状态码:", response.status_code)  # 应显示200
                    print("响应前100字符:", response.text[:100])  # 查看实际返回内容
                    return response.json().get("features", {})[0]  # 返回中国的GeoJSON数据
                except Exception as e:
                    logger.error(f"获取中国GeoJSON数据失败: {str(e)}")
                    return {}
            return self._get_country_by_code(normalize_country_code(country_code))
        
        # 获取完整数据集（所有国家）
        return self._extract_all_countries(shp_path)
    
    def _get_all_countries(self) -> List[Dict[str, Any]]:
        """获取所有国家数据"""
        if not self._loaded:
            raise RuntimeError("请先调用 _extract_all_countries 构建索引")
        
        countries = []
        try:
            with open(self._data_file, 'r', encoding='utf-8') as data_f:
                for line in data_f:
                    countries.append(json.loads(line))
            return countries
        except Exception as e:
            logger.error(f"获取所有国家数据失败: {str(e)}")
            return []

    def _cleanup_temp_files(self) -> None:
        """清理临时文件"""
        for file_path in [self._index_file, self._data_file]:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning(f"删除临时文件失败: {file_path}, 错误: {str(e)}")
        
        self._index_file = None
        self._data_file = None
        self._index = {}
        self._loaded = False
        logger.info("已清理临时索引文件")
    
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
        """一次性提取所有国家数据并构建索引"""
        print('构建国家数据索引...')
        # 如果已经加载过，先清理旧文件
        if self._loaded:
            self._cleanup_temp_files()
        
        # 创建临时文件
        self._index_file = tempfile.mktemp(prefix="ne_country_index_", suffix=".pkl")
        self._data_file = tempfile.mktemp(prefix="ne_country_data_", suffix=".json")
        
        try:
            sf = shapefile.Reader(shp_path, encoding='latin-1')
            fields = [f[0] for f in sf.fields[1:]]
            
            with open(self._data_file, 'w', encoding='utf-8') as data_f:
                for i, (record, shape) in enumerate(zip(sf.iterRecords(), sf.iterShapes())):
                    attributes = dict(zip(fields, record))
                    feature = self._create_country_feature(attributes, shape)
                    
                    if feature:
                        # 记录文件位置（换行符需要考虑）
                        position = data_f.tell()
                        
                        # 写入JSON数据并换行
                        json.dump(feature, data_f, ensure_ascii=False)
                        data_f.write('\n')
                        
                        # 更新索引（支持ISO_A2和ISO_A3）
                        iso_a2 = feature['properties']['iso_a2']
                        iso_a3 = feature['properties']['iso_a3']
                        
                        if iso_a2:
                            self._index[iso_a2] = position
                        if iso_a3:
                            self._index[iso_a3] = position
            
            # 保存索引到文件
            with open(self._index_file, 'wb') as index_f:
                pickle.dump(self._index, index_f)
            
            self._loaded = True
            logger.info(f"成功构建国家数据索引，共索引 {len(self._index)} 个国家")
            print(f"成功构建国家数据索引，共索引 {len(self._index)} 个国家")
            
        except Exception as e:
            self._cleanup_temp_files()
            logger.error(f"构建国家数据索引失败: {str(e)}")
            raise
    
    def _extract_country(self, shp_path: str, country_code: str) -> Dict[str, Any]:
        """从Shapefile提取单个国家数据"""
        print(f"extract {country_code}...")
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

    def _get_country_by_code(self, country_code: str) -> Dict[str, Any]:
        """通过国家代码快速查询国家数据"""
        print(f'get {country_code} geojson from geojson cache')
        if not self._loaded:
            raise RuntimeError("请先调用 _extract_all_countries 构建索引")
        
        try:
            position = self._index.get(country_code)
            if position is None:
                logger.warning(f"未找到国家代码: {country_code}")
                return None
            
            with open(self._data_file, 'r', encoding='utf-8') as data_f:
                data_f.seek(position)
                line = data_f.readline()
                return json.loads(line)
        
        except Exception as e:
            logger.error(f"查询国家数据失败: {str(e)}")
            return None
    
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
            # 处理多边形（单个多边形或多个部分组成的多边形）
            if shape.shapeType in [shapefile.POLYGON, shapefile.POLYGONZ]:
                # 检查是否有多个部分（即是否是多部分多边形）
                if len(shape.parts) > 1:
                    # 处理多部分多边形（如国家包含多个岛屿）
                    polygons = []
                    parts = list(shape.parts) + [len(shape.points)]  # 确保parts是列表
                    for i in range(len(parts) - 1):
                        start_idx = parts[i]
                        end_idx = parts[i+1]
                        # 确保每个多边形部分是列表的列表
                        polygon_part = [list(map(list, shape.points[start_idx:end_idx]))]
                        polygons.append(polygon_part)
                    return {"type": "MultiPolygon", "coordinates": polygons}
                else:
                    # 单一部分的多边形
                    return {
                        "type": "Polygon",
                        "coordinates": [list(map(list, shape.points))]  # 转换为列表的列表
                    }

            # 其他几何类型（点、线等，暂不支持）
            else:
                logger.warning(f"不支持的几何类型: {shape.shapeType}")
                return None

        except Exception as e:
            logger.error(f"几何数据转换失败: {str(e)}")
            return None