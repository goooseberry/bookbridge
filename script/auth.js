import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged, 
    setPersistence, 
    browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Set persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistence set successfully");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
        
        
    } else {
        if (!window.location.href.includes("index.html")) {
            window.location.href = "index.html";
        }
    }
});


//redirection from home page 
const homeLink = document.getElementById('home-link');
if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior

        const user = auth.currentUser; // Get the current user
        if (user) {
            // If user is logged in, redirect to home.html
            window.location.href = "home.html";
        } else {
            // If user is not logged in, show an alert
            alert("YOU SHALL NOT PASS! Login to continue.");
        }
    });
}

// Signup
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            // Store user data with UID as document ID
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                createdAt: new Date()
            });

            alert('Signup successful! Please check your email for verification.');
        } catch (error) {
            console.error('Error during signup:', error);
            alert(error.message);
        }
    });
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                alert('Please verify your email before logging in.');
                // Hide the "Don't have an account? Signup" link
                document.getElementById('signup-link-container').style.display = 'none';
                // Show the "Resend Verification Email" link
                document.getElementById('resendVerification').style.display = 'block';
            } else {
                window.location.href = 'home.html';
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert(error.message);
        }
    });
}
// Resend verification email
const resendVerificationLink = document.getElementById('resendVerificationLink');
if (resendVerificationLink) {
    resendVerificationLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            try {
                await sendEmailVerification(user);
                alert('Verification email resent! Check your inbox.');
            } catch (error) {
                console.error('Error resending verification email:', error);
                alert(error.message);
            }
        } else {
            alert('No user is currently logged in.');
        }
    });
}

// Forgot password
const forgotPasswordLink = document.getElementById('forgot-password-link');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt('Please enter your email:');

        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert('Password reset email sent!');
            } catch (error) {
                console.error('Error sending password reset email:', error);
                alert(error.message);
            }
        }
    });
}

