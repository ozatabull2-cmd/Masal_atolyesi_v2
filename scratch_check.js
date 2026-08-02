import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXH4MpMNJI_uIVQkPN_-NkZhJeg5Mt5UA",
  authDomain: "ankaracocukv3-b2182.firebaseapp.com",
  databaseURL: "https://ankaracocukv3-b2182-default-rtdb.firebaseio.com",
  projectId: "ankaracocukv3-b2182",
  storageBucket: "ankaracocukv3-b2182.firebasestorage.app",
  messagingSenderId: "678969625372",
  appId: "1:678969625372:web:6e910af53e1218ab4488d9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const querySnapshot = await getDocs(collection(db, "mini_apps"));
  querySnapshot.forEach((doc) => {
    console.log("MINI APP:", doc.id, "=>", JSON.stringify(doc.data()));
  });
}

main().catch(console.error);
