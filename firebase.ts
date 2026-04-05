import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// TODO: Lütfen Firebase Console'dan aldığınız yapılandırma kodlarını buraya yapıştırın.
const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_GELECEK",
  authDomain: "BURAYA_AUTH_DOMAIN_GELECEK",
  projectId: "BURAYA_PROJECT_ID_GELECEK",
  storageBucket: "BURAYA_STORAGE_BUCKET_GELECEK",
  messagingSenderId: "BURAYA_SENDER_ID_GELECEK",
  appId: "BURAYA_APP_ID_GELECEK"
};

// Yalnızca yapılandırma tamamlandıysa Firebase'i başlat
const app = firebaseConfig.apiKey !== "BURAYA_API_KEY_GELECEK" ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export { app, db };

// Kullanıcı kotasını Firestore'dan getiren yardımcı fonksiyon
export const getUserQuota = async (email: string) => {
  if (!db) return null;
  const docRef = doc(db, "users", email);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Kullanıcı ilk defa geliyorsa varsayılan kotayı oluştur
    const defaultData = { count: 0, resetTime: null };
    await setDoc(docRef, defaultData);
    return defaultData;
  }
};

// Kullanıcı kotasını güncelleyen yardımcı fonksiyon
export const updateUserQuota = async (email: string, newData: any) => {
  if (!db) return;
  const docRef = doc(db, "users", email);
  await updateDoc(docRef, newData);
};
