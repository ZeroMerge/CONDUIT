export const avatarUrl = (seed: string): string =>
  `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=transparent`

export const generateAvatarOptions = (): string[] => {
  return Array.from({ length: 6 }, () => crypto.randomUUID())
}
