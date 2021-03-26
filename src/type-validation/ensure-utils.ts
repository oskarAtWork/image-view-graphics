const isString = (x: unknown): x is string => typeof x === 'string' || x instanceof String;

export const ensureString = (x: unknown): string => {
  if (isString(x)) {
    return x;
  }

  throw Error(`Expected a string, got ${JSON.stringify(x)}`);
};

export const ensureNumber = (x: unknown, acceptStringNumber = true, defaultValue?: number): number => {
  if (typeof x === 'number') {
    return x as number;
  }

  if (acceptStringNumber && isString(x)) {
    const stringAsNumber = parseFloat(x);
    if (!isNaN(stringAsNumber) && typeof stringAsNumber === 'number') {
      return stringAsNumber;
    }
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw Error(`A variable presumed to be a number was in fact ${x}`);
};

export const ensureList = <T>(
  maybeList: unknown,
  ensuranceFunction: (x: unknown) => T,
  filterOutIncorrectValues = false,
  emptyListOnUndefinedAndNull = false,
): T[] => {
  if (maybeList === undefined || maybeList === null) {
    if (emptyListOnUndefinedAndNull) {
      return [];
    } else {
      throw Error(`Expected list, got ${maybeList}`);
    }
  }

  if (!Array.isArray(maybeList)) {
    throw Error(`Expected list, got ${maybeList}`);
  }

  const assumedList = maybeList as T[];

  const isNotNullGuard = <U>(x: U | null): x is U => x !== null;

  return assumedList
    .map((x) => {
      if (filterOutIncorrectValues) {
        try {
          return ensuranceFunction(x);
        } catch (e) {
          return null;
        }
      } else {
        return ensuranceFunction(x);
      }
    })
    .filter(isNotNullGuard);
};
