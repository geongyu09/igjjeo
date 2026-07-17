import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { Injectable } from "@nestjs/common";

const scrypt = promisify(scryptCallback);

const KEY_LEN = 64;
const SALT_LEN = 16;
const PREFIX = "scrypt";

/**
 * 비밀번호 해싱(scrypt, Node 내장). 외부 의존성 없이 솔트+KDF 로 저장한다.
 * 저장 포맷: `scrypt$<saltHex>$<keyHex>`.
 */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LEN);
    const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer;

    return `${PREFIX}$${salt.toString("hex")}$${derived.toString("hex")}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [prefix, saltHex, keyHex] = stored.split("$");
    if (prefix !== PREFIX || !saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const derived = (await scrypt(password, salt, expected.length)) as Buffer;

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  }
}
