/* eslint-disable @typescript-eslint/no-explicit-any */
export default function asyncCache(): (
  name: string,
  fn: () => Promise<any>
) => any {
  const promises: { [key: string]: Promise<any> } = {};
  const states: {
    [key: string]: {
      status: "pending" | "success" | "error";
      value: any;
    };
  } = {};
  return function read(name: string, fn: () => Promise<any>) {
    if (!promises[name]) {
      promises[name] = fn();
      states[name] = {
        status: "pending",
        value: undefined
      };
      promises[name]
        .then((value) => {
          states[name] = {
            status: "success",
            value
          };
        })
        .catch((error) => {
          states[name] = {
            status: "error",
            value: error
          };
        });
    }
    if (states[name].status === "pending") {
      throw promises[name];
    }
    if (states[name].status === "error") {
      throw states[name].value;
    }
    if (states[name].status === "success") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return states[name].value;
    }
  };
}
