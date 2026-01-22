import json
import websocket
import threading
import ssl
from datetime import datetime
from typing import Callable, Optional

class BinanceWebSocket:
    def __init__(self, symbol: str = "btcusdt", callback: Optional[Callable] = None):
        self.symbol = symbol.lower()
        self.callback = callback
        self.ws = None
        self.running = False
        
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            if 'k' in data:
                kline = data['k']
                if kline['x']:  # kline이 완료된 경우만
                    result = {
                        "time": datetime.fromtimestamp(kline['T'] / 1000),
                        "timestamp": kline['T'],
                        "price": float(kline['c']),
                        "open": float(kline['o']),
                        "high": float(kline['h']),
                        "low": float(kline['l']),
                        "close": float(kline['c']),
                        "volume": float(kline['v']),
                        "is_up": float(kline['c']) > float(kline['o'])
                    }
                    
                    # 바카라 결과 계산
                    if result["close"] > result["open"]:
                        result["result"] = "B"  # Banker - 양봉 (상승) - 빨간색
                    elif result["close"] < result["open"]:
                        result["result"] = "P"  # Player - 음봉 (하락) - 파란색
                    else:
                        result["result"] = "P"  # 기본값
                    
                    if self.callback:
                        self.callback(result)
        except Exception as e:
            print(f"웹소켓 메시지 처리 오류: {e}")
    
    def on_error(self, ws, error):
        print(f"웹소켓 오류: {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        print("웹소켓 연결 종료")
        # 재연결 시도 (running이 True인 경우에만)
        if self.running:
            print("5초 후 재연결 시도...")
            threading.Timer(5.0, self.connect).start()
    
    def on_open(self, ws):
        print("웹소켓 연결 성공")
        self.running = True
    
    def connect(self):
        """웹소켓 연결"""
        stream = f"{self.symbol}@kline_1m"
        url = f"wss://stream.binance.com:9443/ws/{stream}"
        
        self.ws = websocket.WebSocketApp(
            url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open
        )
        
        # SSL 인증서 검증 건너뛰기
        self.ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
    
    def start(self):
        """웹소켓 시작 (별도 스레드에서)"""
        thread = threading.Thread(target=self.connect, daemon=True)
        thread.start()
        return thread
    
    def stop(self):
        """웹소켓 중지"""
        self.running = False
        if self.ws:
            self.ws.close()
