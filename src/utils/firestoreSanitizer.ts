/**
 * Recursively removes any keys with `undefined` values from an object or array,
 * ensuring Firestore setDoc, updateDoc, and addDoc calls never throw errors
 * due to invalid data.
 */
export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  // Preserve Firestore FieldValues (serverTimestamp, increment, etc.) and Date objects
  if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
    return obj;
  }
  if (Array.isArray(obj)) {
    // Firestore does not support nested arrays (arrays of arrays).
    // Convert 2D arrays into index-keyed map objects: { "0": [...], "1": [...] }
    const is2DArray = obj.some(item => Array.isArray(item));
    if (is2DArray) {
      const sanitizedMap: Record<string, any> = {};
      obj.forEach((row, idx) => {
        sanitizedMap[idx.toString()] = sanitizeFirestoreData(row);
      });
      return sanitizedMap as any;
    }
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item)) as any;
  }
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== '' && value !== undefined) {
      sanitized[key] = sanitizeFirestoreData(value);
    }
  }
  return sanitized;
}
