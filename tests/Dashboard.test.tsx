import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';
import { Task, FocusSession } from '../types';

describe('Dashboard weekly focus', () => {
  it('renders weekly focus hours based on sessions', () => {
    const tasks: Task[] = [];
    const sessions: FocusSession[] = [
      { id: 's1', user_id: '1', duration_minutes: 30, label: 'Study', completed_at: new Date().toISOString() }
    ];

    const onNavigate = () => {};

    render(<Dashboard tasks={tasks} sessions={sessions} onNavigate={onNavigate} />);

    // Focus Time (week) should display 0.5h for 30 minutes
    const focusText = screen.getByText(/Focus Time \(week\)/i);
    expect(focusText).toBeInTheDocument();

    const hoursEl = screen.getByText(/0\.5/);
    expect(hoursEl).toBeInTheDocument();
  });
});
