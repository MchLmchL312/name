const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const configSource = fs.readFileSync(path.join(root, "supabase-config.js"), "utf8");

const referencedIds = [...app.matchAll(/querySelector\("#([^\"]+)"\)/g)].map((match) => match[1]);
const missingIds = referencedIds.filter((id) => !html.includes(`id="${id}"`));
assert.deepStrictEqual(missingIds, [], `Missing DOM elements: ${missingIds.join(", ")}`);

assert.ok(html.indexOf("@supabase/supabase-js@2") < html.indexOf("supabase-config.js"));
assert.ok(html.indexOf("supabase-config.js") < html.indexOf("app.js"));
assert.ok(html.includes('id="emailInput" type="email"'));
assert.ok(!configSource.includes("service_role"));

const sandbox = { window: {} };
vm.runInNewContext(configSource, sandbox);
assert.strictEqual(sandbox.window.SUPABASE_CONFIG.url, "https://ckfwcpyiuuuxremfrmot.supabase.co");
assert.strictEqual(sandbox.window.SUPABASE_CONFIG.siteUrl, "https://www.machielvansoest.nl/Pinkfluffystories/");
assert.ok(sandbox.window.SUPABASE_CONFIG.publishableKey.startsWith("sb_publishable_"));

console.log("smoke-tests: ok");
