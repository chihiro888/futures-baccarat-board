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
        print(f"바이낸스 API 요청: {url}, params={params}")
        response = requests.get(url, params=params, timeout=30)  # 타임아웃 30초로 증가
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 451:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get('msg', 'Binance API 접근이 제한된 지역입니다')
            print(f"Binance API 지역 제한 오류 (451): {error_msg}")
            print("Railway 서버 위치가 Binance에서 제한된 지역일 수 있습니다")
            raise Exception(f"Binance API 지역 제한: {error_msg}")
        
        if response.status_code != 200:
            print(f"HTTP 오류: {response.status_code}")
            print(f"응답 내용: {response.text[:500]}")  # 처음 500자만 출력
        
        response.raise_for_status()
        data = response.json()
        print(f"받은 데이터 개수: {len(data)}")
        
        if not data:
            print("경고: 바이낸스 API에서 빈 데이터 반환")
            return []
        
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
        
        print(f"변환된 klines 개수: {len(klines)}")
        return klines
    except requests.exceptions.Timeout as e:
        print(f"바이낸스 API 타임아웃 오류: {e}")
        import traceback
        traceback.print_exc()
        return []
    except requests.exceptions.ConnectionError as e:
        print(f"바이낸스 API 연결 오류: {e}")
        print("인터넷 연결 또는 Binance API 서버 상태를 확인해주세요")
        import traceback
        traceback.print_exc()
        return []
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 451:
            error_data = e.response.json() if e.response.text else {}
            error_msg = error_data.get('msg', 'Binance API 접근이 제한된 지역입니다')
            print(f"Binance API 지역 제한 오류 (451): {error_msg}")
            raise Exception(f"Binance API 지역 제한: {error_msg}")
        print(f"바이낸스 API HTTP 오류: {e}")
        print(f"응답 내용: {e.response.text if hasattr(e, 'response') else 'N/A'}")
        import traceback
        traceback.print_exc()
        return []
    except requests.exceptions.RequestException as e:
        print(f"바이낸스 API 요청 오류: {e}")
        import traceback
        traceback.print_exc()
        return []
    except Exception as e:
        print(f"바이낸스 API 처리 오류: {e}")
        import traceback
        traceback.print_exc()
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
