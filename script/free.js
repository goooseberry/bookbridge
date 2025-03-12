import { db, auth } from "./firebase.js";
import { collection, getDocs, query, where, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const booksGrid = document.querySelector(".books-grid");
const noResults = document.getElementById("noResults");
const searchInput = document.querySelector(".search-bar input");
const categoryFilters = document.querySelectorAll("input[name='category']");
const donationTypeFilters = document.querySelectorAll("input[name='donation-type']");

let books = [];
let filteredBooks = [];

async function fetchBooks() {
    booksGrid.innerHTML = "";
    try {
        // Create query to only fetch books listed for donation
        const booksQuery = query(
            collection(db, "listings"),
            where("for", "==", "donation")
        );
        
        const querySnapshot = await getDocs(booksQuery);
        books = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (books.length === 0) {
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
            applyFiltersAndSorting();
        }

        // Check URL parameters after books are loaded
        checkUrlAndOpenModal();
    } catch (error) {
        console.error("Error fetching books:", error);
        noResults.style.display = "block";
    }
}

async function isBookInWishlist(bookId) {
    const user = auth.currentUser;
    if (!user) return false;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data().wishlist?.includes(bookId);
}

function displayBook(book) {
    const bookCard = document.createElement("div");
    bookCard.classList.add("book-card");
    
    isBookInWishlist(book.id).then(isWishlisted => {
        bookCard.innerHTML = `
            <img src="${book.imageUrl}" alt="${book.title}">
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="author">by ${book.author}</p>
                <p class="condition">Condition: ${book.condition}</p>
                <p class="donation-type">Type: ${book.donationType === 'temporary' ? 'Temporary Donation' : 'Permanent Donation'}</p>
                <div class="actions">
                    <button class="buy-btn" onclick="openBookDetails(${JSON.stringify(book).replace(/"/g, '&quot;')})">View</button>
                    <button class="cart-btn" onclick="addToWishlist('${book.id}', this)">
                        <span class="material-symbols-rounded">${isWishlisted ? 'favorite' : 'favorite_border'}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    booksGrid.appendChild(bookCard);
}

// Open book details modal with donation-specific information
window.openBookDetails = function(book) {
    const bookDetailsModal = document.getElementById("bookDetailsModal");
    bookDetailsModal.querySelector(".modal-book-image").src = book.imageUrl;
    bookDetailsModal.querySelector("h2").textContent = book.title;
    bookDetailsModal.querySelector(".modal-author").textContent = `by ${book.author}`;
    bookDetailsModal.querySelector(".modal-condition").textContent = `Condition: ${book.condition}`;
    bookDetailsModal.querySelector(".modal-donation-type").textContent = 
        book.donationType === 'temporary' ? 'Temporary Donation' : 'Permanent Donation';
    
    // Return date display
    if (book.returnDate) {
        bookDetailsModal.querySelector(".modal-return-date").textContent = 
            `Return by: ${new Date(book.returnDate).toLocaleDateString()}`;
        bookDetailsModal.querySelector(".modal-return-date").style.display = "block";
    } else {
        bookDetailsModal.querySelector(".modal-return-date").style.display = "none";
    }
    
    bookDetailsModal.querySelector(".modal-description").textContent = book.description;
    
    // Update modal actions to match buy page style
    const modalActions = bookDetailsModal.querySelector(".modal-actions");
    modalActions.innerHTML = `
        <button class="request-btn" onclick="initiateRequest('${book.id}')">Request Book</button>
    `;

    bookDetailsModal.style.display = "block";
};

// Add request initiation function
window.initiateRequest = function(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    showRequestForm(book.id, book.title, book.userId);
};

// Add new functions for handling the request form
window.showRequestForm = function(bookId, bookTitle, ownerId) {
    const requestFormModal = document.getElementById("requestFormModal");
    requestFormModal.dataset.bookId = bookId;
    requestFormModal.dataset.bookTitle = bookTitle;
    requestFormModal.dataset.ownerId = ownerId;
    
    document.getElementById("bookDetailsModal").style.display = "none";
    requestFormModal.style.display = "block";
};

window.closeRequestForm = function() {
    document.getElementById("requestFormModal").style.display = "none";
};

// Add form submission handler
document.getElementById("requestForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Get submit button and disable it
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; // Prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const modal = document.getElementById("requestFormModal");
        const bookId = modal.dataset.bookId;
        const bookTitle = modal.dataset.bookTitle;
        const ownerId = modal.dataset.ownerId;
        
        const user = auth.currentUser;
        if (!user) {
            alert("Please sign in to request books");
            return;
        }

        // Get book and user data
        const [bookDoc, ownerDoc, requesterDoc] = await Promise.all([
            getDoc(doc(db, "listings", bookId)),
            getDoc(doc(db, "users", ownerId)),
            getDoc(doc(db, "users", user.uid))
        ]);

        if (!bookDoc.exists()) throw new Error("Book not found");
        if (!ownerDoc.exists()) throw new Error("Book owner not found");
        
        const bookData = bookDoc.data();
        const ownerData = ownerDoc.data();
        const requesterData = requesterDoc.exists() ? requesterDoc.data() : {};

        // Form data
        const contactEmail = document.getElementById("contactEmail").value;
        const contactPhone = document.getElementById("contactPhone").value;
        const message = document.getElementById("message").value;

        if (!contactEmail) throw new Error("Please provide your contact email");

        // Get formatted return date if it exists
        const returnDateText = bookData.donationType === 'temporary' && bookData.returnDate 
            ? `<p><strong>Return Date Required:</strong> ${new Date(bookData.returnDate).toLocaleDateString()}</p>` 
            : '';

        // Send email through Firebase Extension
        await setDoc(doc(collection(db, "mail")), {
            to: [ownerData.email],
            message: {
                subject: `New Request for Your ${bookData.donationType === 'temporary' ? 'Temporary' : 'Permanent'} Donation Book: ${bookTitle}`,
                html: `
                    <h2>Hello ${ownerData.name || 'Book Owner'},</h2>
                    <p>You have received a new request for your book donation:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="color: #00bcd4; margin-bottom: 10px;">${bookData.title}</h3>
                        <p><strong>Author:</strong> ${bookData.author}</p>
                        <p><strong>Condition:</strong> ${bookData.condition}</p>
                        <p><strong>Donation Type:</strong> ${bookData.donationType === 'temporary' ? 'Temporary Donation' : 'Permanent Donation'}</p>
                        ${returnDateText}
                    </div>

                    <h3>Request Details:</h3>
                    <ul>
                        <li><strong>From:</strong> ${requesterData.name || user.email.split('@')[0]}</li>
                        <li><strong>Contact Options:</strong>
                            <ul>
                                <li>Email: ${contactEmail}</li>
                                ${contactPhone ? `<li>Phone: ${contactPhone}</li>` : ''}
                            </ul>
                        </li>
                    </ul>

                    <h3>Message from Requester:</h3>
                    <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
                    
                    <div style="background-color: #ffeb3b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333; margin-bottom: 10px;">⚠️ Important Reminder</h3>
                        <p style="color: #333;">After completing the donation, please remember to remove this listing from BookBridge through your account dashboard.</p>
                    </div>

                    <hr style="margin: 20px 0;">
                    <p>Best regards,<br>BookBridge Team</p>
                `
            }
        });

        alert("Request sent successfully! The book owner will be notified via email.");
        closeRequestForm();
        document.getElementById("requestForm").reset();
    } catch (error) {
        console.error("Error sending request:", error);
        alert(error.message || "Failed to send request. Please try again.");
    } finally {
        // Re-enable the button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
    }
});

function applyFiltersAndSorting() {
    // 1. Filter by category
    const selectedCategory = document.querySelector("input[name='category']:checked").id;
    filteredBooks = selectedCategory === "all"
        ? [...books]
        : books.filter(book => book.category.toLowerCase() === selectedCategory);

    // 2. Filter by donation type
    const selectedDonationType = document.querySelector("input[name='donation-type']:checked")?.id;
    if (selectedDonationType) {
        filteredBooks = filteredBooks.filter(book => 
            book.donationType === selectedDonationType
        );
    }

    // 3. Apply search filter
    const query = searchInput.value.toLowerCase();
    filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query)
    );

    displayResults(filteredBooks);
}

// Add missing displayResults function
function displayResults(results) {
    booksGrid.innerHTML = "";

    if (results.length === 0) {
        noResults.style.display = "block";
        return;
    }

    noResults.style.display = "none";
    results.forEach(displayBook);
}

// Add modal close functionality
document.querySelectorAll(".close-btn").forEach(btn => {
    btn.onclick = function () {
        document.querySelectorAll(".modal").forEach(modal => {
            modal.style.display = "none";
        });
    };
});

// Add request confirmation handling
window.requestBook = function(bookId) {
    const confirmationModal = document.getElementById("requestModal");
    // Set book details in confirmation modal
    confirmationModal.style.display = "block";
};

// Add the same addToWishlist function
window.addToWishlist = async function(bookId, buttonElement) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert("Please sign in to add books to your wishlist");
            return;
        }

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const isInWishlist = userDoc.exists() && userDoc.data().wishlist?.includes(bookId);

        if (!userDoc.exists() || !userDoc.data().wishlist) {
            await setDoc(userRef, { wishlist: [] }, { merge: true });
        }

        await updateDoc(userRef, {
            wishlist: isInWishlist ? arrayRemove(bookId) : arrayUnion(bookId)
        });

        const heartIcon = buttonElement.querySelector('.material-symbols-rounded');
        heartIcon.textContent = isInWishlist ? 'favorite_border' : 'favorite';

        alert(isInWishlist ? "Book removed from wishlist!" : "Book added to wishlist successfully!");
    } catch (error) {
        console.error("Error updating wishlist:", error);
        alert("Failed to update wishlist. Please try again.");
    }
};

// Event listeners
categoryFilters.forEach(filter => {
    filter.addEventListener("change", applyFiltersAndSorting);
});

donationTypeFilters.forEach(filter => {
    filter.addEventListener("change", applyFiltersAndSorting);
});

searchInput.addEventListener("input", applyFiltersAndSorting);

window.onload = fetchBooks;

function checkUrlAndOpenModal() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showModal') === 'true') {
        const bookId = urlParams.get('id');
        const book = books.find(b => b.id === bookId);
        if (book) {
            window.openBookDetails(book);
        }
    }
}
