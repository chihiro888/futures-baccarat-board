import os
from flask import Flask, render_template, jsonify
from binance_api import get_baccarat_results

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/baccarat')
def api_baccarat():
    """바카라 결과 API"""
    limit = int(os.environ.get('BACCARAT_LIMIT', 100))
    results = get_baccarat_results("BTCUSDT", limit)
    
    # JSON 직렬화를 위해 datetime을 문자열로 변환
    for result in results:
        result['time'] = result['time'].strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify({
        'success': True,
        'data': results,
        'count': len(results)
    })

@app.route('/health')
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9000))
    app.run(debug=True, host='0.0.0.0', port=port)
