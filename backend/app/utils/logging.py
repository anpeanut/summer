import os
import sys
import logging
from pathlib import Path  # 推荐使用Path处理跨平台路径
from datetime import datetime
from logging.handlers import RotatingFileHandler
from typing import Optional

# ------------------------------
# 核心路径配置（Azure + 静态文件夹适配）
# ------------------------------
def get_project_root() -> Path:
    """获取项目根目录（兼容不同部署环境）"""
    # 方法1：从当前文件路径向上推导（最可靠）
    current_path = Path(__file__).resolve()  # app/utils/logging.py的绝对路径
    return current_path.parent.parent.parent  # 上三级目录（utils -> app -> project_root）

    # 方法2：通过环境变量获取（Azure App Service可配置）
    # return Path(os.getenv("APP_HOME", os.getcwd()))

# 静态日志目录路径（关键修改）
PROJECT_ROOT = get_project_root()
STATIC_LOGS_DIR = PROJECT_ROOT / "static" / "logs"  # 等价于 static/logs

# 确保目录存在（Azure环境可能需要手动创建权限）
STATIC_LOGS_DIR.mkdir(parents=True, exist_ok=True)  # 递归创建，已存在则忽略

# 默认日志格式
DEFAULT_LOG_FORMAT = (
    "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s"
)
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
LOG_LEVEL_MAP = {"DEBUG": logging.DEBUG, "INFO": logging.INFO, "WARNING": logging.WARNING, "ERROR": logging.ERROR, "CRITICAL": logging.CRITICAL}

# ------------------------------
# 日志器创建函数（修改路径部分）
# ------------------------------
def get_logger(
    name: str,
    log_file: Optional[str] = None,
    level: str = "INFO",
    max_bytes: int = 10 * 1024 * 1024,  # 10MB/文件
    backup_count: int = 5,  # 最多保留5个备份
    formatter: Optional[logging.Formatter] = None
) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL_MAP.get(level.upper(), logging.INFO))
    logger.propagate = False  # 防止重复日志

    # 移除已有处理器避免重复
    if logger.handlers:
        logger.handlers = []

    # 日志格式器
    if not formatter:
        formatter = logging.Formatter(fmt=DEFAULT_LOG_FORMAT, datefmt=DEFAULT_DATE_FORMAT)

    # 1. 添加控制台处理器（始终启用）
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 2. 添加文件处理器（指定日志文件时）
    if log_file:
        # 带日期的日志文件名（如：data_updater_20250902.log）
        date_str = datetime.now().strftime("%Y%m%d")
        log_filename = f"{log_file}_{date_str}.log"
        
        # 关键路径：拼接static/logs目录
        log_file_path = STATIC_LOGS_DIR / log_filename  # 等价于 os.path.join(STATIC_LOGS_DIR, log_filename)

        # 创建按大小轮换的文件处理器
        file_handler = RotatingFileHandler(
            str(log_file_path),  # Path对象转字符串（兼容Python 3.8+）
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8"  # 确保中文正常写入
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        # 调试：打印日志文件路径（部署时可注释）
        logger.debug(f"Log file path: {log_file_path}")

    return logger

# ------------------------------
# 其他辅助函数保持不变（log_exception、log_performance）
# ------------------------------
def log_exception(logger: logging.Logger, message: str, exc_info: Exception) -> None:
    logger.error(f"{message} | Exception: {str(exc_info)}", exc_info=True)

def log_performance(logger: logging.Logger, action: str, duration: float, details: dict = None) -> None:
    details_str = f" | Details: {details}" if details else ""
    logger.info(f"Performance | Action: {action} | Duration: {duration:.4f}s{details_str}")