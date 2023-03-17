#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { getStyledCss } from './styler';

const main = (...args: string[]) => {
  for (const arg of args) {
    const file = readFileSync(arg);
    const result = getStyledCss(file.toString());

    writeFileSync(arg, result);
    console.log(`${arg} edited`);
  }
};

export default main;

if (typeof require === 'function' && typeof module === 'object' && require.main === module) {
  const args = process.argv.slice(2);
  try {
    main(...args);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}
