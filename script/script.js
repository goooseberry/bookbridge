// DOM Elements
const navbarMenu = document.querySelector(".navbar .links");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const hideMenuBtn = navbarMenu.querySelector(".close-btn");
const showLoginPopupBtn = document.querySelector(".login-btn");
const loginPopup = document.getElementById("login-popup");
const hidePopupBtns = document.querySelectorAll(".form-popup .close-btn");

// Show mobile menu
hamburgerBtn.addEventListener("click", () => {
    navbarMenu.classList.toggle("show-menu");
});

// Hide mobile menu
hideMenuBtn.addEventListener("click", () => hamburgerBtn.click());


// Show login popup
showLoginPopupBtn.addEventListener("click", () => {
    document.body.classList.add("show-popup");
    loginPopup.style.display = "block";
    // Hide other popups
    document.querySelectorAll(".form-popup").forEach(popup => {
        if (popup.id !== "login-popup") {
            popup.style.display = "none";
        }
    });
});

// Hide all popups when close button is clicked
hidePopupBtns.forEach(button => {
    button.addEventListener("click", () => {
        document.body.classList.remove("show-popup");
        document.querySelectorAll(".form-popup").forEach(popup => {
            popup.style.display = "none";
        });
    });
});

// Handle About Us, Contact, and Guideline popups
const aboutUsLink = document.getElementById("about-us-link");
const contactLink = document.getElementById("contact-link");
const guidelineLink = document.getElementById("guideline-link");

const aboutUsPopup = document.getElementById("about-us-popup");
const contactPopup = document.getElementById("contact-popup");
const guidelinePopup = document.getElementById("guideline-popup");

function showPopup(popupId) {
    document.body.classList.add("show-popup");
    document.getElementById(popupId).style.display = "block";
    document.querySelectorAll(".form-popup").forEach(popup => {
        if (popup.id !== popupId) {
            popup.style.display = "none";
        }
    });
}

aboutUsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPopup("about-us-popup");
});

contactLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPopup("contact-popup");
});

guidelineLink.addEventListener("click", (e) => {
    e.preventDefault();
    showPopup("guideline-popup");
});

// Toggle between login and signup forms
const signupLink = document.getElementById("signup-link");
const loginLink = document.getElementById("login-link");

signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginPopup.classList.add("show-signup");
});

loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginPopup.classList.remove("show-signup");
});

// Load content for About Us, Contact, and Guideline popups
document.addEventListener("DOMContentLoaded", () => {
    const loadText = async (file, elementId) => {
        try {
            const response = await fetch(file);
            const data = await response.text();
            document.getElementById(elementId).innerText = data;
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
        }
    };

    loadText("../assets/text/about.txt", "about-us-content");
    loadText("../assets/text/contact.txt", "contact-content");
    loadText("../assets/text/guideline.txt", "guideline-content");
});

// Video Popup Logic
const videoPopup = document.getElementById("video-popup");
const popupVideo = document.getElementById("popup-video");
const videoLink = document.getElementById("video-link");
const closeVideoBtn = document.getElementById("close-video");

videoLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".form-popup").forEach(popup => {
        popup.style.display = "none";
    });
    videoPopup.style.display = "block";
    document.body.classList.add("show-popup");
    setTimeout(() => {
        videoPopup.classList.add("show");
        popupVideo.play();
    }, 100);
});

closeVideoBtn.addEventListener("click", () => {
    videoPopup.classList.remove("show");
    document.body.classList.remove("show-popup");
    setTimeout(() => {
        videoPopup.style.display = "none";
        popupVideo.pause();
    }, 300);
});
