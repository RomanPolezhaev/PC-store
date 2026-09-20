import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZaFyD_NTc6ogr79SPlCWmMBuCQhyFcIk",
  authDomain: "pc-store-c6d53.firebaseapp.com",
  projectId: "pc-store-c6d53",
  storageBucket: "pc-store-c6d53.firebasestorage.app",
  messagingSenderId: "123680427567",
  appId: "1:123680427567:web:62ee6877938f8e8dd600da",
  measurementId: "G-5S430G4CWY",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };
