import { db } from './firebase-config.js';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeTestimonials();
    setupContactForm();
});

function initializeTestimonials() {
    const testimonialsGrid = document.querySelector('.testimonials-grid');
    const testimonialsQuery = query(
        collection(db, "testimonials"),
        where("approved", "==", true),
        orderBy("timestamp", "desc"),
        limit(6)
    );

    onSnapshot(testimonialsQuery, (snapshot) => {
        testimonialsGrid.innerHTML = '';
        snapshot.forEach((doc) => {
            const testimonial = doc.data();
            testimonialsGrid.insertAdjacentHTML('beforeend', createTestimonialCard(testimonial));
        });
    });
}

function createTestimonialCard(testimonial) {
    return `
        <div class="testimonial-card">
            <div class="testimonial-content">
                <i class="fas fa-quote-left"></i>
                <p>${testimonial.content}</p>
            </div>
            <div class="testimonial-author">
                <div class="author-info">
                    <h4>${testimonial.name}</h4>
                    <span>${testimonial.location}</span>
                </div>
                <div class="profit-info">
                    <span class="profit-percentage">+${testimonial.profitPercentage}%</span>
                    <span class="profit-period">${testimonial.period}</span>
                </div>
            </div>
        </div>
    `;
}

function setupContactForm() {
    const form = document.getElementById('accountInquiryForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const formData = {
                name: form.name.value,
                email: form.email.value,
                investment: parseFloat(form.investment.value),
                message: form.message.value,
                timestamp: new Date(),
                status: 'new'
            };

            await addDoc(collection(db, "inquiries"), formData);
            
            showNotification('Inquiry submitted successfully! We\'ll contact you soon.', 'success');
            form.reset();
            
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            showNotification('Error submitting inquiry. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Inquiry';
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