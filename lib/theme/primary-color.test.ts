import assert from "node:assert/strict";
import { it } from "node:test";
import { tenantThemeStyle } from "./primary-color";

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((part) => {
    const value = Number.parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a,b)=>b-a);
  return (values[0]+0.05)/(values[1]+0.05);
}
it("keeps tenant fills, labels, links and control edges readable across brand colors", () => {
  for (const brand of ["#fff29b", "#ffffff", "#000000", "#0b5cab", "#ff6a00", "#777777", "#23a880"]) {
    const theme = tenantThemeStyle(brand);
    assert.equal(theme["--primary"], brand);
    assert.ok(contrast(brand, theme["--primary-foreground"]) >= 4.5, `label on ${brand}`);
    assert.ok(contrast("#ffffff", theme["--primary-text"]) >= 4.5, `link for ${brand}`);
    assert.ok(contrast("#f5f6f8", theme["--primary-text"]) >= 4.5, `canvas link for ${brand}`);
    assert.ok(contrast("#ffffff", theme["--primary-border"]) >= 3, `edge for ${brand}`);
  }
});
it("normalizes short colors and safely falls back for invalid tenant input", () => {
  assert.equal(tenantThemeStyle(" #AbC ")["--primary"], "#aabbcc");
  assert.equal(tenantThemeStyle("url(unsafe)")["--primary"], "#0b5cab");
});
