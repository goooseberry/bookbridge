import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    setPersistence, 
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    getFirestore 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6LJHW63vlK6vNQOFt_-QGn8jWIvzCRWg",
    authDomain: "book--bridge.firebaseapp.com",
    projectId: "book--bridge",
    storageBucket: "book--bridge.appspot.com",
    messagingSenderId: "52786369950",
    appId: "1:52786369950:web:19cb39b9db1ac82af7b28f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistence set successfully");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Check authentication state
export function checkAuthState(redirectIfUnauthenticated = true) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:", user.email);
            if (window.location.href.includes("index.html")){
                window.location.href = "home.html";
            }
        } else if (redirectIfUnauthenticated) {
            window.location.href = "index.html";
        }
    });
}


// Export Firebase instances for use in other files
export { auth, db };