"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: [
                { completed: 'asc' },
                { deadline: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create task
router.post('/', async (req, res) => {
    try {
        const { title, description, category, priority, deadline } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const task = await prisma.task.create({
            data: {
                title,
                description: description || '',
                category: category || 'personal',
                priority: priority || 'medium',
                deadline: deadline ? new Date(deadline) : null
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, priority, deadline, completed } = req.body;
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (category !== undefined)
            data.category = category;
        if (priority !== undefined)
            data.priority = priority;
        if (deadline !== undefined)
            data.deadline = deadline ? new Date(deadline) : null;
        if (completed !== undefined)
            data.completed = completed;
        const task = await prisma.task.update({
            where: { id },
            data
        });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({
            where: { id }
        });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
