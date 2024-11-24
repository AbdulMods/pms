import { db, auth, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    where
} from "firebase/firestore";
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendSignalToTelegram } from './telegram-bot.js';

// Constants
const TELEGRAM_ADMIN = '@PIPSMASTER22';
const TELEGRAM_CHANNEL = 'https://t.me/Pipsmarket4x';
const TELEGRAM_CHANNEL_ID = '-1001100250703';

// Auth State Management
onAuthStateChanged(auth, (user) => {
    if (!user && !window.location.href.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
});

// Admin Login
async function adminLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'admin-dashboard.html';
    } catch (error) {
        console.error("Login error:", error);
        showNotification('Invalid login credentials', 'error');
    }
}

// Admin Logout
async function adminLogout() {
    try {
        await signOut(auth);
        window.location.href = 'admin-login.html';
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// Signal Management
async function addNewSignal(signalData) {
    try {
        // Add timestamp and status
        signalData.timestamp = serverTimestamp();
        signalData.status = 'active';

        // Save to Firebase
        const docRef = await addDoc(collection(db, "signals"), signalData);

        // Send to Telegram channel
        await sendSignalToTelegram(signalData);

        // Update stats
        await updateSignalStats('increment');

        showNotification('Signal added and sent to Telegram', 'success');
        return docRef.id;
    } catch (error) {
        console.error("Error adding signal:", error);
        showNotification('Error adding signal', 'error');
        throw error;
    }
}

async function updateSignal(signalId, signalData) {
    try {
        await updateDoc(doc(db, "signals", signalId), signalData);
        showNotification('Signal updated successfully', 'success');
    } catch (error) {
        console.error("Error updating signal:", error);
        showNotification('Error updating signal', 'error');
    }
}

async function deleteSignal(signalId) {
    if (confirm('Are you sure you want to delete this signal?')) {
        try {
            await deleteDoc(doc(db, "signals", signalId));
            await updateSignalStats('decrement');
            showNotification('Signal deleted successfully', 'success');
        } catch (error) {
            console.error("Error deleting signal:", error);
            showNotification('Error deleting signal', 'error');
        }
    }
}

// Stats Management
async function updateSignalStats(action) {
    const statsRef = doc(db, 'stats', 'dashboard');
    const increment = action === 'increment' ? 1 : -1;
    
    try {
        await updateDoc(statsRef, {
            totalSignals: increment,
            activeSignals: increment
        });
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login Form Handler
    const loginForm = document.querySelector('.admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            adminLogin(email, password);
        });
    }

    // Signal Form Handler
    const signalForm = document.querySelector('.signal-form');
    if (signalForm) {
        signalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = signalForm.querySelector('.submit-btn');
            submitBtn.disabled = true;

            try {
                const formData = new FormData(signalForm);
                const signalData = {
                    type: formData.get('type'),
                    entry: parseFloat(formData.get('entry')),
                    stopLoss: parseFloat(formData.get('stopLoss')),
                    takeProfits: [
                        parseFloat(formData.get('tp1')),
                        parseFloat(formData.get('tp2')),
                        parseFloat(formData.get('tp3'))
                    ].filter(tp => !isNaN(tp)),
                    analysis: formData.get('analysis')
                };

                await addNewSignal(signalData);
                signalForm.reset();
            } catch (error) {
                console.error("Form submission error:", error);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Logout Handler
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            adminLogout();
        });
    }

    // Initialize Dashboard
    if (window.location.href.includes('admin-dashboard.html')) {
        initializeDashboard();
    }
});

// Dashboard Initialization
function initializeDashboard() {
    // Load stats
    const statsRef = doc(db, 'stats', 'dashboard');
    onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
            updateDashboardStats(doc.data());
        }
    });

    // Load recent signals
    const signalsQuery = query(
        collection(db, "signals"),
        orderBy("timestamp", "desc"),
        limit(5)
    );

    onSnapshot(signalsQuery, (snapshot) => {
        updateSignalsList(snapshot);
    });
}

// UI Updates
function updateDashboardStats(stats) {
    document.getElementById('totalSignals').textContent = stats.totalSignals || 0;
    document.getElementById('activeSignals').textContent = stats.activeSignals || 0;
    document.getElementById('totalPosts').textContent = stats.totalPosts || 0;
    document.getElementById('subscribers').textContent = stats.subscribers || 0;
}

function updateSignalsList(snapshot) {
    const signalsContainer = document.querySelector('.signals-grid');
    if (!signalsContainer) return;

    signalsContainer.innerHTML = '';
    snapshot.forEach((doc) => {
        const signal = doc.data();
        signalsContainer.insertAdjacentHTML('beforeend', createSignalCard(signal, doc.id));
    });
}

// Helper Functions
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createSignalCard(signal, signalId) {
    return `
        <div class="admin-signal-card" data-id="${signalId}">
            <div class="signal-status ${signal.status}"></div>
            <div class="signal-info">
                <div class="signal-type ${signal.type.toLowerCase()}">${signal.type}</div>
                <h3>GOLD (XAUUSD)</h3>
                <div class="signal-details">
                    <p>Entry: <span>${signal.entry}</span></p>
                    <p>Stop Loss: <span>${signal.stopLoss}</span></p>
                    <div class="tp-info">
                        <p>TP1 (2min): <span>$${signal.takeProfits[0]}</span></p>
                        <p>TP2 (5min): <span>$${signal.takeProfits[1]}</span></p>
                        <p>TP3 (7min): <span>$${signal.takeProfits[2]}</span></p>
                        <p>TP4 (10min): <span>$${signal.takeProfits[3]}</span></p>
                    </div>
                </div>
                <div class="signal-meta">
                    <span class="timestamp">${formatTimestamp(signal.timestamp)}</span>
                    <span class="status">${signal.status}</span>
                </div>
            </div>
            <div class="signal-actions">
                <button onclick="editSignal('${signalId}')" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteSignal('${signalId}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

export {
    adminLogin,
    adminLogout,
    addNewSignal,
    updateSignal,
    deleteSignal
}; 