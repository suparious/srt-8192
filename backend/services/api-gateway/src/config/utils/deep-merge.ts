export function deepMerge(target: any, source: any): any {
  if (!source) {
    return target;
  }

  if (typeof target !== 'object' || typeof source !== 'object') {
    return source;
  }

  for (const key in source) {
    if (source[key] === undefined) {
      continue;
    }

    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }

  return target;
}