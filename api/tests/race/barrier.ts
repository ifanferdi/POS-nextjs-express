const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Align every task to the same wall-clock instant, then fire them together. */
export async function fireConcurrent<T>(n: number, makeRequest: (i: number) => Promise<T>) {
  const startAt = Date.now() + 200;
  const tasks: Promise<T>[] = [];

  for (let i = 0; i < n; i++) {
    tasks.push(
      (async () => {
        const wait = startAt - Date.now();
        if (wait > 0) await sleep(wait);
        return makeRequest(i);
      })(),
    );
  }

  return Promise.all(tasks);
}

/** Spread n requests randomly across a window (ramp). */
export async function fireRamped<T>(
  n: number,
  windowMs: number,
  makeRequest: (i: number) => Promise<T>,
) {
  const tasks: Promise<T>[] = [];

  for (let i = 0; i < n; i++) {
    tasks.push(
      (async () => {
        await sleep(Math.random() * windowMs);
        return makeRequest(i);
      })(),
    );
  }

  return Promise.all(tasks);
}
