export function removeDuplicates(array, keyExtractor) {
  const map = new Map();
  for (const item of array) {
    const key = keyExtractor(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}
