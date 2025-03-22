/**
 * Space Quiz Shooter Game
 * Main game logic
 */

// Game constants
let GAME_WIDTH = 800;
let GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 6; // 从3提高到6，速度翻倍
const ENEMY_SPEED = 0.75;
const MAX_HEALTH = 10;
const BULLET_TYPES = {
    A: { key: 'a', color: '#ff00de', text: 'A' }, // 霓虹粉红
    B: { key: 's', color: '#00ffcc', text: 'B' }, // 霓虹青绿
    C: { key: 'd', color: '#00ccff', text: 'C' }, // 霓虹蓝
    D: { key: 'f', color: '#ffcc00', text: 'D' }, // 霓虹金黄
    TRUE: { key: 'w', color: '#00ff66', text: '✓' }, // 霓虹绿
    FALSE: { key: 'e', color: '#ff3377', text: '✗' }, // 霓虹红
    SUBMIT: { key: ' ', color: '#bb33ff', text: '🔘' } // 霓虹紫
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
let fireworks = []; // 烟花特效数组
let comboDisplayTimer = null; // Timer for combo display
let shouldShowComboText = false; // Flag to control combo text display
let backgroundImage = null; // 背景图片

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
const questionDetailContainer = document.getElementById('question-detail-container');
const questionDetailContent = document.querySelector('.question-detail-content');
const closeDetailBtn = document.getElementById('close-detail-btn');

// 定义里程碑连击文本常量，避免重复定义
const COMBO_MESSAGES = {
    COMBO_5: "5连击，太牛了！",
    COMBO_10: "10连击，够了够了别练了！",
    COMBO_20: "20连击！毕业！"
};

// Player class
class Player {
    constructor() {
        this.width = 120;
        this.height = 120;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - this.height - 0; // Position player at the very bottom
        this.moveLeft = false;
        this.moveRight = false;
        
        // 加载玩家图片
        this.image = new Image();
        this.image.src = 'assets/player.svg';
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
            // Draw the player image with proper rendering
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    
    drawFallbackShip() {
        // 保存当前绘图状态
        ctx.save();
        
        // 获取当前时间用于脉动效果
        const pulseTime = Date.now() / 1000;
        const pulseAmount = Math.sin(pulseTime * 3) * 0.05 + 1; // 缓慢脉动效果
        const glowPulse = Math.sin(pulseTime * 5) * 0.3 + 0.7; // 发光脉动
        
        // 计算中心点
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 大脑外部轮廓 - 脉动圆形
        const baseRadius = Math.min(this.width, this.height) / 2.2;
        const outerRadius = baseRadius * pulseAmount;
        
        // 外层发光光环
        const outerGlow = ctx.createRadialGradient(
            centerX, centerY, baseRadius * 0.7,
            centerX, centerY, outerRadius * 1.2
        );
        outerGlow.addColorStop(0, 'rgba(0, 255, 204, 0.3)');
        outerGlow.addColorStop(0.7, 'rgba(0, 255, 204, 0.1)');
        outerGlow.addColorStop(1, 'rgba(0, 255, 204, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 主体大脑
        const mainGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, outerRadius
        );
        mainGradient.addColorStop(0, '#004455');
        mainGradient.addColorStop(0.7, '#002233');
        mainGradient.addColorStop(1, '#001122');
        
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加神经网络纹理 - 随机圆形连接
        ctx.strokeStyle = `rgba(0, 255, 204, ${0.4 * glowPulse})`;
        ctx.lineWidth = 1;
        
        // 生成基于时间的随机种子，但保持一定的稳定性
        const seed = Math.floor(pulseTime / 0.3);
        const pseudoRandom = (base) => {
            return Math.sin(base * seed * 123.456) * 0.5 + 0.5;
        };
        
        // 神经节点数量
        const nodeCount = 6;
        const nodes = [];
        
        // 生成神经节点位置
        for (let i = 0; i < nodeCount; i++) {
            const angle = pseudoRandom(i) * Math.PI * 2;
            const distance = pseudoRandom(i + 0.5) * outerRadius * 0.8;
            nodes.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                radius: pseudoRandom(i + 0.2) * 3 + 2,
                pulse: Math.sin(pulseTime * 4 + i) * 0.5 + 0.5
            });
        }
        
        // 绘制神经连接
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                // 只连接一部分节点
                if (pseudoRandom(i * j) > 0.5) {
                    const alpha = (1 - (nodes[i].pulse + nodes[j].pulse) / 2) * 0.7;
                    ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // 绘制神经节点
        for (const node of nodes) {
            ctx.fillStyle = `rgba(0, 255, 204, ${0.5 + node.pulse * 0.5})`;
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 10 * node.pulse;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius * (0.8 + node.pulse * 0.4), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 中央核心 - 强烈发光
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15 * glowPulse;
        
        // 内部发光核心
        const coreGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, baseRadius * 0.5
        );
        coreGradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
        coreGradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.6)');
        coreGradient.addColorStop(1, 'rgba(0, 255, 204, 0.1)');
        
        ctx.fillStyle = coreGradient;
        ctx.globalAlpha = 0.7 + glowPulse * 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.4 * (0.9 + glowPulse * 0.2), 0, Math.PI * 2);
        ctx.fill();
        
        // 重置阴影和变换效果
        ctx.restore();
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
            this.x + this.width / 2 - 30, // Centered bullet (half of 60px bullet width)
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
        this.width = 30; // 从60缩小到30，缩小50%
        this.height = 30; // 从60缩小到30，缩小50%
        this.speed = BULLET_SPEED;
        this.type = type;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        const bulletInfo = BULLET_TYPES[this.type];
        
        // 绘制子弹光晕效果
        ctx.shadowColor = bulletInfo.color;
        ctx.shadowBlur = 15;
        
        // 绘制子弹外发光环
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制子弹主体
        ctx.fillStyle = bulletInfo.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加内部发光核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制子弹文字
        ctx.fillStyle = '#000000'; // 黑色文字更醒目
        ctx.font = 'bold 36px "Orbitron", "Rajdhani", Arial, sans-serif'; // 使用更科幻的字体
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bulletInfo.text, this.x + this.width / 2, this.y + this.height / 2);
        
        // 重置阴影效果
        ctx.shadowBlur = 0;
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
        this.width = 60; // Increased from 40 to 60
        this.height = 60; // Increased from 40 to 60
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = -5; // Position slightly above the top edge to create transition effect
        
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
        
        // Determine color based on question type - 赛博朋克霓虹色调
        // 统一使用单选题的颜色：霓虹青色
        this.color = '#00ffcc'; // 固定使用霓虹青色
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
        ctx.lineWidth = 5; // Increased from 3 to 5
        ctx.beginPath();
        // Use the question box bottom position for the line, but make it 1/5 the width
        const lineY = questionBoxInfo.y + questionBoxInfo.height;
        const lineWidth = questionBoxInfo.width / 5; // Width reduced to 1/5 instead of 1/6 (slightly wider)
        const lineStartX = questionBoxInfo.x + (questionBoxInfo.width - lineWidth) / 2; // 居中显示
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineStartX + lineWidth, lineY);
        ctx.stroke();
        
        // 更新命中判定区域
        this.hitbox = {
            x: lineStartX,
            y: lineY - 15, // Increased from 10 to 15 (extends upward more)
            width: lineWidth,
            height: 30 // Increased from 20 to 30 (larger hit area)
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
        const questionWidth = 450; // Increased from 350 to 450
        const lineHeight = 24; // Increased from 18 to 24
        
        // Calculate how many lines the question will take
        const words = question.question.split(' ');
        let lines = [];
        let currentLine = '';
        
        // Measure text width (initialize canvas text properties first)
        ctx.font = 'bold 18px "Orbitron", "Rajdhani", "Blender Pro", Arial, sans-serif'; // 更科幻的字体
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
        const fixedHeight = 180; // Increased from 150 to 180
        const boxHeight = fixedHeight;
        
        // 使用稳定的位置计算方法，通过对 this.y 取整数进一步稳定位置
        // 通过四舍五入计算位置，防止像素级的抖动
        const enemyY = Math.floor(this.y); // 取整数
        const boxX = Math.round(Math.max(5, Math.min(GAME_WIDTH - questionWidth - 5, this.x + this.width / 2 - questionWidth / 2)));
        const boxY = Math.round(Math.max(5, enemyY - boxHeight - 10));
        
        // 半透明背景 - 增加透明度（降低不透明度）
        ctx.fillStyle = 'rgba(10, 5, 40, 0.4)'; // 由0.75改为0.4，增加透明度
        ctx.fillRect(boxX, boxY, questionWidth, boxHeight);
        
        // 添加内发光效果 - 保留发光但不要边框
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8; // 稍微增强发光效果
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 根据保护套数量改变文字颜色
        let textColor;
        switch(this.shields) {
            case 0:
                textColor = '#ffffff'; // 白色
                break;
            case 1:
                textColor = '#ffff33'; // 明亮的黄色
                break;
            case 2:
                textColor = '#ff9900'; // 明亮的橙色
                break;
            case 3:
                textColor = '#ff3366'; // 明亮的红色（无敌）
                break;
            default:
                textColor = '#ffffff';
        }
        
        // 添加题目标题的赛博朋克风格
        ctx.save();
        
        // 绘制题目标题背景条 - 完全替换原有实现
        const titleHeight = 30;

        // 创建静态的题目类型标题
        let questionTypeText = "";
        if (question.type === 'multiSelect') {
            questionTypeText = "【多选题】";
        } else if (!question.options) {
            questionTypeText = "【判断题】";
        } else {
            questionTypeText = "【单选题】";
        }

        // 使用固定样式和单一渲染方法绘制标题
        ctx.fillStyle = 'rgba(10, 5, 40, 0.8)'; // 固定的背景色
        ctx.fillRect(boxX, boxY, questionWidth, titleHeight);

        // 添加霓虹边框，提高可见性
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, questionWidth, titleHeight);

        // 文字绘制使用固定样式和位置
        ctx.font = 'bold 18px "Orbitron", "Rajdhani", "Blender Pro", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // 使用middle确保垂直居中
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // 固定位置，始终在标题栏中央
        const textY = boxY + titleHeight/2;
        ctx.fillText(questionTypeText, boxX + questionWidth/2, textY);

        // 重置为问题文本样式
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic'; // 重置为默认基线
        ctx.restore();
        
        // 绘制题目文本
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4; // 增加阴影模糊度，提高文字清晰度
        ctx.fillStyle = textColor;
        ctx.font = 'bold 18px "Orbitron", "Rajdhani", "Blender Pro", Arial, sans-serif'; // 使用更科幻的字体
        ctx.textBaseline = 'top';
        
        // 添加赛博朋克风格扫描线效果
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY + titleHeight, questionWidth, boxHeight - titleHeight);
        ctx.clip();
        
        // 绘制水平扫描线
        const scanLineOpacity = 0.15;
        const scanLineSpacing = 4;
        const scanLineGlow = 2;
        
        ctx.shadowColor = 'rgba(0, 255, 255, 0.3)';
        ctx.shadowBlur = scanLineGlow;
        ctx.fillStyle = `rgba(0, 255, 255, ${scanLineOpacity})`;
        
        for (let y = boxY + titleHeight; y < boxY + boxHeight; y += scanLineSpacing) {
            ctx.fillRect(boxX, y, questionWidth, 1);
        }
        
        ctx.restore();
        
        // Draw the question - with a slight offset for the title
        const textStartY = boxY + titleHeight + 10;
        const maxDisplayLines = 4; // 最多显示4行问题文本
        lines.slice(0, maxDisplayLines).forEach((line, index) => {
            // 创建文字发光效果
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 3;
            ctx.fillStyle = textColor;
            ctx.fillText(line, boxX + 15, textStartY + (index * lineHeight));
            ctx.restore();
        });
        
        // 如果问题文本超过4行，显示省略号
        if (lines.length > maxDisplayLines) {
            ctx.fillText('...', boxX + 15, textStartY + (maxDisplayLines * lineHeight));
        }
        
        // Draw options for multiple choice
        if (question.options) {
            const optionsY = textStartY + Math.min(lines.length, maxDisplayLines + 1) * lineHeight + 10;
            const optionLetters = ['A', 'B', 'C', 'D'];
            
            // 创建选项背景和边框
            ctx.save();
            ctx.strokeStyle = 'rgba(100, 220, 255, 0.3)';
            ctx.lineWidth = 1;
            
            // 最多显示4个选项
            const maxOptions = 4;
            question.options.slice(0, maxOptions).forEach((option, index) => {
                const optionY = optionsY + (index * lineHeight);
                
                // 选项字母样式
                ctx.save();
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 8;
                ctx.font = 'bold 17px "Orbitron", "Rajdhani", Arial, sans-serif';
                ctx.fillStyle = BULLET_TYPES[optionLetters[index]].color; // 使用与子弹相同的颜色
                
                // 移除选项字母边框
                const letterX = boxX + 15;
                
                // 绘制选项字母
                ctx.textAlign = 'center';
                ctx.fillText(optionLetters[index], letterX, optionY + 8);
                ctx.textAlign = 'left';
                ctx.restore();
                
                // 对于多选题，已选中的选项前面添加特殊标记
                const isSelected = question.type === 'multiSelect' && 
                                this.selectedAnswers.includes(optionLetters[index]);
                
                // 选项文本样式
                ctx.fillStyle = textColor;
                ctx.font = 'bold 17px "Orbitron", "Rajdhani", Arial, sans-serif';
                
                // 选中选项的样式
                if (isSelected) {
                    ctx.save();
                    ctx.fillStyle = BULLET_TYPES[optionLetters[index]].color;
                    ctx.shadowColor = BULLET_TYPES[optionLetters[index]].color;
                    ctx.shadowBlur = 6;
                }
                
                // 绘制选项文本（位置稍作调整以适应新的字母样式）
                ctx.fillText(option, boxX + 40, optionY + 8);
                
                if (isSelected) {
                    ctx.restore();
                }
            });
            
            ctx.restore();
        } else {
            // Show it's a True/False question
            const tfY = textStartY + Math.min(lines.length, maxDisplayLines + 1) * lineHeight + 15;
            
            ctx.save();
            
            // 移除判断题标签，因为已经移到标题处
            
            // 绘制选项
            const optionY = tfY + 25;
            
            // 真选项
            ctx.fillStyle = BULLET_TYPES['TRUE'].color;
            ctx.shadowColor = BULLET_TYPES['TRUE'].color;
            ctx.shadowBlur = 8;
            // 移除圆形边框
            ctx.fillText('TRUE', boxX + 30, optionY + 5);
            
            // 假选项
            ctx.fillStyle = BULLET_TYPES['FALSE'].color;
            ctx.shadowColor = BULLET_TYPES['FALSE'].color;
            // 移除圆形边框
            ctx.fillText('FALSE', boxX + 130, optionY + 5);
            
            ctx.restore();
        }
        
        // Reset shadow after text rendering
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
        // Check if the enemy has fully moved below the bottom of the canvas
        // Include the question box in the calculation
        const questionBoxHeight = 180; // Same as fixedHeight in drawHoveringQuestion
        return this.y - questionBoxHeight > GAME_HEIGHT;
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
    constructor(x, y, color, size = 1, text = null) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.color = color || this.getRandomColor();
        this.lifespan = 60; // frames
        this.size = size; // Size multiplier
        this.text = text; // Optional text to display
        this.textLifespan = text ? 60 : 0; // Text disappears after 1 second (60 frames at 60fps)
        this.init();
    }
    
    init() {
        // Create particles - 减少粒子数量以提高性能
        const particleCount = 10 + Math.floor(this.size * 8); // 从20+15减少到10+8
        for (let i = 0; i < particleCount; i++) {
            const speed = (1 + Math.random() * 2) * this.size; // 降低粒子速度
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                size: (1.5 + Math.random() * 2) * this.size // 略微减小粒子尺寸
            });
        }
    }
    
    getRandomColor() {
        // 赛博朋克风格霓虹色
        const colors = [
            '#ff00de', '#00ffcc', '#00ccff', '#ffcc00', 
            '#ff3377', '#00ff66', '#bb33ff', '#33ddff',
            '#ff0066', '#00ffff', '#ffcc33', '#cc00ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.lifespan--;
        
        // Update text lifespan separately
        if (this.textLifespan > 0) {
            this.textLifespan--;
        }
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = Math.max(0, p.alpha - 0.02);
        });
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 添加中心光晕 - 保持效果但减少复杂度
        ctx.globalAlpha = Math.min(1, this.lifespan / 30);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15; // 从20减少到15
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 4, 0, Math.PI * 2); // 略微减小尺寸
        ctx.fill();
        
        // 绘制粒子轨迹 - 每隔一个粒子绘制拖尾以提高性能
        this.particles.forEach((p, index) => {
            ctx.globalAlpha = p.alpha * 1.2;
            
            // 添加辉光效果，但降低复杂度
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8; // 从10减少到8
            
            // 只为部分粒子添加拖尾效果
            if (index % 2 === 0) { // 只绘制一半粒子的拖尾
                ctx.strokeStyle = this.color;
                ctx.lineWidth = p.size / 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx, p.y - p.vy);
                ctx.stroke();
            }
            
            // 绘制粒子
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制文字，添加更多赛博朋克风格
        if (this.text && this.textLifespan > 0) {
            // 计算文字透明度
            const textAlpha = Math.min(1, this.textLifespan / 60);
            ctx.globalAlpha = textAlpha;
            
            // 添加文字阴影和发光效果，但降低复杂度
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15; // 从20减少到15
            
            // 使用赛博朋克风格的字体
            ctx.font = `bold ${30 * this.size}px "Orbitron", "Rajdhani", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制辉光背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const textWidth = ctx.measureText(this.text).width;
            ctx.fillRect(-textWidth/2 - 10, -20, textWidth + 20, 40);
            
            // 绘制文字边框
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-textWidth/2 - 10, -20, textWidth + 20, 40);
            
            // 绘制文字
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.text, 0, 0);
            
            // 重置阴影
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
    
    isDead() {
        return this.lifespan <= 0;
    }
}

// Game initialization
function initGame() {
    canvas = document.getElementById('game-canvas');
    
    // Get the actual container size first
    const gameArea = document.querySelector('.game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    
    // Update game constants to match canvas size
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
    
    ctx = canvas.getContext('2d');
    
    // Enable high-quality text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.textRendering = 'optimizeLegibility';
    
    // 加载背景图片
    backgroundImage = new Image();
    backgroundImage.src = 'assets/background.png';
    
    // Calculate appropriate size based on container
    function resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        
        // Make canvas fill the entire game area
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        // Update the internal canvas dimensions to match its display size
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        // Only change dimensions if they're significantly different
        if (Math.abs(canvas.width - displayWidth) > 10 || 
            Math.abs(canvas.height - displayHeight) > 10) {
            
            // Update game dimensions to match the actual display size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            GAME_WIDTH = displayWidth;
            GAME_HEIGHT = displayHeight;
            
            // Re-position the player when canvas size changes
            if (player) {
                player.x = GAME_WIDTH / 2 - player.width / 2;
                player.y = GAME_HEIGHT - player.height - 10;
            }
        }
    }
    
    // Initial resize and add event listener for window resizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // 移除和重新添加按钮监听器
    const startButtonEl = document.getElementById('start-button');
    if (startButtonEl) {
        console.log('Found start button, attaching click listener');
        // 移除已有的事件监听器，避免重复
        startButtonEl.removeEventListener('click', startGame);
        // 添加新的事件监听器
        startButtonEl.addEventListener('click', function(e) {
            console.log('Start button clicked via listener');
            startGame();
        });
    } else {
        console.error('Start button not found!');
    }
    
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
    
    try {
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
        shouldShowComboText = false;
        currentQuestionIndex = 0; // 重置当前题目索引
        shieldCount = 0;
        isInvincible = false;
        
        // Clear any existing combo display timer
        if (comboDisplayTimer) {
            clearTimeout(comboDisplayTimer);
            comboDisplayTimer = null;
        }
        
        // Reset question review state
        document.querySelector('.question-area').classList.remove('game-over');
        questionDetailContainer.classList.add('hidden');
        
        // Reset UI displays
        if (comboDisplayElement) {
            comboDisplayElement.textContent = '0';
            // Reset combo display styling with green color
            comboDisplayElement.style.color = '#4caf50';
            comboDisplayElement.style.fontSize = '32px'; 
            comboDisplayElement.style.textShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
        }
        
        // Hide start screen and pause overlay
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        questionBankScreen.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        
        // Initialize player
        player = new Player();
        
        // Get random questions
        try {
            currentQuestions = QuestionManager.getRandomQuestions(selectedSampleSize);
            console.log('Loaded', currentQuestions.length, 'questions');
            questionStats = Array(currentQuestions.length).fill('unanswered');
        } catch (err) {
            console.error('Failed to get questions:', err);
            alert('加载题目失败: ' + err.message);
            return;
        }
        
        // Update UI
        updateScore();
        updateHealth();
        renderQuestionStats();
        
        // Start game loop
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameUpdate, 1000 / 60); // 60 FPS
        
        // Spawn enemies periodically
        spawnEnemy();
    } catch (error) {
        console.error('Error starting game:', error);
        alert('游戏启动失败，请查看控制台获取详细信息');
    }
}

// Restart the game
function restartGame() {
    startGame();
}

// Game over
function gameOver() {
    // 如果游戏已经结束，不再执行
    if (!gameActive) return;
    
    gameActive = false;
    clearInterval(gameLoop);
    
    // Clear any combo display timers
    if (comboDisplayTimer) {
        clearTimeout(comboDisplayTimer);
        comboDisplayTimer = null;
    }
    shouldShowComboText = false;
    
    // Reset combo (visually)
    comboCount = 0;
    if (comboDisplayElement) {
        comboDisplayElement.textContent = '0';
        updateComboDisplayColor();
    }
    
    // Make sure final score is updated before displaying
    updateScore();
    
    // Update final score display to match the format of the in-game score
    finalScoreElement.textContent = score;
    
    // Add game-over class to enable stat-box hover effect
    document.querySelector('.question-area').classList.add('game-over');
    
    // Enable question review by making question blocks clickable
    enableQuestionReview();
    
    gameOverScreen.classList.remove('hidden');
}

// Main game update loop
function gameUpdate() {
    // Clear canvas and draw background
    if (backgroundImage && backgroundImage.complete) {
        // 绘制背景图片
        // 方法1：简单缩放填充（可能会变形）
        // ctx.drawImage(backgroundImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 方法2：保持宽高比例，居中填充
        const imgRatio = backgroundImage.width / backgroundImage.height;
        const canvasRatio = GAME_WIDTH / GAME_HEIGHT;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (canvasRatio > imgRatio) {
            // 画布比图片"扁平"，以宽度为基准
            drawWidth = GAME_WIDTH;
            drawHeight = GAME_WIDTH / imgRatio;
            offsetX = 0;
            offsetY = (GAME_HEIGHT - drawHeight) / 2;
        } else {
            // 画布比图片"狭长"，以高度为基准
            drawHeight = GAME_HEIGHT;
            drawWidth = GAME_HEIGHT * imgRatio;
            offsetX = (GAME_WIDTH - drawWidth) / 2;
            offsetY = 0;
        }
        
        // 添加一点半透明暗色叠加，使游戏元素更显眼
        ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
        
        // 添加更强的暗色叠加效果，使霓虹色更突出
        ctx.fillStyle = 'rgba(5, 0, 20, 0.45)'; // 深紫色半透明叠加
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 移除网格线绘制调用
    } else {
        // 如果图片未加载完成，使用纯色背景作为备选
        ctx.fillStyle = '#0a0030'; // 深紫蓝色背景
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 移除网格线绘制调用
    }
    
    if (!gameActive) return;
    if (gamePaused) {
        // Render current game state but don't update
        player.draw();
        bullets.forEach(bullet => bullet.draw());
        enemies.forEach(enemy => enemy.draw());
        
        // Draw pause message with cyberpunk style
        ctx.fillStyle = 'rgba(5, 0, 20, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 暂停文字
        ctx.fillStyle = '#00ffff'; // 霓虹青色
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加发光效果
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ff00de'; // 霓虹粉
        ctx.fillText('Press P to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
        
        // 重置阴影
        ctx.shadowBlur = 0;
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
    
    // Draw combo count if active and should be shown
    // Special styling for exact milestone combos (5, 10, 20)
    if (shouldShowComboText) {
        // For milestone combos, show the special text
        if (comboCount === 5 || comboCount === 10 || comboCount === 20) {
            drawComboCount();
        } 
        // For other combo counts, show a simpler indicator
        else if (comboCount > 1) {
            // 创建赛博朋克风格的普通连击显示 - 只保留文字效果
            const centerX = GAME_WIDTH / 2;
            const centerY = 100;
            
            // 获取连击文本和设置字体大小(增大)
            const comboText = `${comboCount} COMBO!`;
            const fontSize = Math.min(72, 45 + comboCount * 3); // 更大的字体
            
            // 保存当前绘图状态
            ctx.save();
            
            // 移除背景渲染代码
            
            // 绘制霓虹字体 - 只保留文字效果
            ctx.font = `bold ${fontSize}px "Orbitron", "Rajdhani", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 创建多层文字发光效果
            // 外发光 - 青色
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 25;
            ctx.globalAlpha = 0.7; // 增加整体透明度
            ctx.fillStyle = '#00ffff';
            ctx.fillText(comboText, centerX, centerY);
            
            // 内发光 - 白色
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.8;
            ctx.fillText(comboText, centerX, centerY);
            
            // 恢复绘图状态
            ctx.restore();
        }
    }
    
    // Debugging: Log initial enemy count
    console.log(`Start of update: ${enemies.length} enemies`);
    
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
                console.log(`Bullet collision with type: ${bullet.type}`);
                
                if (enemy.checkCorrectHit(bullet.type) && enemy.shields < enemy.maxShields) {
                    // Correct answer and enemy is not fully shielded
                    score += 100 * (enemy.shields + 1); // More points for shielded enemies
                    updateScore();
                    
                    // Update question stats for correct answer
                    questionStats[enemy.questionIndex] = 'correct';
                    renderQuestionStats(); // This will update the combo count based on consecutive correct answers
                    
                    // Create a small firework at enemy's position for destruction
                    // But only if not at a milestone combo (those have their own effects)
                    if (comboCount !== 5 && comboCount !== 10 && comboCount !== 20) {
                        createFireworks(enemy.x + enemy.width/2, enemy.y, 0.8);
                    }
                    
                    // Remove bullet
                    bullets.splice(i, 1);
                    
                    // Mark this enemy as destroyed
                    enemyDestroyed = true;
                    console.log('Enemy destroyed by correct hit!');
                    
                    break; // Exit the bullet loop since enemy is destroyed
                } else {
                    // 检查是否是多选题选项选择
                    const question = currentQuestions[enemy.questionIndex];
                    const isMultiSelectOption = question.type === 'multiSelect' && 
                                               ['A', 'B', 'C', 'D'].includes(bullet.type);
                    
                    // 对于多选题的选项选择，不视为错误，只移除子弹
                    if (isMultiSelectOption) {
                        bullets.splice(i, 1);
                        console.log(`Multi-select option ${bullet.type} toggled`);
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
                            console.log(`Wrong hit! Enemy shields now: ${enemy.shields}`);
                        }
                        bullets.splice(i, 1);
                        
                        // Update question stats for wrong answer
                        questionStats[enemy.questionIndex] = 'wrong';
                        renderQuestionStats(); // This will update the combo count
                        
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
            console.log('Enemy was destroyed, not adding to remainingEnemies');
            continue;
        }
        
        // Check if enemy passed the bottom
        if (enemy.isOffScreen()) {
            console.log('Enemy went off screen!');
            if (!isInvincible) {
                health--;
                updateHealth();
                
                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
            
            // Update question stats for enemy passing bottom
            questionStats[enemy.questionIndex] = 'wrong';
            renderQuestionStats(); // This will update the combo count
            
            continue; // Skip adding this enemy to remainingEnemies
        }
        
        enemy.draw();
        remainingEnemies.push(enemy);
    }
    
    console.log(`End of update: ${remainingEnemies.length} enemies remain`);
    enemies = remainingEnemies;
    
    // Draw invincibility indicator if active
    if (isInvincible) {
        // 更科幻的无敌效果
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 2;
        
        // 添加脉动效果
        const pulseSize = 1.0 + 0.1 * Math.sin(Date.now() / 100);
        
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
                player.width * pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // 添加辉光效果
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
                player.width * pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

// 生成一个新敌人，按顺序出题
function spawnEnemy() {
    if (!gameActive || gamePaused) return;
    
    console.log(`SpawnEnemy called. CurrentQuestionIndex: ${currentQuestionIndex}, Questions total: ${currentQuestions.length}, Enemies on screen: ${enemies.length}`);
    
    // 如果屏幕上已经有敌人，不再生成新敌人
    if (enemies.length > 0) {
        // 每秒检查一次屏幕上是否有敌人
        console.log('Enemies still on screen, delaying spawn');
        setTimeout(spawnEnemy, 1000);
        return;
    }
    
    // 检查是否还有未放出的题目
    if (currentQuestionIndex < currentQuestions.length) {
        // 按顺序取下一道题
        const questionIndex = currentQuestionIndex;
        console.log(`Spawning new enemy with question ${questionIndex + 1}`);
        enemies.push(new Enemy(questionIndex));
        currentQuestionIndex++; // 递增题目索引
    } else {
        // 所有题目都已放出，检查是否还有未回答的题目
        const unansweredExists = questionStats.some(status => status === 'unanswered');
        console.log(`All questions have been spawned. Any unanswered questions? ${unansweredExists}`);
        
        if (!unansweredExists) {
            // 所有题目已回答，游戏胜利
            if (health > 0) {
                // 奖励剩余生命值
                score += health * 500;
                updateScore(); // Update the score display
                
                // 立即将游戏状态设为非活动，防止重复调用
                gameActive = false;
                
                setTimeout(() => {
                    // Make sure final score element is updated with latest score
                    finalScoreElement.textContent = score;
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
        } else {
            // 添加赛博朋克风格的发光效果
            segment.style.boxShadow = '0 0 8px #00ffcc';
        }
        
        // 自定义颜色
        if (health <= i) {
            segment.style.backgroundColor = 'rgba(20, 0, 40, 0.3)'; // 暗紫色底
            segment.style.borderColor = '#33007a'; // 深紫色边框
        } else if (health <= 3) { // 生命危急
            segment.style.backgroundColor = '#ff3366'; // 霓虹红
            segment.style.borderColor = '#ff0066'; // 霓虹深红
        } else if (health <= 6) { // 生命适中
            segment.style.backgroundColor = '#ffcc00'; // 霓虹黄
            segment.style.borderColor = '#ff9900'; // 霓虹橙
        } else { // 生命充足
            segment.style.backgroundColor = '#00ffcc'; // 霓虹青
            segment.style.borderColor = '#00ccaa'; // 深霓虹青
        }
        
        healthBarElement.appendChild(segment);
    }
}

// Update question statistics in the left panel
function renderQuestionStats() {
    statsContainerElement.innerHTML = '';
    
    const statHeader = document.createElement('h3');
    statHeader.textContent = '题目统计';
    statHeader.style.color = '#00ffff'; // 霓虹青色标题
    statHeader.style.textShadow = '0 0 5px #00ffff'; // 添加发光效果
    statsContainerElement.appendChild(statHeader);
    
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    questionStats.forEach((status, index) => {
        const statBox = document.createElement('div');
        statBox.className = `stat-box ${status}`;
        statBox.textContent = index + 1;
        
        // Add tooltip showing question number
        statBox.title = `点击查看题目 #${index + 1} 详情`;
        
        // 赛博朋克风格颜色 - 调整为更柔和的色调，问题编号使用白色
        switch(status) {
            case 'correct':
                statBox.style.backgroundColor = '#00dd66'; // 稍微暗一点的绿色
                statBox.style.borderColor = '#00aa44'; // 更暗的绿色边框
                statBox.style.color = '#ffffff'; // 白色数字
                statBox.style.boxShadow = '0 0 6px #00dd66'; // 弱化发光效果
                break;
            case 'wrong':
                statBox.style.backgroundColor = '#ee3366'; // 稍微柔和的红色
                statBox.style.borderColor = '#aa1144'; // 更暗的红色边框
                statBox.style.color = '#ffffff'; // 白色数字
                statBox.style.boxShadow = '0 0 6px #ee3366'; // 弱化发光效果
                break;
            case 'unanswered':
                statBox.style.backgroundColor = 'rgba(40, 20, 80, 0.6)'; // 更深、更不透明的紫色
                statBox.style.borderColor = '#6633aa'; // 稍微暗一点的紫色边框
                statBox.style.color = '#e6e6ff'; // 淡蓝白色数字
                break;
        }
        
        statsGrid.appendChild(statBox);
    });
    
    statsContainerElement.appendChild(statsGrid);
    
    const statLegend = document.createElement('div');
    statLegend.className = 'stat-legend';
    
    const legendItems = [
        { class: 'unanswered', label: '未回答', color: '#8855dd' }, // 更柔和的紫色
        { class: 'correct', label: '正确', color: '#00dd66' }, // 稍微暗一点的绿色
        { class: 'wrong', label: '错误', color: '#ee3366' } // 稍微柔和的红色
    ];
    
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const legendColor = document.createElement('span');
        legendColor.className = `legend-color ${item.class}`;
        legendColor.style.backgroundColor = item.color;
        legendColor.style.boxShadow = `0 0 4px ${item.color}`; // 减弱发光效果
        
        const legendLabel = document.createElement('span');
        legendLabel.textContent = item.label;
        legendLabel.style.color = item.color; // 匹配颜色
        
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
        <div style="color: #00dd66; text-shadow: 0 0 3px #00dd66;">正确: ${correctCount}</div>
        <div style="color: #ee3366; text-shadow: 0 0 3px #ee3366;">错误: ${wrongCount}</div>
        <div style="color: #8855dd; text-shadow: 0 0 3px #8855dd;">未回答: ${unansweredCount}</div>
    `;
    
    statsContainerElement.appendChild(statsCounter);
    
    // Update combo counter based on consecutive correct answers at the end
    // This ensures the combo count represents consecutive green boxes
    updateComboCount();
}

// Calculate and update current combo based on consecutive correct answers at the end
function updateComboCount() {
    // Only count consecutive correct answers at the end
    let currentCombo = 0;
    
    // Start from the last question that has a result (correct or wrong)
    let lastAnsweredIndex = -1;
    for (let i = questionStats.length - 1; i >= 0; i--) {
        if (questionStats[i] !== 'unanswered') {
            lastAnsweredIndex = i;
            break;
        }
    }
    
    // If no questions have been answered yet, combo is 0
    if (lastAnsweredIndex === -1) {
        comboCount = 0;
        comboDisplayElement.textContent = '0';
        updateComboDisplayColor();
        return;
    }
    
    // Count consecutive correct answers backwards from the last answered question
    for (let i = lastAnsweredIndex; i >= 0; i--) {
        if (questionStats[i] === 'correct') {
            currentCombo++;
        } else {
            // Break the count on the first non-correct answer
            break;
        }
    }
    
    // Update combo count if it has changed
    if (currentCombo !== comboCount) {
        // Store the old count to detect exact milestone transitions
        const oldCount = comboCount;
        
        // Update combo count
        comboCount = currentCombo;
        comboDisplayElement.textContent = comboCount;
        updateComboDisplayColor();
        
        // Check for exact milestone achievements (not ranges)
        const isExactly5 = comboCount === 5;
        const isExactly10 = comboCount === 10;
        const isExactly20 = comboCount === 20;
        
        // Only show special text and effects for exact milestone numbers
        const isAtMilestone = isExactly5 || isExactly10 || isExactly20;
        
        // Show combo text based on milestone
        shouldShowComboText = (comboCount > 0);
        
        // Clear any existing timer
        if (comboDisplayTimer) {
            clearTimeout(comboDisplayTimer);
        }
        
        // Set a new timer to hide the combo text after 1 second
        comboDisplayTimer = setTimeout(() => {
            shouldShowComboText = false;
        }, 1000);
        
        // 只在这一处触发特殊烟花效果，避免重复
        const centerX = GAME_WIDTH / 2;
        const centerY = 150;
        
        if (isExactly20) {
            // 毕业特效 - 大型烟花
            createFireworks(centerX, centerY, 2.5); // 移除文本参数
            
            // 周围的小烟花 - 减少数量以提高性能
            for (let i = 0; i < 8; i++) { // 从15减少到8
                setTimeout(() => {
                    const x = Math.random() * GAME_WIDTH;
                    const y = 50 + Math.random() * 300;
                    createFireworks(x, y, 1.5); // 降低大小以减少粒子
                }, i * 150); // 增加间隔，减少短时间内的粒子数量
            }
        } 
        else if (isExactly10) {
            // 10连击特效
            createFireworks(centerX, centerY, 2); // 移除文本参数
            
            // 周围的小烟花 - 减少数量以提高性能
            for (let i = 0; i < 5; i++) { // 从8减少到5
                setTimeout(() => {
                    const x = Math.random() * GAME_WIDTH;
                    const y = 80 + Math.random() * 200;
                    createFireworks(x, y, 1.2); // 降低大小以减少粒子
                }, i * 150); // 增加间隔
            }
        } 
        else if (isExactly5) {
            // 5连击特效
            createFireworks(centerX, centerY, 1.5); // 移除文本参数
            
            // 周围的小烟花 - 减少数量以提高性能
            for (let i = 0; i < 3; i++) { // 从5减少到3
                setTimeout(() => {
                    const x = Math.random() * GAME_WIDTH;
                    const y = 100 + Math.random() * 150;
                    createFireworks(x, y, 0.8); // 降低大小以减少粒子
                }, i * 150); // 增加间隔
            }
        }
        else if (comboCount > 1) {
            // 普通连击，简单烟花 - 减小尺寸以提高性能
            createFireworks(centerX, centerY, 0.4); // 从0.5减少到0.4
        }
    }
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
        if (gameLoop) {
            clearInterval(gameLoop);
        }
        
        // Pause combo display timer by hiding the text during pause
        if (shouldShowComboText) {
            // We'll store that we had an active timer, but hide the text during pause
            shouldShowComboText = false;
        }
    }
}

// 恢复游戏
function resumeGame() {
    if (gameActive && gamePaused) {
        gamePaused = false;
        pauseOverlay.classList.add('hidden');
        gameLoop = setInterval(gameUpdate, 1000 / 60); // 使用setInterval而不是requestAnimationFrame
        
        // If a combo was active, restart a brief display
        if (comboCount > 1) {
            shouldShowComboText = true;
            
            // Clear any existing timer
            if (comboDisplayTimer) {
                clearTimeout(comboDisplayTimer);
            }
            
            // Set a new timer to hide the combo text after 0.5 seconds (after resuming)
            comboDisplayTimer = setTimeout(() => {
                shouldShowComboText = false;
            }, 500);
        }
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
    // Determine message based on combo count - only special messages at exact milestones
    let comboMessage;
    let fontSize;
    
    if (comboCount === 20) {
        comboMessage = COMBO_MESSAGES.COMBO_20;
        fontSize = 80; // Largest font
    } else if (comboCount === 10) {
        comboMessage = COMBO_MESSAGES.COMBO_10;
        fontSize = 64; // Large font
    } else if (comboCount === 5) {
        comboMessage = COMBO_MESSAGES.COMBO_5;
        fontSize = 56; // Medium-large font
    } else {
        comboMessage = `${comboCount} COMBO!`;
        fontSize = Math.min(48, 30 + comboCount * 2); // Size increases with combo
    }
    
    const centerX = GAME_WIDTH / 2;
    const centerY = 100;
    
    // 创建赛博朋克风格的背景效果 - 减少故障效果的幅度以提升性能
    const glitchAmount = Math.sin(Date.now() / 200) * 3; // 从5减少到3，降低故障效果的频率和幅度
    
    // 添加故障背景
    ctx.save();
    
    // 添加故障背景矩形
    const textWidth = ctx.measureText(comboMessage).width;
    const bgWidth = textWidth * 1.4;
    const bgHeight = fontSize * 1.6;
    
    // 绘制背景故障效果 - 减少重复次数以提高性能
    for (let i = 0; i < 2; i++) { // 从3减少到2
        const offsetX = (Math.random() - 0.5) * glitchAmount * 2;
        const offsetY = (Math.random() - 0.5) * glitchAmount * 2;
        
        // 创建渐变背景
        const gradient = ctx.createLinearGradient(
            centerX - bgWidth/2, centerY - bgHeight/2,
            centerX + bgWidth/2, centerY + bgHeight/2
        );
        
        // 使用更酷的渐变颜色
        gradient.addColorStop(0, 'rgba(0, 30, 60, 0.7)');
        gradient.addColorStop(0.5, 'rgba(20, 0, 40, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 30, 60, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            centerX - bgWidth/2 + offsetX, 
            centerY - bgHeight/2 + offsetY, 
            bgWidth, bgHeight
        );
    }
    
    // 添加霓虹边框效果
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - bgWidth/2, centerY - bgHeight/2, bgWidth, bgHeight);
    
    // 添加内部扫描线
    const scanLineOpacity = 0.2;
    const scanLineSpacing = 4;
    ctx.fillStyle = `rgba(0, 255, 255, ${scanLineOpacity})`;
    
    for (let y = centerY - bgHeight/2; y < centerY + bgHeight/2; y += scanLineSpacing) {
        ctx.fillRect(centerX - bgWidth/2, y, bgWidth, 1);
    }
    
    // 绘制文字内容
    ctx.font = `bold ${fontSize}px "Orbitron", "Rajdhani", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 文字故障效果 - 绘制多层文字，有轻微错位
    const glitchColors = ['#ff00de', '#00ffcc', '#ffffff'];
    
    glitchColors.forEach((color, i) => {
        const offsetX = (Math.random() - 0.5) * glitchAmount;
        const offsetY = (Math.random() - 0.5) * glitchAmount;
        
        // 文字阴影和发光效果
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        
        // 绘制错位文字
        ctx.fillText(comboMessage, centerX + offsetX, centerY + offsetY);
    });
    
    // 绘制主文字 - 永远位于顶层且位置固定
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(comboMessage, centerX, centerY);
    
    // 在文字周围添加电子线条效果
    const lineLength = bgWidth * 0.2;
    const cornerOffset = 10;
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    // 左上角装饰
    ctx.beginPath();
    ctx.moveTo(centerX - bgWidth/2, centerY - bgHeight/2 + cornerOffset);
    ctx.lineTo(centerX - bgWidth/2, centerY - bgHeight/2);
    ctx.lineTo(centerX - bgWidth/2 + cornerOffset, centerY - bgHeight/2);
    ctx.stroke();
    
    // 右上角装饰
    ctx.beginPath();
    ctx.moveTo(centerX + bgWidth/2, centerY - bgHeight/2 + cornerOffset);
    ctx.lineTo(centerX + bgWidth/2, centerY - bgHeight/2);
    ctx.lineTo(centerX + bgWidth/2 - cornerOffset, centerY - bgHeight/2);
    ctx.stroke();
    
    // 左下角装饰
    ctx.beginPath();
    ctx.moveTo(centerX - bgWidth/2, centerY + bgHeight/2 - cornerOffset);
    ctx.lineTo(centerX - bgWidth/2, centerY + bgHeight/2);
    ctx.lineTo(centerX - bgWidth/2 + cornerOffset, centerY + bgHeight/2);
    ctx.stroke();
    
    // 右下角装饰
    ctx.beginPath();
    ctx.moveTo(centerX + bgWidth/2, centerY + bgHeight/2 - cornerOffset);
    ctx.lineTo(centerX + bgWidth/2, centerY + bgHeight/2);
    ctx.lineTo(centerX + bgWidth/2 - cornerOffset, centerY + bgHeight/2);
    ctx.stroke();
    
    // 重置状态
    ctx.restore();
}

// Update combo display color based on combo count
function updateComboDisplayColor() {
    if (!comboDisplayElement) return;
    
    // 使用霓虹绿色
    const greenColor = '#00ff66'; // 霓虹绿
    
    // Apply the color
    comboDisplayElement.style.color = greenColor;
    
    // Add animation effect ONLY for exact milestone combos
    if (comboCount === 5 || comboCount === 10 || comboCount === 20) {
        comboDisplayElement.style.fontSize = '36px'; // Temporarily make it larger
        comboDisplayElement.style.textShadow = `0 0 15px ${greenColor}, 0 0 25px ${greenColor}, 0 0 35px ${greenColor}`; // 更强烈的辉光效果
        
        // 添加闪烁动画
        const blinkAnimation = () => {
            let count = 0;
            const interval = setInterval(() => {
                if (count >= 6) { // 3次闪烁后停止
                    clearInterval(interval);
                    comboDisplayElement.style.fontSize = '32px'; // Back to normal size
                    comboDisplayElement.style.textShadow = `0 0 10px ${greenColor}`; // Normal glow
                    return;
                }
                
                // 交替增强和减弱辉光效果
                if (count % 2 === 0) {
                    comboDisplayElement.style.textShadow = `0 0 5px ${greenColor}, 0 0 10px ${greenColor}`;
                    comboDisplayElement.style.opacity = '0.7';
                } else {
                    comboDisplayElement.style.textShadow = `0 0 15px ${greenColor}, 0 0 25px ${greenColor}, 0 0 35px ${greenColor}`;
                    comboDisplayElement.style.opacity = '1';
                }
                count++;
            }, 80); // 快速闪烁
        };
        
        blinkAnimation();
    }
}

// Create fireworks at specified position
function createFireworks(x, y, size = 1, text = null) {
    if (text) {
        // For text fireworks (milestone combos), create a single firework with text
        fireworks.push(new Firework(x, y, null, size, text));
    }
    else if (size >= 2) {
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

// Test function to diagnose QuestionManager
function testQuestionManager() {
    console.log('Testing QuestionManager...');
    try {
        // Check if QuestionManager object exists
        console.log('QuestionManager exists:', !!QuestionManager);
        
        if (QuestionManager) {
            // Check methods
            console.log('Methods available:', {
                init: typeof QuestionManager.init === 'function',
                setCurrentBank: typeof QuestionManager.setCurrentBank === 'function',
                getRandomQuestions: typeof QuestionManager.getRandomQuestions === 'function'
            });
            
            // Check current bank state
            console.log('Current bank ID:', selectedBankId);
            console.log('Sample size:', selectedSampleSize);
        }
        
        // Find and log status of start button
        const startBtn = document.getElementById('start-button');
        console.log('Start button exists:', !!startBtn);
        if (startBtn) {
            console.log('Start button class list:', startBtn.classList);
            console.log('Start button is visible:', !startBtn.closest('.hidden'));
            
            // Add a direct event handler for testing
            startBtn.onclick = function() {
                console.log('Direct onclick handler triggered');
                startGame();
            };
        }
        
        return true;
    } catch (err) {
        console.error('Test failed:', err);
        return false;
    }
}

// Run test during load
window.addEventListener('load', function() {
    setTimeout(() => {
        testQuestionManager();
    }, 1000); // Run test 1 second after page load
});

// Initialize the game when the page loads
window.addEventListener('load', initGame);

// Enable question review functionality after game over
function enableQuestionReview() {
    // Hide the question detail container initially
    questionDetailContainer.classList.add('hidden');
    
    // Add click event listeners to all stat boxes
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach((box, index) => {
        box.addEventListener('click', () => {
            // Only allow interaction after game over
            if (!gameActive) {
                showQuestionDetail(index);
            }
        });
    });
}

// Display question details when a stat box is clicked
function showQuestionDetail(questionIndex) {
    // Get the question
    const question = currentQuestions[questionIndex];
    if (!question) return;
    
    // Create HTML for the question detail
    let html = `<div class="question-text">${questionIndex + 1}. ${question.question}</div>`;
    
    // Add options if it's a multiple choice question
    if (question.options) {
        html += '<div class="question-options">';
        
        // Determine if it's a multi-select question
        const isMultiSelect = question.type === 'multiSelect';
        
        if (isMultiSelect) {
            // For multi-select questions
            const correctAnswers = question.correctAnswers;
            
            question.options.forEach((option, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isCorrect = correctAnswers.includes(letter);
                
                const optionClass = isCorrect ? 'option-correct' : 'option-incorrect';
                
                html += `
                    <div class="question-option ${optionClass}">
                        <div class="option-letter">${letter}.</div>
                        <div class="option-text">${option}</div>
                    </div>
                `;
            });
            
            // Add the correct answers
            html += `
                <div class="question-answer answer-correct">
                    正确答案: ${correctAnswers.join(', ')}
                </div>
            `;
        } else {
            // For single-choice questions
            const correctAnswer = question.correctAnswer;
            
            question.options.forEach((option, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isCorrect = letter === correctAnswer;
                
                const optionClass = isCorrect ? 'option-correct' : '';
                
                html += `
                    <div class="question-option ${optionClass}">
                        <div class="option-letter">${letter}.</div>
                        <div class="option-text">${option}</div>
                    </div>
                `;
            });
            
            // Add the correct answer
            html += `
                <div class="question-answer answer-correct">
                    正确答案: ${correctAnswer}
                </div>
            `;
        }
        
        html += '</div>';
    } else {
        // True/False question
        const correctAnswer = question.correctAnswer === 'TRUE' ? '是' : '否';
        
        html += `
            <div class="question-options">
                <div class="question-option ${question.correctAnswer === 'TRUE' ? 'option-correct' : ''}">
                    <div class="option-letter">✓</div>
                    <div class="option-text">是</div>
                </div>
                <div class="question-option ${question.correctAnswer === 'FALSE' ? 'option-correct' : ''}">
                    <div class="option-letter">✗</div>
                    <div class="option-text">否</div>
                </div>
            </div>
            <div class="question-answer answer-correct">
                正确答案: ${correctAnswer}
            </div>
        `;
    }
    
    // Add user's answer status
    const userAnswerStatus = questionStats[questionIndex];
    let userAnswerHtml = '';
    
    if (userAnswerStatus === 'correct') {
        userAnswerHtml = '<div class="question-answer answer-correct">您的回答: 正确</div>';
    } else if (userAnswerStatus === 'wrong') {
        userAnswerHtml = '<div class="question-answer answer-incorrect">您的回答: 错误</div>';
    } else {
        userAnswerHtml = '<div class="question-answer">您未回答此题</div>';
    }
    
    html += userAnswerHtml;
    
    // Update the container and show it
    questionDetailContent.innerHTML = html;
    questionDetailContainer.classList.remove('hidden');
}

// Add event handler for the close button
closeDetailBtn.addEventListener('click', () => {
    questionDetailContainer.classList.add('hidden');
});

// 绘制赛博朋克网格背景
function drawCyberpunkGrid() {
    // 网格线颜色
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'; // 青色半透明
    ctx.lineWidth = 1;
    
    // 增加网格间距以减少绘制的网格线数量
    const gridSpacingY = 80; // 从50增加到80
    const gridSpacingX = 80; // 从50增加到80
    
    // 减少单独的beginPath和stroke调用，批量处理以提高性能
    
    // 绘制所有水平线
    ctx.beginPath();
    for (let y = 0; y < GAME_HEIGHT; y += gridSpacingY) {
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
    }
    ctx.stroke();
    
    // 绘制所有垂直线
    ctx.beginPath();
    for (let x = 0; x < GAME_WIDTH; x += gridSpacingX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
    }
    ctx.stroke();
} 