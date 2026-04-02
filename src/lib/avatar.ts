export const avatarUrl = (seed: string): string =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`

export const generateAvatarOptions = (): string[] => {
  return Array.from({ length: 6 }, () => crypto.randomUUID())
}
