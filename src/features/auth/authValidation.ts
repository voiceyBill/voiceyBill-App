export type PasswordRuleKey = 'length' | 'uppercase' | 'number' | 'special';

export type PasswordRuleState = Record<PasswordRuleKey, boolean>;

export type AuthFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export const getPasswordRules = (password: string): PasswordRuleState => ({
  length: password.trim().length >= 8,
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

export const isPasswordValid = (password: string) =>
  Object.values(getPasswordRules(password)).every(Boolean);

export const getPasswordValidationMessage = (password: string) => {
  if (!password) return 'Password is required';
  if (!isPasswordValid(password)) {
    return 'Password must contain at least 8 characters, an uppercase letter, a number, and a special character';
  }
  return undefined;
};

const getServerMessage = (error: any) => {
  const message = error?.data?.message ?? error?.message ?? error?.error;
  if (Array.isArray(message)) return message.join('\n');
  return typeof message === 'string' ? message : undefined;
};

const getValidationErrors = (error: any) => {
  const errors = error?.data?.errors ?? error?.errors;
  if (Array.isArray(errors)) return errors;
  if (Array.isArray(error?.data?.message)) return error.data.message;
  return [];
};

export const mapAuthApiErrors = (
  error: any,
  fallbackMessage: string,
  defaultField: keyof AuthFieldErrors = 'email',
): AuthFieldErrors => {
  const mappedErrors: AuthFieldErrors = {};
  const validationErrors = getValidationErrors(error);

  validationErrors.forEach((validationError: any) => {
    const rawField = validationError?.field ?? validationError?.path ?? validationError?.param;
    const field = Array.isArray(rawField) ? rawField.join('.') : rawField;
    const message = validationError?.message ?? validationError?.msg;

    if (typeof message !== 'string') return;

    if (field === 'name') mappedErrors.name = message;
    if (field === 'email') mappedErrors.email = message;
    if (field === 'password' || field === 'newPassword' || /password/i.test(message)) {
      mappedErrors.password = message;
    }
  });

  const message = getServerMessage(error) || fallbackMessage;

  if (Object.keys(mappedErrors).length > 0) {
    if (mappedErrors.password && getServerMessage(error)) {
      mappedErrors.password = message;
    }
    return mappedErrors;
  }

  if (/email\/password|email password|password/i.test(message)) return { password: message };
  if (/email|account|user already|already exists/i.test(message)) return { email: message };
  if (/validation failed/i.test(message) && defaultField === 'password') {
    return { password: fallbackMessage };
  }

  return { [defaultField]: message };
};
