import { sealGenerationPortTable } from "@hypit/generation";
import type { GenerationPortTable } from "@hypit/generation";

/**
 * Exact Suno music inputs, verified field by field against docs.kie.ai
 * (`suno-api/generate-music.md`, `suno-api/generate-sounds.md`). Provider wire
 * names are deliberately absent: each service maps these ports independently.
 *
 * The Suno version selector is an input parameter of one wire route, so one
 * capability covers `V6` / `V6_MINI` / `V6_WILD` (the only non-discontinued
 * family) rather than one capability per version. The tables carry the union of
 * both `custom_mode` bands; the mode grammar (which fields each mode accepts,
 * the at-least-one groups, `title` in custom mode, the non-custom prompt cap) is
 * cross-field and lives in the Kie Provider's refusal layer, where every rule
 * cites its docs page.
 */
export function generateMusicPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "generate-music",
    result: "audio",
    ports: [
      { name: "customMode", value: { kind: "boolean" }, minItems: 1, maxItems: 1 },
      { name: "instrumental", value: { kind: "boolean" }, minItems: 1, maxItems: 1 },
      { name: "model", value: { kind: "enum", values: ["V6", "V6_MINI", "V6_WILD"] }, minItems: 1, maxItems: 1 },
      // Custom mode: sung as lyrics (V6 lyrics band); non-custom: core idea (≤3000).
      { name: "prompt", value: { kind: "text", maxChars: 5000 }, minItems: 0, maxItems: 1 },
      { name: "lyrics", value: { kind: "text", maxChars: 5000 }, minItems: 0, maxItems: 1 },
      { name: "style", value: { kind: "text", maxChars: 1000 }, minItems: 0, maxItems: 1 },
      { name: "title", value: { kind: "text", maxChars: 80 }, minItems: 0, maxItems: 1 },
      { name: "negativeTags", value: { kind: "text" }, minItems: 0, maxItems: 1 },
      { name: "vocalGender", value: { kind: "enum", values: ["m", "f"] }, minItems: 0, maxItems: 1 },
      { name: "styleWeight", value: { kind: "number", minimum: 0, maximum: 1 }, minItems: 0, maxItems: 1 },
      { name: "weirdnessConstraint", value: { kind: "number", minimum: 0, maximum: 1 }, minItems: 0, maxItems: 1 },
      { name: "audioWeight", value: { kind: "number", minimum: 0, maximum: 1 }, minItems: 0, maxItems: 1 },
      { name: "variety", value: { kind: "number", integer: true, minimum: 0, maximum: 4 }, minItems: 0, maxItems: 1 },
      { name: "personaId", value: { kind: "token", minLength: 1, maxLength: 256 }, minItems: 0, maxItems: 1 },
      {
        name: "personaModel",
        value: { kind: "enum", values: ["style_persona", "voice_persona"] },
        minItems: 0,
        maxItems: 1,
      },
      { name: "duration", value: { kind: "number", integer: true, minimum: 10, maximum: 360 }, minItems: 0, maxItems: 1 },
      { name: "imageUrls", value: { kind: "media", accepts: ["image"] }, minItems: 0, maxItems: 5 },
      { name: "videoUrls", value: { kind: "media", accepts: ["video"] }, minItems: 0, maxItems: 1 },
      { name: "audioUrls", value: { kind: "media", accepts: ["audio"] }, minItems: 0, maxItems: 10 },
    ],
    requires: [
      // "Total attachments must not exceed 10: style + lyrics + image_urls + video_urls + audio_urls".
      {
        kind: "weightedTotal",
        weights: { style: 1, lyrics: 1, imageUrls: 1, videoUrls: 1, audioUrls: 1 },
        maximum: 10,
      },
    ],
  });
}

export const generateMusicPorts = generateMusicPortTable();

/** `ai-music-api/sounds` — Suno's SFX route. `sound_key` enum verified 25 values. */
export function generateSoundsPortTable(): GenerationPortTable {
  return sealGenerationPortTable({
    model: "generate-sounds",
    result: "audio",
    ports: [
      { name: "prompt", value: { kind: "text", maxChars: 500 }, minItems: 1, maxItems: 1 },
      { name: "model", value: { kind: "enum", values: ["V6", "V6_MINI", "V6_WILD"] }, minItems: 1, maxItems: 1 },
      { name: "soundLoop", value: { kind: "boolean" }, minItems: 0, maxItems: 1 },
      { name: "soundTempo", value: { kind: "number", integer: true, minimum: 1, maximum: 300 }, minItems: 0, maxItems: 1 },
      {
        name: "soundKey",
        value: {
          kind: "enum",
          values: ["Any", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        },
        minItems: 0,
        maxItems: 1,
      },
      { name: "grabLyrics", value: { kind: "boolean" }, minItems: 0, maxItems: 1 },
    ],
    requires: [],
  });
}

export const generateSoundsPorts = generateSoundsPortTable();
