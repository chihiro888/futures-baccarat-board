#!/bin/bash
# EC2 배포 스크립트 (PM2 또는 systemd)

echo "Starting deployment..."

# 프로젝트 디렉토리로 이동
cd /opt/futures-baccarat-board

# 가상환경 활성화
source venv/bin/activate

# Git에서 최신 코드 가져오기
echo "Pulling latest code..."
git pull

# 의존성 업데이트
echo "Installing dependencies..."
pip install -r requirements.txt

# PM2 사용 여부 확인
if command -v pm2 &> /dev/null && pm2 list | grep -q "futures-baccarat-board"; then
    echo "Restarting with PM2..."
    pm2 restart futures-baccarat-board
    pm2 status
else
    echo "Restarting with systemd..."
    sudo systemctl restart futures-baccarat-board
    sleep 2
    sudo systemctl status futures-baccarat-board --no-pager
fi

echo "Deployment completed!"
