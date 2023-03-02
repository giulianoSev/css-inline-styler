import { readFileSync, writeFileSync } from 'fs';
import { getResult } from './styler';

const file = readFileSync(process.argv[2]);
const result = getResult(file.toString());

writeFileSync(process.argv[2], result);
console.log('Done');
