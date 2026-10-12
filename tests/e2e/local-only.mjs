export function localOnly(value, port) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== String(port))
    throw new Error(
      `E2E requires the isolated localhost port ${port}; remote targets are forbidden`,
    );
  return value;
}
