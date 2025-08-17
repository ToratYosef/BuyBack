// js/main.js

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, signInWithCustomToken, updateEmail, updatePassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = {
    apiKey: "AIzaSyAmUGWbpbJIWLrBMJpZb8iMpFt-uc24J0k",
    authDomain: "buyback-a0f05.firebaseapp.com",
    projectId: "buyback-a0f05",
    storageBucket: "buyback-a0f05.firebasestorage.app",
    messagingSenderId: "876430429098",
    appId: "1:876430429098:web:f6dd64b1960d90461979d3",
    measurementId: "G-6WWQN44JHT"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase instances
let app, auth, db;
let currentUser = null;
let currentUserId = null;
let currentUserName = ''; // Store user's name

// State for navigation and data filtering
let currentCategoryFilter = ''; // For filtering models on sell.html
let globalSearchTerm = ''; // For header search and filtering models
let selectedPhoneBrand = ''; // For model-detail page
let selectedPhoneModel = ''; // For model-detail page
let selectedPhoneCondition = ''; // For model-detail page
let isLoading = false; // General loading state

// DOM elements (will be initialized on each page's load)
let authStatusContainer;
let messageDisplay;
let headerSearchInput;
let appContentDiv; // Main content div for pages that dynamically render primary content (e.g., dashboard, account-info)

// --- All Popular Models Data ---
const allPopularModels = [
    {
        brand: 'iPhone',
        model: '15 Pro Max',
        img: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-finish-select-202309-6-7inch-naturaltitanium?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1692845702251',
        conditions: [
            { range: 'Excellent ($700 - $800)', desc: 'Flawless screen & body, fully functional, original parts.' },
            { range: 'Good ($550 - $699)', desc: 'Minor wear, no cracks, fully functional.' },
            { range: 'Fair ($350 - $549)', desc: 'Visible scratches/dents, minor display issues, still functional.' },
            { range: 'Poor ($150 - $349)', desc: 'Cracked screen/back, significant wear, functional but may have issues.' },
            { range: 'Damaged (Quote Varies)', desc: 'Non-functional, severe damage, for parts only.' }
        ]
    },
    {
        brand: 'iPhone',
        model: '14 Pro',
        img: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-deeppurple?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1661877995642',
        conditions: [
            { range: 'Excellent ($450 - $550)', desc: 'Flawless screen & body, fully functional, original parts.' },
            { range: 'Good ($350 - $449)', desc: 'Minor wear, no cracks, fully functional.' },
            { range: 'Fair ($250 - $349)', desc: 'Visible scratches/dents, minor display issues, still functional.' },
            { range: 'Poor ($150 - $249)', desc: 'Cracked screen/back, significant wear, functional but may have issues.' },
            { range: 'Damaged (Quote Varies)', desc: 'Non-functional, severe damage, for parts only.' }
        ]
    },
    {
        brand: 'iPhone',
        model: '13',
        img: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202209-6-1inch-midnight?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1661877995642',
        conditions: [
            { range: 'Excellent ($400 - $500)', desc: 'Flawless screen & body, fully functional, original parts.' },
            { range: 'Good ($300 - $399)', desc: 'Minor wear, no cracks, fully functional.' },
            { range: 'Fair ($200 - $299)', desc: 'Visible scratches/dents, minor display issues, still functional.' },
            { range: 'Poor ($100 - $199)', desc: 'Cracked screen/back, significant wear, functional but may have issues.' },
            { range: 'Damaged (Quote Varies)', desc: 'Non-functional, severe damage, for parts only.' }
        ]
    },
    {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        img: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bztlmea-thumb-539401777?$344_344_PNG$',
        conditions: [
            { range: 'Excellent ($600 - $750)', desc: 'Pristine condition, no visible flaws, all features working.' },
            { range: 'Good ($450 - $599)', desc: 'Light scratches/scuffs, fully operational.' },
            { range: 'Fair ($250 - $449)', desc: 'Noticeable wear, screen burn, functional.' },
            { range: 'Poor ($100 - $249)', desc: 'Cracked screen or back, functional but issues present.' },
            { range: 'Damaged (Quote Varies)', desc: 'Beyond repair for typical use, parts only.' }
        ]
    },
    {
        brand: 'Samsung',
        model: 'Galaxy S22',
        img: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2202/gallery/levant-galaxy-s22-s901-sm-s901bzglmea-thumb-530932007?$344_344_PNG$',
        conditions: [
            { range: 'Excellent ($250 - $350)', desc: 'Pristine condition, no visible flaws, all features working.' },
            { range: 'Good ($180 - $249)', desc: 'Light scratches/scuffs, fully operational.' },
            { range: 'Fair ($100 - $179)', desc: 'Noticeable wear, screen burn, functional.' },
            { range: 'Poor ($50 - $99)', desc: 'Cracked screen or back, functional but issues present.' },
            { range: 'Damaged (Quote Varies)', desc: 'Beyond repair for typical use, parts only.' }
        ]
    },
    {
        brand: 'Google',
        model: 'Pixel 8',
        img: 'https://store.google.com/images/pixel_8/pixel_8_color_obsidian_front.png',
        conditions: [
            { range: 'Excellent ($400 - $550)', desc: 'Pristine condition, no visible flaws, all features working.' },
            { range: 'Good ($300 - $399)', desc: 'Light scratches/scuffs, fully operational.' },
            { range: 'Fair ($200 - $299)', desc: 'Noticeable wear, functional.' },
            { range: 'Poor ($100 - $199)', desc: 'Cracked screen or back, functional but issues present.' },
            { range: 'Damaged (Quote Varies)', desc: 'Non-functional, severe damage, for parts only.' }
        ]
    },
    {
        brand: 'Tablet',
        model: 'iPad Pro (M2)',
        img: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-m4-202405-wifi-spacegray-thb?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1713374246142',
        conditions: [
            { range: 'Excellent ($550 - $700)', desc: 'Pristine condition, no visible flaws, all features working.' },
            { range: 'Good ($400 - $549)', desc: 'Light scratches/scuffs, fully operational.' },
            { range: 'Fair ($250 - $399)', desc: 'Noticeable wear, functional.' },
            { range: 'Poor ($150 - $249)', desc: 'Significant wear, functional but issues present.' },
            { range: 'Damaged (Quote Varies)', desc: 'Beyond repair for typical use, parts only.' }
        ]
    },
    {
        brand: 'Samsung',
        model: 'Galaxy Tab S9 Ultra',
        img: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2307/gallery/levant-galaxy-tab-s9-ultra-x910-sm-x910nzaamea-thumb-537449553?$344_344_PNG$',
        conditions: [
            { range: 'Excellent ($400 - $600)', desc: 'Pristine condition, no visible flaws, all features working.' },
            { range: 'Good ($300 - $399)', desc: 'Light scratches/scuffs, fully operational.' },
            { range: 'Fair ($200 - $299)', desc: 'Noticeable wear, functional.' },
            { range: 'Poor ($100 - $199)', desc: 'Significant wear, functional but issues present.' },
            { range: 'Damaged (Quote Varies)', desc: 'Beyond repair for typical use, parts only.' }
        ]
    }
];

// --- Helper Functions (for potential future audio features, included for consistency) ---
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcm16, sampleRate) {
    const dataLength = pcm16.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');

    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(44 + i * 2, pcm16[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
// --- End Helper Functions ---

// Function to display messages to the user
export function showMessage(message, duration = 3000) {
    if (!messageDisplay) {
        messageDisplay = document.getElementById('message-display');
    }
    if (messageDisplay) {
        messageDisplay.textContent = message;
        messageDisplay.classList.remove('hidden');
        setTimeout(() => {
            messageDisplay.classList.add('hidden');
        }, duration);
    } else {
        console.warn('Message display element not found.');
    }
}

// --- Navigation and Rendering ---
export function navigateTo(path, params = {}) {
    let url = new URL(path, window.location.origin);
    for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    }
    window.location.href = url.toString();
}

export function renderNavbar() {
    if (!authStatusContainer) {
        authStatusContainer = document.getElementById('auth-status-container');
    }
    if (!authStatusContainer) return;

    let navbarHtml = '';
    if (currentUser) {
        const displayName = currentUserName || currentUser.email || 'My Account';
        navbarHtml = `
            <button id="account-dropdown-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${displayName}
            </button>
            <div id="account-dropdown-menu" class="dropdown-menu">
                <button id="dashboard-btn" class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">My Dashboard</button>
                <button id="account-info-btn" class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Account Info</button>
                <button id="logout-btn" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 logout">Logout</button>
            </div>
        `;
    } else {
        navbarHtml = `
            <button id="login-nav-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold">
                Login
            </button>
        `;
    }
    authStatusContainer.innerHTML = navbarHtml;

    // Add event listeners for new elements
    if (currentUser) {
        const dropdownBtn = document.getElementById('account-dropdown-btn');
        const dropdownMenu = document.getElementById('account-dropdown-menu');

        if (dropdownBtn) {
            dropdownBtn.onclick = (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            };
        }

        if (document.getElementById('dashboard-btn')) {
            document.getElementById('dashboard-btn').onclick = () => { navigateTo('profile.html', { view: 'dashboard' }); dropdownMenu.classList.remove('show'); };
        }
        if (document.getElementById('account-info-btn')) {
            document.getElementById('account-info-btn').onclick = () => { navigateTo('profile.html', { view: 'account-info' }); dropdownMenu.classList.remove('show'); };
        }
        if (document.getElementById('logout-btn')) {
            document.getElementById('logout-btn').onclick = () => { handleLogout(); dropdownMenu.classList.remove('show'); };
        }

        window.onclick = (event) => {
            if (dropdownMenu && dropdownMenu.classList.contains('show') && !dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
        };

    } else {
        if (document.getElementById('login-nav-btn')) {
            document.getElementById('login-nav-btn').onclick = () => navigateTo('auth.html', { view: 'login' });
        }
    }
}

// --- Firebase Authentication Handlers ---
export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Logged in successfully!');
        navigateTo('profile.html', { view: 'dashboard' });
    } catch (error) {
        showMessage(`Login failed: ${error.message}`);
        console.error('Login error:', error);
    }
}

export async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);
        showMessage('Registration successful! Please check your email to verify your account.');

        // Save user name to Firestore in a private collection
        const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        await setDoc(userProfileRef, { name: name, email: user.email, createdAt: new Date().toISOString(), emailVerified: user.emailVerified });
        currentUserName = name;

        navigateTo('auth.html', { view: 'login', message: 'Verification email sent. Please check your inbox.' });
    } catch (error) {
        showMessage(`Registration failed: ${error.message}`);
        console.error('Registration error:', error);
    }
}

export async function handleLogout() {
    try {
        await signOut(auth);
        showMessage('Logged out.');
        currentUserName = '';
        navigateTo('index.html');
    } catch (error) {
        showMessage(`Logout failed: ${error.message}`);
        console.error('Logout error:', error);
    }
}

export async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!currentUser) {
        showMessage('You must be logged in to update your profile.');
        return;
    }

    const updatedName = document.getElementById('account-name').value;

    try {
        const userProfileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data');
        await updateDoc(userProfileRef, { name: updatedName });
        currentUserName = updatedName;
        showMessage('Profile updated successfully!');
        renderNavbar();
    }
    catch (error) {
        showMessage(`Profile update failed: ${error.message}`);
        console.error('Profile update error:', error);
    }
}

export async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentUser) {
        showMessage('You must be logged in to change your password.');
        return;
    }

    const oldPassword = document.getElementById('old-password').value; // New: Get old password
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    if (newPassword !== confirmNewPassword) {
        showMessage('New passwords do not match!');
        return;
    }
    if (newPassword.length < 6) {
        showMessage('Password should be at least 6 characters.');
        return;
    }

    try {
        // Re-authenticate user with old password before changing
        const credential = await signInWithEmailAndPassword(auth, currentUser.email, oldPassword);
        await updatePassword(credential.user, newPassword);
        showMessage('Password changed successfully! You might need to log in again with the new password.');
        handleLogout();
    } catch (error) {
        showMessage(`Password change failed: ${error.message}. Please ensure your old password is correct and you are recently logged in.`);
        console.error('Password change error:', error);
    }
}

// --- Buyback Request and Firestore Saving ---
export async function handleBuybackRequest(e) {
    e.preventDefault();
    if (!currentUser) {
        showMessage('You must be logged in to start a buyback request.');
        return;
    }

    selectedPhoneCondition = document.getElementById('phone-condition').value;

    if (!selectedPhoneBrand || !selectedPhoneModel || !selectedPhoneCondition) {
        showMessage('Please select phone details and condition.');
        return;
    }

    try {
        const buybackRequestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'buybackRequests');
        await addDoc(buybackRequestsRef, {
            userId: currentUser.uid,
            userName: currentUserName || currentUser.email,
            brand: selectedPhoneBrand,
            model: selectedPhoneModel,
            condition: selectedPhoneCondition,
            status: 'Pending Shipment', // Initial status
            requestDate: new Date().toISOString()
        });
        showMessage('Buyback request submitted! Please follow the instructions to ship your device.');
        // Redirect to dashboard or a confirmation page
        navigateTo('profile.html', { view: 'dashboard', message: 'Buyback request submitted!' });
    } catch (error) {
        showMessage(`Error submitting request: ${error.message}`);
        console.error('Buyback request error:', error);
    }
}


// --- Page Specific Render Functions (Called by each HTML file) ---

// Render function for index.html (Homepage)
export function renderHomePageContent() {
    appContentDiv = document.getElementById('app-content');
    if (!appContentDiv) return;

    const homepageFilteredPhones = allPopularModels.filter(model =>
        model.model.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        model.brand.toLowerCase().includes(globalSearchTerm.toLowerCase())
    );
    let homepagePhonesHtml = '';
    if (homepageFilteredPhones.length > 0) {
        homepagePhonesHtml = homepageFilteredPhones.map((item) => `
            <div class="bg-gray-50 p-4 rounded-lg shadow-md flex flex-col items-center">
                <img src="${item.img}" alt="${item.brand} ${item.model}" class="mb-4 rounded-md w-32 h-48 object-contain"/>
                <h3 class="text-xl font-semibold mb-2">${item.brand} ${item.model}</h3>
                <p class="text-gray-600 text-sm mb-4">Starting from $${item.conditions[0].range.match(/\$(\d+)/)?.[1] || '---'}</p>
                <button onclick="main.navigateTo('model-detail.html', { brand: '${item.brand}', model: '${item.model}' })" class="bg-indigo-500 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-600 transition duration-300">Sell This</button>
            </div>
        `).join('');
    } else {
        homepagePhonesHtml = `<p class="text-gray-600 col-span-full">No popular phones found matching your search. Try a different term or browse all models.</p>`;
    }

    appContentDiv.innerHTML = `
        <div class="p-0 sm:p-6 bg-white rounded-lg shadow-xl max-w-full w-full">
            <!-- Hero Section -->
            <div class="hero-section mb-12">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <h2 class="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
                        Turn Your Old Phone into <span class="text-yellow-400">Cash!</span>
                    </h2>
                    <p class="text-lg sm:text-xl mb-6">
                        Quick, easy, and transparent buyback for iPhones and Samsung Galaxy devices.
                    </p>
                    <button id="sell-phone-hero-btn" class="bg-indigo-600 text-white px-8 py-4 rounded-md shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out font-bold text-xl transform hover:scale-105">
                        Sell Your Phone Now!
                    </button>
                </div>
            </div>

            <!-- Service Highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-gray-700">
                <div class="flex flex-col items-center p-4">
                    <svg class="w-10 h-10 mb-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h10m-9 4h8a2 2 0 002-2v-8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    <h3 class="font-semibold text-lg">Hassle-Free Returns</h3>
                    <p class="text-sm text-center">Enjoy peace of mind with our 30-day return policy.</p>
                </div>
                <div class="flex flex-col items-center p-4">
                    <svg class="w-10 h-10 mb-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    <h3 class="font-semibold text-lg">Free Shipping</h3>
                    <p class="text-sm text-center">Ship your device to us at no cost to you.</p>
                </div>
                <div class="flex flex-col items-center p-4">
                    <svg class="w-10 h-10 mb-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h3 class="font-semibold text-lg">Certified Inspection</h3>
                    <p class="text-sm text-center">Every device undergoes a thorough 55-point inspection.</p>
                </div>
                <div class="flex flex-col items-center p-4">
                    <svg class="w-10 h-10 mb-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h-3a2 2 0 01-2-2V8a2 2 0 012-2h3m0 10v4m0 0H8m4 0h4m-9-4L9 8m4 4l-4 4"></path></svg>
                    <h3 class="font-semibold text-lg">Dedicated Support</h3>
                    <p class="text-sm text-center">Customer service available 7 days a week.</p>
                </div>
            </div>

            <!-- Shop by Category Section -->
            <h2 class="text-3xl font-bold mb-8 text-gray-800">Shop by Category</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 px-4">
                <!-- iPhone Category Card -->
                <div class="category-card bg-category-orange" data-category="iPhone">
                    <div class="category-card-content">
                        <h3>iPhones</h3>
                        <span>Shop Now
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </div>
                    <img src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-finish-select-202309-6-7inch-naturaltitanium?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1692845702251" alt="iPhone Category" class="absolute bottom-0 right-0 max-h-full max-w-full object-contain z-0"/>
                </div>
                <!-- Samsung Galaxy Category Card -->
                <div class="category-card bg-category-purple" data-category="Samsung">
                    <div class="category-card-content">
                        <h3>Samsung Galaxy</h3>
                        <span>Shop Now
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </div>
                    <img src="https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bztlmea-thumb-539401777?$344_344_PNG$" alt="Samsung Category" class="absolute bottom-0 right-0 max-h-full max-w-full object-contain z-0"/>
                </div>
                <!-- Tablet Category Card -->
                <div class="category-card bg-category-teal" data-category="Tablet">
                    <div class="category-card-content">
                        <h3>Tablets</h3>
                        <span>Shop Now
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </div>
                    <img src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-m4-202405-wifi-spacegray-thb?wid=512&hei=512&fmt=jpeg&qlt=95&.v=1713374246142" alt="iPad Category" class="absolute bottom-0 right-0 max-h-full max-w-full object-contain z-0"/>
                </div>
                <!-- Google Phones Category Card -->
                <div class="category-card bg-category-pink" data-category="Google">
                    <div class="category-card-content">
                        <h3>Google Phones</h3>
                        <span>Shop Now
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </div>
                    <img src="https://store.google.com/images/pixel_8/pixel_8_color_obsidian_front.png" alt="Google Phone Category" class="absolute bottom-0 right-0 max-h-full max-w-full object-contain z-0"/>
                </div>
            </div>
            <!-- Popular Phones Section -->
            <h2 class="text-3xl font-bold mb-8 text-gray-800">Popular Phones We Buy</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 pb-8">
                ${homepagePhonesHtml}
            </div>

            <!-- What Customers Are Saying Section -->
            <h2 class="text-3xl font-bold mb-8 text-gray-800">What Customers Are Saying</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-8">
                <!-- Testimonial Card 1 -->
                <div class="testimonial-card">
                    <span class="icon">🚀</span>
                    <p>"Extremely fast delivery and excellent communication throughout the process!"</p>
                    <span class="author">- Happy Seller</span>
                </div>
                <!-- Testimonial Card 2 -->
                <div class="testimonial-card">
                    <span class="icon">😊</span>
                    <p>"Customer service was excellent and timely; they answered all my questions."</p>
                    <span class="author">- Satisfied Customer</span>
                </div>
                <!-- Testimonial Card 3 -->
                <div class="testimonial-card">
                    <span class="icon">💸</span>
                    <p>"Phone was in great shape for a great price, totally worth it!"</p>
                    <span class="author">- Smart Buyer</span>
                </div>
                <!-- Testimonial Card 4 -->
                <div class="testimonial-card">
                    <span class="icon">⭐</span>
                    <p>"Easy order, efficient process, and clear communication every step of the way."</p>
                    <span class="author">- Verified Purchase</span>
                </div>
                <div class="testimonial-card">
                    <span class="icon">👍</span>
                    <p>"Got more than I expected for my old phone. Smooth transaction!"</p>
                    <span class="author">- Delighted Seller</p>
                </div>
                <div class="testimonial-card">
                    <span class="icon">🌟</span>
                    <p>"The best experience selling a device online. Highly recommend SwiftBuyBack!"</p>
                    <span class="author">- Enthusiastic User</span>
                </div>
            </div>
        </div>
    `;

    // Attach event listeners for elements specific to this page
    const sellPhoneHeroBtn = document.getElementById('sell-phone-hero-btn');
    if (sellPhoneHeroBtn) {
        sellPhoneHeroBtn.onclick = () => navigateTo('sell.html');
    }

    document.querySelectorAll('.category-card').forEach(card => {
        card.onclick = (event) => {
            const category = event.currentTarget.dataset.category;
            navigateTo('sell.html', { category: category });
        };
    });
}

// Render function for sell.html
export function renderSellPageContent() {
    appContentDiv = document.getElementById('app-content');
    if (!appContentDiv) return;

    // Read URL parameters for category filter and search term
    const urlParams = new URLSearchParams(window.location.search);
    currentCategoryFilter = urlParams.get('category') || '';
    globalSearchTerm = urlParams.get('search') || '';

    // Update header search input if it exists
    if (headerSearchInput) {
        headerSearchInput.value = globalSearchTerm;
    }

    const filteredModels = allPopularModels.filter(model =>
        (currentCategoryFilter === '' || model.brand === currentCategoryFilter) &&
        (model.model.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        model.brand.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    );

    let modelsHtml = '';
    if (filteredModels.length > 0) {
        modelsHtml = `
            <h3 class="text-2xl font-semibold mb-4 text-gray-800">Available Models ${currentCategoryFilter ? `(${currentCategoryFilter})` : ''}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${filteredModels.map((item, index) => `
                    <div class="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 flex flex-col items-center">
                        <img src="${item.img}" alt="${item.brand} ${item.model}" class="mb-4 rounded-md w-32 h-48 object-contain"/>
                        <h4 class="text-xl font-bold text-indigo-700 mb-2">${item.brand} ${item.model}</h4>
                        <ul class="list-disc list-inside text-gray-700 space-y-2 text-left w-full">
                            ${item.conditions.map((cond, idx) => `
                                <li>
                                    <span class="font-semibold">${cond.range}:</span> ${cond.desc}
                                </li>
                            `).join('')}
                        </ul>
                        <button data-brand="${item.brand}" data-model="${item.model}" class="select-model-btn mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold">
                            Select This Phone
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        modelsHtml = `<p class="text-gray-600">No models found matching your search and filter criteria. Try a different term or proceed to get a custom quote.</p>`;
    }

    appContentDiv.innerHTML = `
        <div class="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Sell Your Phone</h2>
            <div class="w-full mb-8">
                <input type="text" id="search-term-sell" placeholder="Search for your phone model (e.g., iPhone 13, S22 Ultra)" value="${globalSearchTerm}" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div class="w-full">
                ${modelsHtml}
            </div>
            <button id="back-to-home-from-sell" class="mt-4 text-indigo-600 hover:underline">
                Back to Homepage
            </button>
        </div>
    `;

    // Attach event listeners for elements specific to this page
    const sellSearchInput = document.getElementById('search-term-sell');
    if (sellSearchInput) {
        sellSearchInput.oninput = (e) => {
            globalSearchTerm = e.target.value;
            // Update URL with search term for persistence on refresh
            const url = new URL(window.location.href);
            if (globalSearchTerm) {
                url.searchParams.set('search', globalSearchTerm);
            } else {
                url.searchParams.delete('search');
            }
            window.history.replaceState({}, '', url);
            renderSellPageContent(); // Re-render to filter models
        };
    }
    document.querySelectorAll('.select-model-btn').forEach(button => {
        button.onclick = (event) => {
            const brand = event.target.dataset.brand;
            const model = event.target.dataset.model;
            navigateTo('model-detail.html', { brand: brand, model: model });
        };
    });
    const backToHomeFromSell = document.getElementById('back-to-home-from-sell');
    if (backToHomeFromSell) {
        backToHomeFromSell.onclick = () => navigateTo('index.html');
    }
}

// Render function for model-detail.html
export function renderModelDetailPageContent() {
    appContentDiv = document.getElementById('app-content');
    if (!appContentDiv) return;

    // Read URL parameters for pre-filling
    const urlParams = new URLSearchParams(window.location.search);
    selectedPhoneBrand = urlParams.get('brand') || '';
    selectedPhoneModel = urlParams.get('model') || '';

    const phone = allPopularModels.find(p => p.brand === selectedPhoneBrand && p.model === selectedPhoneModel);

    if (!phone) {
        appContentDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">Phone Not Found</h2>
                <p class="text-gray-600 mb-4">The requested phone model could not be found. Please go back and select a valid model.</p>
                <button onclick="main.navigateTo('sell.html')" class="mt-4 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold">
                    Browse All Models
                </button>
            </div>
        `;
        return;
    }

    appContentDiv.innerHTML = `
        <div class="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Sell Your ${phone.brand} ${phone.model}</h2>
            <div class="flex flex-col md:flex-row items-center md:items-start gap-8 w-full mb-8">
                <img src="${phone.img}" alt="${phone.brand} ${phone.model}" class="w-48 h-64 object-contain rounded-lg shadow-md"/>
                <div class="text-left flex-grow">
                    <p class="text-lg text-gray-700 mb-4">Select the condition of your device to start the buyback process. We'll provide a final quote after inspection.</p>
                    <h3 class="text-xl font-semibold mb-2 text-gray-800">Condition Guidelines & Estimated Ranges:</h3>
                    <ul class="list-disc list-inside text-gray-700 space-y-2">
                        ${phone.conditions.map(cond => `
                            <li><span class="font-semibold">${cond.range}:</span> ${cond.desc}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <form id="buyback-request-form" class="w-full space-y-4">
                <label for="phone-condition" class="block text-left text-gray-700 font-semibold">Select Condition:</label>
                <select id="phone-condition" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    <option value="">-- Choose Condition --</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                </select>
                <button type="submit" id="start-buyback-btn" class="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold">
                    Start Buyback Process
                </button>
            </form>

            <p class="text-sm text-gray-500 mt-6">
                After you submit your request, we'll send you a free shipping label. Once we receive and inspect your device, we'll provide a final offer. If you accept, we'll pay you! If not, we'll ship it back to you for free.
            </p>

            <button onclick="main.navigateTo('sell.html')" class="mt-8 text-indigo-600 hover:underline">
                Back to All Models
            </button>
        </div>
    `;

    // Attach event listeners
    const buybackRequestForm = document.getElementById('buyback-request-form');
    if (buybackRequestForm) {
        buybackRequestForm.onsubmit = main.handleBuybackRequest;
    }
    const phoneConditionSelect = document.getElementById('phone-condition');
    if (phoneConditionSelect) {
        phoneConditionSelect.onchange = (e) => selectedPhoneCondition = e.target.value;
    }
}

// Render function for profile.html
export function renderProfilePageContent() {
    appContentDiv = document.getElementById('app-content');
    if (!appContentDiv) return;

    const urlParams = new URLSearchParams(window.location.search);
    const subView = urlParams.get('view') || 'dashboard'; // Default to dashboard

    let contentHtml = '';
    if (subView === 'dashboard') {
        contentHtml = `
            <div class="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">Welcome, ${currentUserName || currentUser?.email || 'User'}!</h2>
                ${currentUserId ? `<p class="text-sm text-gray-500 mb-4">Your User ID: ${currentUserId}</p>` : ''}
                <div class="w-full space-y-4">
                    <button id="dashboard-new-buyback-btn" class="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold">
                        Start New Buyback
                    </button>
                    <button id="dashboard-view-requests-btn" class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold">
                        View My Buyback Requests
                    </button>
                    <button id="dashboard-account-info-btn" class="w-full bg-yellow-600 text-white p-3 rounded-md hover:bg-yellow-700 transition duration-300 ease-in-out font-semibold">
                        Account Settings
                    </button>
                    <button id="dashboard-logout-btn" class="w-full bg-red-600 text-white p-3 rounded-md hover:bg-red-700 transition duration-300 ease-in-out font-semibold">
                        Logout
                    </button>
                </div>
            </div>
        `;
    } else if (subView === 'account-info') {
        contentHtml = `
            <div class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">Account Settings</h2>
                <form id="update-profile-form" class="w-full space-y-4 mb-6">
                    <label for="account-name" class="block text-left text-gray-700 font-semibold">Name:</label>
                    <input type="text" id="account-name" placeholder="Your Name" value="${currentUserName || ''}" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>

                    <label for="account-email" class="block text-left text-gray-700 font-semibold">Email:</label>
                    <input type="email" id="account-email" placeholder="Your Email" value="${currentUser?.email || ''}" class="w-full p-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled/>
                    <p class="text-sm text-gray-500 text-left">Email can only be changed by re-authenticating.</p>

                    <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold">
                        Update Name
                    </button>
                </form>

                <h3 class="text-2xl font-bold mb-4 text-gray-800">Change Password</h3>
                <form id="change-password-form" class="w-full space-y-4">
                    <label for="old-password" class="block text-left text-gray-700 font-semibold">Old Password:</label>
                    <input type="password" id="old-password" placeholder="Enter Old Password" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <label for="new-password" class="block text-left text-gray-700 font-semibold">New Password:</label>
                    <input type="password" id="new-password" placeholder="Enter New Password" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <label for="confirm-new-password" class="block text-left text-gray-700 font-semibold">Confirm New Password:</label>
                    <input type="password" id="confirm-new-password" placeholder="Confirm New Password" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <button type="submit" class="w-full bg-yellow-600 text-white p-3 rounded-md hover:bg-yellow-700 transition duration-300 ease-in-out font-semibold">
                        Change Password
                    </button>
                </form>

                <button id="back-to-dashboard-from-account" class="mt-8 text-indigo-600 hover:underline">
                    Back to Dashboard
                </button>
            </div>
        `;
    }
    appContentDiv.innerHTML = contentHtml;

    // Attach event listeners for elements specific to this page
    if (subView === 'dashboard') {
        const dashboardNewBuybackBtn = document.getElementById('dashboard-new-buyback-btn');
        if (dashboardNewBuybackBtn) {
            dashboardNewBuybackBtn.onclick = () => navigateTo('sell.html');
        }
        const dashboardViewRequestsBtn = document.getElementById('dashboard-view-requests-btn');
        if (dashboardViewRequestsBtn) {
            dashboardViewRequestsBtn.onclick = () => showMessage('Feature coming soon: View your past buyback requests!'); // Placeholder
        }
        const dashboardAccountInfoBtn = document.getElementById('dashboard-account-info-btn');
        if (dashboardAccountInfoBtn) {
            dashboardAccountInfoBtn.onclick = () => navigateTo('profile.html', { view: 'account-info' });
        }
        const dashboardLogoutBtn = document.getElementById('dashboard-logout-btn');
        if (dashboardLogoutBtn) {
            dashboardLogoutBtn.onclick = handleLogout;
        }
    } else if (subView === 'account-info') {
        const updateProfileForm = document.getElementById('update-profile-form');
        if (updateProfileForm) {
            updateProfileForm.onsubmit = handleUpdateProfile;
        }
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.onsubmit = handleChangePassword;
        }
        const backToDashboardFromAccount = document.getElementById('back-to-dashboard-from-account');
        if (backToDashboardFromAccount) {
            backToDashboardFromAccount.onclick = () => navigateTo('profile.html', { view: 'dashboard' });
        }
    }
}

// Render function for auth.html
export function renderAuthPageContent() {
    appContentDiv = document.getElementById('app-content');
    if (!appContentDiv) return;

    const urlParams = new URLSearchParams(window.location.search);
    const subView = urlParams.get('view') || 'login'; // Default to login
    const initialMessage = urlParams.get('message') || ''; // Read message from URL

    let contentHtml = '';
    if (subView === 'login') {
        contentHtml = `
            <div class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">Login</h2>
                ${initialMessage ? `<p class="text-green-600 mb-4">${initialMessage}</p>` : ''}
                <form id="login-form" class="w-full space-y-4">
                    <input type="email" id="login-email" placeholder="Email" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <input type="password" id="login-password" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <button type="submit" class="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold">
                        Login
                    </button>
                </form>
                <p class="mt-4 text-gray-600">
                    Don't have an account?
                    <button id="go-to-register-btn" class="text-indigo-600 hover:underline">
                        Register
                    </button>
                </p>
            </div>
        `;
    } else if (subView === 'register') {
        contentHtml = `
            <div class="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">Register</h2>
                <form id="register-form" class="w-full space-y-4">
                    <input type="text" id="register-name" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <input type="email" id="register-email" placeholder="Email" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <input type="password" id="register-password" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <button type="submit" class="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out font-semibold">
                        Register
                    </button>
                </form>
                <p class="mt-4 text-gray-600">
                    Already have an account?
                    <button id="go-to-login-btn" class="text-indigo-600 hover:underline">
                        Login
                    </button>
                </p>
            </div>
        `;
    }
    appContentDiv.innerHTML = contentHtml;

    // Attach event listeners for elements specific to this page
    if (subView === 'login') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = handleLogin;
        }
        const goToRegisterBtn = document.getElementById('go-to-register-btn');
        if (goToRegisterBtn) {
            goToRegisterBtn.onclick = () => navigateTo('auth.html', { view: 'register' });
        }
    } else if (subView === 'register') {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.onsubmit = handleRegister;
        }
        const goToLoginBtn = document.getElementById('go-to-login-btn');
        if (goToLoginBtn) {
            goToLoginBtn.onclick = () => navigateTo('auth.html', { view: 'login' });
        }
    }
}


// --- Main Initialization Function (called by each HTML file) ---
export function initApp(pageType) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize common DOM elements
    authStatusContainer = document.getElementById('auth-status-container');
    messageDisplay = document.getElementById('message-display');
    headerSearchInput = document.getElementById('header-search-input');
    appContentDiv = document.getElementById('app-content'); // Main content div for pages

    // Attach global search input listener
    if (headerSearchInput) {
        headerSearchInput.oninput = (e) => {
            globalSearchTerm = e.target.value;
            // Navigate to sell page with search term if not already there, otherwise re-render current page
            if (window.location.pathname.includes('sell.html')) {
                renderSellPageContent(); // Re-render sell page with new filter
            } else {
                navigateTo('sell.html', { search: globalSearchTerm });
            }
        };
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;

            const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists()) {
                    currentUserName = docSnap.data().name || '';
                } else {
                    currentUserName = user.email || '';
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                currentUserName = user.email || '';
            }
            showMessage(`Welcome, ${currentUserName || user.email || 'Guest'}!`);

            // If on auth page and logged in, redirect to dashboard
            if (window.location.pathname.includes('auth.html')) {
                navigateTo('profile.html', { view: 'dashboard' });
            }

        } else {
            currentUser = null;
            currentUserId = crypto.randomUUID();
            currentUserName = '';
            showMessage('Please login or register.');

            // If on a protected page (dashboard, account-info) and not logged in, redirect to login
            if (window.location.pathname.includes('profile.html')) {
                navigateTo('auth.html', { view: 'login' });
            }

            if (initialAuthToken) {
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                } catch (error) {
                    console.error("Error signing in with custom token:", error);
                    await signInAnonymously(auth);
                }
            } else {
                await signInAnonymously(auth);
            }
        }
        renderNavbar(); // Always render navbar after auth state is known
    });

    // Initial render of content based on page type
    switch (pageType) {
        case 'home':
            renderHomePageContent();
            break;
        case 'sell':
            renderSellPageContent();
            break;
        case 'model-detail': // New page type
            renderModelDetailPageContent();
            break;
        case 'profile': // New page type
            renderProfilePageContent();
            break;
        case 'auth':
            renderAuthPageContent();
            break;
        default:
            renderHomePageContent(); // Fallback
            break;
    }
    renderNavbar(); // Initial render of the navbar
}
