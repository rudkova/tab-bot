const replaceWithoutProps = (
  keysToOmit: Map<string, string>
): ((k: string, v: string) => string | undefined) => {
  return (k: string, v: string): string | undefined => (keysToOmit.has(k) ? undefined : v);
};

export { replaceWithoutProps };
