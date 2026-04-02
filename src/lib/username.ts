export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }
  if (username.length > 24) {
    return { valid: false, error: 'Username must be at most 24 characters' }
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and underscores allowed' }
  }
  return { valid: true }
}

export const sanitizeUsername = (input: string): string => {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, '')
}
