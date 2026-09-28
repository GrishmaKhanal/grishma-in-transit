import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageType } from "../src/lib/image-type";

const bytes = (hex: string, ascii = "") => new Uint8Array([...Buffer.from(hex, "hex"), ...Buffer.from(ascii)]);

test("recognises the allowed image formats by their magic bytes", () => {
  assert.equal(sniffImageType(bytes("89504e470d0a1a0a")), "image/png");
  assert.equal(sniffImageType(bytes("ffd8ffe0")), "image/jpeg");
  assert.equal(sniffImageType(bytes("", "GIF89a")), "image/gif");
  assert.equal(sniffImageType(bytes("", "RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImageType(bytes("00000020", "ftypavif")), "image/avif");
});

test("rejects SVG, HTML and anything renamed to look like an image", () => {
  assert.equal(sniffImageType(bytes("", '<svg xmlns="http://www.w3.org/2000/svg"><script>')), null);
  assert.equal(sniffImageType(bytes("", "<!doctype html><script>alert(1)</script>")), null);
  assert.equal(sniffImageType(bytes("", "%PDF-1.7")), null);
  assert.equal(sniffImageType(new Uint8Array()), null);
});
