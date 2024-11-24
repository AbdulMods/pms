import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    where, 
    limit, 
    startAfter,
    getDocs,
    onSnapshot 
} from "firebase/firestore";

let lastVisible = null;
let currentCategory = 'all';
const POSTS_PER_PAGE = 6;

document.addEventListener('DOMContentLoaded', () => {
    initializeBlogPage();
});

async function initializeBlogPage() {
    setupCategoryListeners();
    await loadFeaturedPost();
    await loadBlogPosts();
    setupPaginationListeners();
}

function setupCategoryListeners() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update category and reload posts
            currentCategory = button.dataset.category;
            lastVisible = null;
            await loadBlogPosts(true);
        });
    });
}

async function loadFeaturedPost() {
    const featuredPostContainer = document.getElementById('featuredPost');
    const featuredQuery = query(
        collection(db, "blog_posts"),
        where("featured", "==", true),
        limit(1)
    );

    try {
        const snapshot = await getDocs(featuredQuery);
        if (!snapshot.empty) {
            const post = snapshot.docs[0].data();
            featuredPostContainer.innerHTML = createFeaturedPostHTML(post, snapshot.docs[0].id);
        }
    } catch (error) {
        console.error("Error loading featured post:", error);
    }
}

async function loadBlogPosts(reset = false) {
    const blogGrid = document.getElementById('blogGrid');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    if (reset) {
        blogGrid.innerHTML = '';
    }
    
    loadingSpinner.style.display = 'block';
    
    try {
        let postsQuery = query(
            collection(db, "blog_posts"),
            where("featured", "==", false),
            orderBy("timestamp", "desc")
        );

        if (currentCategory !== 'all') {
            postsQuery = query(postsQuery, where("category", "==", currentCategory));
        }

        if (lastVisible) {
            postsQuery = query(postsQuery, startAfter(lastVisible), limit(POSTS_PER_PAGE));
        } else {
            postsQuery = query(postsQuery, limit(POSTS_PER_PAGE));
        }

        const snapshot = await getDocs(postsQuery);
        
        if (snapshot.empty && reset) {
            blogGrid.innerHTML = '<p class="no-posts">No posts found in this category</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const post = doc.data();
            blogGrid.insertAdjacentHTML('beforeend', createBlogPostHTML(post, doc.id));
        });

        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        // Update pagination buttons
        document.getElementById('prevPage').disabled = !lastVisible;
        document.getElementById('nextPage').disabled = snapshot.docs.length < POSTS_PER_PAGE;
        
    } catch (error) {
        console.error("Error loading blog posts:", error);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function setupPaginationListeners() {
    document.getElementById('prevPage').addEventListener('click', () => {
        // Implementation for previous page
    });

    document.getElementById('nextPage').addEventListener('click', async () => {
        await loadBlogPosts();
    });
}

function createFeaturedPostHTML(post, postId) {
    return `
        <div class="featured-post-image">
            <img src="${post.imageUrl}" alt="${post.title}">
        </div>
        <div class="featured-post-content">
            <div class="featured-post-meta">
                <span class="featured-post-category">${post.category}</span>
                <span class="featured-post-date">${formatDate(post.timestamp)}</span>
            </div>
            <h2 class="featured-post-title">${post.title}</h2>
            <p class="featured-post-excerpt">${post.excerpt}</p>
            <a href="blog-post.html?id=${postId}" class="read-more">Read More</a>
        </div>
    `;
}

function createBlogPostHTML(post, postId) {
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