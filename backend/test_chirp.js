import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';

const ttsClient = new textToSpeech.TextToSpeechClient();

async function testChirpHDVoices() {
    console.log("Generating samples for Google Cloud Chirp3-HD (Studio Quality Generative Voices)...");
    
    const textToSay = "Bir zamanlar, pofuduk bulutların üzerinde yaşayan küçük bir yıldız varmış. Gökyüzünde parıldamayı ve çocuklara tatlı rüyalar fısıldamayı çok severmiş.";

    const chirpVoices = [
        { name: 'tr-TR-Chirp3-HD-Achernar', label: 'Achernar (Kadın - Masalsı)' },
        { name: 'tr-TR-Chirp3-HD-Aoede', label: 'Aoede (Kadın - Yumuşak Ton)' },
        { name: 'tr-TR-Chirp3-HD-Kore', label: 'Kore (Kadın - Tatlı Anlatıcı)' },
        { name: 'tr-TR-Chirp3-HD-Puck', label: 'Puck (Erkek - Canlı/Hikayeci)' },
        { name: 'tr-TR-Chirp3-HD-Zephyr', label: 'Zephyr (Kadın - Sıcak Ton)' }
    ];

    const outputDir = path.join(process.cwd(), 'test_output_chirp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const v of chirpVoices) {
        try {
            console.log(`Generating audio for Chirp 3 HD: ${v.label}...`);
            const request = {
                input: { text: textToSay },
                voice: { languageCode: 'tr-TR', name: v.name },
                audioConfig: { audioEncoding: 'MP3' },
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

testChirpHDVoices();
