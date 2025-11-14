import React from 'react';
import { render } from 'ink';
import { ASIATApp } from './app.js';
import type { RuntimeContext } from '../services/context.js';

export const runTui = async (context: RuntimeContext): Promise<void> => {
  const { waitUntilExit } = render(<ASIATApp context={context} />);
  await waitUntilExit();
};
