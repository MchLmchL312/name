const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const appRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(appRoot, "..");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "board-creator-check-"));
const boardsDir = path.join(output, "boards");
fs.mkdirSync(boardsDir);
fs.copyFileSync(path.join(projectRoot, "boards/board1.jpg"), path.join(boardsDir, "board1.jpg"));

async function until(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function solidImage(page, name, width, height, color) {
  const encoded = await page.evaluate(({ width, height, color }) => {
    const image = document.createElement("canvas");
    image.width = width;
    image.height = height;
    const ctx = image.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    return image.toDataURL("image/png").split(",")[1];
  }, { width, height, color });
  return { name, mimeType: "image/png", buffer: Buffer.from(encoded, "base64") };
}

async function colorBounds(page, color) {
  return page.evaluate(color => {
    const canvas = document.getElementById("boardCanvas");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        if (color.every((value, i) => pixels[offset + i] === value)) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  }, color);
}

async function dragOnBoard(page, from, to) {
  const rect = await page.locator("#boardCanvas").boundingBox();
  const screen = point => ({ x: rect.x + point.x * rect.width / 1200, y: rect.y + point.y * rect.height / 900 });
  const start = screen(from), end = screen(to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

async function main() {
  let browser, powershell, staticServer;
  let serverLog = "", creatorUrl;
  const errors = [];
  try {
    powershell = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
      path.join(appRoot, "server.ps1"), "-BoardsDir", boardsDir, "-PreferredPort", "18965", "-NoBrowser"],
      { windowsHide: true });
    powershell.stdout.on("data", data => {
      serverLog += data;
      creatorUrl = serverLog.match(/Board Creator draait op (http:\/\/127\.0\.0\.1:\d+\/)/)?.[1];
    });
    powershell.stderr.on("data", data => { serverLog += data; });
    await until(() => {
      if (powershell.exitCode !== null) throw new Error(serverLog);
      return Boolean(creatorUrl);
    }, "Server did not start: " + serverLog);

    const status = await (await fetch(creatorUrl + "api/status")).json();
    assert.equal(status.nextName, "board2.jpg");
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(boardsDir, "boards.json"))).boards, ["board1.jpg"]);

    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(creatorUrl);
    await page.waitForFunction(() => document.getElementById("nextName").textContent === "board2.jpg");
    for (const [label, rgb] of [["Grijs", [128,128,128]], ["Donkergrijs", [63,63,63]], ["Zwart", [0,0,0]], ["Wit", [255,255,255]]]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      assert.deepEqual(await page.evaluate(() => Array.from(document.getElementById("boardCanvas").getContext("2d").getImageData(10, 10, 1, 1).data).slice(0, 3)), rgb);
    }
    console.log("PASS backgrounds and startup status");

    const wide = await solidImage(page, "wide.png", 3000, 100, "#ff0000");
    const tall = await solidImage(page, "tall.png", 100, 3000, "#00ff00");
    for (const [image, color, expectedRatio] of [[wide, [255,0,0], 30], [tall, [0,255,0], 1/30]]) {
      await page.locator("#fileInput").setInputFiles(image);
      await page.waitForFunction(() => document.querySelectorAll(".layer").length === 1);
      await page.locator("#scaleSlider").evaluate(slider => {
        slider.value = slider.max;
        slider.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.locator("#boardCanvas").click({ position: { x: 2, y: 2 } });
      const bounds = await colorBounds(page, color);
      assert.ok(Math.abs(bounds.width / bounds.height - expectedRatio) / expectedRatio < 0.04, JSON.stringify(bounds));
      await page.locator(".layer").click();
      await page.getByRole("button", { name: "Verwijderen", exact: true }).click();
    }
    console.log("PASS wide/tall images retain their proportions at size limits");

    const red = await solidImage(page, "red.png", 400, 200, "#ff0000");
    const green = await solidImage(page, "green.png", 400, 200, "#00ff00");
    await page.locator("#fileInput").setInputFiles([red, green]);
    await page.waitForFunction(() => document.querySelectorAll(".layer").length === 2);
    assert.equal(await page.locator(".layer").first().textContent(), "green.png");
    await page.getByRole("button", { name: "Naar achteren", exact: true }).click();
    assert.equal(await page.locator(".layer").first().textContent(), "red.png");
    await page.getByRole("button", { name: "Naar voren", exact: true }).click();
    assert.equal(await page.locator(".layer").first().textContent(), "green.png");
    await page.getByRole("button", { name: "Verwijderen", exact: true }).click();
    const before = await colorBounds(page, [255,0,0]);
    await dragOnBoard(page, { x: before.left + 100, y: before.top + 50 }, { x: before.left + 180, y: before.top + 110 });
    const moved = await colorBounds(page, [255,0,0]);
    assert.ok(Math.abs(moved.left - before.left - 80) < 4);
    assert.ok(Math.abs(moved.top - before.top - 60) < 4);
    await dragOnBoard(page, { x: moved.left + moved.width, y: moved.top + moved.height }, { x: moved.left + moved.width + 100, y: moved.top + moved.height + 50 });
    const resized = await colorBounds(page, [255,0,0]);
    assert.ok(resized.width > moved.width + 80);
    assert.ok(Math.abs(resized.width / resized.height - 2) < 0.05);
    console.log("PASS multiple imports, layer ordering, delete, move and handle resize");

    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `creator-${viewport.width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1280, height: 800 });

    // A new file appears after status was read, before the save is submitted.
    const original = fs.readFileSync(path.join(boardsDir, "board1.jpg"));
    fs.writeFileSync(path.join(boardsDir, "board2.jpg"), original);
    let releaseSave;
    const holdSave = new Promise(resolve => { releaseSave = resolve; });
    let saveRequests = 0;
    await page.route("**/api/save", async route => {
      saveRequests++;
      await holdSave;
      await route.continue();
    });
    await page.locator("#saveButton").click();
    await until(() => saveRequests === 1, "Save request missing");
    await page.getByRole("button", { name: "Zwart", exact: true }).click();
    assert.equal(await page.locator("#saveButton").isDisabled(), true);
    releaseSave();
    await page.waitForFunction(() => !document.getElementById("saveButton").disabled);
    assert.equal(await page.locator("#statusText").textContent(), "Opgeslagen als board3.jpg");
    assert.equal(saveRequests, 1);
    assert.deepEqual(fs.readFileSync(path.join(boardsDir, "board2.jpg")), original);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(boardsDir, "boards.json"))).boards, ["board1.jpg", "board2.jpg", "board3.jpg"]);
    const savedImage = await browser.newPage();
    await savedImage.goto(creatorUrl);
    const dimensions = await savedImage.evaluate(async data => {
      const image = new Image();
      image.src = data;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, "data:image/jpeg;base64," + fs.readFileSync(path.join(boardsDir, "board3.jpg")).toString("base64"));
    assert.deepEqual(dimensions, [1200, 900]);
    await savedImage.close();
    console.log("PASS JPG save, no overwrite, duplicate-save guard and updated board list");

    for (const body of ["{invalid", JSON.stringify({ image: "data:image/jpeg;base64,broken" }), JSON.stringify({ image: "data:image/jpeg;base64," + red.buffer.toString("base64") })]) {
      assert.equal((await fetch(creatorUrl + "api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body })).status, 400);
    }
    assert.equal((await (await fetch(creatorUrl + "api/status")).json()).nextName, "board4.jpg");
    console.log("PASS invalid requests rejected without creating a board");

    const requests = [];
    staticServer = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      requests.push(pathname);
      const file = path.resolve(projectRoot, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(projectRoot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.setHeader("Content-Type", file.endsWith(".html") ? "text/html" : file.endsWith(".json") ? "application/json" : "image/jpeg");
      response.end(fs.readFileSync(file));
    });
    await new Promise(resolve => staticServer.listen(0, "127.0.0.1", resolve));
    const gallery = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    gallery.on("pageerror", error => errors.push(error.message));
    await gallery.goto(`http://127.0.0.1:${staticServer.address().port}/`);
    const boardList = JSON.parse(fs.readFileSync(path.join(projectRoot, "boards/boards.json"))).boards;
    await gallery.waitForFunction(count => document.querySelectorAll(".gallery img").length === count, boardList.length);
    for (let scroll = 0; scroll < await gallery.evaluate(() => document.body.scrollHeight); scroll += 650) {
      await gallery.evaluate(y => scrollTo(0, y), scroll);
      await gallery.waitForTimeout(100);
    }
    await gallery.waitForFunction(() => Array.from(document.querySelectorAll(".gallery img")).every(img => img.complete && img.naturalWidth > 0));
    assert.ok(requests.filter(url => /\/board\d+\.jpg$/.test(url)).every(url => boardList.includes(path.basename(url))));
    assert.equal(new Set(requests.filter(url => /\/board\d+\.jpg$/.test(url))).size, boardList.length);
    await gallery.evaluate(() => scrollTo(0, 0));
    await gallery.locator(".gallery img").first().click();
    assert.equal(await gallery.locator("#overlay").evaluate(el => el.classList.contains("show")), true);
    await gallery.keyboard.press("ArrowRight");
    await gallery.keyboard.press("Escape");
    assert.equal(await gallery.locator("#fullscreenImg").getAttribute("src"), null);
    await gallery.screenshot({ path: path.join(output, "gallery.png"), fullPage: false });
    await gallery.route("**/boards/boards.json*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ boards: ["board1.jpg", "board49.jpg"] }) }));
    await gallery.reload();
    await gallery.waitForFunction(() => document.querySelectorAll(".gallery img").length === 2);
    assert.deepEqual(await gallery.locator(".gallery img").evaluateAll(images => images.map(img => img.getAttribute("src")).sort()), ["boards/board1.jpg", "boards/board49.jpg"]);
    assert.deepEqual(errors, []);
    console.log(`PASS gallery: ${boardList.length} boards, no nonexistent-board requests, gaps and overlay`);
    console.log("Screenshots: " + output);
  } finally {
    if (browser) await browser.close();
    if (staticServer) await new Promise(resolve => staticServer.close(resolve));
    if (powershell && powershell.exitCode === null) {
      const closed = new Promise(resolve => powershell.once("close", resolve));
      powershell.kill();
      await closed;
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
