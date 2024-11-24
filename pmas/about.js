import { db } from './firebase-config.js';
import { doc, onSnapshot } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeTelegramStats();
});

function initializeTelegramStats() {
    const memberCountElement = document.getElementById('memberCount');
    const channelAvatarElement = document.getElementById('channelAvatar');
    
    // Get Telegram stats from Firebase
    const statsDoc = doc(db, 'stats', 'telegram');
    
    onSnapshot(statsDoc, (doc) => {
        if (doc.exists()) {
            const stats = doc.data();
            
            // Animate member count
            animateNumber(memberCountElement, stats.subscriberCount);
            
            // Update channel avatar if available
            if (stats.avatarUrl) {
                channelAvatarElement.src = stats.avatarUrl;
            }
        }
    });
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