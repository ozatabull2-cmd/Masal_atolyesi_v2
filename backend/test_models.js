import { GoogleGenAI, Type } from '@google/genai';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const project = "project-e771c06e-1856-4706-96d";
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

console.log(`Starting AI Benchmark Test with Project: ${project}`);

const ttsClient = new textToSpeech.TextToSpeechClient();

const getAIClient = () => {
    return new GoogleGenAI({
        vertexai: true,
        project,
        location
    });
};

async function testStoryText() {
    console.log("\n--- Testing Story Text Generation (Gemini 1.5 Pro vs Gemini 2.5 Flash) ---");
    const ai = getAIClient();

    const sampleInput = {
        childName: "Deniz",
        age: "3-5",
        gender: "Erkek",
        category: "Uzay Macera",
        moral: "Yardımseverlik",
        hairColor: "Kahverengi",
        eyeColor: "Yeşil"
    };

    const prompt = `
      Sen profesyonel bir çocuk kitabı yazarı ve sanat yönetmenisin.
      Aşağıdaki bilgilerle 3-5 yaşındaki bir çocuk için 1 sayfalık örnek masal paragrafı oluştur:
      - Kahraman Adı: ${sampleInput.childName}
      - Yaş Grubu: ${sampleInput.age}
      - Kategori: ${sampleInput.category}
      - Öğüt: ${sampleInput.moral}

      KURALLAR:
      1. Dil: Türkçe. Çocuk psikolojisine uygun, masalsı, sıcak, akıcı ve merak uyandıran bir dil kullan.
      2. 3-5 yaş grubuna uygun duygu dolu, kısa ve melodik cümleler kullan.
      3. İngilizce görsel istemi (imagePrompt) "Whimsical children's book illustration, Pixar 3D style, soft warm lighting, 8k" stilini içersin.
      JSON FORMATINDA yanıt ver: { "title": "", "text": "", "imagePrompt": "" }
    `;

    try {
        console.log("Generating with gemini-2.5-pro...");
        const responsePro = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        console.log("\n[Gemini 2.5 Pro Output]:");
        console.log(responsePro.text);

        return JSON.parse(responsePro.text);
    } catch (err) {
        console.error("Gemini 1.5 Pro error:", err.message);
        return null;
    }
}

async function testVoice(sampleText) {
    console.log("\n--- Testing Speech Synthesis (Neural2 Voices) ---");
    const textToSay = sampleText || "Bir zamanlar, küçük çocuk Deniz gökyüzündeki yıldızları çok severmiş. Her gece penceresinden el sallar, onlara iyi geceler dermiş.";

    const voicesToTest = [
        { name: 'tr-TR-Standard-A', label: 'Standard-A (Kadın)' },
        { name: 'tr-TR-Standard-B', label: 'Standard-B (Erkek)' },
        { name: 'tr-TR-Wavenet-A', label: 'Wavenet-A (Mevcut Ses)' },
        { name: 'tr-TR-Wavenet-B', label: 'Wavenet-B (Erkek Wavenet)' },
        { name: 'tr-TR-Wavenet-C', label: 'Wavenet-C (Kadın Wavenet)' },
        { name: 'tr-TR-Wavenet-D', label: 'Wavenet-D (Kadın Wavenet 2)' }
    ];

    const outputDir = path.join(process.cwd(), 'test_output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const v of voicesToTest) {
        try {
            console.log(`Generating audio for: ${v.label}...`);
            const request = {
                input: { text: textToSay },
                voice: { languageCode: 'tr-TR', name: v.name },
                audioConfig: { 
                    audioEncoding: 'MP3',
                    speakingRate: 0.92,
                    pitch: 1.0
                },
            };
            const [response] = await ttsClient.synthesizeSpeech(request);
            const filePath = path.join(outputDir, `${v.name}.mp3`);
            fs.writeFileSync(filePath, response.audioContent);
            console.log(`Saved: ${filePath}`);
        } catch (err) {
            console.error(`Error generating ${v.name}:`, err.message);
        }
    }
}

async function testImage(prompt) {
    console.log("\n--- Testing Image Generation (Imagen 3.0 vs Imagen 4.0 Fast) ---");
    const ai = getAIClient();

    const imagePrompt = prompt || "Whimsical children's book illustration, Pixar 3D style, soft warm lighting. A cute 4 year old boy with brown hair and green eyes looking at floating glowing stars inside his bedroom.";

    const outputDir = path.join(process.cwd(), 'test_output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const modelsToTest = [
        { id: 'imagen-3.0-generate-002', label: 'Imagen 3.0 High Quality' },
        { id: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' }
    ];

    for (const m of modelsToTest) {
        try {
            console.log(`Generating image with ${m.label}...`);
            const response = await ai.models.generateImages({
                model: m.id,
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '1:1',
                    outputMimeType: 'image/png'
                }
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64Image = response.generatedImages[0].image.imageBytes;
                const buffer = Buffer.from(base64Image, 'base64');
                const filePath = path.join(outputDir, `${m.id}.png`);
                fs.writeFileSync(filePath, buffer);
                console.log(`Saved image: ${filePath}`);
            } else {
                console.log(`${m.label} returned no image or was blocked.`);
            }
        } catch (err) {
            console.error(`Error generating image with ${m.id}:`, err.message);
        }
    }
}

async function runAllTests() {
    const storyData = await testStoryText();
    const sampleText = storyData?.text;
    const sampleImagePrompt = storyData?.imagePrompt;

    await testVoice(sampleText);
    await testImage(sampleImagePrompt);

    console.log("\nAll tests completed! Check the 'backend/test_output' directory for generated MP3 and PNG files.");
}

runAllTests();
