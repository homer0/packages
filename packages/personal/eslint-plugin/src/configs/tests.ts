import type { Linter } from 'eslint';
import { testsRulesConfig } from '../rules/index.js';

export const testsConfig: Linter.Config[] = [testsRulesConfig];
