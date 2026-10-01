import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Calendar, Plus, Trash2, Sparkles, CheckCircle } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [aiPlan, setAiPlan] = useState('');
  const [aiPlanError, setAiPlanError] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Database එකෙන් Tasks ටික ගෙන්නා ගැනීම
  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTaskError('Task ලැයිස්තුව ලබාගැනීමට නොහැකි විය. Backend server එක ක්‍රියාත්මකදැයි බලන්න.');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // අලුත් Task එකක් ඇතුළත් කිරීම
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !dueDate) {
      setTaskError('Task නම, විෂය සහ අවසන් දිනය ඇතුළත් කරන්න.');
      return;
    }

    setAddingTask(true);
    setTaskError('');
    try {
      await axios.post('/api/tasks', {
        title: title.trim(),
        subject: subject.trim(),
        due_date: dueDate
      });
      setTitle('');
      setSubject('');
      setDueDate('');
      await fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
      const message = err.response?.data?.message || err.response?.data?.error;
      setTaskError(
        typeof message === 'string'
          ? `Task එක එකතු කළ නොහැකි විය: ${message}`
          : 'Task එක එකතු කළ නොහැකි විය. Backend සහ database connection එක පරීක්ෂා කරන්න.'
      );
    } finally {
      setAddingTask(false);
    }
  };

  // Task එකක් Delete කිරීම
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Groq AI එකෙන් Study Plan එකක් හදා ගැනීම
  const handleGenerateAiPlan = async () => {
    if (tasks.length === 0) {
      alert('කරුණාකර මුලින්ම Tasks කිහිපයක් එකතු කරන්න!');
      return;
    }

    setLoadingAi(true);
    setAiPlanError('');
    try {
      const res = await axios.post('/api/generate-plan', { tasks });
      setAiPlan(res.data.plan);
    } catch (err) {
      console.error('AI Error:', err);
      setAiPlanError(
        err.response?.data?.error ||
        'AI Plan එක සාදා ගැනීමට නොහැකි විය. Backend server එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <BookOpen /> AI Personal Study Planner
      </h1>

      {/* Task Add Form */}
      <form onSubmit={handleAddTask} style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>අලුත් Task / Assignment එකක් ඇතුළත් කරන්න</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Task එකේ නම (උදා: Assignment 1)"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="text"
            placeholder="විෂය (උදා: OOP)"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" disabled={addingTask} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: addingTask ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={18} /> {addingTask ? 'Task එක එකතු වෙමින් පවතියි...' : 'Task එක එකතු කරන්න'}
        </button>
        {taskError && <p role="alert" style={{ color: '#b91c1c', marginBottom: 0 }}>{taskError}</p>}
      </form>

      {/* Task List */}
      <div>
        <h3>මගේ පාඩම් වැඩ ලැයිස්තුව ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p>තවම කිසිදු Task එකක් ඇතුළත් කර නැත.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{task.title}</strong> - <span style={{ color: '#4b5563' }}>{task.subject}</span>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Calendar size={14} /> අවසන් දිනය: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Generator Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={handleGenerateAiPlan}
          disabled={loadingAi}
          style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={20} /> {loadingAi ? 'AI Study Plan එක සෑදෙමින් පවතියි...' : 'Groq AI Study Plan එක ලබාගන්න'}
        </button>
        {aiPlanError && <p role="alert" style={{ color: '#b91c1c' }}>{aiPlanError}</p>}
      </div>

      {/* AI Plan Output */}
      {aiPlan && (
        <div style={{ marginTop: '20px', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#6d28d9', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle /> Groq AI මගින් සකස් කළ Study Plan එක:
          </h3>
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{aiPlan}</div>
        </div>
      )}
    </div>
  );
}

export default App;