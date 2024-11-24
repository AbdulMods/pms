import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeInquiryForm();
});

function initializeInquiryForm() {
    const form = document.getElementById('inquiryForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        
        try {
            // Format telegram username
            let username = form.telegramUsername.value.trim();
            if (!username.startsWith('@')) {
                username = '@' + username;
            }

            const inquiryData = {
                telegramUsername: username,
                type: form.inquiryType.value,
                message: form.message.value,
                timestamp: serverTimestamp(),
                status: 'new'
            };

            // Save to Firebase
            await addDoc(collection(db, "inquiries"), inquiryData);
            
            showNotification('Message sent successfully! We\'ll contact you on Telegram.', 'success');
            form.reset();
            
        } catch (error) {
            console.error("Error sending inquiry:", error);
            showNotification('Error sending message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Validate Telegram username format
function validateTelegramUsername(username) {
    const usernameRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
    return usernameRegex.test(username.replace('@', ''));
}

// Add this to the form submission validation
function validateForm(username) {
    if (!validateTelegramUsername(username)) {
        showNotification('Please enter a valid Telegram username', 'error');
        return false;
    }
    return true;
} 