from cerberus import Validator
from typing import Tuple, Dict, Any
from .api_response import APIResponse

class RequestValidator:
    """请求参数验证器基类"""
    
    @staticmethod
    def validate(schema: Dict[str, Any], input_data: Dict[str, Any]) -> Tuple[bool, Any]:
        """
        通用验证方法
        :param schema: 验证规则schema
        :param input_data: 输入数据
        :return: (是否验证通过, 验证结果或错误信息)
        """
        validator = Validator(schema)
        if not validator.validate(input_data):
            return False, validator.errors
        return True, validator.normalized(input_data)

    @staticmethod
    def validate_with_response(schema: Dict[str, Any], input_data: Dict[str, Any]):
        """
        带响应格式的验证方法
        :param schema: 验证规则schema
        :param input_data: 输入数据
        :return: 验证通过返回规范化数据，失败返回API错误响应
        """
        is_valid, result = RequestValidator.validate(schema, input_data)
        if not is_valid:
            return APIResponse.json_error(
                code="400",
                message="Invalid request data",
                details=str(result)
            )
        return result