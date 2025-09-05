from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import update, insert, delete
from sqlalchemy.exc import SQLAlchemyError
from app.utils.logging import get_logger
from app.models import Country, CountryGeoJSON, Demographic, Economy
from app.utils.data_utils import parse_decimal, normalize_country_code
from .restcountries import RestCountriesSource
from .worldbank import WorldBankSource
from .naturalearth import NaturalEarthSource
import time
from app import db

logger = get_logger(__name__)

class DataUpdater:
    def __init__(self, batch_size: int = 50):
        self.batch_size = batch_size  # 批量处理大小
        self.sources = {
            "restcountries": RestCountriesSource(),
            "worldbank": WorldBankSource(),
            "naturalearth": NaturalEarthSource()
        }
        # 存储已处理国家代码，避免重复处理
        self.processed_countries = set()

    # ------------------------------
    # 批量更新所有国家数据（核心接口）
    # ------------------------------
    def batch_update_all_countries(self) -> Dict[str, Any]:
        """批量更新所有国家数据（支持断点续传）"""
        result = {
            "status": "processing",
            "total": 0,
            "updated": 0,
            "failed": 0,
            "failed_countries": [],
            "start_time": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        try:
            # 1. 获取所有国家基础信息（作为国家列表来源）
            logger.info("Fetching all countries list from REST Countries...")
            all_countries = self.sources["restcountries"].fetch_data()  # 获取所有国家列表
            if not isinstance(all_countries, list):
                raise ValueError("Failed to get country list")
            
            result["total"] = len(all_countries)
            logger.info(f"Found {len(all_countries)} countries to process")

            # 2. 批量处理国家数据（按批次）
            for i in range(0, len(all_countries), self.batch_size):
                batch = all_countries[i:i+self.batch_size]
                batch_result = self._process_country_batch(batch)
                
                # 更新统计结果
                result["updated"] += batch_result["updated"]
                result["failed"] += batch_result["failed"]
                result["failed_countries"].extend(batch_result["failed_countries"])
                
                logger.info(f"Processed batch {i//self.batch_size + 1}/"
                          f"{(len(all_countries)-1)//self.batch_size + 1} "
                          f"| Updated: {batch_result['updated']} | Failed: {batch_result['failed']}")

            result["status"] = "completed"
            result["end_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"Batch update completed. Total: {result['total']}, "
                      f"Updated: {result['updated']}, Failed: {result['failed']}")

        except Exception as e:
            logger.error(f"Batch update failed: {str(e)}", exc_info=True)
            result["status"] = "error"
            result["error"] = str(e)
            result["end_time"] = time.strftime("%Y-%m-%d %H:%M:%S")

        return result

    def _process_country_batch(self, batch: List[Dict]) -> Dict[str, Any]:
        """处理单个国家批次（提高效率）"""
        batch_result = {"updated": 0, "failed": 0, "failed_countries": []}
        
        for country in batch:
            country_code = country.get("id")
            if not country_code or country_code in self.processed_countries:
                continue

            try:
                # 1. 批量插入国家基础信息（跳过已处理国家）
                if self._upsert_country(country):
                    # 2. 并行/串行获取其他数据源（根据API限制选择）
                    # 这里使用串行方式避免触发API速率限制
                    wb_data = self.sources["worldbank"].fetch_data(country_code)
                    geojson_data = self.sources["naturalearth"].fetch_data(country_code)

                    # 3. 更新关联数据
                    if wb_data:
                        self._upsert_demographics(country_code, wb_data)
                        self._upsert_economy(country_code, wb_data)
                    
                    if geojson_data and isinstance(geojson_data, dict):
                        self._upsert_geojson(country_code, geojson_data)

                    self.processed_countries.add(country_code)
                    batch_result["updated"] += 1

            except Exception as e:
                logger.warning(f"Failed to process {country_code}: {str(e)}")
                batch_result["failed"] += 1
                batch_result["failed_countries"].append({
                    "code": country_code,
                    "name": country.get("name", "Unknown"),
                    "error": str(e)
                })

        return batch_result
    
    def update_country(self, country_code: str) -> Dict[str, Any]:
        """更新单个国家数据（精简版，直接处理数据库操作）"""
        result = {"country": country_code, "status": "processing", "updated": []}
        country_code = normalize_country_code(country_code)
        
        try:
            # 1. 更新国家基本信息
            base_data = self.sources["restcountries"].fetch_data(country_code)
            if base_data and self._upsert_country(base_data):
                result["updated"].append("country")
            
            # 2. 更新经济人口数据
            wb_data = self.sources["worldbank"].fetch_data(country_code)
            if wb_data:
                if self._upsert_demographics(country_code, wb_data):
                    result["updated"].append("demographics")
                if self._upsert_economy(country_code, wb_data):
                    result["updated"].append("economy")
            
            # 3. 更新GeoJSON边界数据
            geojson_data = self.sources["naturalearth"].fetch_data(country_code)
            if geojson_data and isinstance(geojson_data, dict):
                if self._upsert_geojson(geojson_data):
                    result["updated"].append("geojson")
            
            result["status"] = "success"
            
        except Exception as e:
            logger.error(f"Update failed for {country_code}: {str(e)}")
            result["status"] = "error"
            result["error"] = str(e)
        
        return result
    
    # ------------------------------
    # 数据库操作方法（有SELECT权限的优化版）
    # ------------------------------
    def _upsert_country(self, country_data: Dict[str, Any]) -> bool:
        #print("country_data: ", country_data)
        #return True # 临时跳过数据库操作，避免重复插入

        """更新/插入国家基本信息（有SELECT权限优化版）"""
        country_id = country_data.get("id")
        if not country_id:
            return False

        try:
            # 使用ORM方式查询并更新/插入
            country = db.session.query(Country).get(country_id)

            if country:
                # 更新现有记录
                country.name = country_data.get("name", "")
                country.population = country_data.get("population", 0)
                country.capital = country_data.get("capital", "")
                country.longitude = parse_decimal(country_data.get("longitude", 0))
                country.latitude = parse_decimal(country_data.get("latitude", 0))
                country.data_completeness = self._calculate_completeness(country_data)
            else:
                # 插入新记录
                country = Country(
                    id=country_id,
                    name=country_data.get("name", ""),
                    population=country_data.get("population", 0),
                    capital=country_data.get("capital", ""),
                    longitude=parse_decimal(country_data.get("longitude", 0)),
                    latitude=parse_decimal(country_data.get("latitude", 0)),
                    data_completeness=self._calculate_completeness(country_data)
                )
                db.session.add(country)

            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Country upsert failed: {str(e)}")
            return False

    def _upsert_geojson(self, country_id: str, geojson_data: Dict[str, Any]) -> bool:
        #print("geojson_data: ", geojson_data)
        #return True # 临时跳过数据库操作，避免重复插入

        """更新/插入GeoJSON数据（有SELECT权限优化版）"""
        
        print("country_id:", country_id)
        if not country_id:
            return False

        try:
            geojson = db.session.query(CountryGeoJSON).where(CountryGeoJSON.country_id == country_id).first()

            if geojson:
                geojson.feature_type = 'FeatureCollection'
                geojson.geometry_type = geojson_data.get("geometry", {}).get("type")
                geojson.coordinates = {"type": "FeatureCollection", "features": [geojson_data]}
            else:
                geojson = CountryGeoJSON(
                    country_id=country_id,
                    feature_type='FeatureCollection',
                    geometry_type=geojson_data.get("geometry", {}).get("type"),
                    coordinates={"type": "FeatureCollection", "features": [geojson_data]}
                )
                db.session.add(geojson)
            print("geojson:", geojson)

            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"GeoJSON upsert failed: {str(e)}")
            return False

    def _upsert_demographics(self, country_id: str, demo_data: Dict[str, Any]) -> bool:
        #print("demo_data: ", demo_data)
        #return True # 临时跳过数据库操作，避免重复插入

        """更新/插入人口统计数据（有SELECT权限优化版）"""
        try:
            demo = db.session.query(Demographic).get(country_id)

            if demo:
                demo.urban_ratio = parse_decimal(demo_data.get("demographics", {}).get("urban_population") / 100) if demo_data.get("demographics", {}).get("urban_population") is not None else None
                demo.gender_ratio = parse_decimal(demo_data.get('demographics', {}).get("gender_ratio"))
                demo.median_age = parse_decimal(demo_data.get('demographics', {}).get("median_age"))
                demo.birth_rate = parse_decimal(demo_data.get('demographics', {}).get("birth_rate"))
            else:
                demo = Demographic(
                    country_id=country_id,
                    urban_ratio=parse_decimal(demo_data.get("demographics", {}).get("urban_population") / 100) if demo_data.get("demographics", {}).get("urban_population") is not None else None,
                    gender_ratio=parse_decimal(demo_data.get('demographics', {}).get("gender_ratio")),
                    median_age=parse_decimal(demo_data.get('demographics', {}).get("median_age")),
                    birth_rate=parse_decimal(demo_data.get('demographics', {}).get("birth_rate"))
                )
                db.session.add(demo)

            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Demographics upsert failed: {str(e)}")
            return False

    def _upsert_economy(self, country_id: str, economy_data: Dict[str, Any]) -> bool:
        #print("economy_data: ", economy_data)
        #return True # 临时跳过数据库操作，避免重复插入

        """更新/插入经济数据（有SELECT权限优化版）"""
        try:
            economy = db.session.query(Economy).get(country_id)

            if economy:
                economy.gdp_per_capita = parse_decimal(economy_data.get("economy", {}).get("gdp"))
                economy.internet_penetration = parse_decimal(economy_data.get("economy", {}).get("internet_penetration"))
            else:
                economy = Economy(
                    country_id=country_id,
                    gdp_per_capita=parse_decimal(economy_data.get("economy", {}).get("gdp")),
                    internet_penetration=parse_decimal(economy_data.get("economy", {}).get("internet_penetration"))
                )
                db.session.add(economy)

            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Economy upsert failed: {str(e)}")
            return False
    
    def delete_country(self, country_id: str) -> bool:
        """删除国家所有数据（级联删除）"""
        try:
            # 按顺序删除关联表数据
            db.session.execute(delete(Demographic).where(Demographic.country_id == country_id))
            db.session.execute(delete(Economy).where(Economy.country_id == country_id))
            db.session.execute(delete(CountryGeoJSON).where(CountryGeoJSON.country_id == country_id))
            result = db.session.execute(delete(Country).where(Country.id == country_id))
            db.session.commit()
            return result.rowcount > 0
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Delete failed: {str(e)}")
            return False
    
    # ------------------------------
    # 辅助方法
    # ------------------------------
    def _calculate_completeness(self, data: Dict[str, Any]) -> float:
        """计算数据完整度"""
        required = ["name", "population", "capital", "longitude", "latitude"]
        present = sum(1 for field in required if data.get(field) not in (None, ""))
        return round(present / len(required), 2) if required else 0.0
    
    def close(self):
        """关闭所有资源"""
        for source in self.sources.values():
            source.close()