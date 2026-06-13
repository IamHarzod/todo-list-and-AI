import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { completed: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, deadline, completed } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (priority !== undefined) data.priority = priority;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
    if (completed !== undefined) data.completed = completed;

    const task = await prisma.task.update({
      where: { id },
      data
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({
      where: { id }
    });
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
