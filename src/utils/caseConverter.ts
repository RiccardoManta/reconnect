const toCamel = (s: string): string => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
};

const toSnake = (s: string): string => {
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const isObject = function (obj: any): obj is Record<string, any> {
  return obj === Object(obj) && !Array.isArray(obj) && typeof obj !== 'function';
};

export const keysToCamel = function <T>(obj: any): T {
  if (isObject(obj)) {
    const n: Record<string, any> = {};

    Object.keys(obj).forEach((k) => {
      n[toCamel(k)] = keysToCamel(obj[k]);
    });

    return n as T;
  } else if (Array.isArray(obj)) {
    return obj.map((i) => {
      return keysToCamel(i);
    }) as T;
  }

  return obj as T;
};


export const keysToSnake = function <T>(obj: any): T {
    if (isObject(obj)) {
        const n: Record<string, any> = {};

        Object.keys(obj)
            .forEach((k) => {
                n[toSnake(k)] = keysToSnake(obj[k]);
            });
        return n as T;
    } else if (Array.isArray(obj)) {
        return obj.map((i) => {
            return keysToSnake(i);
        }) as T;
    }

    return obj as T;
}; 