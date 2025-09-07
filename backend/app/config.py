import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    # AI 服务配置
    SILICONFLOW_API_KEY = os.environ.get('SILICONFLOW_API_KEY')
    SILICONFLOW_API_BASE = os.environ.get('SILICONFLOW_API_BASE')
    SILICONFLOW_MODEL_NAME = os.environ.get('SILICONFLOW_MODEL_NAME') or "deepseek-ai/DeepSeek-V3"
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://username:password@localhost:5432/dbname'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 可选：连接池配置
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'max_overflow': 20,
        'pool_timeout': 30,
        'pool_recycle': 3600
    }

    MAX_RETRIES = 3

    REQUEST_TIMEOUT = (3.05, 27) 

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
