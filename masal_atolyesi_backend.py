from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
import base64

app = FastAPI(title="Masal Atölyesi - Vertex AI Backend")

# Initialize the Gemini client via Vertex AI
# Bu yapı Cloud Run servis hesabını (ADC) otomatik kullanarak güvenlik sağlar, API Key gerektirmez.
client = genai.Client(
    vertexai=True, 
    project="project-e771c06e-1856-4706-96d", 
    location="us-central1"
)

# İstek Modelleri
class TextRequest(BaseModel):
    prompt: str

class ImageRequest(BaseModel):
    prompt: str

class AudioRequest(BaseModel):
    text: str


@app.post("/generate-masal-metni")
def generate_masal_metni(req: TextRequest):
    """
    Masal Metni Üretimi
    Model: gemini-2.5-flash
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=req.prompt,
            config=types.GenerateContentConfig(
                system_instruction="Sen 3-10 yaş grubuna uygun, pedagojik açıdan güvenli, eğlenceli ve öğretici bir çocuk masalı yazarısın. Yazdığın tüm masallar çocuk ruhuna uygun, sevgi dolu, eğitici ve her zaman pozitif olmalıdır."
            )
        )
        return {"status": "success", "text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-masal-gorseli")
def generate_masal_gorseli(req: ImageRequest):
    """
    Masal Görseli Üretimi
    Model: imagen-4.0-fast-generate-001 (Onaylanmış aktif model)
    """
    try:
        # Prompta ortak stil, 3D görünüm ve güvenlik parametrelerini ekliyoruz
        enhanced_prompt = f"{req.prompt}, pixar style 3d render, cute children's book illustration, vibrant colors, safe for kids"
        
        response = client.models.generate_images(
            model='imagen-4.0-fast-generate-001',
            prompt=enhanced_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png",
                aspect_ratio="1:1"
            )
        )
        
        if response.generated_images and len(response.generated_images) > 0:
            image_bytes = response.generated_images[0].image.image_bytes
            b64_img = base64.b64encode(image_bytes).decode('utf-8')
            return {"status": "success", "image": f"data:image/png;base64,{b64_img}"}
            
        raise HTTPException(status_code=500, detail="Görsel üretilemedi veya güvenlik filtresine (Safety Filter) takıldı.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-masal-sesi")
def generate_masal_sesi(req: AudioRequest):
    """
    Masal Sesi Üretimi (Text-to-Speech)
    Model: gemini-3.1-flash-tts-preview
    """
    try:
        # Doğal, sıcak ve vurgulu bir insan sesi elde etmek için ön talimat
        system_instruction = "Sen profesyonel bir çocuk masalı anlatıcısısın. Hikayeyi son derece doğal, sıcak, vurgulu ve gerçek bir insan gibi seslendir."
        
        response = client.models.generate_content(
            model='gemini-3.1-flash-tts-preview',
            contents=req.text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Callirrhoe" # Doğal ve insansı Gemini 3.1 sesi
                        )
                    )
                )
            )
        )
        
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                return {"status": "success", "audio": f"data:{part.inline_data.mime_type};base64,{b64_audio}"}
                
        raise HTTPException(status_code=500, detail="Ses üretilemedi. Modelden geçerli bir ses çıktısı alınamadı.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Kodu lokalde denemek için terminalden çalıştırın:
# uvicorn masal_atolyesi_backend:app --host 0.0.0.0 --port 8080
