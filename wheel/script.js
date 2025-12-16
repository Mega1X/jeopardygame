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

    // Simple logic to fit text on board (wrapping not perfect, but functional)
    const text = currentPuzzle.text.toUpperCase();

    for (let char of text) {
        const tile = document.createElement('div');
        tile.className = 'tile';

        if (char.match(/[A-Z]/)) {
            tile.classList.add('active'); // White tile
            tile.dataset.char = char;
            tile.innerHTML = `<span style="display:none">${char}</span>`;
        } else if (char === ' ') {
            // Space, remains green
        } else {
            // Punctuation
            tile.classList.add('revealed');
            tile.classList.add('active');
            tile.innerHTML = `<span>${char}</span>`;
        }
        board.appendChild(tile);
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
