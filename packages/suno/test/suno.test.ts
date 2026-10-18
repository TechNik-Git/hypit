import assert from "node:assert/strict";
import test from "node:test";

import {
  generateLyricsCapability, generateMusicPorts, generateSoundsPorts,
  sealGenerateMusicRequest, sealGenerateSoundsRequest, sunoGenerateLyricsRequest,
} from "../src/index.js";

test("the Suno tables seal complete requests in both music modes", () => {
  sealGenerateMusicRequest({
    customMode: [true], instrumental: [false], model: ["V6"], title: ["T"],
    style: ["rock"], lyrics: ["[Verse] hi"], negativeTags: ["metal"],
  });
  sealGenerateMusicRequest({
    customMode: [false], instrumental: [false], model: ["V6_WILD"], prompt: ["an idea"],
    imageUrls: [{ role: "image", artifact: { kind: "blob", resource: "res_x", size: 1, mediaType: "image/png" } }],
    audioUrls: [{ role: "audio", artifact: { kind: "blob", resource: "res_y", size: 1, mediaType: "audio/mpeg" } }],
  });
  sealGenerateSoundsRequest({ prompt: ["waves at dusk"], model: ["V6_MINI"], soundTempo: [90] });
});

test("the shared attachment budget refuses more than ten style+lyrics+reference items", () => {
  const image = (index: number) => ({
    role: "image" as const,
    artifact: { kind: "blob" as const, resource: `res_i${index}` as `res_${string}`, size: 1, mediaType: "image/png" },
  });
  const audioItem = (index: number) => ({
    role: "audio" as const,
    artifact: { kind: "blob" as const, resource: `res_a${index}` as `res_${string}`, size: 1, mediaType: "audio/mpeg" },
  });
  assert.throws(() => sealGenerateMusicRequest({
    customMode: [false], instrumental: [false], model: ["V6"], style: ["rock"], lyrics: ["verse"],
    imageUrls: Array.from({ length: 5 }, (_item, index) => image(index)),
    videoUrls: [{ role: "video", artifact: { kind: "blob", resource: "res_v", size: 1, mediaType: "video/mp4" } }],
    audioUrls: Array.from({ length: 4 }, (_item, index) => audioItem(index)),
  }), /shared audioUrls\/imageUrls\/lyrics\/style\/videoUrls budget/u);
});

test("generate-lyrics caps its prompt at the documented 200 characters", () => {
  assert.equal(sunoGenerateLyricsRequest("  a nostalgic song  ").prompt, "a nostalgic song");
  assert.throws(() => sunoGenerateLyricsRequest(""), /needs a prompt/u);
  assert.throws(() => sunoGenerateLyricsRequest("x".repeat(201)), /200 characters/u);
  assert.equal(generateLyricsCapability.name, "generate-lyrics");
});

test("both Suno generation tables keep unique ports and the public audio result", () => {
  assert.equal(generateMusicPorts.result, "audio");
  assert.equal(generateSoundsPorts.result, "audio");
  for (const table of [generateMusicPorts, generateSoundsPorts]) {
    const names = new Set(table.ports.map((port) => port.name));
    assert.equal(names.size, table.ports.length, `${table.model} repeats a port`);
  }
});
