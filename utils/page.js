export const pagination = (items, size = 2) => {
  return items.reduce((acc, cur, i) => {
    const index = Math.floor(i / size);
    if (!acc[index]) {
      acc[index] = [];
    }
    acc[index].push(cur);
    return acc;
  }, []);
};