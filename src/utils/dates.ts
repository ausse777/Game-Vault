const pad = (value: number) => String(value).padStart(2, '0');

export const toDateInputValue = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const fromDateInputValue = (value: string, existingTimestamp?: number): number => {
  if (existingTimestamp && toDateInputValue(existingTimestamp) === value) return existingTimestamp;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).getTime();
};
