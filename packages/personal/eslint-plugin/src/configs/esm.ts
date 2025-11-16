import type { Linter } from 'eslint';
import { esmRulesConfig } from '../rules/index.js';

export const esmConfig: Linter.Config[] = [esmRulesConfig];
