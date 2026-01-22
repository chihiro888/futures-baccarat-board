# Binance API 451 에러 해결 방법

## 문제
Binance API가 451 에러를 반환합니다:
```
451 Client Error: Service unavailable from a restricted location
```

이는 Railway 서버의 위치가 Binance에서 제한된 지역일 수 있습니다.

## 해결 방법

### 방법 1: Railway 리전 변경 (권장)

1. Railway 대시보드 → 프로젝트 선택
2. Settings → Networking
3. Region 변경 시도 (가능한 경우)
   - 참고: Railway는 기본적으로 최적의 리전을 자동 선택합니다

### 방법 2: 다른 배포 플랫폼 사용

Binance API 접근이 제한되지 않은 플랫폼으로 배포:

1. **Render** (미국 기반)
   - `render.yaml` 파일 사용
   - 자동 배포 가능

2. **Fly.io** (전 세계 엣지 서버)
   - `fly.toml` 파일 사용
   - 리전 선택 가능

3. **DigitalOcean** (미국/유럽)
   - App Platform 사용
   - 리전 선택 가능

### 방법 3: 프록시 사용 (고급)

Binance API 호출을 프록시를 통해 라우팅:
- 추가 설정 필요
- 비용 발생 가능

### 방법 4: Binance API 대신 다른 소스 사용

- CoinGecko API
- CryptoCompare API
- 다른 거래소 API

## 현재 상태

현재 코드는 451 에러를 감지하고 사용자에게 명확한 메시지를 표시합니다:
- API 호출 실패 시 에러 메시지 표시
- 웹소켓 연결 실패 시 로그 출력

## 권장 사항

**Render** 또는 **Fly.io**로 재배포하는 것을 권장합니다:
- Binance API 접근 제한이 적을 가능성이 높음
- 설정 파일이 이미 준비되어 있음
