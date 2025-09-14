from flask import Blueprint, request, jsonify
from app.services.country_service import CountryService
from app.utils.api_response import APIResponse
from app.services.data_updater import DataUpdater

bp = Blueprint('api', __name__)

@bp.route('/update', methods=['GET'])
def update_endpoint():
    """
    更新国家数据
    """
    input_data = request.args
    country_id = input_data.get('country_id')

    if country_id:
        updater = DataUpdater(if_update_all=False)
        updater.update_country(country_id)
        return jsonify(APIResponse.success(f"Country {country_id} update initiated."))

    # 可以添加权限验证逻辑，例如检查API密钥或用户身份
    CountryService.update_country_data()
    return jsonify(APIResponse.success("Country data update initiated."))
    # return jsonify(APIResponse.error("501", "Not Implemented")), 501

