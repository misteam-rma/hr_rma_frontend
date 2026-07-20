// Case/whitespace-insensitive lookup of a value from a parsed CSV/Excel row,
// trying each candidate header name in order until one matches.
export const findValue = (row, keys) => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find((k) => k.trim().toLowerCase() === key.toLowerCase());
    if (match !== undefined && row[match] !== undefined && row[match] !== '') {
      return row[match];
    }
  }
  return undefined;
};
