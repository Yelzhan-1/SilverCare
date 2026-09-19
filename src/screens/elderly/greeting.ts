export function greetingForNow(name: string): string {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 22) return `Доброй ночи, ${name}`;
  if (hour < 12) return `Доброе утро, ${name}`;
  if (hour < 18) return `Добрый день, ${name}`;
  return `Добрый вечер, ${name}`;
}
