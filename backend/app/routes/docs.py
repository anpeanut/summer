from flask import Blueprint
import os

bp = Blueprint('docs', __name__)

def get_api_doc():
    docs_path = os.path.join(os.path.dirname(__file__), '../../project_docs')
    api_md_path = os.path.join(docs_path, 'API.md')
    if os.path.exists(api_md_path):
        with open(api_md_path, 'r', encoding='utf-8') as f:
            return f.read()

@bp.route('/Docs/API.md')
def API_doc():
    docs_content = get_api_doc()
    return docs_content, 200, {'Content-Type': 'text/markdown; charset=utf-8'}