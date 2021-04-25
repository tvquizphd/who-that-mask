import { render, screen } from '@testing-library/react';
import App from './App';

test('renders an m on many lines', () => {
  render(<App />);
  const mElements = screen.getAllByText(/m/i);
  expect(mElements[0]).toBeInTheDocument();
});
