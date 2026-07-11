// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhaseIndicator } from './PhaseIndicator';

// Vitest isn't configured with `test.globals: true`, so testing-library's
// automatic afterEach-based cleanup never registers itself — do it explicitly.
afterEach(cleanup);

describe('PhaseIndicator', () => {
  it('renders all three phases as buttons', () => {
    render(<PhaseIndicator phase="Before" />);
    expect(screen.getByRole('button', { name: 'Before' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'During' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'After' })).toBeInTheDocument();
  });

  it('calls onChange with the clicked phase', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PhaseIndicator phase="Before" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'During' }));

    expect(onChange).toHaveBeenCalledWith('During');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onChange is omitted', async () => {
    const user = userEvent.setup();
    render(<PhaseIndicator phase="Before" />);
    await user.click(screen.getByRole('button', { name: 'After' }));
    // No onChange handler was provided — clicking must be a no-op, not a crash.
  });
});
