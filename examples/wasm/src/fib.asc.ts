/** Calculates the n-th Fibonacci number. */

// @ts-expect-error we should fix this but I don't know how
export function fib(n: i32): i32 {
  let a = 0,
    b = 1;
  if (n > 0) {
    while (--n) {
      const t = a + b;
      a = b;
      b = t;
    }
    return b;
  }
  return a;
}
