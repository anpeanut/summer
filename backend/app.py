from flask import Flask, render_template
import os

app = Flask(__name__)

@app.route('/api/hello')
def hello():
    return {"message": "Hello World from Flask!"}

@app.route('/api/surprise')
def surprise():
    return render_template('surprise.html') 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)