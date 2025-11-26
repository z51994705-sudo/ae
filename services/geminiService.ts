import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TranslationItem } from "../types";

// Optimized Schema for faster generation
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          translated: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["original", "translated", "description"]
      }
    }
  },
  required: ["results"]
};

// Optimized System Instruction: Comprehensive AE Terminology Glossary for High Precision
const SYSTEM_INSTRUCTION = `
Role: Senior Adobe After Effects (AE) Localization Specialist.

Goal: Translate plugin parameters to standard Adobe Simplified Chinese terms.

Strict Glossary (EN->CN):
- Transform->变换, Anchor Point->锚点, Position->位置, Scale->缩放, Rotation->旋转, Opacity->不透明度
- Composition->合成, Pre-compose->预合成, Footage->素材, Layer->图层, Mask->蒙版
- Keyframe->关键帧, Easy Ease->缓动, Graph Editor->图表编辑器, Interpolation->插值
- Blending Mode->混合模式, Track Matte->轨道遮罩, Alpha Matte->Alpha遮罩, Luma Matte->亮度遮罩
- Null Object->空对象, Adjustment Layer->调整图层, Solid->固态层
- Effect Controls->特效控制台, Expression->表达式, Parent & Link->父级和链接
- Render Queue->渲染队列, Output Module->输出模块, Codec->编码器
- Noise->噪波, Fractal Noise->分形噪波, Grain->颗粒, Glitch->故障/毛刺
- Glow->辉光, Blur->模糊, Sharpen->锐化, Distortion->扭曲, Displacement Map->置换图
- Gradient Ramp->渐变, Stroke->描边, Fill->填充, Trim Paths->修剪路径
- Particle->粒子, Emitter->发射器, Velocity->速度, Life->生命/寿命
- Turbulence Field->湍流场, Physics->物理学, Gravity->重力, Resistance->阻力
- Specular->高光, Ambient->环境光, Reflection->反射, Refraction->折射, Shadow->阴影
- Offset->偏移, Evolution->演化, Cycle->循环, Random Seed->随机种子
- Threshold->阈值, Tolerance->容差, Range->范围, Smoothness->平滑度, Feather->羽化
- Hue->色相, Saturation->饱和度, Luminance->亮度, Contrast->对比度, Levels->色阶, Curves->曲线

Instructions:
1. Fix OCR typos (e.g. "0pacity"->"Opacity", "M0de"->"Mode", "l1ght"->"light").
2. Terminology: Use the EXACT Chinese terms above. Do NOT use synonyms (e.g. use "不透明度" not "透明度").
3. Context: If a word has multiple meanings, choose the VFX/Video Editing meaning (e.g. "Screen" -> "屏幕"(混合模式) not "显示器").
4. Description: <15 words, beginner-friendly visual explanation of what the parameter controls.

Output: JSON strictly.
`;

// Helper: Get AI Client safely
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    throw new Error("API Key 未配置。请在 Vercel 环境变量中添加 API_KEY。");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to resize/compress images before sending to API to reduce latency
const processImage = (base64Str: string, maxWidth = 1024): Promise<{data: string, mimeType: string}> => {
  return new Promise((resolve) => {
    // Safety check for SSR or non-browser envs
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        const cleanData = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
        resolve({ data: cleanData, mimeType: 'image/png' });
        return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions if resizing is needed
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill white background (handles transparent PNGs converting to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.8 quality for optimal speed/size balance
        const newDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
            data: newDataUrl.split(',')[1],
            mimeType: 'image/jpeg'
        });
      } else {
        // Fallback if context creation fails
        const cleanData = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
        resolve({ data: cleanData, mimeType: 'image/png' });
      }
    };
    
    img.onerror = () => {
        // Fallback to original if image load fails
        const cleanData = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
        resolve({ data: cleanData, mimeType: 'image/png' });
    };
  });
};

export const translateText = async (text: string): Promise<TranslationItem[]> => {
  if (!text.trim()) return [];

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate these AE plugin parameters:\n${text}`, 
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const json = JSON.parse(response.text || '{"results": []}');
    return json.results;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

export const translateImage = async (base64Image: string, mimeType: string): Promise<TranslationItem[]> => {
  try {
    // Compress image client-side before sending
    const { data, mimeType: processedMime } = await processImage(base64Image);
    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: processedMime,
              data: data
            }
          },
          {
            text: "Extract AE interface text & Translate to Chinese JSON."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const json = JSON.parse(response.text || '{"results": []}');
    return json.results;
  } catch (error) {
    console.error("Image translation error:", error);
    throw error;
  }
};