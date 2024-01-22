const SHOW_DEBUG = false;

export function getLogger(name: string) {
  return {
    debug: (...args: unknown[]) => {
      if (SHOW_DEBUG) {
        console.log(name, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (SHOW_DEBUG) {
        console.log(name, ...args);
      }
    }
  };
}
