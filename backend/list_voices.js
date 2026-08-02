import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';

const ttsClient = new textToSpeech.TextToSpeechClient();

async function listAllTurkishVoices() {
    console.log("Listing all available Turkish (tr-TR) voices in Google Cloud TTS...");
    const [result] = await ttsClient.listVoices({ languageCode: 'tr-TR' });
    const voices = result.voices || [];
    
    console.log(`Found ${voices.length} Turkish voices:\n`);
    for (const v of voices) {
        console.log(`Name: ${v.name} | Gender: ${v.ssmlGender} | RateHz: ${v.naturalSampleRateHertz}`);
    }
}

listAllTurkishVoices();
