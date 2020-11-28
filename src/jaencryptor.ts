import crypto from "crypto";

const scmp = (a: Buffer, b: Buffer): boolean => {
  const len = a.length;
  let result = 0;
  for (let i = 0; i < len; ++i) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};

const MIN_KEY_LENGTH = 16;
const IV_LENGTH = 16;

interface IOptions {
  key: string;
  iv?: string;
  verifyHmac?: boolean;
  debug?: boolean;
}

export default class JaEncryptor {
  private key: string;
  private iv: string;
  private verifyHmac?: boolean;
  private debug?: boolean;

  private cryptoKey: Buffer;

  constructor(options: IOptions) {
    if (options.key.length < MIN_KEY_LENGTH) {
      throw new Error(
        "key must be at least " + MIN_KEY_LENGTH + " characters long"
      );
    }
    this.key = options.key;
    this.iv = options.iv || "1234567890ABCDEF";
    if (this.iv.length != IV_LENGTH) {
      throw new Error(
        "Iv must be " + IV_LENGTH + " characters long"
      );
    }
    this.verifyHmac = options.verifyHmac || true;
    this.debug = options.debug;
    this.cryptoKey = crypto.createHash("sha256").update(this.key).digest();
  }

  hmac(text: string, format?: crypto.HexBase64Latin1Encoding): string {
    format = format || "hex";
    return crypto
      .createHmac("sha256", this.cryptoKey)
      .update(text)
      .digest(format);
  }

  encrypt(value: string): string {
    const iv = Buffer.from(this.iv); // crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.cryptoKey, iv);
    const encryptedValue =
      cipher.update(value, "utf8", "base64") + cipher.final("base64");
    let result = iv.toString("hex") + encryptedValue;
    if (this.verifyHmac) {
      result = this.hmac(result, "hex") + result;
    }
    return result;
  }

  decrypt(cipherText: string): string {
    if (!cipherText) {
      return null;
    }
    try {
      if (this.verifyHmac) {
        const expectedHmac = cipherText.substring(0, 64);
        cipherText = cipherText.substring(64);
        const actualHmac = this.hmac(cipherText);
        if (
          !scmp(
            Buffer.from(actualHmac, "hex"),
            Buffer.from(expectedHmac, "hex")
          )
        ) {
          throw new Error("HMAC does not match");
        }
      }
      const iv = Buffer.from(cipherText.substring(0, 32), "hex");
      const encryptedJson = cipherText.substring(32);
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        this.cryptoKey,
        iv
      );
      const value =
        decipher.update(encryptedJson, "base64", "utf8") +
        decipher.final("utf8");
      return value;
    } catch (e) {
      if (this.debug) {
        console.error("Exception in decrypt (ignored): %s", e);
      }
      return null;
    }
  }
}
