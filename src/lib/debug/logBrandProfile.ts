/**
 * @fileOverview A developer-only utility to log the contents of a brandProfile object.
 */

/**
 * Safely stringifies an object for logging, handling circular references.
 */
function safeStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.add(value);
      }
      return value;
    },
    2
  );
}

/**
 * Logs the shape and content of a brandProfile object for debugging purposes.
 * This function will only produce output in a development environment.
 *
 * @param brandProfile The brandProfile object fetched from Firestore.
 * @param contextLabel A label to identify where the log is coming from (e.g., 'MyBrandPage').
 */
export function logBrandProfile(brandProfile: any, contextLabel: string): void {
  if (process.env.NODE_ENV !== 'production') {
    if (!brandProfile) {
      console.log(`--- DEV LOG: Brand Profile (${contextLabel}) ---`);
      console.log('STATUS: brandProfile object is null or undefined.');
      console.log('---------------------------------------------');
      return;
    }

    const keys = Object.keys(brandProfile);
    const summary = keys.slice(0, 7).reduce((acc, key) => {
      const value = brandProfile[key];
      if (value !== null && value !== undefined) {
        let displayValue: any = value;
        if (typeof value === 'string' && value.length > 30) {
          displayValue = `"${value.substring(0, 30)}..."`;
        } else if (Array.isArray(value)) {
          displayValue = `[${value.join(', ')}]`;
        }
        acc[`  - ${key}`] = displayValue;
      }
      return acc;
    }, {} as Record<string, any>);

    console.log(`--- DEV LOG: Brand Profile (${contextLabel}) ---`);
    console.log('KEYS:', keys);
    console.log('SUMMARY:');
    console.table(summary);
    console.log('FULL PAYLOAD:');
    console.log(JSON.parse(safeStringify(brandProfile))); // Parse/re-stringify for nice console object view
    console.log('---------------------------------------------');
  }
}
