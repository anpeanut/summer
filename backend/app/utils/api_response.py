from datetime import datetime
from typing import Dict, Any, Optional
from flask import jsonify
from .metadata import Metadata

class APIResponse:
    """标准化API响应封装"""
    
    @staticmethod
    def success(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        成功响应格式
        :param data: 要返回的数据
        :return: 标准化响应字典
        """
        return {
            "apiVersion": "1.0",
            "success": True,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": data,
            "metadata": Metadata.get_metadata()
        }

    @staticmethod
    def error(code: str, message: str, details: Optional[str] = None) -> Dict[str, Any]:
        """
        错误响应格式
        :param code: 错误代码
        :param message: 错误消息
        :param details: 错误详情(可选)
        :return: 标准化错误响应字典
        """
        return {
            "apiVersion": "1.0",
            "success": False,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "error": {
                "code": code,
                "message": message,
                "details": details or message
            },
            "metadata": Metadata.get_metadata()
        }

    @staticmethod
    def json_success(data: Dict[str, Any]):
        """返回JSON格式的成功响应"""
        return jsonify(APIResponse.success(data))

    @staticmethod
    def json_error(code: str, message: str, details: Optional[str] = None, status_code: int = 400):
        """返回JSON格式的错误响应"""
        return jsonify(APIResponse.error(code, message, details)), status_code