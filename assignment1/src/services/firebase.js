// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import {
    getAuth,
    // connectAuthEmulator
  } from 'firebase/auth'
  import {
    getFirestore,
    // connectFirestoreEmulator
  } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHsi3KJ3rSrWu_Lx7jHwqYefHuMlk83vI",
  authDomain: "basketballhub-5b97d.firebaseapp.com",
  projectId: "basketballhub-5b97d",
  storageBucket: "basketballhub-5b97d.firebasestorage.app",
  messagingSenderId: "44673832762",
  appId: "1:44673832762:web:36625e2dea690fa55e2203"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)

// connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
// connectFirestoreEmulator(db, '127.0.0.1', 8080)

export { app, auth, db }