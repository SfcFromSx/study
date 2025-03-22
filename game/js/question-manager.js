/**
 * 题库管理器
 * 负责加载题库、获取题目并提供随机抽样功能
 */

// 存储所有可用题库信息
let availableQuestionBanks = [];
// 当前选择的题库
let currentQuestionBank = null;
// 当前采样数量
let currentSampleSize = 20;

/**
 * 初始化题库管理器
 * @returns {Promise} 初始化完成的Promise
 */
async function initQuestionManager() {
    try {
        // 加载题库列表
        const response = await fetch('question-banks/index.json');
        if (!response.ok) {
            // 如果index.json不存在，手动扫描题库文件夹
            await scanQuestionBanks();
        } else {
            availableQuestionBanks = await response.json();
        }
        return availableQuestionBanks;
    } catch (error) {
        console.error('初始化题库管理器失败:', error);
        // 备用方案：手动列出题库
        availableQuestionBanks = [
            { id: 'space', name: '太空知识', file: 'space.json' },
            { id: 'science', name: '科学知识', file: 'science.json' },
            { id: 'history', name: '历史知识', file: 'history.json' }
        ];
        return availableQuestionBanks;
    }
}

/**
 * 扫描题库文件夹
 * @returns {Promise} 扫描完成的Promise
 */
async function scanQuestionBanks() {
    try {
        // 获取题库文件夹中的所有JSON文件
        const response = await fetch('question-banks/');
        if (!response.ok) {
            throw new Error('无法访问题库文件夹');
        }
        
        const files = await response.json();
        availableQuestionBanks = files
            .filter(file => file.endsWith('.json') && file !== 'index.json')
            .map(file => {
                const id = file.replace('.json', '');
                return { id, name: id, file };
            });
        
        // 获取每个题库的详细信息
        for (const bank of availableQuestionBanks) {
            try {
                const data = await loadQuestionBank(bank.id);
                bank.name = data.name || bank.id;
                bank.description = data.description || '';
                bank.count = countQuestions(data);
            } catch (error) {
                console.error(`加载题库 ${bank.id} 失败:`, error);
            }
        }
        
        return availableQuestionBanks;
    } catch (error) {
        console.error('扫描题库文件夹失败:', error);
        throw error;
    }
}

/**
 * 加载指定题库
 * @param {string} bankId 题库ID
 * @returns {Promise} 题库数据Promise
 */
async function loadQuestionBank(bankId) {
    try {
        const response = await fetch(`question-banks/${bankId}.json`);
        if (!response.ok) {
            throw new Error(`无法加载题库 ${bankId}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`加载题库 ${bankId} 失败:`, error);
        throw error;
    }
}

/**
 * 计算题库中的问题总数
 * @param {Object} bank 题库数据
 * @returns {number} 问题总数
 */
function countQuestions(bank) {
    let count = 0;
    if (bank.questions) {
        if (bank.questions.multipleChoice) {
            count += bank.questions.multipleChoice.length;
        }
        if (bank.questions.trueFalse) {
            count += bank.questions.trueFalse.length;
        }
    }
    return count;
}

/**
 * 设置当前题库和采样数量
 * @param {string} bankId 题库ID
 * @param {number} sampleSize 采样数量
 * @returns {Promise} 设置完成的Promise
 */
async function setCurrentQuestionBank(bankId, sampleSize) {
    try {
        currentQuestionBank = await loadQuestionBank(bankId);
        currentSampleSize = sampleSize;
        
        // 验证采样数量不超过题库总量
        const totalQuestions = countQuestions(currentQuestionBank);
        if (currentSampleSize > totalQuestions) {
            currentSampleSize = totalQuestions;
            console.warn(`采样数量超过题库总量，已调整为 ${totalQuestions}`);
        }
        
        return currentQuestionBank;
    } catch (error) {
        console.error(`设置当前题库 ${bankId} 失败:`, error);
        throw error;
    }
}

/**
 * 获取随机采样的问题
 * @param {number} [count=currentSampleSize] 需要的问题数量
 * @returns {Array} 随机问题数组
 */
function getRandomQuestions(count = currentSampleSize) {
    if (!currentQuestionBank) {
        throw new Error('尚未设置当前题库');
    }
    
    const multipleChoice = currentQuestionBank.questions.multipleChoice || [];
    const trueFalse = currentQuestionBank.questions.trueFalse || [];
    
    // 计算需要的多选题和判断题数量
    // 我们保持原始比例：80%多选题，20%判断题
    const mcCount = Math.floor(count * 0.8);
    const tfCount = count - mcCount;
    
    // 随机采样
    const randomMC = getRandomSample(multipleChoice, mcCount);
    const randomTF = getRandomSample(trueFalse, tfCount);
    
    // 合并结果
    return [...randomMC, ...randomTF];
}

/**
 * 从数组中随机采样
 * @param {Array} array 原始数组
 * @param {number} count 需要的样本数量
 * @returns {Array} 随机样本数组
 */
function getRandomSample(array, count) {
    if (count >= array.length) {
        return [...array]; // 如果需要的数量大于等于数组长度，返回整个数组的副本
    }
    
    // Fisher-Yates洗牌算法的变种，只洗牌前count个元素
    const result = [...array];
    for (let i = 0; i < count; i++) {
        const j = i + Math.floor(Math.random() * (result.length - i));
        [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result.slice(0, count);
}

// 导出函数
window.QuestionManager = {
    init: initQuestionManager,
    loadBank: loadQuestionBank,
    setCurrentBank: setCurrentQuestionBank,
    getRandomQuestions: getRandomQuestions,
    countQuestions: countQuestions
}; 