import * as nsfwjs from "nsfwjs";
import "@tensorflow/tfjs";

// Cache model instance
let nsfwModel: Awaited<ReturnType<typeof nsfwjs.load>> | null = null;

/**
 * Load NSFW model (cached)
 */
const loadNSFWModel = async () => {
  if (nsfwModel) return nsfwModel;

  try {
    nsfwModel = await nsfwjs.load(
      "https://nsfw-model.s3.us-east-2.amazonaws.com/model/"
    );
    return nsfwModel;
  } catch (error) {
    console.error("Failed to load NSFW model", error);
    return null;
  }
};

/**
 * Compress image + NSFW detect
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = event.target?.result as string;

      img.onload = async () => {
        try {
          // =====================
          // NSFW CHECK
          // =====================
          const model = await loadNSFWModel();

          if (model) {
            const predictions = await model.classify(img);

            const explicit = predictions.find(
              (p: any) =>
                (p.className === "Porn" && p.probability > 0.55) ||
                (p.className === "Hentai" && p.probability > 0.55) ||
                (p.className === "Sexy" && p.probability > 0.85)
            );

            if (explicit) {
              reject(
                new Error(
                  `Upload failed: Inappropriate content detected (${explicit.className})`
                )
              );
              return;
            }
          }
        } catch (err) {
          console.warn(
            "NSFW check failed, allowing upload (fail-open mode)",
            err
          );
        }

        // =====================
        // IMAGE COMPRESSION
        // =====================
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Image load failed"));
    };

    reader.onerror = () => reject(new Error("File read failed"));
  });
};
