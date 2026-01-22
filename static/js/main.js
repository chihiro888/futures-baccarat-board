// Main JavaScript file
let autoRefreshInterval = null;
let priceChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Futures Baccarat Board loaded successfully!');
    
    // 차트 초기화
    initChart();
    
    // 초기 데이터 로드
    loadBaccaratData();
    
    // 새로고침 버튼
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadBaccaratData();
    });
    
    // 자동 새로고침 버튼
    document.getElementById('autoRefreshBtn').addEventListener('click', function() {
        toggleAutoRefresh();
    });
});

// 캔들스틱 플러그인
const candlestickPlugin = {
    id: 'candlestick',
    afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const candleData = chart.data.candleData;
        
        if (!candleData || candleData.length === 0) return;
        
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        
        candleData.forEach((candle, index) => {
            if (!candle) return;
            
            const x = xScale.getPixelForValue(index);
            const openY = yScale.getPixelForValue(candle.open);
            const closeY = yScale.getPixelForValue(candle.close);
            const highY = yScale.getPixelForValue(candle.high);
            const lowY = yScale.getPixelForValue(candle.low);
            
            const isUp = candle.isUp;
            const color = isUp ? 'rgba(220, 38, 38, 1)' : 'rgba(59, 130, 246, 1)';
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = bodyBottom - bodyTop;
            const barWidth = Math.max(4, (xScale.width / candleData.length) * 0.6);
            
            ctx.save();
            
            // 꼬리 그리기 (고가-저가)
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();
            
            // 몸통 그리기 (시가-종가)
            ctx.fillStyle = color;
            ctx.fillRect(x - barWidth / 2, bodyTop, barWidth, bodyHeight || 1);
            
            ctx.restore();
        });
    }
};

function initChart() {
    const ctx = document.getElementById('priceChart');
    
    // 플러그인 등록
    Chart.register(candlestickPlugin);
    
    priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'BTC/USDT',
                data: [],
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const candleData = context.chart.data.candleData[dataIndex];
                            
                            if (candleData) {
                                return [
                                    '시가: $' + candleData.open.toFixed(2),
                                    '고가: $' + candleData.high.toFixed(2),
                                    '저가: $' + candleData.low.toFixed(2),
                                    '종가: $' + candleData.close.toFixed(2)
                                ];
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('ko-KR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 20
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

function loadBaccaratData() {
    const boardElement = document.getElementById('baccaratBoard');
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    boardElement.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
    
    fetch('/api/baccarat')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                renderBaccaratBoard(data.data);
                updateChart(data.data);
                lastUpdateElement.textContent = `마지막 업데이트: ${new Date().toLocaleTimeString('ko-KR')}`;
            } else {
                boardElement.innerHTML = '<div class="loading">데이터를 불러올 수 없습니다.</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            boardElement.innerHTML = '<div class="loading">오류가 발생했습니다.</div>';
        });
}

function updateChart(data) {
    if (!priceChart || !data || data.length === 0) return;
    
    // 데이터를 시간순으로 정렬
    const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // 최근 50개만 표시 (너무 많으면 차트가 복잡해짐)
    const recentData = sortedData.slice(-50);
    
    const labels = recentData.map(item => {
        const date = new Date(item.time);
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    });
    
    // 캔들스틱 데이터 준비
    const candleData = [];
    const barData = []; // 차트용 더미 데이터
    
    recentData.forEach(item => {
        const open = item.open;
        const close = item.close || item.price;
        const high = item.high;
        const low = item.low;
        const isUp = close > open || (close === open && item.result === 'B');
        
        // 캔들스틱 데이터 저장
        candleData.push({
            open: open,
            high: high,
            low: low,
            close: close,
            isUp: isUp
        });
        
        // 차트용 더미 데이터 (플러그인이 실제로 그리므로 의미 없음)
        barData.push((high + low) / 2);
    });
    
    // 차트 데이터 업데이트
    priceChart.data.labels = labels;
    priceChart.data.candleData = candleData;
    priceChart.data.datasets[0].data = barData;
    
    // Y축 범위 조정
    const allPrices = recentData.flatMap(item => [item.high, item.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const padding = (maxPrice - minPrice) * 0.1;
    
    priceChart.options.scales.y.min = minPrice - padding;
    priceChart.options.scales.y.max = maxPrice + padding;
    
    priceChart.update('none'); // 애니메이션 없이 업데이트
}

function renderBaccaratBoard(data) {
    const boardElement = document.getElementById('baccaratBoard');
    
    if (!data || data.length === 0) {
        boardElement.innerHTML = '<div class="loading">데이터가 없습니다.</div>';
        return;
    }
    
    // 데이터를 시간순으로 정렬 (오래된 것부터)
    const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // 그리드 생성 - 고정 크기: 세로 6줄, 가로 26줄 (총 156개)
    const rowsPerColumn = 6;  // 세로 (행)
    const columnsPerRow = 26;  // 가로 (열)
    const boardSize = rowsPerColumn * columnsPerRow;  // 156개
    
    // 00:01을 기준으로 보드 시작점 찾기
    const boardData = findCurrentBoardData(sortedData, boardSize);
    
    if (!boardData || boardData.length === 0) {
        boardElement.innerHTML = '<div class="loading">보드 데이터를 찾을 수 없습니다.</div>';
        return;
    }
    
    // 테이블 생성
    const table = document.createElement('table');
    table.className = 'baccarat-table';
    
    // 데이터를 2차원 배열로 변환 (세로 방향으로 채우기)
    const tableData = [];
    for (let row = 0; row < rowsPerColumn; row++) {
        tableData[row] = [];
        for (let col = 0; col < columnsPerRow; col++) {
            tableData[row][col] = null;
        }
    }
    
    // 데이터를 세로 방향으로 배치 (첫 번째 열부터 아래로, 그 다음 열로)
    boardData.forEach((item, index) => {
        if (index >= boardSize) return;  // 보드 크기 초과 방지
        
        // 세로 방향 계산: row = index % rowsPerColumn, col = Math.floor(index / rowsPerColumn)
        const row = index % rowsPerColumn;  // 행 (y)
        const col = Math.floor(index / rowsPerColumn);  // 열 (x)
        
        tableData[row][col] = item;
    });
    
    // 테이블 행 생성
    for (let row = 0; row < rowsPerColumn; row++) {
        const tr = document.createElement('tr');
        
        for (let col = 0; col < columnsPerRow; col++) {
            const td = document.createElement('td');
            const item = tableData[row][col];
            
            if (item) {
                // 결과에 따라 클래스 이름 매핑 (색상 문제 해결)
                let resultClass = '';
                if (item.result === 'P') {
                    resultClass = 'player';
                } else if (item.result === 'B') {
                    resultClass = 'banker';
                } else if (item.result === 'T') {
                    resultClass = 'tie';
                }
                
                const cell = document.createElement('div');
                cell.className = `baccarat-cell ${resultClass}`;
                cell.textContent = item.result;
                cell.setAttribute('data-col', col);
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-index', row * columnsPerRow + col);
                
                // 시간 정보 포맷팅
                const date = new Date(item.time);
                const timeStr = date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                // 마우스 이벤트 핸들러 - 하단 정보 영역에 표시
                cell.addEventListener('mouseenter', function() {
                    displayCellInfo(item, timeStr, col, row);
                });
                
                
                td.appendChild(cell);
            }
            
            tr.appendChild(td);
        }
        
        table.appendChild(tr);
    }
    
    boardElement.innerHTML = '';
    boardElement.appendChild(table);
}

function findCurrentBoardData(sortedData, boardSize) {
    if (!sortedData || sortedData.length === 0) return [];
    
    // 현재 시간 기준으로 가장 최근 00:01 찾기
    const now = new Date();
    let boardStartIndex = -1;
    
    // 역순으로 검색하여 가장 최근 00:01 찾기
    for (let i = sortedData.length - 1; i >= 0; i--) {
        const date = new Date(sortedData[i].time);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // 00:01을 찾으면 그 지점부터 보드 시작
        if (hours === 0 && minutes === 1) {
            boardStartIndex = i;
            break;
        }
    }
    
    // 00:01을 찾지 못하면 가장 최근 데이터부터 역순으로 00:01 찾기
    if (boardStartIndex === -1) {
        // 날짜별로 그룹화하여 각 날짜의 00:01 찾기
        const dateGroups = {};
        sortedData.forEach((item, index) => {
            const date = new Date(item.time);
            const dateKey = date.toDateString();
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = [];
            }
            dateGroups[dateKey].push({ item, index });
        });
        
        // 가장 최근 날짜의 00:01 찾기
        const dates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));
        for (const dateKey of dates) {
            const group = dateGroups[dateKey];
            for (const { item, index } of group) {
                const date = new Date(item.time);
                if (date.getHours() === 0 && date.getMinutes() === 1) {
                    boardStartIndex = index;
                    break;
                }
            }
            if (boardStartIndex !== -1) break;
        }
    }
    
    // 00:01을 찾지 못하면 가장 최근 데이터부터 사용
    if (boardStartIndex === -1) {
        boardStartIndex = sortedData.length - boardSize;
        if (boardStartIndex < 0) boardStartIndex = 0;
    }
    
    // 보드 시작점부터 boardSize만큼 데이터 추출
    const boardData = sortedData.slice(boardStartIndex, boardStartIndex + boardSize);
    
    // 보드가 꽉 차지 않았으면 (156개 미만) 이전 보드의 나머지 데이터로 채우기
    if (boardData.length < boardSize && boardStartIndex > 0) {
        const remaining = boardSize - boardData.length;
        const prevData = sortedData.slice(boardStartIndex - remaining, boardStartIndex);
        return [...prevData, ...boardData];
    }
    
    return boardData;
}

function displayCellInfo(item, timeStr, col, row) {
    const cellInfoElement = document.getElementById('cellInfo');
    const resultText = item.result === 'B' ? 'Banker (양봉/상승)' : 'Player (음봉/하락)';
    const resultColor = item.result === 'B' ? '#e53e3e' : '#3182ce';
    
    cellInfoElement.innerHTML = `
        <p><span class="info-label">위치:</span><span class="info-value">${col}x${row}</span></p>
        <p><span class="info-label">1분봉:</span><span class="info-value">${timeStr}</span></p>
        <p><span class="info-label">결과:</span><span class="info-value" style="color: ${resultColor}; font-weight: bold;">${resultText}</span></p>
        <p><span class="info-label">현재가:</span><span class="info-value">$${item.price.toFixed(2)}</span></p>
        <p><span class="info-label">시가:</span><span class="info-value">$${item.open.toFixed(2)}</span></p>
        <p><span class="info-label">고가:</span><span class="info-value">$${item.high.toFixed(2)}</span></p>
        <p><span class="info-label">저가:</span><span class="info-value">$${item.low.toFixed(2)}</span></p>
        <p><span class="info-label">종가:</span><span class="info-value">$${(item.close || item.price).toFixed(2)}</span></p>
        <p><span class="info-label">거래량:</span><span class="info-value">${item.volume.toFixed(4)}</span></p>
    `;
}

function toggleAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        btn.textContent = '자동 새로고침';
        btn.classList.remove('active');
    } else {
        autoRefreshInterval = setInterval(() => {
            loadBaccaratData();
        }, 60000); // 1분마다 새로고침
        btn.textContent = '자동 새로고침 중...';
        btn.classList.add('active');
    }
}
