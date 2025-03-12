import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";

import { 
    getAuth,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    getFirestore 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6LJHW63vlK6vNQOFt_-QGn8jWIvzCRWg",
    authDomain: "book--bridge.firebaseapp.com",
    projectId: "book--bridge",
    storageBucket: "book--bridge.firebasestorage.app",
    messagingSenderId: "52786369950",
    appId: "1:52786369950:web:19cb39b9db1ac82af7b28f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);




// Export Firebase instances for use in other files
export { auth, db };