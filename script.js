// Fallback default questions in case fetch fails (e.g. file:// context)
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

let currentScore = 0;
let currentQuestionValue = 0;
let currentCardElement = null;

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('reveal-btn').addEventListener('click', revealAnswer);
    document.getElementById('correct-btn').addEventListener('click', () => handleAnswer(true));
    document.getElementById('incorrect-btn').addEventListener('click', () => handleAnswer(false));
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to reset the game? Score will be lost.')) {
            currentScore = 0;
            updateScoreDisplay();
            // Re-render the current board to reset disabled cards
            // Getting the current data is a bit tricky if we don't store it globally.
            // Let's store it.
            if (window.gameData) {
                renderBoard(window.gameData);
            } else {
                initGame();
            }
        }
    });
}

function updateScoreDisplay() {
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = `$${currentScore}`;
    scoreEl.style.color = currentScore < 0 ? '#ff5555' : 'white';
}

async function initGame() {
    // Try to fetch default questions
    try {
        const response = await fetch('default_questions.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderBoard(data);
    } catch (error) {
        console.warn('Could not fetch default_questions.json (likely due to file:// protocol restriction), using fallback data.', error);
        renderBoard(FALLBACK_QUESTIONS);
    }
}

function renderBoard(data) {
    window.gameData = data; // Store for reset
    const grid = document.getElementById('grid-container');
    grid.innerHTML = ''; // Clear existing

    // 1. Render Headers
    data.forEach(category => {
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = category.category;
        grid.appendChild(header);
    });

    // 2. Render Questions (assuming all categories have same # of questions)
    // We need to iterate by ROW, not by category column, for CSS Grid to flow correctly 
    // IF we just dump them. But CSS Grid default flow is row-major. 
    // So we need: Row 1 (Cat 1 Q1, Cat 2 Q1, Cat 3 Q1...), Row 2 (Cat 1 Q2...)
    
    const numQuestions = data[0].questions.length;
    const numCategories = data.length;

    for (let i = 0; i < numQuestions; i++) {
        for (let j = 0; j < numCategories; j++) {
            const questionData = data[j].questions[i];
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = `$${questionData.value}`;
            
            // Store data
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
    answerControls.style.display = 'none'; // Hide answer controls initially
    
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

function handleAnswer(isCorrect) {
    if (isCorrect) {
        currentScore += currentQuestionValue;
    } else {
        currentScore -= currentQuestionValue;
    }
    updateScoreDisplay();
    closeModal();
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    
    // Disable the card
    if (currentCardElement) {
        currentCardElement.classList.add('disabled');
        currentCardElement.textContent = ''; // Clear value
        currentCardElement = null;
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Basic validation
            if (Array.isArray(data) && data.length > 0 && data[0].questions) {
                currentScore = 0;
                updateScoreDisplay();
                renderBoard(data);
                alert('Questions loaded successfully!');
            } else {
                alert('Invalid JSON format. Please ensure it matches the Jeopardy format.');
            }
        } catch (error) {
            alert('Error parsing JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed (though unlikely)
    event.target.value = '';
}
