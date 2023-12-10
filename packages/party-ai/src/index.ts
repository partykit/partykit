import { Ai as CFAi } from "@cloudflare/ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AiOptions = ConstructorParameters<typeof CFAi>[1] & { binding?: any };

export class Ai extends CFAi {
  constructor(options: AiOptions = {}) {
    super(options.binding, {
      apiGateway: true,
      apiToken: "DEVTOKEN",
      ...options,
    });
  }
}
