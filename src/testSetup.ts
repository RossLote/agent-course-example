// Runs before every unit test file (vite.config.ts test.setupFiles): after each test the
// rendered trees are unmounted and the page is back at `/`, so a query string one test set
// never leaks into the next.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});
