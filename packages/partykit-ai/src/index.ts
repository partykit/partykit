// @ts-expect-error boop
import { Ai as CFAi } from "@cloudflare/ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AiOptions = ConstructorParameters<typeof CFAi>[1] & { binding?: any };

export class Ai extends CFAi {
  constructor(options: AiOptions) {
    if (!options) {
      throw new Error("You should pass room.context.ai as the first argument");
    }
    const { binding, ...rest } = options;
    super(binding || {}, {
      ...rest
    });
  }
}
