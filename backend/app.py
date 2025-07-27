from flask import Flask, render_template, jsonify, request
from datetime import datetime
from typing import Dict, Any, Optional
from cerberus import Validator  # 参数校验库
import os

app = Flask(__name__)

# 国家数据Schema校验规则
country_schema = {
    'id': {'type': 'string', 'required': False, 'default': 'CN'},
    'name': {'type': 'string', 'required': False, 'default': '中国'},
    'population': {'type': 'integer', 'required': False, 'default': 1412000000},
    'capital': {'type': 'string', 'required': False, 'default': '北京'},
    'location': {
        'type': 'dict',
        'required': False,
        'default': {'type': 'Point', 'coordinates': [104.1954, 35.8617]},
        'schema': {
            'type': {'type': 'string', 'allowed': ['Point']},
            'coordinates': {
                'type': 'list',
                'items': [{'type': 'float'}, {'type': 'float'}]
            }
        }
    }
}

class APIResponse:
    """标准化API响应封装"""
    @staticmethod
    def success(data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "apiVersion": "1.0",
            "success": True,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": data,
            "metadata": Metadata.get_metadata()
        }

    @staticmethod
    def error(code: str, message: str, details: Optional[str] = None) -> Dict[str, Any]:
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

class Metadata:
    """元数据管理"""
    @staticmethod
    def get_metadata() -> Dict[str, str]:
        return {
            "source": "World Bank",
            "license": "CC BY 4.0"
        }

class RequestValidator:
    """请求参数验证器"""
    @staticmethod
    def validate_country_data(input_data: Dict[str, Any]) -> tuple:
        validator = Validator(country_schema)
        if not validator.validate(input_data):
            return False, validator.errors
        return True, validator.normalized(input_data)

@app.route('/api/country', methods=['GET', 'POST'])
def country_endpoint():
    """
    国家数据接口
    GET: 返回默认国家数据
    POST: 接收并验证输入的国家数据
    """
    if request.method == 'GET':
        # 返回默认数据
        valid, data = RequestValidator.validate_country_data({})
        return jsonify(APIResponse.success(data))
    
    elif request.method == 'POST':
        # 获取并验证输入数据
        input_data = request.get_json(silent=True) or {}
        is_valid, result = RequestValidator.validate_country_data(input_data)
        
        if not is_valid:
            return jsonify(APIResponse.error(
                code="400",
                message="Invalid request data",
                details=str(result)
            )), 400
            
        return jsonify(APIResponse.success(result))

@app.route('/api/hello')
def hello():
    return {"message": "Hello World from Flask!"}

@app.route('/api/surprise')
def surprise():
    return render_template('surprise.html') 

def get_api_doc():
    docs_path = os.path.join(os.path.dirname(__file__), 'Docs')
    api_md_path = os.path.join(docs_path, 'API.md')
    if os.path.exists(api_md_path):
        with open(api_md_path, 'r', encoding='utf-8') as f:
            return f.read()

@app.route('/Docs/API.md')
def API_doc():
    docs_content = get_api_doc()
    return docs_content, 200, {'Content-Type': 'text/markdown; charset=utf-8'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)