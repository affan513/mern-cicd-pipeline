import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import App from './App';
import * as api from './api';

vi.mock('./api');

beforeEach(() => {
  vi.resetAllMocks();
});

test('TC10 renders tasks returned by the API', async () => {
  api.listTasks.mockResolvedValue([{ _id: '1', title: 'Write report', status: 'todo' }]);
  render(<App />);
  expect(await screen.findByText('Write report')).toBeInTheDocument();
});

test('TC11 submitting the form creates a task', async () => {
  api.listTasks.mockResolvedValue([]);
  api.createTask.mockResolvedValue({ _id: '2', title: 'New one', status: 'todo' });
  render(<App />);
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'New one' } });
  fireEvent.click(screen.getByText('Add'));
  expect(await screen.findByText('New one')).toBeInTheDocument();
  expect(api.createTask).toHaveBeenCalledWith({ title: 'New one' });
});

test('TC12 shows an error when the API fails', async () => {
  api.listTasks.mockRejectedValue(new Error('Boom'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
});
