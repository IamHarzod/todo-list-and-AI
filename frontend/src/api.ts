export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AISuggestion {
  category: 'work' | 'personal' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
}

export interface ChatResponse {
  reply: string;
  tasks: Task[];
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

const API_BASE_URL = 'http://localhost:4000/api';

export const api = {
  // Task Endpoints
  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    category: 'work' | 'personal' | 'urgent';
    priority: 'low' | 'medium' | 'high';
    deadline: string | null;
  }): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // AI Endpoints
  async getSuggestions(title: string, description?: string): Promise<AISuggestion> {
    const res = await fetch(`${API_BASE_URL}/ai/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    if (!res.ok) throw new Error('Failed to fetch AI suggestions');
    return res.json();
  },

  async sendChatMessage(message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE_URL}/ai/chat-history`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async clearChatHistory(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/ai/chat-history`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear chat history');
  },

  async getDailySummary(): Promise<{ summary: string }> {
    const res = await fetch(`${API_BASE_URL}/ai/summary`);
    if (!res.ok) throw new Error('Failed to fetch daily summary');
    return res.json();
  }
};
