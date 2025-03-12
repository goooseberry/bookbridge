import { auth, db } from "./firebase.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const storage = getStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImage(file) {
    if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Image size should be less than 5MB');
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    const returnDateContainer = document.querySelector('.return-date-container');
    const returnDateInput = document.getElementById('returnDate');
    const donationTypeInputs = document.querySelectorAll('input[name="donationType"]');

    // Improved date validation
    const today = new Date();
    const oneMonthFromNow = new Date(today.setMonth(today.getMonth() + 1));
    const maxDate = new Date(today.setFullYear(today.getFullYear() + 3));
    
    returnDateInput.min = oneMonthFromNow.toISOString().split('T')[0];
    returnDateInput.max = maxDate.toISOString().split('T')[0];

    returnDateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate < oneMonthFromNow) {
            alert('Return date must be at least one month from today');
            this.value = returnDateInput.min;
        } else if (selectedDate > maxDate) {
            alert('Return date cannot be more than 3 year from today');
            this.value = returnDateInput.max;
        }
    });

    // Toggle return date field visibility
    donationTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            returnDateContainer.style.display = e.target.value === 'temporary' ? 'block' : 'none';
            returnDateInput.required = e.target.value === 'temporary';
        });
    });

    // Handle Image Preview with validation
    document.getElementById("bookImage").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            try {
                validateImage(file);
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById("preview").src = e.target.result;
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert(error.message);
                event.target.value = '';
                document.getElementById("preview").src = "/assets/images/Book-Bridge.png";
            }
        }
    });

    // Single loading state function
    function setLoadingState(button, isLoading) {
        const buttonText = button.querySelector('.button-text');
        const loadingSpinner = button.querySelector('.loading-spinner');
        
        if (isLoading) {
            button.classList.add('loading');
            buttonText.style.display = 'none';
            loadingSpinner.style.display = 'inline-block';
        } else {
            button.classList.remove('loading');
            buttonText.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }

    // Handle form submission
    const bookDonateForm = document.getElementById('bookDonateForm');
    bookDonateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('.submit-btn');
        
        if (submitBtn.classList.contains('loading')) return;

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to donate a book.");
            return;
        }

        // Get form data
        const formData = {
            title: e.target.querySelector('input[name="title"]').value,
            author: e.target.querySelector('input[name="author"]').value,
            category: e.target.querySelector('input[name="category"]:checked')?.value,
            condition: e.target.querySelector('input[name="condition"]:checked')?.value,
            donationType: e.target.querySelector('input[name="donationType"]:checked')?.value,
            description: e.target.querySelector('textarea[name="description"]').value,
            returnDate: document.getElementById('returnDate').value || null
        };

        const file = document.getElementById("bookImage").files[0];

        // Validate form data
        if (!formData.title || !formData.author || !formData.category || 
            !formData.condition || !formData.donationType || !formData.description || !file) {
            alert("All fields are required.");
            return;
        }

        //  confirmation dialog
        const confirmMessage = `Please confirm the donation details:
        - Title: ${formData.title}
        - Author: ${formData.author}
        - Category: ${formData.category}
        - Condition: ${formData.condition}
        - Donation Type: ${formData.donationType}
        ${formData.returnDate ? `\n- Return Date: ${formData.returnDate}` : ''}

Are you sure you want to list this book?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            submitBtn.classList.add('loading');
            const imageUrl = await uploadImage(file);

            // Save Book Data and get the reference
            const bookRef = await addDoc(collection(db, "listings"), {
                ...formData,
                imageUrl,
                userId: user.uid,
                for: "donation",
                createdAt: serverTimestamp()
            });

            // Add book ID to user's document
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                donationlisting: arrayUnion(bookRef.id)
            });

            showCelebration();
            
            // Reset form
            bookDonateForm.reset();
            document.getElementById("preview").src = "/assets/images/Book-Bridge.png";
            returnDateContainer.style.display = 'none';

        } catch (error) {
            console.error("Error donating book:", error);
            alert(error.message || "Failed to donate book. Please try again.");
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
});

// Improved celebration function
function showCelebration() {
    const celebrationMsg = document.createElement('div');
    celebrationMsg.className = 'celebration-message';
    celebrationMsg.innerHTML = `
        <div class="celebration-content">
            <h1>Thank You for Your Generous Donation!</h1>
            <p>Your contribution will help others in their learning journey.</p>
        </div>
    `;
    celebrationMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        padding: 40px 60px;
        border-radius: 20px;
        color: white;
        text-align: center;
        z-index: 10000;
        animation: popIn 0.5s ease forwards;
    `;
    document.body.appendChild(celebrationMsg);

    // Create multiple confetti bursts with proper timing
    createConfetti();
    setTimeout(() => createConfetti(), 700);
    setTimeout(() => createConfetti(), 1400);

    setTimeout(() => {
        celebrationMsg.style.animation = 'popOut 0.5s ease forwards';
        setTimeout(() => {
            celebrationMsg.remove();
        }, 500);
    }, 4000);
}

async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `listings_cover/${auth.currentUser.uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            null,
            reject,
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
    });
}
