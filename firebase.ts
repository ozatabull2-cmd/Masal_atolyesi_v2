import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ankaracocukV3 Firebase projesi — Ankara Çocuk uygulaması ile aynı veritabanı
const firebaseConfig = {
  apiKey: "AIzaSyAXH4MpMNJI_uIVQkPN_-NkZhJeg5Mt5UA",
  authDomain: "ankaracocukv3-b2182.firebaseapp.com",
  databaseURL: "https://ankaracocukv3-b2182-default-rtdb.firebaseio.com",
  projectId: "ankaracocukv3-b2182",
  storageBucket: "ankaracocukv3-b2182.firebasestorage.app",
  messagingSenderId: "678969625372",
  appId: "1:678969625372:web:6e910af53e1218ab4488d9",
  measurementId: "G-J4DFSMMWVL"
};

// Uygulamayı sadece bir kere başlat (hot-reload çakışmasını önler)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };

// masal_users koleksiyonu — Ankara Çocuk users koleksiyonuna dokunmadan ayrı tutar
// Firestore Rules'a gerek kalmadan public write olarak çalışması için ayrı koleksiyon kullanıyoruz

export const getUserQuota = async (email: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, "masal_users", email);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.quota || { count: 0, resetTime: null };
    } else {
      const defaultData = { count: 0, resetTime: null };
      await setDoc(docRef, { quota: defaultData, email }, { merge: true });
      return defaultData;
    }
  } catch (e) {
    console.error("Firebase getUserQuota error:", e);
    return null; // Hata olursa localStorage'a fallback
  }
};

export const updateUserQuota = async (email: string, newData: any) => {
  if (!db) return;
  try {
    const docRef = doc(db, "masal_users", email);
    await setDoc(docRef, { quota: newData, email, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.error("Firebase updateUserQuota error:", e);
  }
};
