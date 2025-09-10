from flask import Blueprint, render_template, request, Response, jsonify, current_app

bp = Blueprint('main', __name__)

@bp.route('/api/hello')
def hello():
    return 'hello world'
