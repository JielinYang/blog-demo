export const checkImageType = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
  return validTypes.includes(file.type)
}

export const checkImageSize = (file: File, maxMB: number) => {
  return file.size <= maxMB * 1024 * 1024
}
