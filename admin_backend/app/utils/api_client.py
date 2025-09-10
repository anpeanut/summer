import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Optional, Dict, Any
import json
from ..config import Config
from .logging import get_logger

logger = get_logger(__name__)

class APIClient:
    def __init__(self):
        self.session = requests.Session()
        retries = Retry(
            total=Config.MAX_RETRIES,
            backoff_factor=1,
            status_forcelist=[500, 502, 503, 504]
        )
        self.session.mount('https://', HTTPAdapter(max_retries=retries))
    
    def get(self, url: str, params: Optional[Dict] = None, headers: Optional[Dict] = None, stream: bool = False) -> Any:
        try:
            response = self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=Config.REQUEST_TIMEOUT,
                stream=stream
            )
            response.raise_for_status()
            return response.json() if not stream else response
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            
    
    def close(self):
        self.session.close()