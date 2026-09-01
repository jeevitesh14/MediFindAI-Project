import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LanguageSelector from './LanguageSelector';
import '../../i18n/i18n';

describe('LanguageSelector Component', () => {
  it('renders language selector button', () => {
    render(<LanguageSelector />);
    const button = screen.getByTitle(/Select Language/i);
    expect(button).toBeInTheDocument();
  });

  it('toggles dropdown on click', () => {
    render(<LanguageSelector />);
    const button = screen.getByTitle(/Select Language/i);
    fireEvent.click(button);

    expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('తెలుగు')).toBeInTheDocument();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
  });
});
