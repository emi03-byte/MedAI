/**
 * DB layer: SQLite (local) or Azure SQL (production).
 * Set AZURE_SQL_CONNECTION_STRING to use Azure SQL (e.g. on App Service).
 */
const useAzure = !!(process.env.AZURE_SQL_CONNECTION_STRING && process.env.AZURE_SQL_CONNECTION_STRING.trim());

let adapter = null;

export function isAzure() {
  return useAzure;
}

export async function init() {
  adapter = useAzure ? (await import('./azure.js')) : (await import('./sqlite.js'));
  await adapter.init();
}

export function close() {
  if (adapter && adapter.close) adapter.close();
}

export function runAsync(sql, params) {
  return adapter.runAsync(sql, params);
}

export function getAsync(sql, params) {
  return adapter.getAsync(sql, params);
}

export function allAsync(sql, params) {
  return adapter.allAsync(sql, params);
}
