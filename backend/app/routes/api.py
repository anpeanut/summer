from flask import Blueprint, request, jsonify
from app.services.country_service import CountryService
from app.utils.api_response import APIResponse
from app.services.data_updater import DataUpdater

bp = Blueprint('api', __name__)

@bp.route('/country', methods=['GET', 'POST'])
def country_endpoint():
    """
    按出生潜力(出生率×总人口)加权随机返回一个国家数据
    - 权重计算: 出生率(‰) × 总人口(人) → 代表该国每年新生儿数量(万为单位)
    - 出生率缺失时使用默认值15.0‰(全球平均水平)
    """
    if request.method == 'GET':
        valid, data = CountryService.get_country()
        if not valid:
            return jsonify(data), int(data['error']['code'])
        return jsonify(data)

    '''
    elif request.method == 'POST':
        input_data = request.get_json(silent=True) or {}
        is_valid, result = CountryService.validate_country_data(input_data)
        
        if not is_valid:
            return jsonify(APIResponse.error(
                code="400",
                message="Invalid request data",
                details=str(result)
            )), 400
            
        return jsonify(APIResponse.success(result))
    '''
    

@bp.route('/update', methods=['GET'])
def update_endpoint():
    """
    更新国家数据
    """
    input_data = request.args
    country_id = input_data.get('country_id')

    if country_id:
        updater = DataUpdater()
        updater.update_country(country_id)
        return jsonify(APIResponse.success(f"Country {country_id} update initiated."))

    # 可以添加权限验证逻辑，例如检查API密钥或用户身份
    CountryService.update_country_data()
    return jsonify(APIResponse.success("Country data update initiated."))
    # return jsonify(APIResponse.error("501", "Not Implemented")), 501

