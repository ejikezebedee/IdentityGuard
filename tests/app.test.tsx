import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('frontend auth gate', () => {
  it('renders the locked vault gate before any session is unlocked', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'IdentityGuard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Vault passphrase')).toBeInTheDocument();
    expect(screen.getByText(/Use at least 12 characters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlock local vault/i })).toBeInTheDocument();
  });
});
