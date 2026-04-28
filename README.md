<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1elb7Q6q5r_AKjqohSIK5JhqMv6Aagjua

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 📝 Son Yapılan Değişiklikler

### 1. Otomatik Giriş (URL Parametreleri)
- Uygulama, açılırken URL'deki `?email=...&name=...&role=...` parametrelerini otomatik olarak okur.
- Admin yetkisi güvenliğe alınarak sadece `ozgurweb112@gmail.com` adresine tanımlanmıştır. 

### 2. Admin (Süper Yetki) Ayrıcalıkları
- 12 saatlik kota ve her masal arası uygulanan 60 saniyelik dinlenme süreleri tamamen kaldırılmıştır.

### 3. Mobil İndirme Çözümleri (PDF & Ses)
- Uygulama içi (Webview) gömülü tarayıcı kısıtlamalarına karşın; indirme butonlarına tıklandığında Paylaşım, İndirme ve URL kopyalama seçeneklerini sunan akıllı bir yönlendirme modülü entegre edildi.


