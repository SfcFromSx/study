/**
 * Space Quiz Shooter Game
 * Main game logic
 */

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 3;
const ENEMY_SPEED = 0.75;
const MAX_HEALTH = 10;
const BULLET_TYPES = {
    A: { key: 'a', color: '#ff5252', text: 'A' },
    B: { key: 's', color: '#4caf50', text: 'B' },
    C: { key: 'd', color: '#2196f3', text: 'C' },
    D: { key: 'f', color: '#ff9800', text: 'D' },
    TRUE: { key: 'w', color: '#4caf50', text: '✓' },
    FALSE: { key: 'e', color: '#ff5252', text: '✗' },
    SUBMIT: { key: ' ', color: '#9c27b0', text: '→' }
};

// 游戏难度
const DIFFICULTY = {
    EASY: 'easy',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
};

// Game state
let gameActive = false;
let gamePaused = false;
let player;
let bullets = [];
let enemies = [];
let currentQuestions = [];
let currentQuestionIndex = 0; // 当前题目索引
let score = 0;
let health = MAX_HEALTH;
let canvas, ctx;
let shieldCount = 0;
let isInvincible = false;
let gameLoop;
let questionStats = []; // For tracking question status
let comboCount = 0; // 连击计数
let comboTimer = null; // 连击计时器
let fireworks = []; // 烟花特效数组

// 题库和难度相关变量
let selectedBankId = null;
let selectedSampleSize = 20;
let selectedDifficulty = DIFFICULTY.EASY;

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const questionBankScreen = document.getElementById('question-bank-screen');
const finalScoreElement = document.getElementById('final-score');
const scoreElement = document.getElementById('score');
const healthBarElement = document.getElementById('health-bar');
const comboDisplayElement = document.getElementById('combo-display');
const statsContainerElement = document.getElementById('stats-container');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const pauseOverlay = document.getElementById('pause-overlay');
const questionBanksContainer = document.getElementById('question-banks-container');
const selectBankButton = document.getElementById('select-bank-button');
const changeBankButton = document.getElementById('change-bank-button');
const changeBankButtonGameover = document.getElementById('change-bank-button-gameover');
const selectedBankNameElement = document.getElementById('selected-bank-name');
const selectedSampleSizeElement = document.getElementById('selected-sample-size');

// Player class
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - this.height - 10;
        this.moveLeft = false;
        this.moveRight = false;
        
        // 加载玩家图片
        this.image = new Image();
        this.image.src = 'assets/player.png';
        
        // 如果PNG加载失败，尝试加载SVG
        this.image.onerror = () => {
            this.image.src = 'assets/player.svg';
        };
    }

    update() {
        // Move player based on keyboard input
        if (this.moveLeft) {
            this.x = Math.max(0, this.x - PLAYER_SPEED);
        }
        if (this.moveRight) {
            this.x = Math.min(GAME_WIDTH - this.width, this.x + PLAYER_SPEED);
        }
    }

    draw() {
        // Fallback if image isn't loaded
        if (!this.image.complete || this.image.naturalHeight === 0) {
            this.drawFallbackShip();
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    
    drawFallbackShip() {
        // Draw ship body
        ctx.fillStyle = '#4c4cff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship details
        ctx.fillStyle = '#7070ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + 10);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.8);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Draw cockpit
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 15, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw engine glow
        ctx.fillStyle = '#ff9955';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height - 12, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    move(direction) {
        if (gamePaused) return;
        
        if (direction === 'left') {
            this.moveLeft = true;
            this.moveRight = false;
        } else if (direction === 'right') {
            this.moveRight = true;
            this.moveLeft = false;
        }
    }
    
    stop() {
        this.moveLeft = false;
        this.moveRight = false;
    }

    shoot(bulletType) {
        if (gamePaused) return;
        
        const bullet = new Bullet(
            this.x + this.width / 2 - 5,
            this.y,
            bulletType
        );
        bullets.push(bullet);
    }
}

// Bullet class
class Bullet {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20; // Wider to fit text
        this.height = 20; // Square shape
        this.speed = BULLET_SPEED;
        this.type = type;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        const bulletInfo = BULLET_TYPES[this.type];
        
        // Draw bullet background (circle)
        ctx.fillStyle = bulletInfo.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bullet text
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bulletInfo.text, this.x + this.width / 2, this.y + this.height / 2);
    }

    isOffScreen() {
        return this.y < 0;
    }

    collidesWith(enemy) {
        return (
            this.x < enemy.hitbox.x + enemy.hitbox.width &&
            this.x + this.width > enemy.hitbox.x &&
            this.y < enemy.hitbox.y + enemy.hitbox.height &&
            this.y + this.height > enemy.hitbox.y
        );
    }
}

// Enemy class
class Enemy {
    constructor(questionIndex) {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = -this.height;
        
        // 根据难度设置速度
        if (selectedDifficulty === DIFFICULTY.EXPERT) {
            this.speed = ENEMY_SPEED * 2; // 资深难度下速度翻倍
        } else {
            this.speed = ENEMY_SPEED;
        }
        
        this.questionIndex = questionIndex;
        this.shields = 0;
        this.maxShields = 3;
        this.question = currentQuestions[questionIndex];
        this.hitbox = { x: 0, y: 0, width: 0, height: 0 }; // 添加命中判定区域
        
        // 记录多选题已选中的选项
        this.selectedAnswers = [];
        
        // Determine color based on question type
        if (this.question.options) { // Multiple choice
            const answerIndex = ['A', 'B', 'C', 'D'].indexOf(this.question.correctAnswer);
            const colors = ['#ff5252', '#4caf50', '#2196f3', '#ff9800'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        } else { // True/False
            this.color = this.question.correctAnswer === 'TRUE' ? '#4caf50' : '#ff5252';
        }
    }

    update() {
        // Simple downward movement
        this.y += this.speed;
    }

    draw() {
        // Draw question above enemy first
        const questionBoxInfo = this.drawHoveringQuestion();
        
        // Draw enemy as a horizontal line that's positioned right below the question box
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Use the question box bottom position for the line, but make it 1/6 the width
        const lineY = questionBoxInfo.y + questionBoxInfo.height;
        const lineWidth = questionBoxInfo.width / 6; // 宽度减少到六分之一
        const lineStartX = questionBoxInfo.x + (questionBoxInfo.width - lineWidth) / 2; // 居中显示
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineStartX + lineWidth, lineY);
        ctx.stroke();
        
        // 更新命中判定区域
        this.hitbox = {
            x: lineStartX,
            y: lineY - 10, // 判定区域向上延伸一点，更容易命中
            width: lineWidth,
            height: 20 // 判定区域高度加大，更容易命中
        };
        
        // 绘制判定区域（调试用，正式版可以注释掉）
        // ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        // ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        
        // Draw shields if any
        this.drawShields();
    }
    
    drawShields() {
        // 移除绘制横线的代码，我们现在使用文字颜色表示保护套
        // 如果需要，可以在这里添加其他视觉效果
    }
    
    drawHoveringQuestion() {
        const question = this.question;
        const questionWidth = 350;
        const lineHeight = 15;
        
        // Calculate how many lines the question will take
        const words = question.question.split(' ');
        let lines = [];
        let currentLine = '';
        
        // Measure text width (initialize canvas text properties first)
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (ctx.measureText(testLine).width > questionWidth - 30) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        lines.push(currentLine);
        
        // 使用固定高度，不再动态计算
        const fixedHeight = 150; // 固定高度为150像素
        const boxHeight = fixedHeight;
        
        // Position the question box above the enemy
        const boxX = Math.max(5, Math.min(GAME_WIDTH - questionWidth - 5, this.x + this.width / 2 - questionWidth / 2));
        const boxY = Math.max(5, this.y - boxHeight - 10);
        
        // 半透明背景
        ctx.fillStyle = 'rgba(33, 33, 33, 0.1)'; // 更改背景色和透明度
        ctx.fillRect(boxX, boxY, questionWidth, boxHeight);
        
        // 根据保护套数量改变文字颜色
        let textColor;
        switch(this.shields) {
            case 0:
                textColor = 'white'; // 默认白色
                break;
            case 1:
                textColor = '#ffff00'; // 黄色
                break;
            case 2:
                textColor = '#ffa500'; // 橙色
                break;
            case 3:
                textColor = '#ff0000'; // 红色（无敌）
                break;
            default:
                textColor = 'white';
        }
        
        // Draw text with shadow for better visibility
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4; // 增加阴影模糊度，提高文字清晰度
        ctx.fillStyle = textColor;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Draw the question
        const maxDisplayLines = 4; // 最多显示4行问题文本
        lines.slice(0, maxDisplayLines).forEach((line, index) => {
            ctx.fillText(line, boxX + 15, boxY + 15 + (index * lineHeight));
        });
        
        // 如果问题文本超过4行，显示省略号
        if (lines.length > maxDisplayLines) {
            ctx.fillText('...', boxX + 15, boxY + 15 + (maxDisplayLines * lineHeight));
        }
        
        // Draw options for multiple choice
        if (question.options) {
            const optionsY = boxY + Math.min(lines.length, maxDisplayLines + 1) * lineHeight + 25;
            const optionLetters = ['A', 'B', 'C', 'D'];
            
            // 显示是否为多选题
            if (question.type === 'multiSelect') {
                ctx.font = '12px Arial';
                ctx.fillStyle = textColor;
                ctx.fillText('(多选)', boxX + 15, optionsY - 15);
            }
            
            // 最多显示4个选项
            const maxOptions = 4;
            question.options.slice(0, maxOptions).forEach((option, index) => {
                ctx.fillStyle = textColor; // 选项也使用相同颜色
                
                // 对于多选题，已选中的选项前面添加勾选标记
                const prefix = question.type === 'multiSelect' && 
                              this.selectedAnswers.includes(optionLetters[index]) 
                              ? '✓ ' : '';
                
                ctx.font = '13px Arial';
                ctx.fillText(`${prefix}${optionLetters[index]}: ${option}`, boxX + 15, optionsY + (index * lineHeight));
            });
        } else {
            // Show it's a True/False question
            ctx.font = '12px Arial';
            ctx.fillStyle = textColor;
            ctx.fillText('(True/False)', boxX + 15, boxY + Math.min(lines.length, maxDisplayLines + 1) * lineHeight + 25);
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Return the question box position and dimensions for the enemy line
        return {
            x: boxX,
            y: boxY,
            width: questionWidth,
            height: boxHeight
        };
    }

    isOffScreen() {
        return this.y > GAME_HEIGHT;
    }

    addShield() {
        if (this.shields < this.maxShields) {
            this.shields++;
        }
    }

    checkCorrectHit(bulletType) {
        const question = currentQuestions[this.questionIndex];
        
        // 如果是提交按钮
        if (bulletType === 'SUBMIT') {
            // 对于多选题，验证所有选中的答案是否正确
            if (question.type === 'multiSelect') {
                // 检查是否所有必选项都已选中
                const allRequiredSelected = question.correctAnswers.every(
                    answer => this.selectedAnswers.includes(answer)
                );
                
                // 检查是否有错选项
                const noWrongSelection = this.selectedAnswers.every(
                    answer => question.correctAnswers.includes(answer)
                );
                
                // 必须既包含所有必选项，又不包含错误选项
                return allRequiredSelected && noWrongSelection;
            }
            
            // 单选题和判断题，提交按钮无效
            return false;
        }
        
        // 处理多选题的选项选择
        if (question.type === 'multiSelect' && ['A', 'B', 'C', 'D'].includes(bulletType)) {
            // 选项已经选中，则取消选择
            if (this.selectedAnswers.includes(bulletType)) {
                this.selectedAnswers = this.selectedAnswers.filter(a => a !== bulletType);
            } else {
                // 选项未选中，则添加到已选列表
                this.selectedAnswers.push(bulletType);
            }
            
            // 选择选项时不摧毁敌人，只标记
            return false;
        }
        else if (question.options) { // 单选题
            return bulletType === question.correctAnswer;
        } else { // True/False
            return (bulletType === 'TRUE' && question.correctAnswer === 'TRUE') ||
                   (bulletType === 'FALSE' && question.correctAnswer === 'FALSE');
        }
    }
}

// Firework class for special effects
class Firework {
    constructor(x, y, color, size = 1) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.color = color || this.getRandomColor();
        this.lifespan = 60; // frames
        this.size = size; // Size multiplier
        this.init();
    }
    
    init() {
        // Create particles
        const particleCount = 20 + Math.floor(this.size * 15); // More particles for larger fireworks
        for (let i = 0; i < particleCount; i++) {
            const speed = (1 + Math.random() * 3) * this.size;
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                size: (2 + Math.random() * 3) * this.size // Larger particles for bigger fireworks
            });
        }
    }
    
    getRandomColor() {
        // Enhanced colors with brighter options for major milestones
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#ff5500', '#ff0055', '#55ff00', '#00ff55', '#5500ff', '#5555ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.lifespan--;
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = Math.max(0, p.alpha - 0.02);
        });
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    isDead() {
        return this.lifespan <= 0;
    }
}

// Game initialization
function initGame() {
    canvas = document.getElementById('game-canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Initialize event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    changeBankButton.addEventListener('click', showQuestionBankScreen);
    changeBankButtonGameover.addEventListener('click', showQuestionBankScreen);
    
    // 题库选择相关事件监听
    selectBankButton.addEventListener('click', selectQuestionBank);
    
    // 难度选择监听
    document.querySelectorAll('.difficulty-option').forEach(option => {
        option.addEventListener('click', () => {
            // 移除所有选项的选中状态
            document.querySelectorAll('.difficulty-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 添加选中状态
            option.classList.add('selected');
            
            // 设置选中的难度
            selectedDifficulty = option.dataset.difficulty;
        });
    });
    
    // 初始化题库管理器
    initQuestionBanks();
    
    // 显示题库选择界面
    showQuestionBankScreen();
}

// 初始化题库选择界面
async function initQuestionBanks() {
    try {
        // 加载题库列表
        const banks = await QuestionManager.init();
        
        // 清空容器
        questionBanksContainer.innerHTML = '';
        
        // 渲染题库列表
        banks.forEach(bank => {
            const bankElement = document.createElement('div');
            bankElement.className = 'question-bank-item';
            bankElement.dataset.id = bank.id;
            
            // 计算默认采样数量：使用实际题目总数
            const totalQuestions = bank.count || 0;
            const defaultSampleSize = totalQuestions; // 默认使用全部题目
            bankElement.dataset.totalQuestions = totalQuestions;
            
            // 题库信息部分
            const bankInfoElement = document.createElement('div');
            bankInfoElement.className = 'question-bank-info';
            bankInfoElement.innerHTML = `
                <div class="question-bank-header">
                    <span class="question-bank-name">${bank.name}</span>
                    <span class="question-bank-count">题目数量: ${totalQuestions || '未知'}</span>
                </div>
                <div class="question-bank-description">${bank.description}</div>
            `;
            
            // 采样数量调整部分
            const bankSampleElement = document.createElement('div');
            bankSampleElement.className = 'question-bank-sample';
            
            const sampleControl = document.createElement('div');
            sampleControl.className = 'sample-size-control';
            
            const sampleLabel = document.createElement('span');
            sampleLabel.className = 'sample-size-label';
            sampleLabel.textContent = '采样数量:';
            
            const sampleInput = document.createElement('input');
            sampleInput.type = 'number';
            sampleInput.min = '1';
            sampleInput.max = totalQuestions.toString();
            sampleInput.value = defaultSampleSize.toString();
            sampleInput.step = '1';
            sampleInput.className = 'sample-size-input';
            sampleInput.addEventListener('input', (e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
                // 确保输入值在有效范围内
                let value = parseInt(e.target.value) || defaultSampleSize;
                if (value < 1) value = 1;
                if (value > totalQuestions) value = totalQuestions;
                e.target.value = value;
                bankElement.dataset.sampleSize = value;
            });
            
            sampleControl.appendChild(sampleLabel);
            sampleControl.appendChild(sampleInput);
            
            const sampleHint = document.createElement('div');
            sampleHint.className = 'sample-size-hint';
            sampleHint.textContent = `(最小 1, 最大 ${totalQuestions})`;
            
            bankSampleElement.appendChild(sampleControl);
            bankSampleElement.appendChild(sampleHint);
            
            // 将两部分添加到题库卡片
            bankElement.appendChild(bankInfoElement);
            bankElement.appendChild(bankSampleElement);
            
            // 设置默认采样数量
            bankElement.dataset.sampleSize = defaultSampleSize;
            
            // 点击卡片选择题库
            bankElement.addEventListener('click', () => selectQuestionBankItem(bank.id));
            
            questionBanksContainer.appendChild(bankElement);
        });
    } catch (error) {
        console.error('加载题库失败:', error);
        questionBanksContainer.innerHTML = '<div class="error-message">加载题库失败，请刷新页面重试</div>';
    }
}

// 选择题库项
function selectQuestionBankItem(bankId) {
    // 清除其他选中状态
    document.querySelectorAll('.question-bank-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 设置当前选中
    const selectedItem = document.querySelector(`.question-bank-item[data-id="${bankId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedBankId = bankId;
        
        // 获取选中题库的采样数量
        selectedSampleSize = parseInt(selectedItem.dataset.sampleSize || '20');
        
        // 启用确认按钮
        selectBankButton.disabled = false;
    }
}

// 确认选择题库
async function selectQuestionBank() {
    if (!selectedBankId) return;
    
    try {
        // 获取所选题库和采样数量
        const bank = await QuestionManager.setCurrentBank(selectedBankId, selectedSampleSize);
        
        // 更新开始界面信息
        selectedBankNameElement.textContent = bank.name;
        selectedSampleSizeElement.textContent = selectedSampleSize;
        
        // 显示开始游戏界面
        questionBankScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
    } catch (error) {
        console.error('设置题库失败:', error);
        alert('加载题库失败，请重试');
    }
}

// 显示题库选择界面
function showQuestionBankScreen() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    questionBankScreen.classList.remove('hidden');
}

// Start the game
function startGame() {
    console.log('startGame called, selectedBankId:', selectedBankId);
    
    if (!selectedBankId) {
        alert('请先选择一个题库');
        return;
    }
    
    gameActive = true;
    gamePaused = false;
    score = 0;
    health = MAX_HEALTH;
    bullets = [];
    enemies = [];
    fireworks = [];
    comboCount = 0;
    currentQuestionIndex = 0; // 重置当前题目索引
    shieldCount = 0;
    isInvincible = false;
    
    // Reset UI displays
    comboDisplayElement.textContent = '0';
    
    // Hide start screen and pause overlay
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    questionBankScreen.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    
    // Initialize player
    player = new Player();
    
    // Get random questions
    currentQuestions = QuestionManager.getRandomQuestions(selectedSampleSize);
    questionStats = Array(currentQuestions.length).fill('unanswered');
    
    // Update UI
    updateScore();
    updateHealth();
    renderQuestionStats();
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameUpdate, 1000 / 60); // 60 FPS
    
    // Spawn enemies periodically
    spawnEnemy();
}

// Restart the game
function restartGame() {
    startGame();
}

// Game over
function gameOver() {
    gameActive = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Main game update loop
function gameUpdate() {
    // Clear canvas
    ctx.fillStyle = '#121240';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (!gameActive) return;
    if (gamePaused) {
        // Render current game state but don't update
        player.draw();
        bullets.forEach(bullet => bullet.draw());
        enemies.forEach(enemy => enemy.draw());
        
        // Draw pause message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '16px Arial';
        ctx.fillText('Press P to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        return;
    }
    
    // Update player
    player.update();
    player.draw();
    
    // Update bullets
    bullets = bullets.filter(bullet => !bullet.isOffScreen());
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();
    });
    
    // Update fireworks
    fireworks = fireworks.filter(fw => !fw.isDead());
    fireworks.forEach(fw => {
        fw.update();
        fw.draw();
    });
    
    // Draw combo count if active
    if (comboCount > 1) {
        drawComboCount();
    }
    
    // Update enemies
    const remainingEnemies = [];
    
    for (const enemy of enemies) {
        enemy.update();
        
        // Check for bullet collisions
        let enemyDestroyed = false;
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            if (bullet.collidesWith(enemy)) {
                // Collision detected
                if (enemy.checkCorrectHit(bullet.type) && enemy.shields < enemy.maxShields) {
                    // Correct answer and enemy is not fully shielded
                    score += 100 * (enemy.shields + 1); // More points for shielded enemies
                    updateScore();
                    
                    // Increment combo and refresh timer
                    incrementCombo();
                    
                    // Create fireworks for enemy destruction
                    createFireworks(enemy.x + enemy.width/2, enemy.y);
                    
                    // Update question stats
                    questionStats[enemy.questionIndex] = 'correct';
                    renderQuestionStats();
                    
                    // Remove bullet
                    bullets.splice(i, 1);
                    
                    // Mark this enemy as destroyed
                    enemyDestroyed = true;
                    
                    break; // Exit the bullet loop since enemy is destroyed
                } else {
                    // 检查是否是多选题选项选择
                    const question = currentQuestions[enemy.questionIndex];
                    const isMultiSelectOption = question.type === 'multiSelect' && 
                                               ['A', 'B', 'C', 'D'].includes(bullet.type);
                    
                    // 对于多选题的选项选择，不视为错误，只移除子弹
                    if (isMultiSelectOption) {
                        bullets.splice(i, 1);
                    }
                    // 对于错误答案或SUBMIT判定错误的情况
                    else {
                        // Wrong answer or enemy is fully shielded
                        if (enemy.shields < enemy.maxShields) {
                            if (selectedDifficulty === DIFFICULTY.ADVANCED || selectedDifficulty === DIFFICULTY.EXPERT) {
                                // 高级和资深难度下，一次答错就将敌人升级到无敌状态
                                enemy.shields = enemy.maxShields;
                            } else {
                                // 简单难度下，每次答错给敌人增加一个护盾
                                enemy.addShield();
                            }
                        }
                        bullets.splice(i, 1);
                        
                        // Reset combo on wrong answer
                        resetCombo();
                        
                        // Update question stats
                        questionStats[enemy.questionIndex] = 'wrong';
                        renderQuestionStats();
                        
                        // Check if player gets invincible
                        shieldCount++;
                        if (shieldCount >= 3 && !isInvincible) {
                            isInvincible = true;
                            setTimeout(() => {
                                isInvincible = false;
                                shieldCount = 0;
                            }, 5000); // 5 seconds of invincibility
                        }
                    }
                }
            }
        }
        
        // Skip this enemy if it was destroyed
        if (enemyDestroyed) {
            continue;
        }
        
        // Check if enemy passed the bottom
        if (enemy.isOffScreen()) {
            if (!isInvincible) {
                health--;
                updateHealth();
                
                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
            
            // Reset combo when enemy passes bottom
            resetCombo();
            
            // Update question stats
            questionStats[enemy.questionIndex] = 'wrong';
            renderQuestionStats();
            
            continue; // Skip adding this enemy to remainingEnemies
        }
        
        enemy.draw();
        remainingEnemies.push(enemy);
    }
    
    enemies = remainingEnemies;
    
    // Draw invincibility indicator if active
    if (isInvincible) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
                player.width, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 生成一个新敌人，按顺序出题
function spawnEnemy() {
    if (!gameActive || gamePaused) return;
    
    // 如果屏幕上已经有敌人，不再生成新敌人
    if (enemies.length > 0) {
        // 每秒检查一次屏幕上是否有敌人
        setTimeout(spawnEnemy, 1000);
        return;
    }
    
    // 检查是否还有未回答的题目
    if (currentQuestionIndex < currentQuestions.length) {
        // 按顺序取下一道题
        const questionIndex = currentQuestionIndex;
        enemies.push(new Enemy(questionIndex));
        currentQuestionIndex++; // 递增题目索引
    } else {
        // 所有题目都已放出，检查是否还有未回答的题目
        const unansweredExists = questionStats.some(status => status === 'unanswered');
        
        if (!unansweredExists) {
            // 所有题目已回答，游戏胜利
            if (health > 0) {
                score += health * 500; // 奖励剩余生命值
                updateScore();
                setTimeout(() => {
                    alert(`恭喜！您完成了所有题目！最终得分：${score}`);
                    gameOver();
                }, 500);
                return;
            }
        }
    }
    
    // 固定延迟检查
    setTimeout(spawnEnemy, 1000);
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Update health bar
function updateHealth() {
    // 清空现有的生命条
    healthBarElement.innerHTML = '';
    
    // 创建10个生命段
    for (let i = 0; i < MAX_HEALTH; i++) {
        const segment = document.createElement('div');
        segment.className = 'health-segment';
        
        // 如果当前生命值小于等于i，则这个段是空的
        if (health <= i) {
            segment.classList.add('empty');
        }
        
        healthBarElement.appendChild(segment);
    }
}

// Render question statistics in the left panel
function renderQuestionStats() {
    statsContainerElement.innerHTML = '';
    
    const statHeader = document.createElement('h3');
    statHeader.textContent = '题目统计';
    statsContainerElement.appendChild(statHeader);
    
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    questionStats.forEach((status, index) => {
        const statBox = document.createElement('div');
        statBox.className = `stat-box ${status}`;
        statBox.textContent = index + 1;
        
        // Add tooltip showing the question text
        statBox.title = currentQuestions[index].question;
        
        statsGrid.appendChild(statBox);
    });
    
    statsContainerElement.appendChild(statsGrid);
    
    const statLegend = document.createElement('div');
    statLegend.className = 'stat-legend';
    
    const legendItems = [
        { class: 'unanswered', label: '未回答' },
        { class: 'correct', label: '正确' },
        { class: 'wrong', label: '错误' }
    ];
    
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const legendColor = document.createElement('span');
        legendColor.className = `legend-color ${item.class}`;
        
        const legendLabel = document.createElement('span');
        legendLabel.textContent = item.label;
        
        legendItem.appendChild(legendColor);
        legendItem.appendChild(legendLabel);
        statLegend.appendChild(legendItem);
    });
    
    statsContainerElement.appendChild(statLegend);
    
    // Add counter stats
    const correctCount = questionStats.filter(s => s === 'correct').length;
    const wrongCount = questionStats.filter(s => s === 'wrong').length;
    const unansweredCount = questionStats.filter(s => s === 'unanswered').length;
    
    const statsCounter = document.createElement('div');
    statsCounter.className = 'stats-counter';
    statsCounter.innerHTML = `
        <div>正确: ${correctCount}</div>
        <div>错误: ${wrongCount}</div>
        <div>未回答: ${unansweredCount}</div>
    `;
    
    statsContainerElement.appendChild(statsCounter);
}

// Handle keyboard input
function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (!gameActive) return;
    
    if (key === 'arrowleft') {
        player.move('left');
    } else if (key === 'arrowright') {
        player.move('right');
    } else if (key === 'a') {
        player.shoot('A');
    } else if (key === 's') {
        player.shoot('B');
    } else if (key === 'd') {
        player.shoot('C');
    } else if (key === 'f') {
        player.shoot('D');
    } else if (key === 'w') {
        player.shoot('TRUE');
    } else if (key === 'e') {
        player.shoot('FALSE');
    } else if (key === ' ') { // 空格键
        // 空格键只用于提交答案
        player.shoot('SUBMIT');
    } else if (key === 'p') { // P键用于暂停/恢复游戏
        togglePause();
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'arrowleft' || key === 'arrowright') {
        player.stop();
    }
    // 移除空格键暂停/恢复功能
}

// 暂停游戏
function pauseGame() {
    if (gameActive && !gamePaused) {
        gamePaused = true;
        pauseOverlay.classList.remove('hidden');
        cancelAnimationFrame(gameLoop);
    }
}

// 恢复游戏
function resumeGame() {
    if (gameActive && gamePaused) {
        gamePaused = false;
        pauseOverlay.classList.add('hidden');
        gameLoop = setInterval(gameUpdate, 1000 / 60); // 使用setInterval而不是requestAnimationFrame
    }
}

// 切换暂停状态
function togglePause() {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Function to draw combo count with large text
function drawComboCount() {
    // Determine message based on combo count
    let comboMessage;
    let fontSize;
    
    if (comboCount >= 20) {
        comboMessage = "20连击！！！毕业！！！";
        fontSize = 80; // Largest font
    } else if (comboCount >= 10) {
        comboMessage = "10连击，够了够了别练了！";
        fontSize = 64; // Large font
    } else if (comboCount >= 5) {
        comboMessage = "5连击，太牛了！";
        fontSize = 56; // Medium-large font
    } else {
        comboMessage = `${comboCount} COMBO!`;
        fontSize = Math.min(48, 30 + comboCount * 2); // Size increases with combo
    }
    
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Determine color based on combo size
    let comboColor;
    if (comboCount >= 20) {
        comboColor = '#ff00ff'; // Magenta for 20+
    } else if (comboCount >= 10) {
        comboColor = '#ff0000'; // Red for 10+
    } else if (comboCount >= 5) {
        comboColor = '#ff9900'; // Orange for 5+
    } else if (comboCount >= 3) {
        comboColor = '#ffff00'; // Yellow for 3+
    } else {
        comboColor = '#ffffff'; // White for 2
    }
    
    // Add pulsing effect for high combos
    let scale = 1.0;
    if (comboCount >= 5) {
        scale = 1.0 + 0.05 * Math.sin(Date.now() / 100);
    }
    
    // Draw combo text with slight animation
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 100);
    ctx.scale(scale, scale);
    ctx.fillStyle = comboColor;
    ctx.fillText(comboMessage, 0, 0);
    ctx.restore();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Increment combo counter
function incrementCombo() {
    comboCount++;
    
    // Update the combo display in the DOM
    comboDisplayElement.textContent = comboCount;
    
    // Clear existing timer
    if (comboTimer) {
        clearTimeout(comboTimer);
    }
    
    // Set timer to reset combo after 3 seconds
    comboTimer = setTimeout(() => {
        resetCombo();
    }, 3000);
    
    // Create special effects for milestone combos
    if (comboCount === 20) {
        // Graduation celebration - massive fireworks display
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const x = Math.random() * GAME_WIDTH;
                const y = 50 + Math.random() * 300;
                createFireworks(x, y, 2);
            }, i * 100); // Staggered fireworks for dramatic effect
        }
    }
    else if (comboCount === 10) {
        // Impressive milestone - big fireworks
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = 80 + Math.random() * 200;
            createFireworks(x, y, 2);
        }
    }
    else if (comboCount === 5) {
        // First milestone - medium fireworks
        for (let i = 0; i < 7; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = 100 + Math.random() * 150;
            createFireworks(x, y);
        }
    }
    else if (comboCount > 1) {
        // Regular fireworks for any combo
        const x = GAME_WIDTH / 2 + (Math.random() * 200 - 100);
        const y = 120;
        createFireworks(x, y);
    }
}

// Reset combo counter
function resetCombo() {
    comboCount = 0;
    
    // Update the combo display in the DOM
    comboDisplayElement.textContent = '0';
    
    if (comboTimer) {
        clearTimeout(comboTimer);
        comboTimer = null;
    }
}

// Create fireworks at specified position
function createFireworks(x, y, size = 1) {
    if (size >= 2) {
        // For larger fireworks, create multiple colors
        for (let i = 0; i < size; i++) {
            const offsetX = (Math.random() - 0.5) * 30 * size;
            const offsetY = (Math.random() - 0.5) * 30 * size;
            fireworks.push(new Firework(x + offsetX, y + offsetY, null, size));
        }
    } else {
        // Simple single firework
        fireworks.push(new Firework(x, y, null, size));
    }
}

// Initialize the game when the page loads
window.addEventListener('load', initGame); 