import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza logo principal', () => {
  render(<App />);
  expect(screen.getByAltText('Hunnab.Q logo')).toBeInTheDocument();
});
