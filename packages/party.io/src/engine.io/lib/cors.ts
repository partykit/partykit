type OriginOption = boolean | string | RegExp | (string | RegExp)[];

export interface CorsOptions {
  origin?: OriginOption;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
}

export function addCorsHeaders(
  headers: Headers,
  opts: CorsOptions,
  req: Request
) {
  addOrigin(opts, headers, req);
  addCredentials(opts, headers);
  addExposedHeaders(opts, headers);

  if (req.method === "OPTIONS") {
    addMethods(opts, headers);
    addAllowedHeaders(opts, headers, req);
    addMaxAge(opts, headers);
  }
}

function join(arg: string | string[]) {
  return Array.isArray(arg) ? arg.join(",") : arg;
}

function isOriginAllowed(allowedOrigin: OriginOption, origin: string): boolean {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; i++) {
      if (isOriginAllowed(allowedOrigin[i], origin)) {
        return true;
      }
    }
    return false;
  } else if (typeof allowedOrigin === "string") {
    return allowedOrigin === origin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
}

function addOrigin(opts: CorsOptions, headers: Headers, req: Request) {
  const origin = req.headers.get("origin")!;
  const allowedOrigin = opts.origin;

  if (!allowedOrigin || allowedOrigin === "*") {
    headers.set("Access-Control-Allow-Origin", "*");
  } else if (typeof allowedOrigin === "string") {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.append("Vary", "Origin");
  } else {
    const isAllowed = isOriginAllowed(allowedOrigin, origin);
    headers.set("Access-Control-Allow-Origin", isAllowed ? origin : "false");
    headers.append("Vary", "Origin");
  }
}

function addMethods(opts: CorsOptions, headers: Headers) {
  if (opts.methods) {
    headers.set("Access-Control-Allow-Methods", join(opts.methods));
  }
}

function addAllowedHeaders(opts: CorsOptions, headers: Headers, req: Request) {
  if (opts.allowedHeaders) {
    headers.set("Access-Control-Allow-Headers", join(opts.allowedHeaders));
    return;
  }
  const requestedHeaders = req.headers.get("access-control-request-headers");
  if (requestedHeaders) {
    headers.append("Vary", "Access-Control-Request-Headers");
    headers.set("Access-Control-Allow-Headers", requestedHeaders);
  }
}

function addExposedHeaders(opts: CorsOptions, headers: Headers) {
  if (opts.exposedHeaders) {
    headers.set("Access-Control-Expose-Headers", join(opts.exposedHeaders));
  }
}

function addCredentials(opts: CorsOptions, headers: Headers) {
  if (opts.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
}

function addMaxAge(opts: CorsOptions, headers: Headers) {
  if (opts.maxAge) {
    headers.set("Access-Control-Max-Age", opts.maxAge.toString());
  }
}
