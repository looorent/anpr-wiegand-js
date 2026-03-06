import { sha1 } from "./internal/sha1.browser";
import { createEncoder, decode as decode26, type Wiegand26Result } from "./internal/wiegand26";

const encode26 = createEncoder(sha1);

export { encode26, decode26, type Wiegand26Result };
export { decode as decode64, encode as encode64 } from "./internal/wiegand64";
