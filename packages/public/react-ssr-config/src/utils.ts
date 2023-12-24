/**
 * Simple check to see if the code is being executed on the server.
 *
 * @ignore
 */
export const isServer = (): boolean => typeof window === 'undefined';
