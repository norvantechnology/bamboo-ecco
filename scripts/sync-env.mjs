#!/usr/bin/env node
/**
 * Merges keys from .env.example into env files without overwriting existing values.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplePath = join(root, ".env.example");

if (!existsSync(examplePath)) {
  console.error("Missing .env.example");
  process.exit(1);
}

const exampleVars = parseEnv(readFileSync(examplePath, "utf8"));
const rootEnvPath = join(root, ".env");
const rootVars = existsSync(rootEnvPath) ? parseEnv(readFileSync(rootEnvPath, "utf8")) : {};

const targets = [
  join(root, ".env"),
  join(root, "apps/api/.env"),
  join(root, "apps/admin/.env"),
];

// Storefront uses subset in .env.local
const storefrontKeys = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_GRAPHQL_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_GSC_VERIFICATION",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
];

const adminKeys = ["VITE_API_URL", "VITE_STOREFRONT_URL"];

for (const target of targets) {
  mergeEnv(target, exampleVars, target !== rootEnvPath);
}

const storefrontLocal = join(root, "apps/storefront/.env.local");
const storefrontVars = Object.fromEntries(
  Object.entries(exampleVars).filter(([k]) => storefrontKeys.includes(k)),
);
mergeEnv(storefrontLocal, storefrontVars, true);

const adminLocal = join(root, "apps/admin/.env");
const adminVars = Object.fromEntries(
  Object.entries(exampleVars).filter(([k]) => adminKeys.includes(k)),
);
mergeEnv(adminLocal, adminVars, true);

console.log("✅ Env files synced from .env.example (existing values preserved)");

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

function mergeEnv(filePath, newVars, fillEmptyFromRoot = false) {
  const existing = existsSync(filePath) ? parseEnv(readFileSync(filePath, "utf8")) : {};
  const merged = { ...newVars, ...existing };

  if (fillEmptyFromRoot) {
    for (const [key, value] of Object.entries(rootVars)) {
      if (value && (!merged[key] || merged[key] === "")) {
        merged[key] = value;
      }
    }
  }

  const lines = [];
  const written = new Set();

  const sourceContent = existsSync(filePath)
    ? readFileSync(filePath, "utf8")
    : readFileSync(examplePath, "utf8");

  for (const line of sourceContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }
    if (trimmed.startsWith("#")) {
      lines.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      lines.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq);
    if (key in merged) {
      lines.push(`${key}=${merged[key]}`);
      written.add(key);
    } else {
      lines.push(line);
    }
  }

  for (const [key, value] of Object.entries(merged)) {
    if (!written.has(key)) {
      lines.push(`${key}=${value}`);
    }
  }

  writeFileSync(filePath, lines.join("\n").replace(/\n+$/, "\n"));
}
