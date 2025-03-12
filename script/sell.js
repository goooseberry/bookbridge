import { auth, db } from "./firebase.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const storage = getStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Function to validate image
function validateImage(file) {
    if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Image size should be less than 5MB');
    }
    return true;
}

// Handle Image Preview
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
            event.target.value = ''; // Reset file input
            document.getElementById("preview").src = "/assets/images/Book-Bridge.png";
        }
    }
});

// Function to Upload Image
async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `listings_cover/${auth.currentUser.uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // Track upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
                console.error("Error uploading file: ", error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

// Handle Form Submission
document.getElementById("bookSellForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    if (submitBtn.classList.contains('loading')) return; // Prevent multiple submissions

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to list a book.");
        return;
    }

    const title = document.querySelector("input[name='title']")?.value;
    const author = document.querySelector("input[name='author']")?.value;
    const price = document.querySelector("input[name='price']")?.value;
    const category = document.querySelector("input[name='category']:checked")?.value;
    const condition = document.querySelector("input[name='condition']:checked")?.value;
    const description = document.querySelector("textarea[name='description']")?.value;
    const file = document.getElementById("bookImage").files[0];

    if (!title || !author || !price || !category || !condition || !description || !file) {
        alert("All fields are required.");
        return;
    }

    // Add confirmation dialog
    const confirmMessage = `Please confirm the book details:
    - Title: ${title}
    - Author: ${author}
    - Price: ${price}
    - Category: ${category}
    - Condition: ${condition}

Are you sure you want to list this book?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        submitBtn.classList.add('loading'); // Add loading state
        
        // Validate image before upload
        validateImage(file);
        
        // Upload Image and Get URL
        const imageUrl = await uploadImage(file);

        // Save Book Data and get the reference
        const bookRef = await addDoc(collection(db, "listings"), {
            title,
            author,
            price,
            category,
            condition,
            description,
            imageUrl,
            userId: user.uid,
            for: "sale",
            createdAt: serverTimestamp()
        });

        // Add book ID to user's document
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            sellinglisting: arrayUnion(bookRef.id)
        });

        alert("Book listed successfully!");
        document.getElementById("bookSellForm").reset();
        document.getElementById("preview").src = "/assets/images/Book-Bridge.png"; // Reset image preview
    } catch (error) {
        console.error("Error listing book:", error);
        alert(error.message || "Failed to list book. Please try again.");
    } finally {
        submitBtn.classList.remove('loading'); // Remove loading state
    }
});
