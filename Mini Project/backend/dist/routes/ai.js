"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../services/ai");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get chat history
router.get('/chat-history', async (req, res) => {
    try {
        const history = await prisma.chatMessage.findMany({
            orderBy: { createdAt: 'asc' }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Clear chat history
router.delete('/chat-history', async (req, res) => {
    try {
        await prisma.chatMessage.deleteMany();
        res.json({ message: 'Chat history cleared' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Suggest category, priority, and deadline
router.post('/suggest', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const suggestion = await ai_1.AIService.getSuggestions(title, description);
        res.json(suggestion);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Chat with AI to manage tasks
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const userMsg = await prisma.chatMessage.create({
            data: {
                role: 'user',
                content: message
            }
        });
        const chatHistory = await prisma.chatMessage.findMany({
            orderBy: { createdAt: 'asc' },
            take: 15
        });
        const result = await ai_1.AIService.handleChat(message, chatHistory);
        const assistantMsg = await prisma.chatMessage.create({
            data: {
                role: 'assistant',
                content: result.reply
            }
        });
        res.json({
            reply: result.reply,
            tasks: result.tasks,
            userMessage: userMsg,
            assistantMessage: assistantMsg
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get daily task summary
router.get('/summary', async (req, res) => {
    try {
        const summaryMarkdown = await ai_1.AIService.getDailySummary();
        res.json({ summary: summaryMarkdown });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
