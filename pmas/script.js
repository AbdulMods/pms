import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, onSnapshot, doc } from "firebase/firestore";

// Update these constants at the top of script.js
const TELEGRAM_CHANNEL = '@PIPSMASTER22';
const TELEGRAM_CHANNEL_ID = '-1001100250703';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all homepage functionalities
    initializeSignals();
    initializeSubscriberCount();
    initializeTradingView();
    initializeFAQ();
});

// Real-time Signals Management
function initializeSignals() {
    const signalsContainer = document.querySelector('.signals-container');
    
    // Create query for latest signals
    const signalsQuery = query(
        collection(db, "signals"),
        orderBy("timestamp", "desc"),
        limit(5)
    );

    // Real-time listener for signals
    onSnapshot(signalsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                addSignalToUI(change.doc.data(), change.doc.id);
            } else if (change.type === "modified") {
                updateSignalInUI(change.doc.data(), change.doc.id);
            }
        });
    });
}

// Subscriber Count Management
function initializeSubscriberCount() {
    const subscriberCountElement = document.getElementById('memberCount');
    const statsDoc = doc(db, 'stats', 'telegram');

    onSnapshot(statsDoc, (doc) => {
        if (doc.exists()) {
            const count = doc.data().subscriberCount;
            animateNumber(subscriberCountElement, count);
        }
    });
}

// TradingView Chart Integration
function initializeTradingView() {
    new TradingView.widget({
        "width": "100%",
        "height": 500,
        "symbol": "OANDA:XAUUSD",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#1a1a1a",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": false,
        "container_id": "tradingview_gold",
        "studies": [
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies"
        ]
    });
}

// UI Helper Functions
function addSignalToUI(signal, signalId) {
    const template = `
        <div class="signal-card" data-id="${signalId}">
            <div class="signal-header">
                <span class="asset">GOLD</span>
                <span class="timestamp">${formatTimestamp(signal.timestamp)}</span>
            </div>
            <div class="signal-body">
                <div class="signal-type ${signal.type.toLowerCase()}">${signal.type}</div>
                <div class="signal-details">
                    <p>Entry: <span>${signal.entry}</span></p>
                    <div class="tp-levels">
                        ${signal.takeProfits.map((tp, index) => `
                            <p>TP${index + 1}: <span>${tp}</span></p>
                        `).join('')}
                    </div>
                    <p>Stop Loss: <span>${signal.stopLoss}</span></p>
                </div>
                <div class="signal-status">${signal.status}</div>
            </div>
            <span class="glow-effect"></span>
        </div>
    `;
    
    const signalsContainer = document.querySelector('.signals-container');
    signalsContainer.insertAdjacentHTML('afterbegin', template);
}

function updateSignalInUI(signal, signalId) {
    const signalElement = document.querySelector(`[data-id="${signalId}"]`);
    if (signalElement) {
        // Update status and add visual feedback
        signalElement.querySelector('.signal-status').textContent = signal.status;
        if (signal.status === 'Completed') {
            signalElement.classList.add('completed');
        }
    }
}

function animateNumber(element, finalNumber) {
    const duration = 1000;
    const startNumber = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const increment = (finalNumber - startNumber) / (duration / 16);
    let currentNumber = startNumber;

    const animate = () => {
        currentNumber += increment;
        if (
            (increment > 0 && currentNumber >= finalNumber) ||
            (increment < 0 && currentNumber <= finalNumber)
        ) {
            element.textContent = new Intl.NumberFormat().format(finalNumber);
        } else {
            element.textContent = new Intl.NumberFormat().format(Math.floor(currentNumber));
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = (now - date) / 1000; // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

// FAQ Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(faq => faq.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
} 