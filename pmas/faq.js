document.addEventListener('DOMContentLoaded', () => {
    initializeFAQ();
});

function initializeFAQ() {
    setupCategoryFilters();
    setupFAQInteractions();
}

function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const faqSections = document.querySelectorAll('.faq-section');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.dataset.category;

            // Show/hide relevant sections
            faqSections.forEach(section => {
                if (selectedCategory === 'all' || section.dataset.category === selectedCategory) {
                    section.style.display = 'block';
                    // Add entrance animation
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(20px)';
                    requestAnimationFrame(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    });
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

function setupFAQInteractions() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0';
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0';
            }
        });
    });
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}); 