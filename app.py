import os
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from binance_api import get_baccarat_results
from binance_websocket import BinanceWebSocket
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
socketio = SocketIO(app, cors_allowed_origins="*")

# 웹소켓 인스턴스
binance_ws = None

def on_kline_update(data):
    """바이낸스 웹소켓에서 받은 데이터를 클라이언트에 전송"""
    # datetime을 문자열로 변환
    data['time'] = data['time'].strftime('%Y-%m-%d %H:%M:%S')
    socketio.emit('kline_update', data)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/baccarat')
def api_baccarat():
    """바카라 결과 API"""
    from flask import request
    try:
        limit = int(os.environ.get('BACCARAT_LIMIT', 100))
        interval = request.args.get('interval', '1m')  # 기본값: 1분
        print(f"API 요청: interval={interval}, limit={limit}")
        
        results = get_baccarat_results("BTCUSDT", limit, interval)
        print(f"데이터 가져옴: {len(results)}개")
        
        if not results:
            print("경고: 결과 데이터가 비어있습니다")
            return jsonify({
                'success': False,
                'error': '데이터를 가져올 수 없습니다',
                'data': [],
                'count': 0
            }), 500
        
        # JSON 직렬화를 위해 datetime을 문자열로 변환
        for result in results:
            result['time'] = result['time'].strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results)
        })
    except Exception as e:
        print(f"API 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'data': [],
            'count': 0
        }), 500

@socketio.on('connect')
def handle_connect():
    """클라이언트 연결 시"""
    print('클라이언트 연결됨')
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """클라이언트 연결 해제 시"""
    print('클라이언트 연결 해제됨')

@socketio.on('change_timeframe')
def handle_change_timeframe(data):
    """타임프레임 변경 요청"""
    global binance_ws
    interval = data.get('interval', '1m')
    print(f'타임프레임 변경 요청: {interval}')
    
    # 기존 웹소켓 중지
    if binance_ws:
        binance_ws.stop()
    
    # 새로운 타임프레임으로 웹소켓 재시작
    binance_ws = BinanceWebSocket(symbol="btcusdt", interval=interval, callback=on_kline_update)
    binance_ws.start()
    
    emit('timeframe_changed', {'interval': interval})

@app.route('/health')
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    # 바이낸스 웹소켓 시작 (기본: 1분봉)
    binance_ws = BinanceWebSocket(symbol="btcusdt", interval="1m", callback=on_kline_update)
    binance_ws.start()
    
    port = int(os.environ.get('PORT', 9000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    socketio.run(app, debug=debug, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
