export function isFile(input: any): input is File {
  return input != null && typeof input === 'object' && input.constructor.name === 'File';
}
