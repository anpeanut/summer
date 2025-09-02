from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
import json

def normalize_country_code(code: Any) -> str:
    """标准化国家代码为2字母格式"""
    if not code or not isinstance(code, str):
        return ""
    return code.upper()[:2]

def parse_decimal(value: Any) -> Decimal:
    """将各种数值类型转换为Decimal"""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except:
        return None

def parse_date(date_str: str, formats: List[str] = ["%Y-%m-%d", "%Y"]) -> datetime:
    """尝试多种格式解析日期"""
    if not date_str:
        return None
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def merge_dicts(base: Dict, update: Dict) -> Dict:
    """深度合并两个字典"""
    for key, value in update.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            merge_dicts(base[key], value)
        else:
            base[key] = value
    return base