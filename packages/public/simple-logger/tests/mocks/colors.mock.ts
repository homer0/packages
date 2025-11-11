import { vi, type Mock } from 'vitest';

const colors = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'grey',
];

const mocks = colors.reduce(
  (acc, color) => {
    acc[color] = vi.fn((str) => str);
    return acc;
  },
  {} as Record<string, Mock>,
);

const clear = () =>
  colors.forEach((color) => {
    mocks[color]?.mockClear();
  });

export default { ...mocks, clear };

// module.exports = {
//   mocks,
//   clear,
//   // ...mocks,
// };
