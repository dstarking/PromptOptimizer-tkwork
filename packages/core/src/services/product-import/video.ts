import { z } from "zod";
export type VideoDuration = 10 | 15 | 20 | 25 | 30;
export const VIDEO_DURATIONS = [10, 15, 20, 25, 30] as const;
export function splitVideoDuration(duration: VideoDuration): number[] {
  if (!VIDEO_DURATIONS.includes(duration))
    throw new Error("INVALID_VIDEO_DURATION");
  return Array.from({ length: Math.ceil(duration / 10) }, (_, i) =>
    Math.min(10, duration - i * 10),
  );
}
const text = z.string().trim().min(1).max(20000);
export const enhancedResultSchema = z.object({
  title: z.object({
    text,
    seoKeywords: z.array(text).max(20),
    emotionalAngle: text,
  }),
  description: z.object({ text }),
  mainImagePrompt: z.object({
    prompt: text,
    referenceImageIds: z.array(text).min(1).max(9),
  }),
  video: z.object({
    totalDuration: z.union([
      z.literal(10),
      z.literal(15),
      z.literal(20),
      z.literal(25),
      z.literal(30),
    ]),
    clips: z
      .array(
        z.object({
          start: z.number().int().nonnegative(),
          end: z.number().int().positive(),
          duration: z.number().int().positive().max(10),
          scene: text,
          sellingPoint: text,
          caption: text,
          voiceover: text,
          prompt: text,
          referenceImageIds: z.array(text).min(1).max(9),
        }),
      )
      .min(1)
      .max(3),
    editingGuide: text,
  }),
});
export type EnhancedProductCardResult = z.infer<typeof enhancedResultSchema>;
export function parseEnhancedResult(
  raw: string,
  duration: VideoDuration,
  imageIds: string[],
): EnhancedProductCardResult {
  const result = enhancedResultSchema.parse(
    JSON.parse(
      raw
        .trim()
        .replace(/^\x60\x60\x60(?:json)?\s*/i, "")
        .replace(/\s*\x60\x60\x60$/, ""),
    ),
  );
  const parts = splitVideoDuration(duration);
  let start = 0;
  if (
    result.video.totalDuration !== duration ||
    result.video.clips.length !== parts.length
  )
    throw new Error("VIDEO_TIMELINE_INVALID");
  result.video.clips.forEach((clip, i) => {
    if (
      clip.start !== start ||
      clip.duration !== parts[i] ||
      clip.end !== start + parts[i] ||
      !clip.prompt.includes(String(parts[i]) + " seconds") ||
      !clip.prompt.includes("9:16")
    )
      throw new Error("VIDEO_TIMELINE_INVALID");
    start = clip.end;
  });
  const refs = [
    result.mainImagePrompt.referenceImageIds,
    ...result.video.clips.map((c) => c.referenceImageIds),
  ].flat();
  const consumerTexts = [
    result.title.text,
    result.description.text,
    result.mainImagePrompt.prompt,
    ...result.video.clips.flatMap((c) => [
      c.scene,
      c.sellingPoint,
      c.caption,
      c.voiceover,
      c.prompt,
    ]),
    result.video.editingGuide,
  ];
  if (consumerTexts.some((text) => /[\u3400-\u9fff]/u.test(text)))
    throw new Error("ENGLISH_OUTPUT_REQUIRED");
  if (refs.some((id) => !imageIds.includes(id)))
    throw new Error("IMAGE_REFERENCE_INVALID");
  return result;
}
