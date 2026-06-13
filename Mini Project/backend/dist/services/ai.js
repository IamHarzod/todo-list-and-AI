"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// Lấy Gemini API Key từ cấu hình môi trường (.env)
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new generative_ai_1.GoogleGenerativeAI(apiKey) : null;
/**
 * Công cụ phân tích dự phòng (Mock offline):
 * Tự động phân tích từ khóa trong tiêu đề nếu chưa điền API Key hoặc xảy ra lỗi kết nối.
 */
function fallbackSuggest(title, description) {
    const content = `${title} ${description || ''}`.toLowerCase();
    // 1. Phân loại Category
    let category = 'personal';
    if (content.includes('urgent') ||
        content.includes('asap') ||
        content.includes('immediately') ||
        content.includes('critical') ||
        content.includes('cấp bách') ||
        content.includes('gấp')) {
        category = 'urgent';
    }
    else if (content.includes('work') ||
        content.includes('meeting') ||
        content.includes('project') ||
        content.includes('report') ||
        content.includes('presentation') ||
        content.includes('code') ||
        content.includes('client') ||
        content.includes('công việc') ||
        content.includes('họp') ||
        content.includes('dự án') ||
        content.includes('báo cáo')) {
        category = 'work';
    }
    // 2. Xác định độ ưu tiên
    let priority = 'low';
    if (category === 'urgent' || content.includes('high') || content.includes('cao') || content.includes('quan trọng')) {
        priority = 'high';
    }
    else if (content.includes('medium') || content.includes('trung bình') || content.includes('normal') || content.includes('work')) {
        priority = 'medium';
    }
    // 3. Phân tích deadline
    let deadlineDate = null;
    const today = new Date();
    if (content.includes('today') || content.includes('hôm nay') || content.includes('ngay bây giờ')) {
        deadlineDate = new Date(today.setHours(23, 59, 59, 999));
    }
    else if (content.includes('tomorrow') || content.includes('ngày mai') || content.includes('hôm sau')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        deadlineDate = new Date(tomorrow.setHours(17, 0, 0, 0));
    }
    else if (content.includes('next week') || content.includes('tuần sau')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        deadlineDate = new Date(nextWeek.setHours(17, 0, 0, 0));
    }
    else if (content.includes('weekend') || content.includes('cuối tuần')) {
        const nextSat = new Date(today);
        nextSat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
        deadlineDate = new Date(nextSat.setHours(12, 0, 0, 0));
    }
    else {
        const daysVietnamese = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];
        const daysEnglish = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < 7; i++) {
            if (content.includes(daysEnglish[i]) || content.includes(daysVietnamese[i])) {
                const targetDay = i;
                const currentDay = today.getDay();
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0)
                    daysToAdd += 7;
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + daysToAdd);
                deadlineDate = new Date(targetDate.setHours(17, 0, 0, 0));
                break;
            }
        }
    }
    return {
        category,
        priority,
        deadline: deadlineDate ? deadlineDate.toISOString() : null
    };
}
/**
 * Xử lý chat dự phòng (Mock offline):
 * Tự động quét regex khớp câu lệnh để thêm/sửa/xóa task.
 */
async function fallbackChat(message, currentTasks) {
    const content = message.toLowerCase().trim();
    const actions = [];
    let reply = '';
    const doneMatch = content.match(/(?:hoàn thành|xong|check|complete|done|tick)\s+(?:task\s+|công việc\s+)?["']?([^"']+)["']?/i);
    const deleteMatch = content.match(/(?:xóa|delete|remove|erase)\s+(?:task\s+|công việc\s+)?["']?([^"']+)["']?/i);
    const addMatch = content.match(/(?:thêm|tạo|add|create|new)\s+(?:task\s+|công việc\s+)?["']?([^"']+)["']?/i);
    if (doneMatch) {
        const searchTitle = doneMatch[1].toLowerCase().trim();
        const task = currentTasks.find(t => t.title.toLowerCase().includes(searchTitle));
        if (task) {
            actions.push({ type: 'COMPLETE_TASK', payload: { id: task.id } });
            reply = `Đã hoàn thành công việc: **"${task.title}"** (ID: ${task.id}).`;
        }
        else {
            reply = `Không tìm thấy công việc nào khớp với tên "${doneMatch[1]}" để đánh dấu hoàn thành.`;
        }
    }
    else if (deleteMatch) {
        const searchTitle = deleteMatch[1].toLowerCase().trim();
        const task = currentTasks.find(t => t.title.toLowerCase().includes(searchTitle));
        if (task) {
            actions.push({ type: 'DELETE_TASK', payload: { id: task.id } });
            reply = `Đã xóa công việc: **"${task.title}"**.`;
        }
        else {
            reply = `Không tìm thấy công việc nào khớp với tên "${deleteMatch[1]}" để xóa.`;
        }
    }
    else if (addMatch || content.length > 5) {
        const title = addMatch ? addMatch[1] : message;
        const suggestion = fallbackSuggest(title);
        actions.push({
            type: 'CREATE_TASK',
            payload: {
                title,
                category: suggestion.category,
                priority: suggestion.priority,
                deadline: suggestion.deadline
            }
        });
        const deadlineText = suggestion.deadline
            ? new Date(suggestion.deadline).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Không có';
        const categoryName = suggestion.category === 'work' ? 'Công việc' : suggestion.category === 'urgent' ? 'Khẩn cấp' : 'Cá nhân';
        const priorityName = suggestion.priority === 'high' ? 'Cao' : suggestion.priority === 'medium' ? 'Trung bình' : 'Thấp';
        reply = `Đã tạo công việc mới:\n` +
            `- **Tiêu đề**: ${title}\n` +
            `- **Phân loại**: ${categoryName} 🏷️\n` +
            `- **Độ ưu tiên**: ${priorityName} ⚡\n` +
            `- **Hạn chót**: ${deadlineText} 📅`;
    }
    else {
        reply = "Xin chào! Bạn có thể chat với mình để quản lý công việc. Ví dụ:\n" +
            "- *\"Thêm công việc họp với nhóm lúc 9h sáng mai\"*\n" +
            "- *\"Hoàn thành công việc họp với nhóm\"*\n" +
            "- *\"Xóa công việc đi siêu thị\"*";
    }
    return { reply, actions };
}
exports.AIService = {
    /**
     * Tự động phân loại danh mục, ưu tiên, deadline bằng Gemini
     */
    async getSuggestions(title, description) {
        if (!genAI) {
            return fallbackSuggest(title, description);
        }
        try {
            // Sử dụng cấu hình JSON Output của Gemini 1.5 để bắt buộc mô hình trả về đúng định dạng mong muốn
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            });
            const prompt = `Bạn là một trợ lý AI quản lý công việc thông minh. 
Nhiệm vụ của bạn là phân tích tiêu đề và mô tả công việc dưới đây, sau đó tự động phân loại, gợi ý mức độ ưu tiên và hạn chót (deadline).

Hãy chọn phân loại và độ ưu tiên phù hợp nhất theo các quy tắc:
- Phân loại (category): "work" (công việc, học tập, sự nghiệp), "personal" (cá nhân, gia đình, sở thích), hoặc "urgent" (khẩn cấp, có deadline cực gần, việc phát sinh cần làm ngay).
- Độ ưu tiên (priority): "low", "medium", hoặc "high".
- Hạn chót (deadline): Dựa vào từ khóa trong tiêu đề/mô tả (ví dụ: "ngày mai", "9h sáng thứ hai", "cuối tuần này"). Định dạng theo chuẩn ISO 8601 String. Nếu không đề cập thời gian cụ thể nào, trả về null.
Thời điểm hiện tại (ngay bây giờ) là: ${new Date().toISOString()}.

Vui lòng trả về kết quả dưới định dạng JSON duy nhất, không giải thích gì thêm, theo cấu trúc:
{
  "category": "work" | "personal" | "urgent",
  "priority": "low" | "medium" | "high",
  "deadline": "ISO-date-string" | null
}

Dữ liệu công việc:
Tiêu đề: "${title}"
Mô tả: "${description || ''}"`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            return JSON.parse(text);
        }
        catch (error) {
            console.error('Gemini API suggest error, using fallback:', error);
            return fallbackSuggest(title, description);
        }
    },
    /**
     * Trò chuyện quản lý Task bằng tiếng Việt thông minh với Gemini
     */
    async handleChat(message, chatHistory) {
        const currentTasks = await prisma.task.findMany({
            orderBy: [
                { completed: 'asc' },
                { deadline: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        if (!genAI) {
            const fallback = await fallbackChat(message, currentTasks);
            const executed = await this.executeActions(fallback.actions);
            const updatedTasks = await prisma.task.findMany({
                orderBy: [
                    { completed: 'asc' },
                    { deadline: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
            return {
                reply: fallback.reply + '\n\n*(Lưu ý: Đang chạy ở chế độ Fallback offline do thiếu GEMINI_API_KEY)*',
                actionsExecuted: executed,
                tasks: updatedTasks
            };
        }
        try {
            // Cấu hình prompt định hướng vai trò cho mô hình Gemini
            const systemPrompt = `Bạn là một trợ lý quản lý công việc cá nhân thông minh tên là TaskAI. 
Bạn giúp người dùng quản lý công việc của họ thông qua ngôn ngữ tự nhiên (tiếng Việt hoặc tiếng Anh).

Bạn có khả năng tương tác trực tiếp với cơ sở dữ liệu bằng cách đề xuất các "hành động" (actions) đi kèm câu trả lời của bạn.
Hệ thống sẽ tự động quét và thực thi các hành động này.
Các hành động được hỗ trợ là:
1. CREATE_TASK: Tạo một công việc mới.
   Payload: { "title": string, "category": "work"|"personal"|"urgent", "priority": "low"|"medium"|"high", "deadline": "ISO-date-string" | null }
2. COMPLETE_TASK: Hoàn thành một công việc.
   Payload: { "id": string }
3. DELETE_TASK: Xóa một công việc.
   Payload: { "id": string }

Để gửi hành động, bạn PHẢI kẹp một đoạn JSON hợp lệ trong thẻ <actions>...</actions> ở cuối câu trả lời của bạn. 
Ví dụ:
<actions>[{"type": "CREATE_TASK", "payload": {"title": "Mua sữa", "category": "personal", "priority": "low", "deadline": "2026-06-14T17:00:00.000Z"}}]</actions>
Bạn có thể kết hợp nhiều hành động trong cùng một mảng JSON nếu người dùng yêu cầu nhiều thứ (ví dụ: vừa thêm vừa xóa).

Thông tin hữu ích:
- Thời gian hiện tại là: ${new Date().toISOString()}.
- Danh sách công việc hiện tại của người dùng:
${JSON.stringify(currentTasks.map(t => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, deadline: t.deadline, completed: t.completed })), null, 2)}

Hãy phân tích kỹ yêu cầu của người dùng để sinh ra hành động chính xác nhất (ví dụ: khớp tiêu đề để tìm ID chính xác khi người dùng muốn xóa hoặc hoàn thành task). 
Hãy trả lời bằng tiếng Việt thân thiện, tự nhiên. Lưu ý luôn dịch các thuật ngữ phân loại và độ ưu tiên sang tiếng Việt trong văn bản hiển thị cho người dùng dễ hiểu (ví dụ: phân loại "work" -> "Công việc", "personal" -> "Cá nhân", "urgent" -> "Khẩn cấp" và mức độ ưu tiên "high" -> "Cao", "medium" -> "Trung bình", "low" -> "Thấp").`;
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: systemPrompt
            });
            // Ánh xạ lịch sử chat tương thích với cấu hình Gemini (role 'user' & 'model')
            const history = chatHistory.slice(-10).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
            // Bắt đầu phiên hội thoại
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(message);
            const rawReply = result.response.text();
            // Phân tích cú pháp hành động
            let reply = rawReply;
            let actions = [];
            const actionsRegex = /<actions>([\s\S]*?)<\/actions>/;
            const match = rawReply.match(actionsRegex);
            if (match) {
                try {
                    actions = JSON.parse(match[1].trim());
                    reply = rawReply.replace(actionsRegex, '').trim();
                }
                catch (e) {
                    console.error('Failed to parse actions JSON from Gemini response:', e);
                }
            }
            // Thực thi hành động vào Database
            const executed = await this.executeActions(actions);
            const updatedTasks = await prisma.task.findMany({
                orderBy: [
                    { completed: 'asc' },
                    { deadline: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
            return {
                reply,
                actionsExecuted: executed,
                tasks: updatedTasks
            };
        }
        catch (error) {
            console.error('Gemini API chat error, using fallback:', error);
            const fallback = await fallbackChat(message, currentTasks);
            const executed = await this.executeActions(fallback.actions);
            const updatedTasks = await prisma.task.findMany({
                orderBy: [
                    { completed: 'asc' },
                    { deadline: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
            return {
                reply: fallback.reply + '\n\n*(Lưu ý: Gặp lỗi kết nối Gemini API, đang chạy ở chế độ Fallback offline)*',
                actionsExecuted: executed,
                tasks: updatedTasks
            };
        }
    },
    /**
     * Thực thi thao tác cập nhật cơ sở dữ liệu bằng Prisma
     */
    async executeActions(actions) {
        const executed = [];
        for (const action of actions) {
            try {
                if (action.type === 'CREATE_TASK') {
                    const { title, description, category, priority, deadline } = action.payload;
                    const created = await prisma.task.create({
                        data: {
                            title,
                            description: description || '',
                            category: category || 'personal',
                            priority: priority || 'medium',
                            deadline: deadline ? new Date(deadline) : null
                        }
                    });
                    executed.push({ action: 'CREATE', success: true, task: created });
                }
                else if (action.type === 'COMPLETE_TASK') {
                    const { id } = action.payload;
                    const updated = await prisma.task.update({
                        where: { id },
                        data: { completed: true }
                    });
                    executed.push({ action: 'COMPLETE', success: true, task: updated });
                }
                else if (action.type === 'DELETE_TASK') {
                    const { id } = action.payload;
                    const deleted = await prisma.task.delete({
                        where: { id }
                    });
                    executed.push({ action: 'DELETE', success: true, task: deleted });
                }
            }
            catch (err) {
                console.error('Error executing action:', action, err);
                executed.push({ action: action.type, success: false, error: err.message });
            }
        }
        return executed;
    },
    /**
     * Tạo tóm tắt công việc trong ngày bằng Gemini
     */
    async getDailySummary() {
        const tasks = await prisma.task.findMany();
        const completed = tasks.filter(t => t.completed);
        const pending = tasks.filter(t => !t.completed);
        if (!genAI) {
            let md = `## 📝 Tóm tắt công việc trong ngày\n\n`;
            md += `Hệ thống ghi nhận tổng cộng **${tasks.length}** công việc. Trong đó:\n`;
            md += `- **Hoàn thành**: ${completed.length} ✅\n`;
            md += `- **Chờ xử lý**: ${pending.length} ⏳\n\n`;
            if (pending.length > 0) {
                md += `### 📌 Các công việc quan trọng cần ưu tiên:\n`;
                const urgentPending = pending.filter(t => t.category === 'urgent' || t.priority === 'high');
                const translateCategory = (cat) => cat === 'work' ? 'Công việc' : cat === 'urgent' ? 'Khẩn cấp' : 'Cá nhân';
                const translatePriority = (pri) => pri === 'high' ? 'Cao' : pri === 'medium' ? 'Trung bình' : 'Thấp';
                if (urgentPending.length > 0) {
                    urgentPending.forEach(t => {
                        md += `- **${t.title}** (Phân loại: ${translateCategory(t.category)}, Ưu tiên: ${translatePriority(t.priority)})\n`;
                    });
                }
                else {
                    pending.slice(0, 3).forEach(t => {
                        md += `- **${t.title}** (Phân loại: ${translateCategory(t.category)})\n`;
                    });
                }
            }
            else {
                md += `🎉 Tuyệt vời! Bạn đã hoàn thành toàn bộ công việc của ngày hôm nay.\n`;
            }
            md += `\n*Lưu ý: Tóm tắt này được tạo ngoại tuyến (Mock Engine).*`;
            return md;
        }
        try {
            const taskListStr = JSON.stringify(tasks.map(t => ({
                title: t.title,
                category: t.category,
                priority: t.priority,
                deadline: t.deadline,
                completed: t.completed
            })), null, 2);
            const prompt = `Bạn là một trợ lý AI quản lý năng suất cá nhân. Hãy tạo một bản tóm tắt công việc ngày hôm nay (Daily Task Summary) cho người dùng dựa trên danh sách công việc sau:
${taskListStr}

Hãy viết một bản tóm tắt hấp dẫn bằng Markdown. Bao gồm các phần:
1. Tổng quan ngắn gọn (Ví dụ: số task đã xong, số task còn lại).
2. Những thành tích đã đạt được hôm nay (các task đã completed).
3. Các công việc khẩn cấp/ưu tiên cần giải quyết tiếp theo (các task chưa completed, đặc biệt là loại urgent hoặc priority high).
4. Lời khuyên/động lực năng suất ngắn gọn dành cho họ.

Lưu ý: Viết bằng tiếng Việt, súc tích, văn phong chuyên nghiệp và năng động. Trả về văn bản Markdown trực tiếp, không chứa các thẻ giải thích hay bọc ngoài.`;
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            return result.response.text();
        }
        catch (err) {
            console.error('Gemini API summary error, using fallback:', err);
            return `### 📝 Tóm tắt công việc trong ngày (Offline Fallback)
Bạn đã hoàn thành **${completed.length}** trên tổng số **${tasks.length}** công việc. 
Còn **${pending.length}** công việc chưa hoàn thành. Hãy tiếp tục cố gắng!`;
        }
    }
};
