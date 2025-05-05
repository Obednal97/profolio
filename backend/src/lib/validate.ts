export function validateRequiredFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): string[] {
  return fields.filter((field) => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  }) as string[];
}