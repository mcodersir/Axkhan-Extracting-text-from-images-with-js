import { GoogleGenAI } from "@google/genai";

/**
 * Resizes an image if it exceeds dimensions, to save tokens/bandwidth.
 */
const resizeImageBase64 = (base64Str: string, maxWidth = 1000): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            // If image is small enough, return original
            if (width <= maxWidth && height <= maxWidth) {
                resolve(base64Str);
                return;
            }

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Keep the mime type from the original string if possible, default to png
                const mimeType = base64Str.split(';')[0].split(':')[1] || 'image/png';
                resolve(canvas.toDataURL(mimeType, 0.8)); // 0.8 quality for slight compression
            } else {
                resolve(base64Str); // Fallback
            }
        };
        img.onerror = () => resolve(base64Str); // Fallback
    });
};

/**
 * Extracts text from a base64 encoded image using Gemini 2.5 Flash.
 * Allows dynamic API key injection and custom user instructions.
 */
export const extractTextFromImage = async (
  base64Data: string, 
  mimeType: string, 
  userApiKey?: string,
  customInstructions?: string,
  isEcoMode: boolean = false
): Promise<string> => {
  try {
    // 1. Determine API Key
    const apiKey = userApiKey || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key یافت نشد. لطفاً در تنظیمات کلید خود را وارد کنید.");
    }

    // 2. Initialize Client with the specific key
    const ai = new GoogleGenAI({ apiKey });

    // 3. Resize if Eco Mode is enabled
    let finalBase64 = base64Data;
    if (isEcoMode) {
        finalBase64 = await resizeImageBase64(base64Data, 1000); // Resize to max 1000px
    }

    // 4. Clean Base64
    const cleanBase64 = finalBase64.split(',')[1] || finalBase64;

    // 5. Construct Prompt
    let promptText = `You are an expert OCR specialist and editor. 
            Extract all text from the provided image with high accuracy.
            
            CRITICAL INSTRUCTIONS FOR PERSIAN/ARABIC LANGUAGES (if detected):
            1. **Correct Spacing for Suffixes**: You MUST fix the spacing of suffixes. 
               - NEVER attach 'ها' (ha), 'می' (mi), 'نمی' (nemi), 'تر' (tar), 'ترین' (tarin), 'های' (haye) directly to the word. 
               - WRONG: "کتابها", "میروم", "زیباتر"
               - CORRECT: "کتاب‌ها" (or "کتاب ها"), "می‌روم" (or "می روم"), "زیباتر"
               - Use standard spacing (ZWNJ or space) to separate these suffixes.
            
            2. **Spelling Correction**: Fix any obvious spelling mistakes in the source text while maintaining the original meaning.
            
            3. **Formatting**: Preserve line breaks and paragraph structure.`;

    // 6. Append Custom Instructions if provided
    if (customInstructions && customInstructions.trim().length > 0) {
      promptText += `\n\nUSER CUSTOM INSTRUCTIONS (PRIORITY):
      The user has provided specific rules for this extraction. Follow them strictly:
      "${customInstructions}"`;
    }

    promptText += `\n\nReturn ONLY the extracted and corrected text. Do not add any conversational output.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText
          },
        ],
      },
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    // User friendly error mapping
    if (error.message.includes("API key") || error.message.includes("403")) {
      throw new Error("کلید API نامعتبر است (403). لطفا کلید خود را بررسی کنید.");
    }
    throw new Error(error.message || "خطا در استخراج متن از تصویر");
  }
};
