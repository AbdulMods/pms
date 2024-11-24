import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    where,
    onSnapshot, 
    doc 
} from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeHomepage();
});

async function initializeHomepage() {
    initializeLatestSignals();
    initializeSubscriberCount();
    initializeTradingView();
    initializeLatestPosts();
}

// Latest Signals Section
function initializeLatestSignals() {
    const signalsContainer = document.getElementById('latestSignals');
    const signalsQuery = query(
        collection(db, "signals"),
        orderBy("timestamp", "desc"),
        limit(2)
    );

    onSnapshot(signalsQuery, (snapshot) => {
        signalsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const signal = doc.data();
            signalsContainer.insertAdjacentHTML('beforeend', createSignalCard(signal));
        });
    });
}

function createSignalCard(signal) {
    return `
        <div class="signal-card">
            <div class="signal-header">
                <span class="asset">XAUUSD</span>
                <span class="timestamp">${formatTimestamp(signal.timestamp)}</span>
            </div>
            <div class="signal-body">
                <div class="signal-type ${signal.type.toLowerCase()}">${signal.type}</div>
                <div class="signal-details">
                    <p>Entry: <span>${signal.entry}</span></p>
                    <p>Take Profit: <span>${signal.takeProfits[0]}</span></p>
                    <p>Stop Loss: <span>${signal.stopLoss}</span></p>
                </div>
                <div class="signal-status">${signal.status}</div>
            </div>
        </div>
    `;
}

// Subscriber Count
function initializeSubscriberCount() {
    const memberCountElement = document.getElementById('memberCount');
    const statsDoc = doc(db, 'stats', 'telegram');

    onSnapshot(statsDoc, (doc) => {
        if (doc.exists()) {
            const count = doc.data().subscriberCount;
            animateNumber(memberCountElement, count);
        }
    });
}

// TradingView Chart
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

// Latest Blog Posts
function initializeLatestPosts() {
    const postsContainer = document.getElementById('latestPosts');
    const postsQuery = query(
        collection(db, "blog_posts"),
        where("published", "==", true),
        orderBy("timestamp", "desc"),
        limit(2)
    );

    onSnapshot(postsQuery, (snapshot) => {
        postsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            postsContainer.insertAdjacentHTML('beforeend', createPostCard(post, doc.id));
        });
    });
}

function createPostCard(post, postId) {
    return `
        <article class="blog-card">
            <div class="blog-image">
                <img src="${post.imageUrl}" alt="${post.title}">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="date">${formatTimestamp(post.timestamp)}</span>
                    <span class="category">${post.category}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <a href="blog-post.html?id=${postId}" class="read-more">Read More</a>
            </div>
        </article>
    `;
}

// Helper Functions
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
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
} 