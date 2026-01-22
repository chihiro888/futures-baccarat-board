#!/bin/bash
# EC2 배포 스크립트

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

# 서비스 재시작
echo "Restarting service..."
sudo systemctl restart futures-baccarat-board

# 서비스 상태 확인
sleep 2
sudo systemctl status futures-baccarat-board --no-pager

echo "Deployment completed!"
