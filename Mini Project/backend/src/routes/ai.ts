import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get chat history
router.get('/chat-history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history
router.delete('/chat-history', async (req: Request, res: Response) => {
  try {
    await prisma.chatMessage.deleteMany();
    res.json({ message: 'Chat history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest category, priority, and deadline
router.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const suggestion = await AIService.getSuggestions(title, description);
    res.json(suggestion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with AI to manage tasks
router.post('/chat', async (req: Request, res: Response) => {
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

    const result = await AIService.handleChat(message, chatHistory);

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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily task summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summaryMarkdown = await AIService.getDailySummary();
    res.json({ summary: summaryMarkdown });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug API status
router.get('/debug', (req: Request, res: Response) => {
  try {
    res.json(AIService.debug());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
