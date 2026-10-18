import assert from "node:assert/strict";
import test from "node:test";
import type { BlobRef, CanonicalValue } from "@hypit/protocol";
import { elevenLabsTtsPorts, sealElevenLabsTtsRequest } from "@hypit/elevenlabs-tts";
import { geminiTtsPorts, sealGeminiTtsRequest } from "@hypit/gemini-tts";
import { generateMusicPorts, generateSoundsPorts, sealGenerateMusicRequest, sealGenerateSoundsRequest } from "@hypit/suno";

import { kieAudioTrackUrls, kieLyricsVariations, kieResultUrls } from "../src/client.js";
import { kieRouteForCapability } from "../src/routes.js";

const image: BlobRef = { kind: "blob", resource: "res_kie_image", size: 4, mediaType: "image/png" };
const audio: BlobRef = { kind: "blob", resource: "res_kie_audio", size: 4, mediaType: "audio/mpeg" };
const resolve = async () => "https://cdn.kie.ai/uploaded";
const URL_ = "https://cdn.kie.ai/uploaded";

test("Suno generate-music compiles both modes to the ai-music-api wire with the two-tier model naming", async () => {
  const route = kieRouteForCapability({ module: { name: "@hypit/suno", version: "1" }, name: "generate-music" })!;
  const custom = route.prepare(sealGenerateMusicRequest({
    customMode: [true], instrumental: [false], model: ["V6"], title: ["Iron Man"],
    style: ["electrifying, rock"], lyrics: ["[Verse] Night city lights"], vocalGender: ["m"],
    duration: [198], variety: [1],
  }) as unknown as CanonicalValue);
  assert.equal(custom.model, "ai-music-api/generate");
  assert.deepEqual(await custom.compile(resolve), {
    custom_mode: true, instrumental: false, model: "V6", title: "Iron Man",
    style: "electrifying, rock", lyrics: "[Verse] Night city lights", vocal_gender: "m",
    duration: 198, variety: 1,
  });

  const plain = route.prepare(sealGenerateMusicRequest({
    customMode: [false], instrumental: [false], model: ["V6_MINI"],
    prompt: ["An upbeat acoustic song about a summer road trip"],
    imageUrls: [{ role: "image", artifact: image }],
  }) as unknown as CanonicalValue);
  assert.equal(plain.model, "ai-music-api/generate");
  assert.deepEqual(await plain.compile(resolve), {
    custom_mode: false, instrumental: false, model: "V6_MINI",
    prompt: "An upbeat acoustic song about a summer road trip", image_urls: [URL_],
  });
});

test("Suno generate-music refuses what each mode's docs page forbids", () => {
  const route = kieRouteForCapability({ module: { name: "@hypit/suno", version: "1" }, name: "generate-music" })!;
  const throws = (ports: Record<string, unknown>, pattern: RegExp) => {
    assert.throws(() => route.prepare(sealGenerateMusicRequest(ports as never) as unknown as CanonicalValue), pattern);
  };
  // Custom mode: title required, no references, needs one of style/lyrics/negative_tags.
  throws({ customMode: [true], instrumental: [false], model: ["V6"], style: ["rock"] }, /requires a title/u);
  throws({ customMode: [true], instrumental: [false], model: ["V6"], title: ["T"],
    imageUrls: [{ role: "image", artifact: image }] }, /takes no image_urls/u);
  throws({ customMode: [true], instrumental: [false], model: ["V6"], title: ["T"] },
    /at least one of style, lyrics or negative_tags/u);
  // Non-custom mode: no custom-only fields, 3000-char prompt, needs one input group.
  throws({ customMode: [false], instrumental: [false], model: ["V6"], style: ["rock"], duration: [30] },
    /takes no duration/u);
  throws({ customMode: [false], instrumental: [false], model: ["V6"], style: ["rock"],
    prompt: ["x".repeat(3001)] }, /capped at 3000 characters/u);
  throws({ customMode: [false], instrumental: [false], model: ["V6"], prompt: ["idea"] },
    /at least one of image_urls, video_urls, audio_urls, style or lyrics/u);
  // audio_weight needs vocals on every mode.
  throws({ customMode: [true], instrumental: [true], model: ["V6"], title: ["T"], style: ["rock"],
    audioWeight: [0.5] }, /audio_weight without vocals/u);
});

test("Suno generate-sounds relays the SFX controls verbatim", async () => {
  const route = kieRouteForCapability({ module: { name: "@hypit/suno", version: "1" }, name: "generate-sounds" })!;
  const prepared = route.prepare(sealGenerateSoundsRequest({
    prompt: ["rain on a tin roof"], model: ["V6"], soundLoop: [true], soundTempo: [166],
    soundKey: ["D#m"], grabLyrics: [true],
  }) as unknown as CanonicalValue);
  assert.equal(prepared.model, "ai-music-api/sounds");
  assert.deepEqual(await prepared.compile(resolve), {
    prompt: "rain on a tin roof", model: "V6", sound_loop: true, sound_tempo: 166,
    sound_key: "D#m", grab_lyrics: true,
  });
});

test("ElevenLabs TTS routes compile their field shapes", async () => {
  const multi = kieRouteForCapability(
    { module: { name: "@hypit/elevenlabs-tts", version: "1" }, name: "text-to-speech-multilingual-v2" },
  )!;
  const multiPrepared = multi.prepare(sealElevenLabsTtsRequest("text-to-speech-multilingual-v2", {
    text: ["Unlock powerful API with Kie.ai!"], voice: ["EkK5I93UQWFDigLMpZcX"],
    stability: [0.5], similarityBoost: [0.75], speed: [1],
  }) as unknown as CanonicalValue);
  assert.equal(multiPrepared.model, "elevenlabs/text-to-speech-multilingual-v2");
  assert.deepEqual(await multiPrepared.compile(resolve), {
    text: "Unlock powerful API with Kie.ai!", voice: "EkK5I93UQWFDigLMpZcX",
    stability: 0.5, similarity_boost: 0.75, speed: 1,
  });

  const turbo = kieRouteForCapability(
    { module: { name: "@hypit/elevenlabs-tts", version: "1" }, name: "text-to-speech-turbo-2-5" },
  )!;
  const turboPrepared = turbo.prepare(sealElevenLabsTtsRequest("text-to-speech-turbo-2-5", {
    text: ["turn"], languageCode: ["en"],
  }) as unknown as CanonicalValue);
  assert.equal(turboPrepared.model, "elevenlabs/text-to-speech-turbo-2-5");
  assert.deepEqual(await turboPrepared.compile(resolve), { text: "turn", language_code: "en" });
});

test("ElevenLabs dialogue-v3 zips the parallel ports into dialogue items", async () => {
  const route = kieRouteForCapability(
    { module: { name: "@hypit/elevenlabs-tts", version: "1" }, name: "text-to-dialogue-v3" },
  )!;
  const prepared = route.prepare(sealElevenLabsTtsRequest("text-to-dialogue-v3", {
    dialogueText: ["I have a pen", "a happy dog"],
    dialogueVoice: ["EkK5I93UQWFDigLMpZcX", "Z3R5wn05IrDiVCyEkUrK"],
    stability: [0.5],
  }) as unknown as CanonicalValue);
  assert.equal(prepared.model, "elevenlabs/text-to-dialogue-v3");
  assert.deepEqual(await prepared.compile(resolve), {
    dialogue: [
      { text: "I have a pen", voice: "EkK5I93UQWFDigLMpZcX" },
      { text: "a happy dog", voice: "Z3R5wn05IrDiVCyEkUrK" },
    ],
    stability: 0.5,
  });
});

test("Gemini TTS zips speakers and turns; 3.8 pages carry per-turn style", async () => {
  const pro = kieRouteForCapability(
    { module: { name: "@hypit/gemini-tts", version: "1" }, name: "gemini-2-5-pro-tts" },
  )!;
  const proPrepared = pro.prepare(sealGeminiTtsRequest("gemini-2-5-pro-tts", {
    speakerId: ["Speaker 1"], speakerVoice: ["Puck"], turnSpeakerId: ["Speaker 1"],
    turnText: ["Hello there."], scene: ["A quiet room"], sampleContext: ["Audiobook narration"],
    temperature: [1],
  }) as unknown as CanonicalValue);
  assert.equal(proPrepared.model, "google/gemini-2-5-pro-tts");
  assert.deepEqual(await proPrepared.compile(resolve), {
    speakers: [{ speaker_id: "Speaker 1", voice_name: "Puck" }],
    dialogue_turns: [{ speaker_id: "Speaker 1", text: "Hello there." }],
    scene: "A quiet room", sample_context: "Audiobook narration", temperature: 1,
  });

  const flash = kieRouteForCapability(
    { module: { name: "@hypit/gemini-tts", version: "1" }, name: "gemini-3-8-flash-tts" },
  )!;
  const flashPrepared = flash.prepare(sealGeminiTtsRequest("gemini-3-8-flash-tts", {
    speakerId: ["Speaker 1", "Speaker 2"], speakerVoice: ["Fola", "Kore"],
    turnSpeakerId: ["Speaker 1", "Speaker 2"], turnText: ["Hi.", "Hello."],
    turnStyle: ["tired radio host", "bright"], fillerWords: [true],
  }) as unknown as CanonicalValue);
  assert.equal(flashPrepared.model, "google/gemini-3-8-flash-tts");
  assert.deepEqual(await flashPrepared.compile(resolve), {
    speakers: [{ speaker_id: "Speaker 1", voice_name: "Fola" }, { speaker_id: "Speaker 2", voice_name: "Kore" }],
    dialogue_turns: [
      { speaker_id: "Speaker 1", text: "Hi.", style: "tired radio host" },
      { speaker_id: "Speaker 2", text: "Hello.", style: "bright" },
    ],
    filler_words: true,
  });
});

test("audio-isolation relays its source as audio_url with the 10 MB documented cap", () => {
  const route = kieRouteForCapability(
    { module: { name: "@hypit/elevenlabs-tts", version: "1" }, name: "audio-isolation" },
  )!;
  const prepared = route.prepare(sealElevenLabsTtsRequest("audio-isolation", {
    source: [{ role: "audio", artifact: audio }],
  }) as unknown as CanonicalValue);
  assert.equal(prepared.model, "elevenlabs/audio-isolation");
  assert.equal(prepared.mediaLimits.audio, 10_000_000);
});

test("Suno audio tracks collect every data.response.data[] entry; TTS keeps resultUrls", () => {
  const sunoRecord = {
    state: "success",
    response: {
      data: [
        { id: "a1", audio_url: "https://cdn.kie.ai/t1.mp3", stream_audio_url: "https://cdn.kie.ai/s1",
          image_url: "https://cdn.kie.ai/c1.jpeg", duration: 198.44 },
        { id: "a2", audio_url: "https://cdn.kie.ai/t2.mp3", stream_audio_url: "https://cdn.kie.ai/s2",
          image_url: "https://cdn.kie.ai/c2.jpeg", duration: 228.28 },
      ],
    },
  };
  assert.deepEqual(kieAudioTrackUrls(sunoRecord), ["https://cdn.kie.ai/t1.mp3", "https://cdn.kie.ai/t2.mp3"]);
  const ttsRecord = { state: "success", response: { resultUrls: ["https://cdn.kie.ai/spoken.mp3"] } };
  assert.equal(kieAudioTrackUrls(ttsRecord), undefined);
  assert.deepEqual(kieResultUrls(ttsRecord), ["https://cdn.kie.ai/spoken.mp3"]);
});

test("lyrics variations read resultJson.resultObject.lyricsData[] and keep complete sets", () => {
  const record = {
    state: "success",
    resultJson: JSON.stringify({
      resultObject: {
        lyricsData: [
          { text: "[Verse] Moonlight", title: "Starry Night Dreams", status: "complete", error_message: "" },
          { text: "[Verse] Failed", title: "Broken", status: "failed", error_message: "blocked" },
          { text: "[Verse] Main Street", title: "Main Street Summer", status: "complete", error_message: "" },
        ],
      },
    }),
  };
  const variations = kieLyricsVariations(record);
  assert.deepEqual(variations.map((item) => item.title), ["Starry Night Dreams", "Main Street Summer"]);
});

test("every new audio port table seals a complete request against its model rules", () => {
  // generate-lyrics is text; music/sounds/TTS tables seal clean requests here as smoke.
  assert.equal(generateMusicPorts.result, "audio");
  assert.equal(generateSoundsPorts.result, "audio");
  assert.equal(elevenLabsTtsPorts["text-to-dialogue-v3"]!.result, "audio");
  assert.equal(geminiTtsPorts["gemini-3-8-flash-lite-tts"]!.result, "audio");
  sealGenerateMusicRequest({
    customMode: [true], instrumental: [true], model: ["V6_WILD"], title: ["Loop"],
    style: ["ambient"], negativeTags: ["vocals"],
  });
  sealGenerateSoundsRequest({ prompt: ["waves"], model: ["V6"] });
  sealElevenLabsTtsRequest("text-to-speech-multilingual-v2", { text: ["hi"], voice: ["EkK5I93UQWFDigLMpZcX"] });
  sealGeminiTtsRequest("gemini-3-8-flash-lite-tts", {
    speakerId: ["Speaker 1"], speakerVoice: ["Fola"],
    turnSpeakerId: ["Speaker 1"], turnText: ["hey"],
  });
});
