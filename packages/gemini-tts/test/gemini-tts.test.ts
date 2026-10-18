import assert from "node:assert/strict";
import test from "node:test";

import { GEMINI_FLASH_VOICES, geminiTtsPorts, sealGeminiTtsRequest } from "../src/index.js";

test("speakers and turns zip one-to-one; speaker ids use the Speaker N shape", () => {
  sealGeminiTtsRequest("gemini-2-5-pro-tts", {
    speakerId: ["Speaker 1"], speakerVoice: [GEMINI_FLASH_VOICES[0]!],
    turnSpeakerId: ["Speaker 1"], turnText: ["Hello."],
  });
  assert.throws(() => sealGeminiTtsRequest("gemini-2-5-pro-tts", {
    speakerId: ["Speaker 1", "Speaker 2"], speakerVoice: [GEMINI_FLASH_VOICES[0]!],
    turnSpeakerId: ["Speaker 1"], turnText: ["Hello."],
  }), /pair speakerId with speakerVoice/u);
  assert.throws(() => sealGeminiTtsRequest("gemini-3-8-flash-tts", {
    speakerId: ["SpeakerOne"], speakerVoice: ["Fola"],
    turnSpeakerId: ["SpeakerOne"], turnText: ["Hello."],
  }), /must be "Speaker N"/u);
  assert.throws(() => sealGeminiTtsRequest("gemini-3-8-flash-tts", {
    speakerId: ["Speaker 1"], speakerVoice: ["Fola"],
    turnSpeakerId: ["Speaker 2"], turnText: ["Hello."],
  }), /names no declared speaker/u);
});

test("3.8 models accept per-turn style, the flash pair does not", () => {
  sealGeminiTtsRequest("gemini-3-8-flash-lite-tts", {
    speakerId: ["Speaker 1"], speakerVoice: ["Fola"],
    turnSpeakerId: ["Speaker 1"], turnText: ["Hello."], turnStyle: ["calm"],
  });
  assert.throws(() => sealGeminiTtsRequest("gemini-2-5-pro-tts", {
    speakerId: ["Speaker 1"], speakerVoice: ["Puck"],
    turnSpeakerId: ["Speaker 1"], turnText: ["Hello."], turnStyle: ["calm"],
  } as never), /undeclared port turnStyle/u);
});

test("every Gemini table carries unique ports and the audio result", () => {
  for (const table of Object.values(geminiTtsPorts)) {
    assert.equal(table.result, "audio");
    const names = new Set(table.ports.map((port) => port.name));
    assert.equal(names.size, table.ports.length, `${table.model} repeats a port`);
  }
});
