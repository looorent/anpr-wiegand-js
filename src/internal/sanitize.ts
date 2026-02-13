export function sanitize(licensePlate: string | null | undefined): string | undefined {
  if (licensePlate && licensePlate?.length > 0) {
    return licensePlate
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  } else {
    return undefined;
  }
}
