const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL Database!');
    }
});

// 1. Get all tasks
app.get('/api/tasks', (req, res) => {
    const sql = 'SELECT * FROM tasks ORDER BY due_date ASC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. Add a new task
app.post('/api/tasks', (req, res) => {
    const { title, subject, due_date } = req.body;
    const sql = 'INSERT INTO tasks (title, subject, due_date) VALUES (?, ?, ?)';
    db.query(sql, [title, subject, due_date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Task added successfully!', id: result.insertId });
    });
});

// 3. Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tasks WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Task deleted successfully!' });
    });
});

// 4. Groq AI Study Plan Generator
app.post('/api/generate-plan', async (req, res) => {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'Study plan එකක් සෑදීමට tasks එකතු කරන්න.' });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
        return res.status(503).json({ error: 'Groq API key එක සකසා නැත. backend/.env ගොනුවේ GROQ_API_KEY එකතු කරන්න.' });
    }

    try {
        const groq = new Groq({ apiKey });
        const prompt = `I am a student. Create a simple, structured daily study plan in clear Sinhala with actionable preparation tips. Use these upcoming study tasks and exams:
        ${JSON.stringify(tasks)}

        Respond only with the study plan.`;
        const result = await groq.chat.completions.create({
            model: 'qwen/qwen3.8-27b',
            messages: [{ role: 'user', content: prompt }]
        });
        const plan = result.choices[0]?.message?.content?.trim();
        if (!plan) {
            throw new Error('Groq returned an empty study plan.');
        }

        res.json({ plan });
    } catch (error) {
        console.error('Groq AI request failed:', {
            status: error.status,
            message: String(error.message || error).replaceAll(apiKey, '[REDACTED]')
        });
        if (error.status === 401 || error.status === 403) {
            return res.status(502).json({ error: 'Groq API key එක අවලංගුයි හෝ අවසර නැත. Groq Console වෙතින් API key එකක් සාදා backend/.env හි GROQ_API_KEY ලෙස යොදන්න.' });
        }
        if (error.status === 429) {
            return res.status(503).json({ error: 'Groq API භාවිත සීමාවට පැමිණ ඇත. ටික වේලාවකින් නැවත උත්සාහ කරන්න.' });
        }
        res.status(502).json({ error: 'Groq වෙතින් Study Plan එක ලබාගත නොහැකි විය. Backend terminal එකේ error එක පරීක්ෂා කරන්න.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});