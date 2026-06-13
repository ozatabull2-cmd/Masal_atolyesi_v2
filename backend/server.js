import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import textToSpeech from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';

dotenv.config();

const ttsClient = new textToSpeech.TextToSpeechClient();

if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.error("FATAL ERROR: GOOGLE_CLOUD_PROJECT is not defined in environment variables. Application cannot start.");
    process.exit(1);
}

const app = express();
const allowedOrigins = ['http://localhost:5173', 'https://masal-atolyesi-v2.vercel.app'];
app.use(cors({
  origin: function (origin, callback) {
    // origin is undefined for server-to-server requests or local tools like curl/Postman
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 8080;

// Initialize GoogleGenAI client securely
// When deployed on Cloud Run, Application Default Credentials (ADC) handle authentication automatically.
const getAIClient = () => {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    return new GoogleGenAI({
        vertexai: true,
        project,
        location
    });
};

const getConstraintsForAge = (age) => {
    switch (age) {
        case "3-5": return "Çok kısa cümleler, basit kelimeler, bol tekrar, somut kavramlar. Sayfa başına Maksimum 40-50 kelime.";
        case "6-8": return "Biraz daha karmaşık cümleler, hafif macera, sebep-sonuç ilişkileri. Sayfa başına Maksimum 80-100 kelime.";
        case "9+": return "Gelişmiş kelime hazinesi, detaylı betimlemeler, güçlü kurgu. Sayfa başına Maksimum 150 kelime.";
        default: return "Basit ve anlaşılır dil.";
    }
};

app.post('/api/generate-story', async (req, res) => {
    try {
        const input = req.body;
        if (!input || !input.childName || !input.age || !input.category || !input.moral) {
            return res.status(400).json({ error: "Eksik parametreler. childName, age, category ve moral alanları zorunludur." });
        }

        const ai = getAIClient();
        const ageConstraints = getConstraintsForAge(input.age);
        
        let characterAppearance = "";
        if (input.hairColor || input.eyeColor) {
            const hair = input.hairColor ? `${input.hairColor} hair` : "";
            const eye = input.eyeColor ? `${input.eyeColor} eyes` : "";
            characterAppearance = `Character physical appearance: ${hair} ${eye}.`;
        }

        const prompt = `
          Sen profesyonel bir çocuk kitabı yazarı ve sanat yönetmenisin.
          Aşağıdaki bilgilerle bir çocuk masalı oluştur:
          
          - Kahraman Adı: ${input.childName}
          - Yaş Grubu: ${input.age}
          - Cinsiyet: ${input.gender}
          - Kategori/Tema: ${input.category}
          - Öğüt/Konu: ${input.moral}
          - Fiziksel Özellikler: ${input.hairColor ? 'Saç: ' + input.hairColor : ''} ${input.eyeColor ? 'Göz: ' + input.eyeColor : ''}

          KURALLAR:
          1. Hikaye dili TÜRKÇE olmalıdır.
          2. Dil ve anlatım şu yaş grubu kuralına uymalıdır: ${ageConstraints}
          3. Asla korku, şiddet veya kötü örnek içermemelidir.
          4. Çıktı tam olarak 5 sayfa olmalıdır.
          5. Her sayfa için bir "imagePrompt" (Görsel İstemi) yazılmalıdır. 
          6. Ayrıca kitap kapağı için "coverImagePrompt" yazılmalıdır.
          7. imagePrompt İNGİLİZCE olmalı, sahneyi detaylı betimlemeli ve stil olarak "Whimsical digital illustration, soft colors, Pixar style 3D render" belirtilmelidir.
          8. ÖNEMLİ: "imagePrompt" içinde karakterin fiziksel özelliklerini (${characterAppearance || `a ${input.age} year old ${input.gender}`}) HER SEFERİNDE tutarlı bir şekilde belirt.

          JSON FORMATINDA yanıt ver.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Hikayenin başlığı" },
                        summary: { type: Type.STRING, description: "Hikayenin 2 cümlelik özeti" },
                        coverImagePrompt: { type: Type.STRING, description: "Kitap kapağı için görsel istemi" },
                        pages: {
                            type: Type.ARRAY,
                            description: "Hikayenin sayfaları (toplam 5 adet)",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    pageNumber: { type: Type.INTEGER },
                                    text: { type: Type.STRING, description: "Sayfanın Türkçe metni" },
                                    imagePrompt: { type: Type.STRING, description: "Sayfanın İngilizce görsel istemi (prompt)" }
                                },
                                required: ["pageNumber", "text", "imagePrompt"]
                            }
                        }
                    },
                    required: ["title", "summary", "coverImagePrompt", "pages"]
                }
            }
        });

        if (response.text) {
            return res.status(200).json(JSON.parse(response.text));
        }
        
        return res.status(500).json({ error: "Masal oluşturulamadı." });
    } catch (error) {
        console.error("Story generation error:", error);
        return res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
});

app.post('/api/generate-illustration', async (req, res) => {
    try {
        const { prompt } = req.body || {};
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: "Geçersiz istek. 'prompt' alanı zorunludur." });
        }

        const ai = getAIClient();
        // Use Imagen 3 for Vertex AI
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/png'
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64Image = response.generatedImages[0].image.imageBytes;
            return res.status(200).json({ image: `data:image/png;base64,${base64Image}`, blocked: false });
        }
        
        console.warn(`Imagen safety filter blocked this prompt: ${prompt.substring(0, 100)}...`);
        return res.status(200).json({ image: "", blocked: true, reason: "SAFETY_FILTER" });
    } catch (error) {
        console.error("Image generation error:", error);
        return res.status(500).json({ error: "Görsel oluşturulurken bir hata oluştu." });
    }
});

app.post('/api/generate-speech', async (req, res) => {
    try {
        const { text } = req.body || {};
        if (!text || typeof text !== "string") {
            return res.status(400).json({ error: "Geçersiz istek. 'text' alanı zorunludur." });
        }

        const request = {
            input: { text: text },
            // Turkish Wavenet Voice (Female)
            voice: { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-A' },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const base64Audio = response.audioContent.toString('base64');
        
        return res.status(200).json({ audio: base64Audio });
    } catch (error) {
        console.error("TTS generation error:", error);
        return res.status(500).json({ error: "Seslendirme işlemi sırasında bir hata oluştu." });
    }
});

app.get('/', (req, res) => {
    res.send('Masal Atölyesi Backend is running on Cloud Run.');
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
