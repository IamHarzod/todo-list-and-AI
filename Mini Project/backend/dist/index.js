"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const tasks_1 = __importDefault(require("./routes/tasks"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/tasks', tasks_1.default);
app.use('/api/ai', ai_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
app.listen(port, () => {
    console.log(`🚀 TaskAI Server running at http://localhost:${port}`);
});
