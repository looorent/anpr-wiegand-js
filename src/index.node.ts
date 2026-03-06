import { sha1 } from "./internal/sha1.node";
import { createSyncEncoder, decode as decode26, type Wiegand26Result } from "./internal/wiegand26";

const encode26 = createSyncEncoder(sha1);

export { encode26, decode26, type Wiegand26Result };
export { decode as decode64, encode as encode64 } from "./internal/wiegand64";
