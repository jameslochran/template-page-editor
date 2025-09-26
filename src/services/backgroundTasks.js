/**
 * Background Task System
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Simple in-memory task queue for handling background processing.
 * In production, this would integrate with Redis, AWS SQS, or similar.
 */

const figmaProcessing = require('../tasks/figmaProcessing');

// In-memory task queue
const taskQueue = [];
const processingTasks = new Map();
const completedTasks = new Map();

// Task statuses
const TASK_STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * Adds a task to the queue
 */
const queueTask = (taskType, taskData) => {
    const taskId = generateTaskId();
    const task = {
        id: taskId,
        type: taskType,
        data: taskData,
        status: TASK_STATUS.QUEUED,
        createdAt: new Date().toISOString(),
        priority: taskData.priority || 0
    };
    
    taskQueue.push(task);
    console.log(`Queued task ${taskId} of type ${taskType}`);
    
    // Process tasks if not already processing
    if (processingTasks.size === 0) {
        processNextTask();
    }
    
    return taskId;
};

/**
 * Processes the next task in the queue
 */
const processNextTask = async () => {
    if (taskQueue.length === 0) {
        return;
    }
    
    // Sort by priority (higher priority first)
    taskQueue.sort((a, b) => b.priority - a.priority);
    const task = taskQueue.shift();
    
    if (!task) {
        return;
    }
    
    // Move to processing
    task.status = TASK_STATUS.PROCESSING;
    task.startedAt = new Date().toISOString();
    processingTasks.set(task.id, task);
    
    console.log(`Processing task ${task.id} of type ${task.type}`);
    
    try {
        // Execute the appropriate task handler
        let result;
        switch (task.type) {
            case 'figma_processing':
                result = await figmaProcessing.processFigmaFile(task.data);
                break;
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
        
        // Mark as completed
        task.status = TASK_STATUS.COMPLETED;
        task.completedAt = new Date().toISOString();
        task.result = result;
        
        completedTasks.set(task.id, task);
        processingTasks.delete(task.id);
        
        console.log(`Completed task ${task.id} of type ${task.type}`);
        
    } catch (error) {
        // Mark as failed
        task.status = TASK_STATUS.FAILED;
        task.completedAt = new Date().toISOString();
        task.error = error.message;
        
        completedTasks.set(task.id, task);
        processingTasks.delete(task.id);
        
        console.error(`Failed task ${task.id} of type ${task.type}:`, error);
    }
    
    // Process next task
    setTimeout(processNextTask, 100); // Small delay to prevent blocking
};

/**
 * Queues a Figma processing task
 */
const queueFigmaProcessing = (figmaData) => {
    return queueTask('figma_processing', {
        ...figmaData,
        priority: 1 // High priority for Figma processing
    });
};

/**
 * Gets task status by ID
 */
const getTaskStatus = (taskId) => {
    // Check processing tasks first
    if (processingTasks.has(taskId)) {
        return processingTasks.get(taskId);
    }
    
    // Check completed tasks
    if (completedTasks.has(taskId)) {
        return completedTasks.get(taskId);
    }
    
    // Check queued tasks
    const queuedTask = taskQueue.find(task => task.id === taskId);
    if (queuedTask) {
        return queuedTask;
    }
    
    return null;
};

/**
 * Gets all tasks with optional status filter
 */
const getAllTasks = (status = null) => {
    const allTasks = [
        ...taskQueue,
        ...Array.from(processingTasks.values()),
        ...Array.from(completedTasks.values())
    ];
    
    if (status) {
        return allTasks.filter(task => task.status === status);
    }
    
    return allTasks;
};

/**
 * Cleans up old completed tasks
 */
const cleanupOldTasks = (maxAgeHours = 24) => {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [taskId, task] of completedTasks.entries()) {
        if (new Date(task.completedAt) < cutoffTime) {
            completedTasks.delete(taskId);
            cleanedCount++;
        }
    }
    
    console.log(`Cleaned up ${cleanedCount} old tasks`);
    return cleanedCount;
};

/**
 * Generates a unique task ID
 */
const generateTaskId = () => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gets queue statistics
 */
const getQueueStats = () => {
    return {
        queued: taskQueue.length,
        processing: processingTasks.size,
        completed: completedTasks.size,
        total: taskQueue.length + processingTasks.size + completedTasks.size
    };
};

module.exports = {
    queueTask,
    queueFigmaProcessing,
    getTaskStatus,
    getAllTasks,
    cleanupOldTasks,
    getQueueStats,
    TASK_STATUS
};
