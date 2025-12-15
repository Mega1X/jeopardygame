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
    // Top bar buttons
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    // document.getElementById('reveal-btn-nav') handles click inline or we bind it here

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

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('modal');
        if (modal.style.display === 'flex') {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling if applicable
                revealAnswer();
            }
            if (e.code === 'Escape') {
                closeModal();
            }
        }
    });
}

function updateScoreDisplay() {
    for (let i = 0; i < 3; i++) {
        const scoreEl = document.getElementById(`score-${i}`);
        if (scoreEl) {
            scoreEl.textContent = `${teamScores[i]}`; // Removed $ sign to match clean look
            scoreEl.style.color = 'white'; // Always white
        }
    }
}

// ... initGame and renderBoard same but small updates if needed ...

function handleCardClick(card) {
    if (card.classList.contains('disabled')) return;

    currentCardElement = card;
    currentQuestionValue = parseInt(card.dataset.value);

    // Show Modal
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const answerText = document.getElementById('answer-text');

    modalText.textContent = card.dataset.question;
    answerText.textContent = card.dataset.answer;

    // Reset state
    answerText.style.display = 'none';

    modal.style.display = 'flex';
}

function revealAnswer() {
    const answerText = document.getElementById('answer-text');
    if (answerText) {
        answerText.style.display = 'block';
    }
}

function handleAnswer(teamIndex, isCorrect) {
    // Important: Prevent event bubbling if clicking button triggers card click behind it? 
    // No, controls are outside modal now.

    if (isCorrect) {
        teamScores[teamIndex] += currentQuestionValue;
        // Don't auto-close modal in this style, typically you reveal then close manually
    } else {
        teamScores[teamIndex] -= currentQuestionValue;
    }
    updateScoreDisplay();
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

// ... handleFileUpload same ...
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
                // alert('Questions loaded successfully!'); // Remove annoyance
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
