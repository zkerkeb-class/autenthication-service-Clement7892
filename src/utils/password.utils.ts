import crypto from "crypto";
import { logger } from "./logger";

const HASH_ITERATIONS = 10000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";

export const generateSalt = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const hashPassword = (password: string, salt: string): string => {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");

  return `${HASH_ITERATIONS}:${HASH_DIGEST}:${HASH_KEY_LENGTH}:${salt}:${hash}`;
};

export const comparePassword = (
  password: string,
  storedHash: string
): boolean => {
  try {
    const [iterations, digest, keyLength, salt, hash] = storedHash.split(":");

    const iterCount = parseInt(iterations);
    const keyLen = parseInt(keyLength);

    const calculatedHash = crypto
      .pbkdf2Sync(password, salt, iterCount, keyLen, digest)
      .toString("hex");

    return calculatedHash === hash;
  } catch (error) {
    logger.error("Error comparing password", error);
    return false;
  }
};
