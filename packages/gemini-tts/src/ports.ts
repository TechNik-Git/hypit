import { sealGenerationPortTable } from "@hypit/generation";
import type { GenerationPort, GenerationPortTable } from "@hypit/generation";

import { GEMINI_38_VOICES, GEMINI_FLASH_VOICES } from "./voices.js";

/**
 * Exact Gemini TTS inputs per Kie's Market pages. The wire carries two object
 * arrays — `speakers: [{speaker_id, voice_name}]` and `dialogue_turns:
 * [{speaker_id, text, style?}]` — which the closed port vocabulary expresses as
 * zipped parallel scalar ports; the Kie Provider rewrites them into the nested
 * shape. `speaker_id` must be "Speaker N" (docs); Hypit caps speakers at two
 * because the pages document single- and two-speaker dialogue only.
 *
 * The 2.5-pro / 3.1-flash pages add `scene` and `sample_context`; the 3.8 pages
 * add per-turn `style` and `filler_words` instead. `replica` (voice cloning)
 * needs paired upload URLs and is not part of these port tables.
 */
function geminiTurnPorts(voices: readonly string[], withStyle: boolean): GenerationPort[] {
  const ports: GenerationPort[] = [
    { name: "speakerId", value: { kind: "token", minLength: 9, maxLength: 16 }, minItems: 1, maxItems: 2 },
    { name: "speakerVoice", value: { kind: "enum", values: [...voices] }, minItems: 1, maxItems: 2 },
    { name: "turnSpeakerId", value: { kind: "token", minLength: 9, maxLength: 16 }, minItems: 1, maxItems: 100 },
    { name: "turnText", value: { kind: "text", maxChars: 10000 }, minItems: 1, maxItems: 100 },
    { name: "temperature", value: { kind: "number", minimum: 0, maximum: 2 }, minItems: 0, maxItems: 1 },
  ];
  if (withStyle) {
    ports.push({ name: "turnStyle", value: { kind: "text", maxChars: 2000 }, minItems: 0, maxItems: 100 });
  }
  return ports;
}

export function gemini25ProTtsPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "gemini-2-5-pro-tts",
    result: "audio",
    ports: [
      ...geminiTurnPorts(GEMINI_FLASH_VOICES, false),
      { name: "scene", value: { kind: "text", maxChars: 2000 }, minItems: 0, maxItems: 1 },
      { name: "sampleContext", value: { kind: "text", maxChars: 2000 }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

export function gemini31FlashTtsPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "gemini-3-1-flash-tts",
    result: "audio",
    ports: [
      ...geminiTurnPorts(GEMINI_FLASH_VOICES, false),
      { name: "scene", value: { kind: "text", maxChars: 2000 }, minItems: 0, maxItems: 1 },
      { name: "sampleContext", value: { kind: "text", maxChars: 2000 }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

export function gemini38FlashTtsPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "gemini-3-8-flash-tts",
    result: "audio",
    ports: [
      ...geminiTurnPorts(GEMINI_38_VOICES, true),
      { name: "fillerWords", value: { kind: "boolean" }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

export function gemini38FlashLiteTtsPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "gemini-3-8-flash-lite-tts",
    result: "audio",
    ports: [
      ...geminiTurnPorts(GEMINI_38_VOICES, true),
      { name: "fillerWords", value: { kind: "boolean" }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

export const geminiTtsPorts: Readonly<Record<string, GenerationPortTable>> = {
  "gemini-2-5-pro-tts": gemini25ProTtsPortTable(),
  "gemini-3-1-flash-tts": gemini31FlashTtsPortTable(),
  "gemini-3-8-flash-tts": gemini38FlashTtsPortTable(),
  "gemini-3-8-flash-lite-tts": gemini38FlashLiteTtsPortTable(),
};
