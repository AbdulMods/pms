import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    limit, 
    getDocs 
} from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeBlogPost();
});

async function initializeBlogPost() {
    const postId = new URLSearchParams(window.location.search).get('id');
    if (!postId) {
        window.location.href = 'blog.html';
        return;
    }

    await loadBlogPost(postId);
}

async function loadBlogPost(postId) {
    const blogPostContainer = document.getElementById('blogPost');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    loadingSpinner.style.display = 'block';
    
    try {
        const postDoc = await getDoc(doc(db, "blog_posts", postId));
        
        if (!postDoc.exists()) {
            window.location.href = 'blog.html';
            return;
        }

        const post = postDoc.data();
        blogPostContainer.innerHTML = createBlogPostHTML(post);
        
        // Load related posts
        await loadRelatedPosts(post.category, postId);
        
        // Update page title
        document.title = `${post.title} - PIPS MASTER`;
        
    } catch (error) {
        console.error("Error loading blog post:", error);
        blogPostContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading post. Please try again later.</p>
                <a href="blog.html" class="back-btn">Back to Blog</a>
            </div>
        `;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

async function loadRelatedPosts(category, currentPostId) {
    const relatedPostsContainer = document.getElementById('relatedPosts');
    
    try {
        const relatedQuery = query(
            collection(db, "blog_posts"),
            where("category", "==", category),
            where("__name__", "!=", currentPostId),
            limit(3)
        );

        const snapshot = await getDocs(relatedQuery);
        
        let relatedPostsHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            relatedPostsHTML += createRelatedPostHTML(post, doc.id);
        });

        relatedPostsContainer.innerHTML = relatedPostsHTML;
        
    } catch (error) {
        console.error("Error loading related posts:", error);
    }
}

function createBlogPostHTML(post) {
    return `
        <div class="blog-post-image">
            <img src="${post.imageUrl}" alt="${post.title}">
        </div>
        <div class="blog-post-meta">
            <span class="category">${post.category}</span>
            <span class="date">${formatDate(post.timestamp)}</span>
        </div>
        <h1>${post.title}</h1>
        <div class="blog-post-content">
            ${post.content}
        </div>
    `;
}

function createRelatedPostHTML(post, postId) {
    return `
        <article class="blog-card">
            <div class="blog-image">
                <img src="${post.imageUrl}" alt="${post.title}">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="date">${formatDate(post.timestamp)}</span>
                    <span class="category">${post.category}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <a href="blog-post.html?id=${postId}" class="read-more">Read More</a>
            </div>
        </article>
    `;
}

function formatDate(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
} 