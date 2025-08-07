export type ExpirationDateValidationResult =
  | { isValid: true; date: Date }
  | { isValid: false; error: string };
