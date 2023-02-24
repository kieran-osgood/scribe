export function fileNameFormatter (s: string, replacement: string) {
  return s.replace(/\$NAME\$/i, replacement)
}