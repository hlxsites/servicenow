import { jest } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
// make window available for /blocks/header/header.js
// global.window = document.defaultView;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

fetchMock.enableMocks();

// setup() mock
window.hlx = window.hlx || {};
window.hlx.RUM_MASK_URL = 'full';
window.hlx.codeBasePath = '..';
window.hlx.lighthouse = 'off';
