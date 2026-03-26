// Implements: REQ-2 — Sensitive data encrypted at rest
// See SRS Section 7.4.2 — Data at Rest
// Encrypts phone and email fields using AES-256-CBC before DB storage

const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || "a".repeat(64), "hex"); // 32 bytes
const IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString();
};

module.exports = { encrypt, decrypt };

// Usage in register route:
// const { encrypt } = require('../services/encryptionService');
// const encryptedEmail = encrypt(email);
// const encryptedPhone = encrypt(phone);
// store encryptedEmail and encryptedPhone in DB instead of plaintext
