from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(app.root_path, 'build'), 'index.html')


@app.route('/api/hello')
def hello():
    return {"message": "Hello World from Flask!"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)