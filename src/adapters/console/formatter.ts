export const file = (s: string) => {
  return `file://${s}`;
};

export const center = (str: string) => {
  const max = process.stdout.columns;
  return str
    .padStart(str.length + Math.floor((max - str.length) / 2), ' ')
    .padEnd(max - Math.floor(str.length / 2), ' ');
};

export const spacer = (s: string) => ` ${s} `;
