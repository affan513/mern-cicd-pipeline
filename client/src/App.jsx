import { useEffect, useState } from 'react';
import { listTasks, createTask, updateTask, deleteTask } from './api';

const NEXT_STATUS = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    listTasks().then(setTasks).catch((err) => setError(err.message));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      const task = await createTask({ title });
      setTasks([task, ...tasks]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdvance(task) {
    try {
      const updated = await updateTask(task._id, { status: NEXT_STATUS[task.status] });
      setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Task Manager</h1>
      <form onSubmit={handleAdd}>
        <input
          aria-label="Task title"
          placeholder="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t._id}>
            <span>{t.title}</span>
            <button onClick={() => handleAdvance(t)} title="Change status">{t.status}</button>
            <button onClick={() => handleDelete(t._id)} aria-label={`Delete ${t.title}`}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
