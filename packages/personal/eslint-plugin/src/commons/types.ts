import { Linter } from 'eslint';

export type LinterPlugin = NonNullable<Linter.Config['plugins']>[string];
