export function preferencesTag(userId: string): string {
  return `user:${userId}:preferences`;
}

export function studentsTag(userId: string): string {
  return `user:${userId}:students`;
}
