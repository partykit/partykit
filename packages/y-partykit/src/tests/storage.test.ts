import { describe, expect, it } from "vitest";

import { getLevelBulkData, levelGet, levelPut } from "../storage";

// import { RoomStorage } from "partykit/src/cli";

describe.skip("storage layer", () => {
  it("should be able to set and get", async () => {
    // @ts-expect-error - RoomStorage is not exported
    const storage = new RoomStorage();
    await levelPut(storage, ["v1_sv", "bar"], new Uint8Array([1, 2, 3]));
    const foo = await levelGet(storage, ["v1_sv", "bar"]);
    expect(foo).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("should be able to set and get big values", async () => {
    // @ts-expect-error - RoomStorage is not exported
    const storage = new RoomStorage();
    const value = new Uint8Array(100000);
    await levelPut(storage, ["v1_sv", "bar"], value);
    const foo = await levelGet(storage, ["v1_sv", "bar"]);
    expect(foo).toEqual(value);
  });

  it("should be able to set and get bulk", async () => {
    // @ts-expect-error - RoomStorage is not exported
    const storage = new RoomStorage();
    await levelPut(storage, ["v1_sv", "bar"], new Uint8Array([1, 2, 3]));
    await levelPut(storage, ["v1_sv", "baz"], new Uint8Array([4, 5, 6]));
    const foo = await getLevelBulkData(storage, {
      gte: ["v1_sv", ""],
      lt: ["v1_sv", "zzz"],
      keys: true,
      values: true
    });
    expect(foo).toEqual([
      {
        key: ["v1_sv", "bar"],
        value: new Uint8Array([1, 2, 3])
      },
      {
        key: ["v1_sv", "baz"],
        value: new Uint8Array([4, 5, 6])
      }
    ]);
  });

  it("should be able to set and get big bulk", async () => {
    // @ts-expect-error - RoomStorage is not exported
    const storage = new RoomStorage();
    const value = new Uint8Array(100000);
    await levelPut(storage, ["v1_sv", "bar"], value);
    await levelPut(storage, ["v1_sv", "baz"], value);
    const foo = await getLevelBulkData(storage, {
      gte: ["v1_sv", ""],
      lt: ["v1_sv", "zzz"],
      keys: true,
      values: true
    });
    expect(foo).toEqual([
      {
        key: ["v1_sv", "bar"],
        value
      },
      {
        key: ["v1_sv", "baz"],
        value
      }
    ]);
  });
});
