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

const mocks = colors.reduce((acc, color) => {
  acc[color] = jest.fn((str) => str);
  return acc;
}, {});

const clear = () =>
  colors.forEach((color) => {
    mocks[color].mockClear();
  });

module.exports = {
  mocks,
  clear,
  ...mocks,
};
