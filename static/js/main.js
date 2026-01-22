// Main JavaScript file
let tradingViewWidget = null;
let socket = null;
let latestData = [];
let currentTimeframe = '1m'; // 기본 타임프레임

// 타임프레임 매핑 (Binance interval -> TradingView interval)
const timeframeMap = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Futures Baccarat Board loaded successfully!');
    
    // TradingView 차트 초기화
    initTradingViewChart();
    
    // 초기 데이터 로드
    loadBaccaratData();
    
    // SocketIO 연결
    initWebSocket();
    
    // 타임프레임 버튼 이벤트 리스너
    initTimeframeButtons();
});

function initWebSocket() {
    // SocketIO 연결
    socket = io();
    
    socket.on('connect', function() {
        console.log('웹소켓 연결 성공');
        document.getElementById('lastUpdate').textContent = '실시간 연결됨';
    });
    
    socket.on('disconnect', function() {
        console.log('웹소켓 연결 해제');
        document.getElementById('lastUpdate').textContent = '연결 해제됨';
    });
    
    socket.on('kline_update', function(data) {
        console.log('새로운 1분봉 데이터:', data);
        handleNewKline(data);
    });
}

function handleNewKline(data) {
    // 새로운 데이터를 latestData에 추가
    // time은 이미 문자열로 변환되어 있음
    const newItem = {
        time: data.time, // 이미 문자열
        timestamp: data.timestamp,
        price: data.price,
        result: data.result,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        is_up: data.is_up
    };
    
    // 기존 데이터에 추가 (중복 제거)
    const existingIndex = latestData.findIndex(item => item.timestamp === data.timestamp);
    if (existingIndex >= 0) {
        latestData[existingIndex] = newItem;
    } else {
        latestData.push(newItem);
    }
    
    // 시간순으로 정렬
    latestData.sort((a, b) => {
        const timeA = typeof a.time === 'string' ? new Date(a.time) : a.time;
        const timeB = typeof b.time === 'string' ? new Date(b.time) : b.time;
        return timeA - timeB;
    });
    
    // 최근 156개만 유지 (보드 크기)
    if (latestData.length > 156) {
        latestData = latestData.slice(-156);
    }
    
    // 보드 업데이트
    renderBaccaratBoard(latestData);
    
    // 마지막 업데이트 시간 표시
    document.getElementById('lastUpdate').textContent = `실시간 업데이트: ${new Date().toLocaleTimeString('ko-KR')}`;
}

function removeTopLayoutArea() {
    // layout__area--top 요소 찾아서 제거
    const topArea = document.querySelector('#tradingview_chart .layout__area--top');
    if (topArea) {
        topArea.style.display = 'none';
        topArea.remove();
    }
}

function initTradingViewChart() {
    // TradingView 차트 초기화
    if (typeof TradingView !== 'undefined') {
        const tvInterval = timeframeMap[currentTimeframe] || '1';
        tradingViewWidget = new TradingView.widget({
            "autosize": true,
            "symbol": "BINANCE:BTCUSDT",
            "interval": tvInterval,
            "timezone": "Asia/Seoul",
            "theme": "light",
            "style": "1",
            "locale": "kr",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_top_toolbar": true,
            "hide_legend": false,
            "save_image": false,
            "container_id": "tradingview_chart",
            "height": 500,
            "width": "100%",
            "studies": [],
            "show_popup_button": false,
            "popup_width": "1000",
            "popup_height": "650",
            "no_referral_id": true,
            "referral_id": "",
            "disabled_features": ["use_localstorage_for_settings", "volume_force_overlay"],
            "enabled_features": ["study_templates"]
        });
        
        // TradingView 차트 로드 후 상단 영역 제거
        setTimeout(() => {
            removeTopLayoutArea();
            // MutationObserver로 동적으로 추가되는 요소도 감지
            const observer = new MutationObserver(() => {
                removeTopLayoutArea();
            });
            const chartContainer = document.getElementById('tradingview_chart');
            if (chartContainer) {
                observer.observe(chartContainer, {
                    childList: true,
                    subtree: true
                });
            }
        }, 1000);
    } else {
        // TradingView 스크립트가 로드되지 않은 경우 재시도
        setTimeout(initTradingViewChart, 100);
    }
}

function initTimeframeButtons() {
    const buttons = document.querySelectorAll('.timeframe-btn');
    console.log('타임프레임 버튼 찾기:', buttons.length);
    if (buttons.length === 0) {
        console.error('타임프레임 버튼을 찾을 수 없습니다!');
        return;
    }
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const interval = this.getAttribute('data-interval');
            console.log('타임프레임 버튼 클릭:', interval);
            changeTimeframe(interval);
        });
    });
    console.log('타임프레임 버튼 이벤트 리스너 등록 완료');
}

function changeTimeframe(interval) {
    console.log('changeTimeframe 호출:', interval, '현재:', currentTimeframe);
    if (currentTimeframe === interval) {
        console.log('같은 타임프레임이므로 변경하지 않음');
        return;
    }
    
    currentTimeframe = interval;
    console.log('타임프레임 변경됨:', currentTimeframe);
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        if (btn.getAttribute('data-interval') === interval) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 웹소켓 재연결 (서버에 타임프레임 변경 알림)
    if (socket) {
        console.log('웹소켓에 타임프레임 변경 알림:', interval);
        socket.emit('change_timeframe', { interval: interval });
    } else {
        console.warn('웹소켓이 연결되지 않았습니다');
    }
    
    // TradingView 차트 재생성 (더 확실한 방법)
    destroyTradingViewWidget();
    setTimeout(() => {
        initTradingViewChart();
    }, 100);
    
    // 데이터 다시 로드
    console.log('데이터 다시 로드 시작');
    loadBaccaratData();
}

function updateTradingViewInterval(interval) {
    console.log('updateTradingViewInterval 호출:', interval, 'widget:', tradingViewWidget);
    if (tradingViewWidget) {
        const tvInterval = timeframeMap[interval] || '1';
        console.log('TradingView interval 변경 시도:', interval, '->', tvInterval);
        try {
            // TradingView 위젯의 setSymbol 메서드 사용
            if (typeof tradingViewWidget.setSymbol === 'function') {
                tradingViewWidget.setSymbol('BINANCE:BTCUSDT', tvInterval, () => {
                    console.log(`TradingView 차트 interval 변경 완료: ${interval} (${tvInterval})`);
                });
            } else {
                // setSymbol이 없으면 위젯을 재생성
                console.log('setSymbol 메서드가 없어 위젯을 재생성합니다');
                destroyTradingViewWidget();
                initTradingViewChart();
            }
        } catch (error) {
            console.error('TradingView interval 변경 오류:', error);
            // 오류 발생 시 위젯 재생성
            destroyTradingViewWidget();
            initTradingViewChart();
        }
    } else {
        console.warn('TradingView 위젯이 아직 초기화되지 않았습니다. 재시도합니다...');
        // 위젯이 없으면 재초기화 시도
        setTimeout(() => {
            initTradingViewChart();
            setTimeout(() => updateTradingViewInterval(interval), 1000);
        }, 100);
    }
}

function destroyTradingViewWidget() {
    if (tradingViewWidget) {
        try {
            const chartContainer = document.getElementById('tradingview_chart');
            if (chartContainer) {
                chartContainer.innerHTML = '';
            }
            tradingViewWidget = null;
        } catch (error) {
            console.error('TradingView 위젯 제거 오류:', error);
        }
    }
}

function loadBaccaratData() {
    const boardElement = document.getElementById('baccaratBoard');
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    boardElement.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
    
    // 타임프레임 파라미터 추가
    const url = `/api/baccarat?interval=${currentTimeframe}`;
    console.log('API 호출:', url);
    
    fetch(url)
        .then(response => {
            console.log('API 응답 상태:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API 응답 데이터:', data);
            if (data.success) {
                if (data.data && data.data.length > 0) {
                    // latestData 업데이트
                    latestData = data.data.map(item => ({
                        ...item,
                        time: item.time // 이미 문자열로 변환됨
                    }));
                    
                    console.log('데이터 로드 완료, 보드 렌더링 시작. 데이터 개수:', latestData.length);
                    renderBaccaratBoard(latestData);
                    lastUpdateElement.textContent = `마지막 업데이트: ${new Date().toLocaleTimeString('ko-KR')}`;
                } else {
                    console.warn('데이터가 비어있습니다:', data);
                    boardElement.innerHTML = '<div class="loading">데이터가 없습니다.<br><small>잠시 후 다시 시도해주세요.</small></div>';
                }
            } else {
                console.error('API 응답 오류:', data);
                const errorMsg = data.error || '데이터를 불러올 수 없습니다';
                boardElement.innerHTML = `<div class="loading">${errorMsg}<br><small>서버 로그를 확인해주세요.</small></div>`;
            }
        })
        .catch(error => {
            console.error('API 호출 오류:', error);
            boardElement.innerHTML = `<div class="loading">오류가 발생했습니다: ${error.message}<br><small>브라우저 콘솔과 서버 로그를 확인해주세요.</small></div>`;
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
    // time이 문자열인 경우와 Date 객체인 경우 모두 처리
    const sortedData = [...data].sort((a, b) => {
        const timeA = typeof a.time === 'string' ? new Date(a.time) : a.time;
        const timeB = typeof b.time === 'string' ? new Date(b.time) : b.time;
        return timeA - timeB;
    });
    
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
                const date = typeof item.time === 'string' ? new Date(item.time) : item.time;
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

