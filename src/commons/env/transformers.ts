export function stringToNumber(radix = 10) {
  return value => (value !== undefined ? parseInt(value, radix) : undefined);
}

export function stringToBoolean() {
  return value => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === null || value === undefined || value === '') {
      return value;
    }
    return value === 'true' || value === '1';
  };
}

export function commaSeparatedStringToArray() {
  return value => {
    if (value && typeof value === 'string') {
      return value.split(',');
    }
    return undefined;
  };
}

export function stringToJson(onError: (err: any) => void) {
  return value => {
    if (typeof value !== 'string' || value === '') {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      onError(e);
    }
  };
}
