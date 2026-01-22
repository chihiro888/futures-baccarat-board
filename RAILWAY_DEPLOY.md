# Railway 배포 가이드

## 1단계: GitHub에 코드 푸시

먼저 프로젝트를 GitHub 저장소에 푸시합니다:

```bash
# Git 저장소 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/your-username/futures-baccarat-board.git
git branch -M main
git push -u origin main
```

## 2단계: Railway 가입 및 프로젝트 생성

1. [Railway.app](https://railway.app) 방문
2. "Start a New Project" 클릭
3. GitHub 계정으로 로그인
4. "Deploy from GitHub repo" 선택
5. 방금 푸시한 저장소 선택

## 3단계: 자동 배포

Railway가 자동으로:
- ✅ Python 감지
- ✅ `requirements.txt` 의존성 설치
- ✅ `Procfile` 또는 `railway.json` 설정 사용
- ✅ 포트 자동 설정
- ✅ HTTPS 자동 설정

## 4단계: 환경 변수 설정 (선택사항)

Railway 대시보드에서 "Variables" 탭으로 이동하여 필요시 설정:

- `SECRET_KEY`: 랜덤 문자열 생성 (예: `openssl rand -hex 32`)
- `BACCARAT_LIMIT`: 기본값 100 (변경 불필요)
- `FLASK_DEBUG`: `false` (프로덕션)

**참고**: Railway는 `PORT` 환경 변수를 자동으로 설정하므로 수동 설정 불필요합니다.

## 5단계: 도메인 설정 (선택사항)

1. Railway 대시보드에서 "Settings" 탭
2. "Generate Domain" 클릭하여 무료 도메인 생성
3. 또는 "Custom Domain"에서 자신의 도메인 연결

## 배포 확인

배포가 완료되면:
- Railway 대시보드의 "Deployments" 탭에서 상태 확인
- 제공된 URL로 접속하여 애플리케이션 테스트
- 로그는 "Deployments" → "View Logs"에서 확인

## 문제 해결

### 배포 실패
- 로그 확인: Railway 대시보드 → Deployments → View Logs
- `requirements.txt` 의존성 확인
- Python 버전 확인 (3.8 이상 필요)

### WebSocket 연결 실패
- Railway는 WebSocket을 자동 지원합니다
- CORS 설정 확인 (`cors_allowed_origins="*"`)

### Binance API 오류
- 인터넷 연결 확인
- Binance API 상태 확인: https://www.binance.com/en/support/announcement

## 재배포

코드를 수정하고 GitHub에 푸시하면 Railway가 자동으로 재배포합니다:

```bash
git add .
git commit -m "Update code"
git push
```

Railway가 자동으로 새 배포를 시작합니다.

## 비용

- **무료 크레딧**: $5 무료 크레딧 제공
- **사용량 기반**: 크레딧 소진 후 사용량에 따라 과금
- **예상 비용**: 소규모 앱의 경우 월 $5-10 정도

## 추가 리소스

- [Railway 문서](https://docs.railway.app)
- [Railway Discord 커뮤니티](https://discord.gg/railway)
