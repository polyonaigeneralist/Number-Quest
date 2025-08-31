let gameState = {
    score: 0,
    level: 1,
    streak: 0,
    targetNumber: 0,
    availableNumbers: [],
    currentCalculation: [],
    timeLeft: 30,
    gameTimer: null,
    leaderboard: [
        { name: "Math Wizard", score: 1250 },
        { name: "Number Ninja", score: 980 },
        { name: "Puzzle Master", score: 750 }
    ]
};

function generateNumbers() {
    const numbers = [];
    const level = gameState.level;
    const count = Math.min(6, 4 + Math.floor(level / 3));

    for (let i = 0; i < count; i++) {
        if (level <= 3) {
            numbers.push(Math.floor(Math.random() * 20) + 1);
        } else if (level <= 6) {
            numbers.push(Math.floor(Math.random() * 50) + 1);
        } else {
            numbers.push(Math.floor(Math.random() * 100) + 1);
        }
    }
    return numbers;
}

function generateTarget() {
    const level = gameState.level;
    if (level <= 3) {
        return Math.floor(Math.random() * 50) + 10;
    } else if (level <= 6) {
        return Math.floor(Math.random() * 200) + 20;
    } else {
        return Math.floor(Math.random() * 500) + 50;
    }
}

function startNewRound() {
    gameState.availableNumbers = generateNumbers();
    gameState.targetNumber = generateTarget();
    gameState.currentCalculation = [];
    gameState.timeLeft = Math.max(20, 35 - gameState.level);

    updateDisplay();
    renderNumbers();
    startTimer();
}

function renderNumbers() {
    const grid = document.getElementById('numbersGrid');
    grid.innerHTML = '';

    gameState.availableNumbers.forEach((number, index) => {
        const card = document.createElement('button');
        card.className = 'number-card';
        card.textContent = number;
        card.onclick = () => selectNumber(index);
        card.id = `number-${index}`;
        grid.appendChild(card);
    });
}

function selectNumber(index) {
    const card = document.getElementById(`number-${index}`);
    if (card.classList.contains('used')) return;

    if (gameState.currentCalculation.length > 0 &&
        typeof gameState.currentCalculation[gameState.currentCalculation.length - 1] === 'number') {
        showFeedback('Select an operator first!', 'error');
        return;
    }

    gameState.currentCalculation.push(gameState.availableNumbers[index]);
    card.classList.add('selected');
    updateCalculationDisplay();
}

function selectOperator(operator) {
    if (gameState.currentCalculation.length === 0) {
        showFeedback('Select a number first!', 'error');
        return;
    }

    if (typeof gameState.currentCalculation[gameState.currentCalculation.length - 1] === 'string') {
        showFeedback('Cannot add operator after operator!', 'error');
        return;
    }

    gameState.currentCalculation.push(operator);
    updateCalculationDisplay();
}

function updateCalculationDisplay() {
    const display = document.getElementById('currentCalculation');
    if (gameState.currentCalculation.length === 0) {
        display.textContent = 'Select numbers and operators to build your equation';
    } else {
        display.textContent = gameState.currentCalculation.join(' ');
    }
}

function clearCalculation() {
    gameState.currentCalculation = [];
    document.querySelectorAll('.number-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateCalculationDisplay();
    clearFeedback();
}

function submitAnswer() {
    if (gameState.currentCalculation.length === 0) {
        showFeedback('Build an equation first!', 'error');
        return;
    }

    if (typeof gameState.currentCalculation[gameState.currentCalculation.length - 1] === 'string') {
        showFeedback('Equation cannot end with an operator!', 'error');
        return;
    }

    try {
        const result = evaluateExpression(gameState.currentCalculation);

        if (Math.abs(result - gameState.targetNumber) < 0.001) {
            // Correct answer!
            const timeBonus = Math.floor(gameState.timeLeft * 2);
            const levelBonus = gameState.level * 10;
            const streakBonus = gameState.streak * 5;
            const totalPoints = 100 + timeBonus + levelBonus + streakBonus;

            gameState.score += totalPoints;
            gameState.streak++;

            showFeedback(`🎉 Correct! +${totalPoints} points!`, 'success');

            // Mark used numbers
            gameState.currentCalculation.forEach(item => {
                if (typeof item === 'number') {
                    const index = gameState.availableNumbers.indexOf(item);
                    if (index !== -1) {
                        document.getElementById(`number-${index}`).classList.add('used');
                        gameState.availableNumbers[index] = null;
                    }
                }
            });

            setTimeout(() => {
                gameState.level++;
                startNewRound();
            }, 2000);

        } else {
            showFeedback(`❌ ${result} ≠ ${gameState.targetNumber}. Try again!`, 'error');
            gameState.streak = 0;
            clearCalculation();
        }

    } catch (error) {
        showFeedback('Invalid equation!', 'error');
    }

    updateDisplay();
}

function evaluateExpression(tokens) {
    // Simple expression evaluator
    let result = tokens[0];

    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const operand = tokens[i + 1];

        switch (operator) {
            case '+':
                result += operand;
                break;
            case '-':
                result -= operand;
                break;
            case '*':
                result *= operand;
                break;
            case '/':
                result /= operand;
                break;
        }
    }

    return Math.round(result * 100) / 100; // Round to 2 decimal places
}

function startTimer() {
    clearInterval(gameState.gameTimer);

    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;

        const timerFill = document.getElementById('timerFill');
        const maxTime = Math.max(20, 35 - gameState.level);
        const percentage = (gameState.timeLeft / maxTime) * 100;
        timerFill.style.width = percentage + '%';

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.gameTimer);
            showFeedback('⏰ Time\'s up! Try the next one!', 'error');
            gameState.streak = 0;
            setTimeout(() => {
                startNewRound();
            }, 2000);
        }

        updateDisplay();
    }, 1000);
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;

    if (type === 'error') {
        setTimeout(clearFeedback, 3000);
    }
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
}

function updateDisplay() {
    document.getElementById('score').textContent = gameState.score.toLocaleString();
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('targetNumber').textContent = gameState.targetNumber;

    // Update leaderboard if player made it
    if (gameState.score > 0) {
        updateLeaderboard();
    }
}

function updateLeaderboard() {
    const playerEntry = { name: "You", score: gameState.score };
    const allScores = [...gameState.leaderboard, playerEntry];
    allScores.sort((a, b) => b.score - a.score);

    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    allScores.slice(0, 5).forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        if (entry.name === "You") {
            div.style.background = 'rgba(76, 175, 80, 0.3)';
            div.style.fontWeight = 'bold';
        }
        div.innerHTML = `<span>${entry.name}</span><span>${entry.score.toLocaleString()} pts</span>`;
        leaderboardList.appendChild(div);
    });
}

function newRound() {
    startNewRound();
    clearFeedback();
}

// Initialize game
startNewRound();