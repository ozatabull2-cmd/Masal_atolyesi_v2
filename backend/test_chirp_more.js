import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';

const ttsClient = new textToSpeech.TextToSpeechClient();

async function testMoreChirpVoices() {
    console.log("Generating samples for ALL remaining Chirp3-HD Turkish Female Voices...");
    
    const textToSay = "Bir zamanlar, pofuduk bulutların üzerinde yaşayan küçük bir yıldız varmış. Gökyüzünde parıldamayı ve çocuklara tatlı rüyalar fısıldamayı çok severmiş.";

    const remainingVoices = [
        { name: 'tr-TR-Chirp3-HD-Autonoe', label: 'Autonoe (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Callirrhoe', label: 'Callirrhoe (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Despina', label: 'Despina (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Erinome', label: 'Erinome (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Gacrux', label: 'Gacrux (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Laomedeia', label: 'Laomedeia (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Leda', label: 'Leda (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Pulcherrima', label: 'Pulcherrima (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Sulafat', label: 'Sulafat (Kadın)' },
        { name: 'tr-TR-Chirp3-HD-Vindemiatrix', label: 'Vindemiatrix (Kadın)' }
    ];

    const outputDir = path.join(process.cwd(), 'test_output_chirp_more');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const v of remainingVoices) {
        try {
            console.log(`Generating audio for: ${v.name}...`);
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

testMoreChirpVoices();
