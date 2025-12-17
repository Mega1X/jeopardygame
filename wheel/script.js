const puzzles = [
    { category: "PHRASE", text: "IT RAINS CATS AND DOGS" },
    { category: "MOVIE TITLE", text: "THE EMPIRE STRIKES BACK" },
    { category: "BEFORE & AFTER", text: "WHEEL OF FORTUNE COOKIE" },
    { category: "FOOD & DRINK", text: "PEANUT BUTTER JELLY TIME" },
    { category: "PLACE", text: "NEW YORK CITY" },
    { category: "SONG TITLE", text: "SWEET HOME ALABAMA" }
];

const segments = [
    { color: "#FF0000", text: "BANKRUPT", value: 0 },
    { color: "#00FF00", text: "$500", value: 500 },
    { color: "#0000FF", text: "$1000", value: 1000 },
    { color: "#FFFF00", text: "$700", value: 700 },
    { color: "#FFA500", text: "$500", value: 500 },
    { color: "#800080", text: "$2500", value: 2500 },
    { color: "#00FFFF", text: "$600", value: 600 },
    { color: "#FFC0CB", text: "LOSE TURN", value: -1 }
];

let currentPuzzle = {};
let score = 0;
let wheelRotation = 0;
let isSpinning = false;
let currentSpinValue = 0;

// Initialize
function initGame() {
    pickPuzzle();
    drawWheel();
    createKeyboard();
    updateScore(0);
}

function pickPuzzle() {
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    currentPuzzle = puzzles[randomIndex];
    document.getElementById('category-display').textContent = currentPuzzle.category;
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = '';

    // Standard Wheel Board: 4 Rows. 
    // Row 1: 12 tiles (we'll use 14 for simplicity, but pad borders)
    // Row 2: 14 tiles
    // Row 3: 14 tiles
    // Row 4: 12 tiles
    // For this implementation, we will use 4 rows of 14 columns each for standard handling.

    const ROWS = 4;
    const COLS = 14;
    const phrase = currentPuzzle.text.toUpperCase();
    const words = phrase.split(' ');

    // formattedRows will hold arrays of characters for each row
    let formattedRows = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    // Logic to distribute words
    let currentRow = 0;
    let currentLineWords = [];

    // Very basic greedy fit + centering
    // Note: A perfect auto-layout algorithm is complex, 
    // we will try to fill Row 1, if not fit, go to Row 2, etc.
    // Ideally, we center vertically too.

    // 1. Group words into lines
    let lines = [[], [], [], []];
    let lineIndex = 0;

    words.forEach(word => {
        // Check if word fits in current line
        let currentLen = lines[lineIndex].reduce((acc, w) => acc + w.length + 1, 0) - 1; // -1 for trailing space
        if (currentLen < 0) currentLen = 0;

        if (currentLen + word.length + (currentLen > 0 ? 1 : 0) <= COLS) {
            lines[lineIndex].push(word);
        } else {
            // Move to next line
            lineIndex++;
            if (lineIndex < ROWS) {
                lines[lineIndex].push(word);
            }
        }
    });

    // Vertical Centering: Move lines down if top rows are empty
    // Count used lines
    let usedLines = lines.filter(l => l.length > 0).length;
    let startRow = 0;
    if (usedLines === 1) startRow = 1; // Center on row 2
    else if (usedLines === 2) startRow = 1; // Center on rows 2,3
    else if (usedLines === 3) startRow = 0; // Rows 1,2,3

    // 2. Map lines to grid
    lines.forEach((lineWords, idx) => {
        if (lineWords.length === 0) return;

        let rowIdx = startRow + idx;
        if (rowIdx >= ROWS) return; // Overflow protection

        // Calculate text and centering
        let lineStr = lineWords.join(' ');
        let padding = Math.floor((COLS - lineStr.length) / 2);

        for (let i = 0; i < lineStr.length; i++) {
            formattedRows[rowIdx][padding + i] = lineStr[i];
        }
    });

    // 3. Render HTML
    for (let r = 0; r < ROWS; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'board-row';

        for (let c = 0; c < COLS; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            const char = formattedRows[r][c];
            if (char && char !== ' ') {
                tile.classList.add('active');
                tile.dataset.char = char;
                tile.innerHTML = `<span style="display:none">${char}</span>`;
            }
            // Else it remains a dark green empty tile

            rowDiv.appendChild(tile);
        }
        board.appendChild(rowDiv);
    }
}

function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    letters.split('').forEach(letter => {
        const btn = document.createElement('button');
        btn.textContent = letter;
        btn.className = 'key';
        btn.disabled = true; // Disabled until spin
        btn.onclick = () => handleGuess(letter, btn);
        keyboard.appendChild(btn);
    });
}

function handleGuess(letter, btn) {
    btn.disabled = true;
    const tiles = document.querySelectorAll('.tile.active');
    let count = 0;

    tiles.forEach(tile => {
        if (tile.dataset.char === letter) {
            tile.classList.add('revealed');
            tile.querySelector('span').style.display = 'block';
            count++;
        }
    });

    if (count > 0) {
        const points = currentSpinValue * count;
        score += points;
        updateScore(score);
        setMessage(`Found ${count} ${letter}'s! +$${points}`);
    } else {
        setMessage(`No ${letter} in the puzzle.`);
    }

    // Disable keyboard again, must spin
    disableKeyboard();
    document.getElementById('spin-btn').disabled = false;

    checkWin();
}

function checkWin() {
    const unrevealed = document.querySelectorAll('.tile.active:not(.revealed)');
    if (unrevealed.length === 0) {
        setMessage("YOU SOLVED IT!");
        // setTimeout(initGame, 3000);
    }
}

// Wheel Logic
function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    const arc = (2 * Math.PI) / segments.length;

    // Set real size
    canvas.width = 300;
    canvas.height = 300;

    segments.forEach((seg, i) => {
        const angle = i * arc;
        const color = seg.color;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arc);
        ctx.lineTo(radius, radius);
        ctx.fill();

        // Text
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.fillText(seg.text, radius - 10, 5);
        ctx.restore();
    });
}

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    document.getElementById('spin-btn').disabled = true;
    setMessage("Spinning...");

    // Random spin force
    const extraSpins = 5 + Math.random() * 5;
    const finalAngle = Math.random() * 360;
    const totalRotation = (extraSpins * 360) + finalAngle;

    wheelRotation += totalRotation; // Keep increasing to spin consistently

    const wheel = document.getElementById('wheel-canvas');
    wheel.style.transform = `rotate(${wheelRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        calculateResult(wheelRotation % 360);
    }, 4000); // Match CSS transition time
}

function calculateResult(deg) {
    // Determine segment based on degrees
    // 0 deg is right (3 o'clock). Arrow is top (270 deg / -90 deg visually).
    // This math can be finicky, approximating for demo.
    const sliceDeg = 360 / segments.length;
    // Normalize to standard circle where 0 is top
    let actualDeg = (360 - deg + 270) % 360; // 0 at top

    const index = Math.floor(actualDeg / sliceDeg);
    const result = segments[index];

    setMessage(`Landed on: ${result.text}`);
    currentSpinValue = result.value;

    if (result.text === "BANKRUPT") {
        score = 0;
        updateScore(score);
        document.getElementById('spin-btn').disabled = false;
    } else if (result.text === "LOSE TURN") {
        document.getElementById('spin-btn').disabled = false;
    } else {
        // Allow Guess
        enableKeyboard();
    }
}

function setMessage(msg) {
    document.getElementById('status-msg').textContent = msg;
}

function updateScore(s) {
    document.getElementById('score-display').textContent = `Score: $${s}`;
}

function enableKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(k => k.disabled = false);
}

function disableKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(k => k.disabled = true);
}

function solvePuzzle() {
    const guess = document.getElementById('solve-input').value.toUpperCase();
    if (guess === currentPuzzle.text) {
        score += 5000; // Bonus
        updateScore(score);
        setMessage("CORRECT! PUZZLE SOLVED!");

        // Reveal all
        document.querySelectorAll('.tile.active span').forEach(s => s.style.display = 'block');
        document.querySelectorAll('.tile').forEach(t => t.classList.add('revealed'));
    } else {
        setMessage("Incorrect Solve Attempt.");
    }
    document.getElementById('solve-input').value = '';
}

window.onload = initGame;
