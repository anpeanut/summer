from flask import Blueprint, render_template

bp = Blueprint('main', __name__)

@bp.route('/api/hello')
def hello():
    return 'sk-wadhajehiojzvhuumuoeqbjyfkaesgcncojhktduihvvdbjv'

@bp.route('/api/surprise')
def surprise():
    return render_template('surprise.html')