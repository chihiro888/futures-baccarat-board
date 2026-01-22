# 배포 가이드

이 프로젝트는 Flask-SocketIO를 사용하는 실시간 웹 애플리케이션입니다. WebSocket을 지원하는 플랫폼에서 배포해야 합니다.

## 추천 배포 플랫폼

### 1. Railway (추천) ⭐
- **장점**: 간단한 설정, WebSocket 완벽 지원, 자동 HTTPS, 환경 변수 관리 쉬움
- **가격**: 무료 크레딧 제공, 이후 사용량 기반
- **배포 방법**:
  1. [Railway](https://railway.app)에 가입
  2. "New Project" → "Deploy from GitHub repo" 선택
  3. GitHub 저장소 연결
  4. 자동으로 배포 시작
  5. 환경 변수 설정 (필요시):
     - `PORT`: 자동 설정됨
     - `BACCARAT_LIMIT`: 100 (기본값)
     - `SECRET_KEY`: 랜덤 문자열 생성

### 2. Render
- **장점**: 무료 티어 제공, WebSocket 지원, 쉬운 설정
- **가격**: 무료 티어 (15분 비활성 시 sleep), 유료 플랜 $7/월
- **배포 방법**:
  1. [Render](https://render.com)에 가입
  2. "New" → "Web Service" 선택
  3. GitHub 저장소 연결
  4. 설정:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python app.py`
     - **Environment**: Python 3
  5. 환경 변수 추가:
     - `PORT`: 자동 설정됨
     - `BACCARAT_LIMIT`: 100
     - `SECRET_KEY`: 랜덤 문자열

### 3. Fly.io
- **장점**: 좋은 성능, 전 세계 엣지 서버, WebSocket 지원
- **가격**: 무료 티어 (제한적), 이후 사용량 기반
- **배포 방법**:
  1. [Fly.io](https://fly.io)에 가입
  2. `flyctl` 설치: `curl -L https://fly.io/install.sh | sh`
  3. 로그인: `flyctl auth login`
  4. 앱 생성: `flyctl launch`
  5. 배포: `flyctl deploy`

### 4. DigitalOcean App Platform
- **장점**: 안정적, 확장 가능
- **가격**: $5/월부터
- **배포 방법**:
  1. [DigitalOcean](https://www.digitalocean.com)에 가입
  2. App Platform에서 "Create App" 선택
  3. GitHub 저장소 연결
  4. 자동 감지된 설정 확인 및 수정

## 로컬 테스트

배포 전에 로컬에서 테스트:

```bash
# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (선택사항)
export PORT=9000
export BACCARAT_LIMIT=100
export SECRET_KEY=your-secret-key

# 실행
python app.py
```

## 주의사항

1. **SECRET_KEY**: 프로덕션에서는 반드시 강력한 랜덤 문자열로 변경하세요
2. **WebSocket**: 모든 추천 플랫폼은 WebSocket을 지원합니다
3. **포트**: 대부분의 플랫폼은 `PORT` 환경 변수를 자동으로 설정합니다
4. **HTTPS**: Railway, Render, Fly.io는 자동으로 HTTPS를 제공합니다

## 문제 해결

### WebSocket 연결 실패
- 플랫폼이 WebSocket을 지원하는지 확인
- CORS 설정 확인 (`cors_allowed_origins="*"`)

### Binance API 오류
- 인터넷 연결 확인
- Binance API 상태 확인

### 포트 오류
- `PORT` 환경 변수가 올바르게 설정되었는지 확인
- 플랫폼의 기본 포트 사용 (대부분 자동 설정)
