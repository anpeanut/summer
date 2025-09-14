from abc import ABC, abstractmethod
from typing import Dict, List, Any
import logging
from ..utils.api_client import APIClient

logger = logging.getLogger(__name__)

class BaseDataSource(ABC):
    def __init__(self):
        self.client = APIClient()
    
    @abstractmethod
    def fetch_data(self, country_code: str = None) -> Dict[str, Any]:
        """获取数据抽象方法"""
        print("Fetching data...(base)")
        pass
    
    def close(self):
        """关闭资源"""
        self.client.close()
    
    def _log_fetch(self, source_name: str, country_code: str = None):
        """记录数据获取日志"""
        target = f"for country {country_code}" if country_code else "all countries"
        logger.info(f"Fetching data from {source_name} {target}")