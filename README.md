# Futures Baccarat Board

Flask 기반 웹 애플리케이션 프로젝트입니다.

## 프로젝트 구조

```
futures-baccarat-board/
├── app.py                 # Flask 메인 애플리케이션
├── requirements.txt       # Python 의존성 패키지
├── templates/            # HTML 템플릿 디렉토리
│   └── index.html
├── static/              # 정적 파일 디렉토리
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── README.md
```

## 설치 및 실행

### 1. 가상 환경 생성 및 활성화

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate     # Windows
```

### 2. 의존성 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 애플리케이션 실행

```bash
python app.py
```

애플리케이션이 실행되면 브라우저에서 `http://localhost:5000`으로 접속할 수 있습니다.

## 개발 환경

- Python 3.8+
- Flask 3.0.0

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
