import assert from "node:assert/strict";
import test from "node:test";

import {
  ELEVENLABS_VOICE_IDS, elevenLabsTtsPorts, sealElevenLabsTtsRequest,
} from "../src/index.js";

test("the shared TTS tables seal; multilingual requires a voice, turbo does not", () => {
  sealElevenLabsTtsRequest("text-to-speech-multilingual-v2", {
    text: ["turn"], voice: [ELEVENLABS_VOICE_IDS[0]!], stability: [0.5],
  });
  assert.throws(() => sealElevenLabsTtsRequest("text-to-speech-multilingual-v2", { text: ["turn"] }),
    /voice is required/u);
  sealElevenLabsTtsRequest("text-to-speech-turbo-2-5", { text: ["turn"], languageCode: ["en"] });
});

test("dialogue-v3 pairs texts with voices and budgets 5000 characters total", () => {
  sealElevenLabsTtsRequest("text-to-dialogue-v3", {
    dialogueText: ["I have a pen", "a happy dog"], dialogueVoice: ["Rachel", ELEVENLABS_VOICE_IDS[1]!],
  });
  assert.throws(() => sealElevenLabsTtsRequest("text-to-dialogue-v3", {
    dialogueText: ["one", "two"], dialogueVoice: ["Rachel"],
  }), /pairs dialogueText with dialogueVoice/u);
  assert.throws(() => sealElevenLabsTtsRequest("text-to-dialogue-v3", {
    dialogueText: ["x".repeat(3000), "y".repeat(3000)], dialogueVoice: ["Rachel", "Adam"],
  }), /at most 5000 characters/u);
});

test("every ElevenLabs table carries unique ports and the audio result", () => {
  assert.equal(Object.keys(ELEVENLABS_VOICE_IDS).length > 0, true);
  for (const table of Object.values(elevenLabsTtsPorts)) {
    assert.equal(table.result, "audio");
    const names = new Set(table.ports.map((port) => port.name));
    assert.equal(names.size, table.ports.length, `${table.model} repeats a port`);
  }
});
