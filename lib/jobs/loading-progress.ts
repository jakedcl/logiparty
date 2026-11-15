/** Display progress per line: extra units on one line cannot satisfy another. */
export function loadingProgress(lines: readonly {
  quantityAssigned: number;
  quantityLoaded: number;
}[]) {
  const assigned = lines.filter((line) => line.quantityAssigned > 0);
  return {
    totalLines: assigned.length,
    loadedLines: assigned.filter((line) => line.quantityLoaded >= line.quantityAssigned).length,
    assignedUnits: assigned.reduce((total, line) => total + line.quantityAssigned, 0),
    loadedUnits: assigned.reduce((total, line) => total + line.quantityLoaded, 0),
  };
}
