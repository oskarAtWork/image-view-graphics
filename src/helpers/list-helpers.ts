export const isDefined = <T>(arg: T | null | undefined): arg is T => arg !== null && arg !== undefined;

export const forEach2d = <T>(grid: T[][], fn: (t: T, r: number, c: number) => void): void => {
  grid.forEach((row, r) => {
    row.forEach((t, c) => {
      fn(t, r, c);
    });
  });
};
