const BASE = '/api/tasks';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = 'Request failed';
    try {
      message = (await res.json()).error || message;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const listTasks = () => request(BASE);
export const createTask = (task) => request(BASE, { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, task) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(task) });
export const deleteTask = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
