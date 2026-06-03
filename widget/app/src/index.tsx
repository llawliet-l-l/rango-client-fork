import { layer as consoleLayer } from '@arthur2079/logging-console';
import { init, Level } from '@arthur2079/logging-subscriber';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';

if (process.env.NODE_ENV === 'development') {
  init([consoleLayer()], {
    baseLevel: Level.Info,
  });
}

const container = document.getElementById('app')!;
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
