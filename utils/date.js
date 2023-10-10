export const yyyymmdd = (raw) => {
  const date = new Date(raw);

  const yyyy = date.getFullYear();
  const mm = date.getMonth().toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');

  return [yyyy, mm, dd].join('-');
};
