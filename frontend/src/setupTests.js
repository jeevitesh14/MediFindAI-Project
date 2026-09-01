import '@testing-library/jest-dom';
import './i18n/i18n';
import { vi } from 'vitest';


window.HTMLElement.prototype.scrollIntoView = vi.fn();

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn((file) => `blob:http://localhost/${file?.name || 'test'}`);
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = vi.fn();
}

