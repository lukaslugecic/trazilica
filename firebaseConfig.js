// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUqi7tah1ILHxdO5Pgt8EkDIWvlx2RlPo",
  authDomain: "trazilica-441520.firebaseapp.com",
  databaseURL: "https://trazilica-441520-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trazilica-441520",
  storageBucket: "trazilica-441520.firebasestorage.app",
  messagingSenderId: "768428277395",
  appId: "1:768428277395:web:431840878a1883cd301766"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;