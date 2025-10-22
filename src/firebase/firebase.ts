import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { environment } from "../environments/environment";

const firebaseConfig = {
    apiKey: environment.firebaseApiKey,
    authDomain: environment.firebaseAuthDomain,
    projectId: environment.firebaseProjectId,
    storageBucket: environment.firebaseStorageBucket,
    messagingSenderId: environment.firebaseMessagingSenderId,
    appId: environment.firebaseAppId
}


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);