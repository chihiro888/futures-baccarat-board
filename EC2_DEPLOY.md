# EC2 Ubuntu 22.04 배포 가이드

## 1단계: EC2 인스턴스 준비

### 1.1 EC2 인스턴스 생성
1. AWS 콘솔 → EC2 → Launch Instance
2. 설정:
   - **Name**: `futures-baccarat-board`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (무료 티어) 또는 t3.small
   - **Key Pair**: 새로 생성하거나 기존 키 사용
   - **Security Group**: 
     - SSH (22): 내 IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom TCP (7777): 0.0.0.0/0 (임시, 나중에 제거)

### 1.2 인스턴스 연결
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## 2단계: 서버 초기 설정

### 2.1 시스템 업데이트
```bash
sudo apt update
sudo apt upgrade -y
```

### 2.2 필수 패키지 설치
```bash
sudo apt install -y python3 python3-pip python3-venv git nginx
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
cd /opt
sudo mkdir -p futures-baccarat-board
sudo chown ubuntu:ubuntu futures-baccarat-board
cd futures-baccarat-board
```

### 3.2 Git 저장소 클론
```bash
git clone https://github.com/your-username/futures-baccarat-board.git .
```

또는 직접 파일 업로드:
```bash
# 로컬에서
scp -i your-key.pem -r * ubuntu@your-ec2-ip:/opt/futures-baccarat-board/
```

### 3.3 가상환경 생성 및 의존성 설치
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 4단계: Systemd 서비스 설정

### 4.1 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/futures-baccarat-board.service
```

다음 내용 입력:
```ini
[Unit]
Description=Futures Baccarat Board Flask App
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/futures-baccarat-board
Environment="PATH=/opt/futures-baccarat-board/venv/bin"
Environment="PORT=7777"
Environment="FLASK_DEBUG=false"
Environment="BACCARAT_LIMIT=100"
Environment="SECRET_KEY=your-secret-key-here"
ExecStart=/opt/futures-baccarat-board/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**중요**: `SECRET_KEY`를 강력한 랜덤 문자열로 변경:
```bash
openssl rand -hex 32
```

### 4.2 서비스 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable futures-baccarat-board
sudo systemctl start futures-baccarat-board
sudo systemctl status futures-baccarat-board
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

### 5.2 심볼릭 링크 생성 및 Nginx 재시작
```bash
sudo ln -s /etc/nginx/sites-available/futures-baccarat-board /etc/nginx/sites-enabled/
sudo nginx -t  # 설정 테스트
sudo systemctl restart nginx
```

## 6단계: SSL 인증서 설정 (Let's Encrypt)

### 6.1 Certbot 설치
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 SSL 인증서 발급
```bash
sudo certbot --nginx -d your-domain.com
```

도메인이 없다면 이 단계는 건너뛰고 IP로 접속 가능합니다.

## 7단계: 로그 확인

### 7.1 애플리케이션 로그
```bash
sudo journalctl -u futures-baccarat-board -f
```

### 7.2 Nginx 로그
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 8단계: 자동 배포 스크립트 (선택사항)

### 8.1 배포 스크립트 생성
```bash
nano /opt/futures-baccarat-board/deploy.sh
```

다음 내용 입력:
```bash
#!/bin/bash
cd /opt/futures-baccarat-board
source venv/bin/activate
git pull
pip install -r requirements.txt
sudo systemctl restart futures-baccarat-board
echo "Deployment completed!"
```

실행 권한 부여:
```bash
chmod +x /opt/futures-baccarat-board/deploy.sh
```

## 문제 해결

### 서비스가 시작되지 않을 때
```bash
sudo systemctl status futures-baccarat-board
sudo journalctl -u futures-baccarat-board -n 50
```

### 포트가 이미 사용 중일 때
```bash
sudo lsof -i :7777
sudo netstat -tulpn | grep 7777
```

### Nginx 502 에러
- 애플리케이션이 실행 중인지 확인: `sudo systemctl status futures-baccarat-board`
- 포트 확인: `curl http://127.0.0.1:7777`

### Binance API 451 에러
- EC2 리전이 Binance에서 제한된 지역일 수 있습니다
- 다른 리전(미국 동부/서부)으로 인스턴스 재생성 고려

## 보안 체크리스트

- [ ] SSH 키 파일 권한 설정: `chmod 400 your-key.pem`
- [ ] SECRET_KEY를 강력한 랜덤 문자열로 변경
- [ ] 불필요한 포트(7777) 방화벽에서 제거
- [ ] 정기적인 시스템 업데이트: `sudo apt update && sudo apt upgrade`
- [ ] 로그 로테이션 설정

## 유용한 명령어

```bash
# 서비스 재시작
sudo systemctl restart futures-baccarat-board

# 서비스 중지
sudo systemctl stop futures-baccarat-board

# 서비스 시작
sudo systemctl start futures-baccarat-board

# 로그 실시간 확인
sudo journalctl -u futures-baccarat-board -f

# Nginx 재시작
sudo systemctl restart nginx

# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h
```
