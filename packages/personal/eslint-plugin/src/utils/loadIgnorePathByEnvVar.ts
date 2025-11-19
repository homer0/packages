import { includeIgnoreFile } from '@eslint/compat';
import type { Config } from 'eslint/config';

const ENV_VAR_NAME = 'ESLINT_IGNORE_PATH';

export const loadIgnorePathByEnvVar = (): Config[] => {
  // eslint-disable-next-line n/no-process-env
  const envVarValue = process.env[ENV_VAR_NAME];
  if (!envVarValue) {
    return [];
  }

  return [includeIgnoreFile(envVarValue)];
};
