import requests
from datetime import datetime, timedelta
from typing import List, Dict

BINANCE_API_BASE = "https://api.binance.com/api/v3"

def get_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 100) -> List[Dict]:
    """
    바이낸스에서 캔들스틱 데이터를 가져옵니다.
    
    Args:
        symbol: 거래 쌍 (기본값: BTCUSDT)
        interval: 시간 간격 (1m, 5m, 1h 등)
        limit: 가져올 데이터 개수 (최대 1000)
    
    Returns:
        캔들스틱 데이터 리스트
    """
    url = f"{BINANCE_API_BASE}/klines"
    params = {
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # 데이터 포맷 변환
        klines = []
        for kline in data:
            klines.append({
                "open_time": kline[0],
                "open": float(kline[1]),
                "high": float(kline[2]),
                "low": float(kline[3]),
                "close": float(kline[4]),
                "volume": float(kline[5]),
                "close_time": kline[6],
                "datetime": datetime.fromtimestamp(kline[0] / 1000)
            })
        
        return klines
    except requests.exceptions.RequestException as e:
        print(f"바이낸스 API 요청 오류: {e}")
        return []

def calculate_baccarat_result(open_price: float, close_price: float) -> str:
    """
    양봉/음봉을 기준으로 바카라 결과를 계산합니다.
    
    바카라 규칙:
    - 양봉 (상승): 종가 > 시가 → Banker (B) - 빨간색
    - 음봉 (하락): 종가 < 시가 → Player (P) - 파란색
    - 같으면: 이전 결과 유지 (기본값: P)
    
    Args:
        open_price: 시가
        close_price: 종가
    
    Returns:
        'P' (Player - 파란색), 'B' (Banker - 빨간색)
    """
    if close_price > open_price:
        return "B"  # Banker - 양봉 (상승) - 빨간색
    elif close_price < open_price:
        return "P"  # Player - 음봉 (하락) - 파란색
    else:
        # 같으면 이전 결과 유지 (기본값: P)
        return "P"  # Player

def get_baccarat_results(symbol: str = "BTCUSDT", limit: int = 100, interval: str = "1m") -> List[Dict]:
    """
    바이낸스 데이터를 가져와서 바카라 결과로 변환합니다.
    
    Args:
        symbol: 거래 쌍
        limit: 가져올 데이터 개수
        interval: 시간 간격 (1m, 5m, 15m, 1h 등)
    
    Returns:
        바카라 결과 리스트
    """
    klines = get_klines(symbol, interval, limit)
    results = []
    prev_result = "P"  # 이전 결과 추적 (같은 경우 사용)
    
    for kline in klines:
        # 양봉/음봉 기준으로 결과 계산
        if kline["close"] > kline["open"]:
            result = "B"  # Banker - 양봉 (상승) - 빨간색
        elif kline["close"] < kline["open"]:
            result = "P"  # Player - 음봉 (하락) - 파란색
        else:
            # 같으면 이전 결과 유지
            result = prev_result
        
        prev_result = result
        
        results.append({
            "time": kline["datetime"],
            "timestamp": kline["close_time"],
            "price": kline["close"],
            "result": result,
            "open": kline["open"],
            "high": kline["high"],
            "low": kline["low"],
            "volume": kline["volume"],
            "is_up": kline["close"] > kline["open"]  # 양봉 여부
        })
    
    return results
