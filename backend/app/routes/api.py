from flask import Blueprint, request, jsonify
from app.services.country_service import CountryService
from app.utils.api_response import APIResponse

bp = Blueprint('api', __name__)

@bp.route('/country', methods=['GET', 'POST'])
def country_endpoint():
    if request.method == 'GET':
        data = CountryService.get_default_country()
        return jsonify(APIResponse.success(data))
    
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