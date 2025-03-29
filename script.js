const puzzleContainer = document.getElementById('puzzle');
const movesDisplay = document.getElementById('moves');
const timeDisplay = document.getElementById('time');
const shuffleButton = document.getElementById('shuffle');
const imageInput = document.getElementById('imageInput');

let currentImage = '1.jpg';

// 处理图片选择
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        currentImage = event.target.result;
        initPuzzle();
    };
    reader.readAsDataURL(file);
});

let puzzlePieces = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 represents the empty space
let emptyIndex = 8;
let moves = 0;
let seconds = 0;
let timer;

// 初始化拼图
function initPuzzle() {
    puzzleContainer.innerHTML = '';
    puzzlePieces.forEach((piece, index) => {
        const puzzlePiece = document.createElement('div');
        puzzlePiece.className = piece === 0 ? 'puzzle-piece empty' : 'puzzle-piece';
        puzzlePiece.textContent = piece === 0 ? '' : piece;
        puzzlePiece.dataset.index = index;
        puzzlePiece.addEventListener('click', () => movePiece(index));
        
        // 设置背景图片位置
        if (piece !== 0) {
            const row = Math.floor((piece - 1) / 3);
            const col = (piece - 1) % 3;
            puzzlePiece.style.backgroundImage = `url("${currentImage}")`;
            puzzlePiece.style.backgroundSize = '300px 300px';
            puzzlePiece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
        }
        puzzleContainer.appendChild(puzzlePiece);
    });
    
    // 初始化排行榜
    if (!localStorage.getItem('leaderboard')) {
        localStorage.setItem('leaderboard', JSON.stringify([]));
    }
    showLeaderboard();
}

// 移动拼图块
function movePiece(clickedIndex) {
    const directions = [-3, -1, 1, 3]; // 上、左、右、下
    
    for (const dir of directions) {
        const targetIndex = clickedIndex + dir;
        
        if (targetIndex === emptyIndex && isValidMove(clickedIndex, targetIndex)) {
            // 交换位置
            [puzzlePieces[clickedIndex], puzzlePieces[emptyIndex]] = 
                [puzzlePieces[emptyIndex], puzzlePieces[clickedIndex]];
            emptyIndex = clickedIndex;
            moves++;
            movesDisplay.textContent = moves;
            
            initPuzzle();
            checkWin();
            break;
        }
    }
}

// 检查移动是否有效
function isValidMove(clickedIndex, targetIndex) {
    // 检查边界
    if (targetIndex < 0 || targetIndex > 8) return false;
    
    // 检查是否在同一行或同一列
    const clickedRow = Math.floor(clickedIndex / 3);
    const targetRow = Math.floor(targetIndex / 3);
    const clickedCol = clickedIndex % 3;
    const targetCol = targetIndex % 3;
    
    return (clickedRow === targetRow && Math.abs(clickedCol - targetCol) === 1) || 
           (clickedCol === targetCol && Math.abs(clickedRow - targetRow) === 1);
}

// 检查是否获胜
function checkWin() {
    const isWin = puzzlePieces.every((piece, index) => 
        piece === 0 || piece === index + 1);
    
    if (isWin) {
        clearInterval(timer);
        setTimeout(() => alert(`恭喜你赢了！\n步数: ${moves}\n时间: ${seconds}秒`), 100);
    }
}

// 随机打乱拼图
function shufflePuzzle() {
    clearInterval(timer);
    moves = 0;
    seconds = 0;
    movesDisplay.textContent = moves;
    timeDisplay.textContent = seconds;
    
    // 随机移动100次
    for (let i = 0; i < 100; i++) {
        const directions = [-3, -1, 1, 3].filter(dir => {
            const targetIndex = emptyIndex + dir;
            return targetIndex >= 0 && targetIndex <= 8 && 
                   isValidMove(emptyIndex, targetIndex);
        });
        
        if (directions.length > 0) {
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const targetIndex = emptyIndex + randomDir;
            
            [puzzlePieces[emptyIndex], puzzlePieces[targetIndex]] = 
                [puzzlePieces[targetIndex], puzzlePieces[emptyIndex]];
            emptyIndex = targetIndex;
        }
    }
    
    initPuzzle();
    
    // 开始计时
    timer = setInterval(() => {
        seconds++;
        timeDisplay.textContent = seconds;
    }, 1000);
}

function checkWin() {
    for (let i = 0; i < puzzlePieces.length - 1; i++) {
        if (puzzlePieces[i] !== i + 1) {
            return false;
        }
    }
    
    if (puzzlePieces[8] !== 0) return false;
    
    clearInterval(timer);
    
    // 检查是否破纪录
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard'));
    const newRecord = { time: seconds, moves: moves, date: new Date().toLocaleString() };
    
    // 如果排行榜为空或新纪录更好，则添加
    if (leaderboard.length < 10 || 
        seconds < leaderboard[leaderboard.length-1].time || 
        (seconds === leaderboard[leaderboard.length-1].time && moves < leaderboard[leaderboard.length-1].moves)) {
        
        leaderboard.push(newRecord);
        // 按时间升序，时间相同按步数升序排序
        leaderboard.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            return a.moves - b.moves;
        });
        
        // 只保留前10条记录
        if (leaderboard.length > 10) {
            leaderboard.length = 10;
        }
        
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        alert('恭喜破纪录！已添加到排行榜！');
    }
    
    showLeaderboard();
    return true;
}

function showLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard'));
    const leaderboardElement = document.getElementById('leaderboard');
    
    if (!leaderboard || leaderboard.length === 0) {
        leaderboardElement.innerHTML = '<p>暂无记录</p>';
        return;
    }
    
    let html = '<table><tr><th>排名</th><th>时间(秒)</th><th>步数</th><th>日期</th></tr>';
    
    leaderboard.forEach((record, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td>${record.time}</td>
            <td>${record.moves}</td>
            <td>${record.date}</td>
        </tr>`;
    });
    
    html += '</table>';
    leaderboardElement.innerHTML = html;
}

// 初始化游戏
shuffleButton.addEventListener('click', shufflePuzzle);
shufflePuzzle();