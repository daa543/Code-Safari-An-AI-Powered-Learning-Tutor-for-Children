// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLtbwrVgpjYZp0HBNu-qLkr8D4ON3_B1s",
    authDomain: "code-safari.firebaseapp.com",
    projectId: "code-safari",
    storageBucket: "code-safari.firebasestorage.app",
    messagingSenderId: "167734114377",
    appId: "1:167734114377:web:660577af30fb9b289ca798"
};

// Initialize Firebase
if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Auth instance
const auth = firebase.auth();

// Helper Function: Show Error Message
function showError(form, message) {
    const existingError = form.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
}

// Google Sign-In
async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        window.location.href = "/html.html"; // Redirect to Dashboard
    } catch (error) {
        showError(document.querySelector(".auth-form"), "Google sign-in failed: " + error.message);
    }
}

// Login Form Handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/html.html"; // Redirect
        } catch (error) {
            showError(loginForm, "Login failed: " + error.message);
        }
    });
}

// Signup Form Handling
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: username });
            window.location.href = "/html.html"; // Redirect
        } catch (error) {
            showError(signupForm, "Signup failed: " + error.message);
        }
    });
}

// // Check Auth State & Redirect
// auth.onAuthStateChanged((user) => {
//     if (user) {
//         if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
//             window.location.href = "/html.html";
//         }
//     } else {
//         if (window.location.pathname.includes('html.html')) {
//             window.location.href = "/login.html";
//         }
//     }
// });


auth.onAuthStateChanged((user) => {
    if (user) {
        document.body.classList.add("logged-in");
        document.querySelector(".logout").style.display = "block";
    } else {
        document.body.classList.remove("logged-in");
        document.querySelector(".logout").style.display = "none";
    }
});

// Attach Google Sign-In Click Event
document.querySelectorAll(".google-sign-in").forEach(button => {
    button.addEventListener("click", handleGoogleSignIn);
});

document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector(".logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            console.log("Logout button clicked");
        });
    }
});


document.querySelector(".logout").addEventListener("click", () => {
    auth.signOut().then(() => {
        window.location.href = "index.html"; // Redirect to login page after logout
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

