from flask import Blueprint, render_template, request, Response, jsonify, current_app
from ..services.ai_service import generate_life_story_stream

bp = Blueprint('main', __name__)

@bp.route('/api/hello')
def hello():
    return 'hello world'

@bp.route('/api/surprise')
def surprise():
    return render_template('surprise.html')

@bp.route('/api/generate-story', methods=['POST'])
def generate_story():
    """
    接收国家数据并流式返回AI生成的人生故事。
    """
    country_data = request.get_json()
    if not country_data:
        return jsonify({"error": "请求体中缺少国家数据"}), 400

    # 在请求上下文中提前获取配置
    api_key = current_app.config.get('SILICONFLOW_API_KEY')
    api_base = current_app.config.get('SILICONFLOW_API_BASE')

    # --- 新增：服务器配置校验 ---
    if not api_key:
        return jsonify({"error": "服务器配置缺失: SILICONFLOW_API_KEY 未设置"}), 500
    if not api_base:
        return jsonify({"error": "服务器配置缺失: SILICONFLOW_API_BASE 未设置"}), 500
    # --- 配置校验结束 ---

    # 创建一个生成器，并将配置作为参数传递给它
    stream = generate_life_story_stream(country_data, api_key, api_base)

    # 使用Response对象将生成器作为流式响应返回
    # mimetype='application/x-ndjson' 告知客户端这是一个NDJSON流
    return Response(stream, mimetype='application/x-ndjson')
