import { sealGenerationPortTable } from "@hypit/generation";
import type { GenerationPortTable } from "@hypit/generation";

import { ELEVENLABS_DIALOGUE_LANGUAGE_CODES, ELEVENLABS_VOICE_IDS } from "./voices.js";

/**
 * Exact ElevenLabs TTS inputs per Kie's Market pages. The multilingual-v2 and
 * turbo-2-5 pages share one field shape; turbo's `input.required` lists only
 * `text` while multilingual also requires `voice`, and only Turbo accepts
 * `language_code` ("For other models, an error will be returned if language code
 * is provided"). dialogue-v3's input is the dialogue itself, carried as the
 * zipped scalar ports `dialogueText`/`dialogueVoice` that the Kie Provider
 * rewrites into `dialogue: [{text, voice}]`.
 */
const elevenSharedTtsPorts = [
  { name: "text", value: { kind: "text", maxChars: 5000 } as const, minItems: 1, maxItems: 1 },
  { name: "stability", value: { kind: "number", minimum: 0, maximum: 1 } as const, minItems: 0, maxItems: 1 },
  { name: "similarityBoost", value: { kind: "number", minimum: 0, maximum: 1 } as const, minItems: 0, maxItems: 1 },
  { name: "style", value: { kind: "number", minimum: 0, maximum: 1 } as const, minItems: 0, maxItems: 1 },
  { name: "speed", value: { kind: "number", minimum: 0.7, maximum: 1.2 } as const, minItems: 0, maxItems: 1 },
  { name: "timestamps", value: { kind: "boolean" } as const, minItems: 0, maxItems: 1 },
  { name: "previousText", value: { kind: "text", maxChars: 5000 } as const, minItems: 0, maxItems: 1 },
  { name: "nextText", value: { kind: "text", maxChars: 5000 } as const, minItems: 0, maxItems: 1 },
] as const;

export function multilingualV2PortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "text-to-speech-multilingual-v2",
    result: "audio",
    ports: [
      ...elevenSharedTtsPorts.map((port) => ({ ...port, value: { ...port.value } })),
      { name: "voice", value: { kind: "enum", values: [...ELEVENLABS_VOICE_IDS] }, minItems: 1, maxItems: 1 },
    ],
    requires: [],
  });
}

export function turbo25PortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "text-to-speech-turbo-2-5",
    result: "audio",
    ports: [
      ...elevenSharedTtsPorts.map((port) => ({ ...port, value: { ...port.value } })),
      { name: "voice", value: { kind: "enum", values: [...ELEVENLABS_VOICE_IDS] }, minItems: 0, maxItems: 1 },
      // Turbo v2.5 is one of the two models that enforce a language code.
      { name: "languageCode", value: { kind: "token", minLength: 2, maxLength: 500 }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

/**
 * dialogue-v3: one `dialogue: [{text, voice}]` array on the wire. The parallel
 * ports must zip to equal lengths and their combined text stays ≤5000 chars
 * (docs); the pairing is a cross-port rule and the Kie Provider enforces it.
 * Hypit caps the pair count structurally — docs bound only total characters.
 */
export function dialogueV3PortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "text-to-dialogue-v3",
    result: "audio",
    ports: [
      { name: "dialogueText", value: { kind: "text", maxChars: 5000 }, minItems: 1, maxItems: 100 },
      // Preset voice name ("Rachel", "Adam") or a 20-character catalog voice ID.
      { name: "dialogueVoice", value: { kind: "token", minLength: 1, maxLength: 64 }, minItems: 1, maxItems: 100 },
      { name: "stability", value: { kind: "enum", values: [0, 0.5, 1] }, minItems: 0, maxItems: 1 },
      {
        name: "languageCode",
        value: { kind: "enum", values: [...ELEVENLABS_DIALOGUE_LANGUAGE_CODES] },
        minItems: 0,
        maxItems: 1,
      },
    ],
    requires: [],
  });
}

/** ElevenLabs voice extraction: one audio Resource in, cleaned voice out. */
export function audioIsolationPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "audio-isolation",
    result: "audio",
    ports: [
      { name: "source", value: { kind: "media", accepts: ["audio"] }, minItems: 1, maxItems: 1 },
    ],
    requires: [],
  });
}

export const elevenLabsTtsPorts: Readonly<Record<string, GenerationPortTable>> = {
  "text-to-speech-multilingual-v2": multilingualV2PortTable(),
  "text-to-speech-turbo-2-5": turbo25PortTable(),
  "text-to-dialogue-v3": dialogueV3PortTable(),
  "audio-isolation": audioIsolationPortTable(),
};
