// 24 Segments (Standard-ish distribution)
const segments = [
    { color: "#FF0000", text: "BANKRUPT", value: 0 },
    { color: "#00FF00", text: "$500", value: 500 },
    { color: "#0000FF", text: "$900", value: 900 },
    { color: "#FFFF00", text: "$700", value: 700 },
    { color: "#FFA500", text: "$500", value: 500 },
    { color: "#800080", text: "$800", value: 800 },
    { color: "#00FFFF", text: "$600", value: 600 },
    { color: "#FFC0CB", text: "$700", value: 700 },
    { color: "#FF0000", text: "LOSE TURN", value: -1 },
    { color: "#008000", text: "$600", value: 600 },
    { color: "#0000FF", text: "$550", value: 550 },
    { color: "#FFFF00", text: "$500", value: 500 },
    { color: "#FFA500", text: "$900", value: 900 },
    { color: "#800080", text: "BANKRUPT", value: 0 },
    { color: "#00FFFF", text: "$650", value: 650 },
    { color: "#FFC0CB", text: "FREE PLAY", value: 500 }, // Treat as 500 for now
    { color: "#008000", text: "$700", value: 700 },
    { color: "#FFD700", text: "$1000", value: 1000 }, // Renamed from LC
    { color: "#0000FF", text: "$800", value: 800 },
    { color: "#FFFF00", text: "$500", value: 500 },
    { color: "#FFA500", text: "$650", value: 650 },
    { color: "#800080", text: "$500", value: 500 },
    { color: "#00FFFF", text: "$900", value: 900 },
    { color: "#C0C0C0", text: "$5000", value: 5000 } // Top Dollar
];

const puzzles = [
    { category: "PHRASE", text: "IT RAINS CATS AND DOGS" },
    { category: "MOVIE TITLE", text: "THE EMPIRE STRIKES BACK" },
    { category: "BEFORE & AFTER", text: "WHEEL OF FORTUNE COOKIE" },
    { category: "FOOD & DRINK", text: "PEANUT BUTTER JELLY TIME" },
    { category: "PLACE", text: "NEW YORK CITY" },
    { category: "SONG TITLE", text: "SWEET HOME ALABAMA" }
];

let currentPuzzle = {};
let score = 0;
let wheelRotation = 0;
let isSpinning = false;
let currentSpinValue = 0;
let consecutiveBadSpins = 0; // Fairness tracker

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

    // Increase resolution for crisper text
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20; // 20px padding for pegs
    const arc = (2 * Math.PI) / segments.length;

    segments.forEach((seg, i) => {
        const angle = i * arc;
        const color = seg.color;

        ctx.beginPath();
        // Gradient for depth
        const gradient = ctx.createRadialGradient(centerX, centerY, radius / 4, centerX, centerY, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, shadeColor(color, -20)); // Darker rim

        ctx.fillStyle = gradient;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = (seg.text === "BANKRUPT" || seg.text === "LOSE TURN") ? "#FFF" : "#000";
        if (["BANKRUPT", "LOSE TURN"].includes(seg.text)) ctx.fillStyle = "#FFF";
        else ctx.fillStyle = "#FFF"; // All white text usually looks best on dark/neon colors

        ctx.font = "bold 24px Arial";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(seg.text, radius - 40, 8);
        ctx.restore();
    });

    // Draw Pegs
    ctx.fillStyle = "white";
    for (let i = 0; i < segments.length; i++) {
        const pegAngle = i * arc;
        const pegX = centerX + (radius + 10) * Math.cos(pegAngle);
        const pegY = centerY + (radius + 10) * Math.sin(pegAngle);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Center Cap
    ctx.beginPath();
    ctx.fillStyle = "gold";
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#DAA520";
    ctx.lineWidth = 5;
    ctx.stroke();
}

// Helper to darken colors for gradient
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    document.getElementById('spin-btn').disabled = true;
    setMessage("Spinning...");

    // Determine Result Logic (Fairness Check)
    // We calculate the final angle *before* we spin so we know the result
    let extraSpins = 5 + Math.random() * 5;
    let finalAngle = Math.random() * 360;

    // Check predicted result
    // Wheel rotates clockwise, so 0 is 3 o'clock. 
    // We need to simulate the result logic here to check fairness
    let predictedRotation = wheelRotation + (extraSpins * 360) + finalAngle;
    let predictedResult = getResultFromRotation(predictedRotation);

    // If 2 bad spins already, and this is another bad one... reroll until it's safe
    if (consecutiveBadSpins >= 2 && (predictedResult.value <= 0)) {
        console.log("Fairness Triggered: Rerolling to avoid 3rd bad spin.");
        let safetyCounter = 0;
        while (predictedResult.value <= 0 && safetyCounter < 50) {
            finalAngle = Math.random() * 360;
            predictedRotation = wheelRotation + (extraSpins * 360) + finalAngle;
            predictedResult = getResultFromRotation(predictedRotation);
            safetyCounter++;
        }
    }

    wheelRotation += (extraSpins * 360) + finalAngle;

    const wheel = document.getElementById('wheel-canvas');
    wheel.style.transform = `rotate(${wheelRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        calculateResult(wheelRotation % 360);
    }, 4000);
}

function getResultFromRotation(deg) {
    const sliceDeg = 360 / segments.length;
    let actualDeg = (360 - (deg % 360) + 270) % 360;
    const index = Math.floor(actualDeg / sliceDeg);
    return segments[index] || segments[0];
}

function calculateResult(deg) {
    const result = getResultFromRotation(deg);

    setMessage(`Landed on: ${result.text}`);
    currentSpinValue = result.value;

    if (result.value <= 0) {
        // Bad Spin
        consecutiveBadSpins++;
        if (result.text === "BANKRUPT") {
            score = 0;
            updateScore(score);
        }
        document.getElementById('spin-btn').disabled = false;
    } else {
        // Good Spin
        consecutiveBadSpins = 0; // Reset counter
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
