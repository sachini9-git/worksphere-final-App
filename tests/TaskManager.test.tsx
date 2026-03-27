import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskManager } from '../components/TaskManager';
import { Task } from '../types';

describe('TaskManager drag and drop', () => {
  const sampleTasks: Task[] = [
    {
      id: 't1', user_id: '1', title: 'Test Task', status: 'todo', priority: 'high', category: 'Study', subtasks: [], created_at: new Date().toISOString()
    }
  ];

  it('calls updateTask with new priority when dropped into another column', async () => {
    const addTask = vi.fn();
    const updateTask = vi.fn();
    const deleteTask = vi.fn();

    render(<TaskManager tasks={sampleTasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />);

    // Find draggable task element by title
    const taskEl = screen.getByText('Test Task');
    const draggable = taskEl.closest('[draggable]') as HTMLElement;
    expect(draggable).toBeTruthy();

    // Create a mock DataTransfer
    const data = new DataTransfer();

    // Drag start
    fireEvent.dragStart(draggable, { dataTransfer: data });

    // Find medium priority column drop zone by locating the column container
      const allMatches = screen.getAllByText(/Medium Priority/i);
      const mediumHeader = allMatches.find(el => el.tagName.toLowerCase() === 'h3');
      expect(mediumHeader).toBeTruthy();
      const mediumColumn = mediumHeader!.parentElement?.nextElementSibling as HTMLElement;
      expect(mediumColumn).toBeTruthy();

    // Drag over and drop
    fireEvent.dragOver(mediumColumn, { dataTransfer: data });
    fireEvent.drop(mediumColumn, { dataTransfer: data });

    // Expect updateTask to have been called (priority change)
    expect(updateTask).toHaveBeenCalled();
  });
});
