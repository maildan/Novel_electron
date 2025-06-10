// Simple utility to merge class names
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ')
}
