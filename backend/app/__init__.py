from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    
    # 注册蓝图
    from app.routes.main import bp as main_bp
    from app.routes.docs import bp as docs_bp
    from app.routes.api import bp as api_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(docs_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app