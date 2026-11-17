const MAGIC = new TextEncoder().encode('RAYRES01');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 600_000;
const MAX_BYTES = 20 * 1024 * 1024;

export interface ResumePoint { label: string; body: string }
export interface ResumeEntry {
  title: string;
  period: string;
  subtitle: string;
  location: string;
  points: ResumePoint[];
}
export interface ResumeProfile {
  name: string;
  role: string;
  details: string[];
  sections: Array<{ title: string; entries: ResumeEntry[] }>;
}
export interface ResumePayload {
  profile: ResumeProfile;
  document: { name: string; data: string };
}

export class ResumeFormatError extends Error {
  constructor() { super('简历资料格式不正确，请联系分享者。'); }
}

export function normalizeAccessCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

export function isValidAccessCode(code: string): boolean {
  return /^[A-Z0-9]{6,64}$/.test(normalizeAccessCode(code));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 20_000;
}
function isList(value: unknown, maximum: number): value is unknown[] {
  return Array.isArray(value) && value.length <= maximum;
}

export function validateResume(value: unknown): asserts value is ResumePayload {
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.document)) throw new ResumeFormatError();
  const { profile, document } = value;
  if (!isText(profile.name) || !profile.name || !isText(profile.role) ||
      !isList(profile.details, 10) || !profile.details.every(isText) ||
      !isList(profile.sections, 12) || !profile.sections.length ||
      !isText(document.name) || !document.name.endsWith('.pdf') ||
      typeof document.data !== 'string' || document.data.length > MAX_BYTES ||
      !/^JVBERi0[A-Za-z0-9+/]*={0,2}$/.test(document.data)) throw new ResumeFormatError();
  for (const section of profile.sections) {
    if (!isRecord(section) || !isText(section.title) || !isList(section.entries, 30)) throw new ResumeFormatError();
    for (const entry of section.entries) {
      if (!isRecord(entry) || ![entry.title, entry.period, entry.subtitle, entry.location].every(isText) ||
          !isList(entry.points, 50)) throw new ResumeFormatError();
      for (const point of entry.points) {
        if (!isRecord(point) || !isText(point.label) || !isText(point.body)) throw new ResumeFormatError();
      }
    }
  }
}

async function deriveKey(code: string, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(normalizeAccessCode(code)), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt },
    material, { name: 'AES-GCM', length: 256 }, false, [usage],
  );
}

export async function encryptResume(value: ResumePayload, code: string): Promise<Uint8Array<ArrayBuffer>> {
  validateResume(value);
  const plain = new TextEncoder().encode(JSON.stringify(value));
  if (plain.byteLength > MAX_BYTES) throw new ResumeFormatError();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  try {
    const key = await deriveKey(code, salt, 'encrypt');
    const cipher = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: MAGIC }, key, plain,
    ));
    const output = new Uint8Array(MAGIC.length + salt.length + iv.length + cipher.length);
    output.set(MAGIC);
    output.set(salt, MAGIC.length);
    output.set(iv, MAGIC.length + salt.length);
    output.set(cipher, MAGIC.length + salt.length + iv.length);
    return output;
  } finally { plain.fill(0); }
}

export async function decryptResume(buffer: ArrayBuffer, code: string): Promise<ResumePayload> {
  const bytes = new Uint8Array(buffer);
  const offset = MAGIC.length + SALT_LENGTH + IV_LENGTH;
  if (bytes.length < offset + 16 || bytes.length > MAX_BYTES + offset + 16 ||
      !MAGIC.every((byte, index) => bytes[index] === byte)) throw new ResumeFormatError();
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_LENGTH);
  const iv = bytes.slice(MAGIC.length + SALT_LENGTH, offset);
  const key = await deriveKey(code, salt, 'decrypt');
  const plain = new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: MAGIC }, key, bytes.slice(offset),
  ));
  try {
    const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain));
    validateResume(payload);
    return payload;
  } finally { plain.fill(0); }
}
