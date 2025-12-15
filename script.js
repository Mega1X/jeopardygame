// Fallback default questions in case fetch fails
const FALLBACK_QUESTIONS = [
    {
        "category": "History",
        "questions": [
            { "value": 100, "question": "This declaration was signed in 1776.", "answer": "What is the Declaration of Independence?" },
            { "value": 200, "question": "He was the first president of the United States.", "answer": "Who is George Washington?" },
            { "value": 300, "question": "This war was fought between the North and South in the US.", "answer": "What is the Civil War?" },
            { "value": 400, "question": "In 1492, he sailed the ocean blue.", "answer": "Who is Christopher Columbus?" },
            { "value": 500, "question": "This ancient civilization built the pyramids.", "answer": "What is Egypt?" }
        ]
    },
    {
        "category": "Science",
        "questions": [
            { "value": 100, "question": "H2O is the chemical formula for this.", "answer": "What is water?" },
            { "value": 200, "question": "The planet closest to the sun.", "answer": "What is Mercury?" },
            { "value": 300, "question": "The force that keeps us on the ground.", "answer": "What is gravity?" },
            { "value": 400, "question": "This organ pumps blood through the body.", "answer": "What is the heart?" },
            { "value": 500, "question": "The process by which plants make food.", "answer": "What is photosynthesis?" }
        ]
    },
    {
        "category": "Geography",
        "questions": [
            { "value": 100, "question": "The largest continent.", "answer": "What is Asia?" },
            { "value": 200, "question": "The capital of France.", "answer": "What is Paris?" },
            { "value": 300, "question": "This river runs through Egypt.", "answer": "What is the Nile?" },
            { "value": 400, "question": "The strict 50 US states share this number of stars on the flag.", "answer": "What is 50?" },
            { "value": 500, "question": "The ocean between America and Europe.", "answer": "What is the Atlantic?" }
        ]
    },
    {
        "category": "Pop Culture",
        "questions": [
            { "value": 100, "question": "This mouse is Disney's mascot.", "answer": "Who is Mickey Mouse?" },
            { "value": 200, "question": "He lives in a pineapple under the sea.", "answer": "Who is Spongebob Squarepants?" },
            { "value": 300, "question": "The boy who lived.", "answer": "Who is Harry Potter?" },
            { "value": 400, "question": "This superhero is known as the Dark Knight.", "answer": "Who is Batman?" },
            { "value": 500, "question": "The king of pop.", "answer": "Who is Michael Jackson?" }
        ]
    },
    {
        "category": "Sports",
        "questions": [
            { "value": 100, "question": "You hit a homerun in this sport.", "answer": "What is Baseball?" },
            { "value": 200, "question": "The Super Bowl is the championship for this sport.", "answer": "What is Football?" },
            { "value": 300, "question": "This sport is played on ice with a puck.", "answer": "What is Hockey?" },
            { "value": 400, "question": "LeBron James plays this sport.", "answer": "What is Basketball?" },
            { "value": 500, "question": "The World Cup is the biggest tournament in this sport.", "answer": "What is Soccer (or Football)?" }
        ]
    },
    {
        "category": "Tech",
        "questions": [
            { "value": 100, "question": "This company makes the iPhone.", "answer": "What is Apple?" },
            { "value": 200, "question": "The largest social media network.", "answer": "What is Facebook?" },
            { "value": 300, "question": "You 'google' things on this search engine.", "answer": "What is Google?" },
            { "value": 400, "question": "This man founded Microsoft.", "answer": "Who is Bill Gates?" },
            { "value": 500, "question": "CPU stands for this.", "answer": "What is Central Processing Unit?" }
        ]
    }
];

// 3 Teams: Index 0, 1, 2
let teamScores = [0, 0, 0];
let currentQuestionValue = 0;
let currentCardElement = null;

// Expose handleAnswer globally since we used onclick in HTML
window.handleAnswer = handleAnswer;

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('reveal-btn').addEventListener('click', revealAnswer);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);

    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the game? Scores will be lost.')) {
            teamScores = [0, 0, 0];
            updateScoreDisplay();
            // Re-render
            if (window.gameData) {
                renderBoard(window.gameData);
            } else {
                initGame();
            }
        }
    });
}

function updateScoreDisplay() {
    for (let i = 0; i < 3; i++) {
        const scoreEl = document.getElementById(`score-${i}`);
        if (scoreEl) {
            scoreEl.textContent = `$${teamScores[i]}`;
            scoreEl.style.color = teamScores[i] < 0 ? '#ff5555' : 'white';
        }
    }
}

async function initGame() {
    try {
        const response = await fetch('default_questions.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderBoard(data);
    } catch (error) {
        console.warn('Could not fetch default_questions.json', error);
        renderBoard(FALLBACK_QUESTIONS);
    }
}

function renderBoard(data) {
    window.gameData = data;
    const grid = document.getElementById('grid-container');
    grid.innerHTML = '';

    // Headers
    data.forEach(category => {
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = category.category;
        grid.appendChild(header);
    });

    // Cards
    const numQuestions = data[0].questions.length;
    const numCategories = data.length;

    for (let i = 0; i < numQuestions; i++) {
        for (let j = 0; j < numCategories; j++) {
            const questionData = data[j].questions[i];
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = `$${questionData.value}`;

            card.dataset.question = questionData.question;
            card.dataset.answer = questionData.answer;
            card.dataset.value = questionData.value;

            card.addEventListener('click', (e) => handleCardClick(e.target));
            grid.appendChild(card);
        }
    }
}

function handleCardClick(card) {
    if (card.classList.contains('disabled')) return;

    currentCardElement = card;
    currentQuestionValue = parseInt(card.dataset.value);

    // Show Modal
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const revealBtn = document.getElementById('reveal-btn');
    const answerControls = document.getElementById('answer-controls');

    modalText.textContent = card.dataset.question;
    revealBtn.style.display = 'block';
    // Use flex, but make sure it respects the CSS class we added
    answerControls.style.display = 'none';
    answerControls.classList.remove('visible'); // Custom helper if needed, but display:none override works

    modal.style.display = 'flex';
}

function revealAnswer() {
    const modalText = document.getElementById('modal-text');
    const revealBtn = document.getElementById('reveal-btn');
    const answerControls = document.getElementById('answer-controls');

    if (currentCardElement) {
        modalText.textContent = currentCardElement.dataset.answer;
        revealBtn.style.display = 'none';
        answerControls.style.display = 'flex';
    }
}

function handleAnswer(teamIndex, isCorrect) {
    if (isCorrect) {
        teamScores[teamIndex] += currentQuestionValue;
    } else {
        teamScores[teamIndex] -= currentQuestionValue;
    }
    updateScoreDisplay();
    // We do NOT close the modal automatically anymore, because multiple teams might answer! 
    // Or users might want to adjust multiple scores.
    // The "Close Question" button is there for when they are done.
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';

    if (currentCardElement) {
        currentCardElement.classList.add('disabled');
        currentCardElement.textContent = '';
        currentCardElement = null;
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data) && data.length > 0 && data[0].questions) {
                teamScores = [0, 0, 0];
                updateScoreDisplay();
                renderBoard(data);
                alert('Questions loaded successfully!');
            } else {
                alert('Invalid JSON format.');
            }
        } catch (error) {
            alert('Error parsing JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
