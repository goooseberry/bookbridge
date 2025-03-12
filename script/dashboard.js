import { auth, db } from "./firebase.js";
import { 
    collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc, arrayRemove, arrayUnion 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { 
    getStorage, ref, deleteObject 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

const storage = getStorage();

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        loadUserProfile(user);
        loadUserBooks(user.uid);
    }
});

// Load user profile information
async function loadUserProfile(user) {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        document.getElementById("userName").textContent = userData.name || 'User';
        document.getElementById("userEmail").textContent = user.email;
        document.getElementById("joinDate").textContent = `Member since: ${new Date(userData.createdAt.toDate()).toLocaleDateString()}`;
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

// Load user's books
async function loadUserBooks(userId) {
    try {
        const [sellingBooks, donatedBooks] = await Promise.all([
            getListings(userId, "sale"),
            getListings(userId, "donation")
        ]);

        // Fetch user document to get booksSold and booksDonated
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();
        const booksSoldCount = userData.soldbooks ? userData.soldbooks.length : 0;
        const booksDonatedCount = userData.donatedbooks ? userData.donatedbooks.length : 0;

        // Update statistics
        document.getElementById("booksSoldCount").textContent = booksSoldCount;
        document.getElementById("booksDonatedCount").textContent = booksDonatedCount;
        document.getElementById("activeListingsCount").textContent = sellingBooks.length + donatedBooks.length;

        // Display books
        displayBooks("sellingBooks", sellingBooks);
        displayBooks("donatedBooks", donatedBooks);
    } catch (error) {
        console.error("Error loading books:", error);
    }
}

// Fetch listings by type
async function getListings(userId, type) {
    const q = query(
        collection(db, "listings"),
        where("userId", "==", userId),
        where("for", "==", type)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Display books in respective tabs
function displayBooks(containerId, books) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (books.length === 0) {
        container.innerHTML = `
            <div class="no-books">
                <p>No books found</p>
            </div>
        `;
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <img src="${book.imageUrl}" alt="${book.title}">
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>by ${book.author}</p>
                <p>Category: ${book.category}</p>
                <p>Condition: ${book.condition}</p>
                ${book.for === 'sale' 
                    ? `<p>Price: ₹${book.price}</p>`
                    : `<p>Type: ${book.donationType} donation</p>`
                }
                <div class="book-actions">
                    <button class="edit-btn" onclick="markAsCompleted('${book.id}', '${book.for}')">
                        Mark as ${book.for === 'sale' ? 'Sold' : 'Donated'}
                    </button>
                    <button class="delete-btn" onclick="deleteListing('${book.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(bookCard);
    });
}

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show corresponding content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(button.dataset.tab + 'Books').style.display = 'grid';
    });
});

// Extract file path from imageUrl
function extractFilePathFromUrl(imageUrl) {
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    return decodedUrl.substring(startIndex, endIndex);
}

// Delete listing and image
window.deleteListing = async function(bookId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
        // Get the book document to retrieve the imageUrl
        const bookDoc = await getDoc(doc(db, "listings", bookId));
        const bookData = bookDoc.data();

        // Delete the image from Firebase Storage
        if (bookData.imageUrl) {
            const filePath = extractFilePathFromUrl(bookData.imageUrl);
            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
        }

        // Delete the book from the listings collection
        await deleteDoc(doc(db, "listings", bookId));

        // Remove the book ID from the user's arrays
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            donationlisting: arrayRemove(bookId),
            sellinglisting: arrayRemove(bookId)
        });

        // Reload books
        loadUserBooks(auth.currentUser.uid);
    } catch (error) {
        console.error("Error deleting listing:", error);
        alert("Failed to delete listing. Please try again.");
    }
};

// Mark listing as completed and delete image
window.markAsCompleted = async function(bookId, type) {
    if (!confirm(`Mark this book as ${type === 'sale' ? 'sold' : 'donated'}?`)) return;

    try {
        // Get the book document to retrieve the imageUrl
        const bookDoc = await getDoc(doc(db, "listings", bookId));
        const bookData = bookDoc.data();

        // Delete the image from Firebase Storage
        if (bookData.imageUrl) {
            const filePath = extractFilePathFromUrl(bookData.imageUrl);
            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
        }

        // Delete the book from the listings collection
        await deleteDoc(doc(db, "listings", bookId));

        // Update the user's document
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            [`${type === 'sale' ? 'sellinglisting' : 'donationlisting'}`]: arrayRemove(bookId),
            [`${type === 'sale' ? 'soldbooks' : 'donatedbooks'}`]: arrayUnion(bookId)
        });

        // Reload books
        loadUserBooks(auth.currentUser.uid);
    } catch (error) {
        console.error("Error updating listing:", error);
        alert("Failed to update listing. Please try again.");
    }
};