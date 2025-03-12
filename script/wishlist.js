import { db, auth } from "./firebase.js";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const booksGrid = document.querySelector(".books-grid");
const noResults = document.getElementById("noResults");
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type'); // 'paid' or 'free'

async function fetchWishlist() {
    try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const wishlist = userDoc.data()?.wishlist || [];

        if (wishlist.length === 0) {
            noResults.style.display = "block";
            return;
        }

        // Query listings based on type
        const listingsRef = collection(db, "listings");
        const querySnapshot = await getDocs(listingsRef);
        const books = [];
        
        querySnapshot.forEach(doc => {
            const bookData = doc.data();
            if (wishlist.includes(doc.id) && bookData.for === (type === 'paid' ? "sale" : "donation")) {
                books.push({ id: doc.id, ...bookData });
            }
        });

        if (books.length === 0) {
            noResults.style.display = "block";
            return;
        }

        displayBooks(books);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        noResults.style.display = "block";
    }
}

// Function to display books
function displayBooks(books) {
    booksGrid.innerHTML = "";
    noResults.style.display = "none";

    books.forEach(book => {
        // Encode book data in base64
        const encodedBookData = btoa(JSON.stringify(book));
        
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");
        
        bookCard.innerHTML = `
            <img src="${book.imageUrl}" alt="${book.title}">
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="author">by ${book.author}</p>
                <p class="condition">Condition: ${book.condition}</p>
                ${type === 'paid' ? 
                    `<p class="price">₹${book.price}</p>` : 
                    `<p class="donation-type">Type: ${book.donationType === 'temporary' ? 'Temporary Donation' : 'Permanent Donation'}</p>`
                }
                <div class="actions">
                    <button class="buy-btn" onclick="openBookDetails('${encodedBookData}')">View</button>
                    <button class="cart-btn" onclick="removeFromWishlist('${book.id}')">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `;
        
        booksGrid.appendChild(bookCard);
    });
}

// Open book details modal
window.openBookDetails = function(encodedBookString) {
    try {
        const book = JSON.parse(atob(encodedBookString));
        
        if (type === 'paid') {
            window.location.href = `buy.html?id=${book.id}&showModal=true`;
        } else {
            window.location.href = `free.html?id=${book.id}&showModal=true`;
        }
    } catch (error) {
        console.error("Error opening book details:", error);
    }
};

// Simplified removeFromWishlist function
window.removeFromWishlist = async function(bookId) {
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return;

        const currentWishlist = userDoc.data().wishlist || [];
        const updatedWishlist = currentWishlist.filter(id => id !== bookId);

        await updateDoc(userRef, {
            wishlist: updatedWishlist
        });

        await fetchWishlist();
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        alert("Failed to remove book from wishlist. Please try again.");
    }
};

// Replace the DOMContentLoaded event listener with this
let authInitialized = false;

auth.onAuthStateChanged((user) => {
    if (!authInitialized && user) {
        authInitialized = true;
        fetchWishlist();
        
        // Setup modal close handlers
        const closeButtons = document.querySelectorAll(".close-btn");
        closeButtons.forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll(".modal").forEach(modal => {
                    modal.style.display = "none";
                });
            };
        });
    }
});
