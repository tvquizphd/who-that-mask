import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hello world', () => {
  render(<App />);
  const helloElement = screen.getByText(/Hello Missingno/i);
  expect(helloElement).toBeInTheDocument();
});
