// @ts-expect-error - the idea is to have `any` and assert on export.
import JimpleOriginal from 'jimple';
import { Container as JimpleContainer } from './jimple.type.js';

const Jimple = JimpleOriginal as typeof JimpleContainer;

export { Jimple };
export type { JimpleContainer };
