from cerberus import Validator
from app.schemas.country import country_schema
from app import db
from app.models import Country, Demographic
from app.utils.api_response import APIResponse
import random
from sqlalchemy import func

class CountryService:
    @staticmethod
    def validate_country_data(input_data: dict) -> tuple:
        validator = Validator(country_schema)
        if not validator.validate(input_data):
            print("Cerberus validation errors:", validator.errors)
            return False, validator.errors
        return True, validator.normalized(input_data)
    
    @staticmethod
    def get_default_country() -> dict:
        valid, data = CountryService.validate_country_data({})
        return data
    
    @staticmethod
    def get_country() -> tuple[bool, dict]:
        flag, country = CountryService.get_random_country_by_birth_weight()
        if flag:
            valid, data = CountryService.validate_country_data(country)
            if valid:
                return True, APIResponse.success(data)
            else:
                return False, APIResponse.error("400", "Invalid country data", str(data))
        else:
            return False, country # 返回错误信息
    
    @staticmethod
    def get_country_data(country_code: str) -> tuple[bool, dict]:
        """获取国家完整数据 (ORM实现)"""
        # 使用SQLAlchemy查询国家数据（自动关联关系）
        country = Country.query.filter_by(id=country_code.upper()).first()
        
        if not country:
            return False, APIResponse.error("404", "国家数据不存在")
        
        # 构建响应数据
        return True, {
                "id": country.id,
                "name": country.name,
                "population": country.population,
                "capital": country.capital,
                "location": {
                    "type": "Point",
                    "coordinates": [float(country.longitude), float(country.latitude)]
                },
                "geoJson": CountryService._format_geojson(country.geojson),
                "storySeed": CountryService._format_story_seed(country)
            }
    
    @staticmethod
    def _format_geojson(geojson_data):
        """格式化地理数据"""
        if not geojson_data:
            return {"type": "FeatureCollection", "features": []}
        
        return geojson_data.coordinates
    
    @staticmethod
    def _format_story_seed(country):
        """格式化故事种子数据"""
        if not country:
            return None
            
        return {
            "demographics": CountryService._format_demographics(country.demographics),
            "education": CountryService._format_education(country.education),
            "environment": CountryService._format_environment(country),
            "milestones": CountryService._format_milestones(country.milestones),
            "historicalEvents": CountryService._format_events(country.events)
        }
    
    # ------------------------------
    # 以下为内部格式化辅助方法
    # ------------------------------
    @staticmethod
    def _format_demographics(demographics):
        if not demographics:
            return None
        return {
            "gender_ratio": float(demographics.gender_ratio),
            "urban_ratio": float(demographics.urban_ratio),
            "median_age": demographics.median_age
        }
    
    @staticmethod
    def _format_education(education):
        if not education:
            return None
        return {
            "school_start_age": education.school_start_age,
            "high_school_rate": float(education.high_school_rate),
            "university_rate": float(education.university_rate)
        }
    
    @staticmethod
    def _format_environment(country):
        if not country.economy:
            return None
        return {
            "gdp_per_capita": float(country.economy.gdp_per_capita),
            "internet_penetration": float(country.economy.internet_penetration),
            "main_industries": [i.industry_name for i in country.industries]
        }
    
    @staticmethod
    def _format_milestones(milestones):
        if not milestones:
            return None
        return {
            "avg_marriage_age": milestones.avg_marriage_age,
            "avg_first_child_age": milestones.avg_first_child_age,
            "life_expectancy": milestones.life_expectancy
        }
    
    @staticmethod
    def _format_events(events):
        if not events:
            return []
        # 按年份倒序排序
        sorted_events = sorted(events, key=lambda x: x.event_year, reverse=True)
        return [
            {
                "name": e.event_name,
                "year": e.event_year,
                "impact": e.impact_type
            } for e in sorted_events
        ]
    
    @staticmethod
    def get_random_country_by_birth_weight() -> tuple[bool, dict]:
        """按出生率×总人口加权随机选择国家"""
        try:
            # 1. 查询国家基础数据和出生率（处理缺失值）
            countries_data = db.session.query(
                Country.id, 
                Country.name,
                Country.population,
                func.coalesce(Demographic.birth_rate, 15.0).label('adjusted_birth_rate')  # 缺失值用15.0替代
            ).outerjoin(  # 使用outerjoin确保即使没有demographics记录也能查询到国家
                Demographic, 
                Country.id == Demographic.country_id
            ).filter(
                Country.population > 0,  # 确保人口数据有效
                func.coalesce(Demographic.birth_rate, 15.0) > 0  # 确保出生率有效
            ).all()

            if not countries_data:
                return False, APIResponse.error("500", "没有可用的国家数据")

            # 2. 计算权重（出生率×总人口）并提取国家信息
            country_ids = []
            weights = []
            country_info = {}
            
            for item in countries_data:
                country_id = item.id
                # 计算权重：出生率(‰) × 总人口(人) → 转换为以万为单位避免数值过大
                weight = (float(item.adjusted_birth_rate) / 1000) * item.population / 10000
                
                country_ids.append(country_id)
                weights.append(weight)
                country_info[country_id] = {
                    "name": item.name,
                    "population": item.population,
                    "birth_rate": float(item.adjusted_birth_rate),
                    "weight": weight
                }

            # 3. 按权重随机选择国家
            selected_country_id = random.choices(
                population=country_ids,
                weights=weights,
                k=1
            )[0]

            # 4. 记录选择日志（可选）
            selected = country_info[selected_country_id]
            print(f"随机选择结果: {selected['name']} (权重: {selected['weight']:.2f}万新生儿当量)")

            # 5. 返回选中国家的完整数据
            return CountryService.get_country_data(selected_country_id)
            
        except Exception as e:
            print(f"随机选择国家失败: {str(e)}")
            return False, APIResponse.error("500", "随机选择国家时发生错误")