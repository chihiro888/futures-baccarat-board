# PM2로 EC2 배포 가이드 (간단 버전)

PM2를 사용하면 systemd보다 더 간단하게 Flask 애플리케이션을 관리할 수 있습니다.

## 1단계: EC2 인스턴스 준비

### 1.1 EC2 인스턴스 생성
- Ubuntu Server 22.04 LTS
- Security Group: SSH(22), HTTP(80), HTTPS(443)

### 1.2 인스턴스 연결
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## 2단계: 서버 초기 설정

### 2.1 시스템 업데이트 및 필수 패키지 설치
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git nginx curl
```

### 2.2 Node.js 및 PM2 설치
```bash
# Node.js 설치 (PM2를 위해 필요)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 전역 설치
sudo npm install -g pm2
```

### 2.3 방화벽 설정
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 3단계: 애플리케이션 배포

### 3.1 프로젝트 디렉토리 생성
```bash
sudo mkdir -p /opt/futures-baccarat-board
sudo chown ubuntu:ubuntu /opt/futures-baccarat-board
cd /opt/futures-baccarat-board
```

### 3.2 프로젝트 파일 업로드
```bash
# Git 클론
git clone https://github.com/chihiro888/futures-baccarat-board .

# 또는 SCP로 업로드 (로컬에서)
# scp -i your-key.pem -r * ubuntu@your-ec2-ip:/opt/futures-baccarat-board/
```

### 3.3 가상환경 생성 및 의존성 설치
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4 SECRET_KEY 생성
```bash
openssl rand -hex 32
```
이 값을 `ecosystem.config.js`의 `SECRET_KEY`에 설정하세요.

## 4단계: PM2로 애플리케이션 실행

### 4.1 ecosystem.config.js 수정
```bash
nano ecosystem.config.js
```

`SECRET_KEY`를 위에서 생성한 값으로 변경:
```javascript
SECRET_KEY: 'your-generated-secret-key-here'
```

`interpreter` 경로 확인:
```javascript
interpreter: '/opt/futures-baccarat-board/venv/bin/python'
```

### 4.2 PM2로 애플리케이션 시작
```bash
pm2 start ecosystem.config.js
```

### 4.3 PM2 상태 확인
```bash
pm2 status
pm2 logs futures-baccarat-board
```

### 4.4 PM2 자동 시작 설정
```bash
# 시작 스크립트 생성
pm2 startup

# 출력된 명령어 실행 (예: sudo env PATH=...)
# 그 다음 저장
pm2 save
```

## 5단계: Nginx 리버스 프록시 설정

### 5.1 Nginx 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/futures-baccarat-board
```

다음 내용 입력:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 EC2 퍼블릭 IP

    location / {
        proxy_pass http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 5.2 Nginx 활성화 및 재시작
```bash
sudo ln -s /etc/nginx/sites-available/futures-baccarat-board /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6단계: SSL 인증서 설정 (선택사항)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## PM2 유용한 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs futures-baccarat-board
pm2 logs futures-baccarat-board --lines 100  # 최근 100줄

# 재시작
pm2 restart futures-baccarat-board

# 중지
pm2 stop futures-baccarat-board

# 시작
pm2 start futures-baccarat-board

# 삭제
pm2 delete futures-baccarat-board

# 모니터링
pm2 monit

# 메모리/CPU 사용량 확인
pm2 list
```

## 자동 배포 스크립트

### deploy.sh 업데이트
```bash
#!/bin/bash
cd /opt/futures-baccarat-board
source venv/bin/activate
git pull
pip install -r requirements.txt
pm2 restart futures-baccarat-board
echo "Deployment completed!"
```

실행:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 문제 해결

### PM2가 시작되지 않을 때
```bash
pm2 logs futures-baccarat-board --err
pm2 describe futures-baccarat-board
```

### 포트 충돌
```bash
sudo lsof -i :7777
pm2 restart futures-baccarat-board
```

### 가상환경 경로 확인
```bash
which python  # 가상환경 내에서
# /opt/futures-baccarat-board/venv/bin/python
```

### PM2 재시작 후 앱이 시작되지 않을 때
```bash
pm2 delete futures-baccarat-board
pm2 start ecosystem.config.js
pm2 save
```

## systemd vs PM2 비교

| 기능 | systemd | PM2 |
|------|---------|-----|
| 설정 복잡도 | 중간 | 낮음 |
| 로그 관리 | journalctl | pm2 logs |
| 모니터링 | 기본 | 고급 (monit) |
| 재시작 정책 | 자동 | 자동 |
| 메모리 제한 | 수동 설정 | 자동 설정 가능 |

PM2가 더 간단하고 사용하기 쉽습니다!
