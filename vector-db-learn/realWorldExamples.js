/**
 * VECTOR DATABASE - REAL WORLD EXAMPLES
 * ======================================
 * This file shows practical examples of how vector databases work
 * with different types of queries.
 */

const { cosineSimilarity, euclideanDistance } = require('./vectorMetrics.js');

// =============================================================================
// EXAMPLE 1: E-COMMERCE PRODUCT SEARCH
// =============================================================================

console.log('=== EXAMPLE 1: E-COMMERCE PRODUCT SEARCH ===\n');

// Products with embeddings (in real app, these come from ML models)
const products = [
    { id: 1, name: 'iPhone 15 Pro', category: 'phone', price: 999, 
      embedding: [0.9, 0.8, 0.1, 0.7, 0.95, 0.85] },
    { id: 2, name: 'Samsung Galaxy S24', category: 'phone', price: 899,
      embedding: [0.85, 0.75, 0.15, 0.65, 0.9, 0.8] },
    { id: 3, name: 'MacBook Pro 14"', category: 'laptop', price: 1999,
      embedding: [0.3, 0.9, 0.8, 0.95, 0.85, 0.4] },
    { id: 4, name: 'Dell XPS 15', category: 'laptop', price: 1499,
      embedding: [0.35, 0.85, 0.75, 0.9, 0.8, 0.45] },
    { id: 5, name: 'Nike Air Max', category: 'shoes', price: 150,
      embedding: [0.1, 0.2, 0.95, 0.1, 0.05, 0.9] },
    { id: 6, name: 'Adidas Ultraboost', category: 'shoes', price: 180,
      embedding: [0.12, 0.22, 0.9, 0.12, 0.07, 0.85] },
    { id: 7, name: 'Sony WH-1000XM5', category: 'headphones', price: 349,
      embedding: [0.6, 0.5, 0.2, 0.3, 0.25, 0.7] }
];

// User query: "I want a powerful laptop for coding"
const userQueryEmbedding = [0.25, 0.95, 0.85, 0.98, 0.88, 0.35];

function searchProducts(queryEmbedding, products, topK = 3) {
    const results = products.map(product => ({
        ...product,
        similarity: cosineSimilarity(queryEmbedding, product.embedding)
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
}

console.log('User Query: "I want a powerful laptop for coding"');
console.log('\nTop 3 Results:');
const searchResults = searchProducts(userQueryEmbedding, products);
searchResults.forEach((product, i) => {
    console.log(`${i + 1}. ${product.name} (${product.category}) - Similarity: ${product.similarity.toFixed(4)}`);
});


// =============================================================================
// EXAMPLE 2: DOCUMENT/ARTICLE SIMILARITY
// =============================================================================

console.log('\n=== EXAMPLE 2: DOCUMENT SIMILARITY ===\n');

const documents = [
    { id: 1, title: 'Introduction to Machine Learning', 
      content: 'Machine learning is a subset of artificial intelligence...',
      embedding: [0.85, 0.9, 0.8, 0.75, 0.7, 0.65, 0.6] },
    { id: 2, title: 'Deep Learning Fundamentals',
      content: 'Deep learning uses neural networks with multiple layers...',
      embedding: [0.8, 0.85, 0.85, 0.7, 0.65, 0.7, 0.55] },
    { id: 3, title: 'Web Development Best Practices',
      content: 'HTML, CSS, and JavaScript are core web technologies...',
      embedding: [0.1, 0.15, 0.2, 0.9, 0.85, 0.25, 0.3] },
    { id: 4, title: 'Database Design Principles',
      content: 'Relational databases use SQL for querying data...',
      embedding: [0.25, 0.2, 0.3, 0.7, 0.75, 0.8, 0.65] },
    { id: 5, title: 'Natural Language Processing',
      content: 'NLP deals with understanding and generating human language...',
      embedding: [0.75, 0.8, 0.7, 0.3, 0.35, 0.6, 0.85] }
];

// User asks: "Tell me about neural networks and AI"
const userQuestion = [0.82, 0.88, 0.78, 0.4, 0.45, 0.55, 0.7];

function findSimilarDocuments(queryEmbedding, documents, topK = 3) {
    const results = documents.map(doc => ({
        ...doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
}

console.log('User Question: "Tell me about neural networks and AI"');
console.log('\nMost Relevant Documents:');
const docResults = findSimilarDocuments(userQuestion, documents);
docResults.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.title} - Similarity: ${doc.similarity.toFixed(4)}`);
});


// =============================================================================
// EXAMPLE 3: RECOMMENDATION SYSTEM
// =============================================================================

console.log('\n=== EXAMPLE 3: MOVIE RECOMMENDATION ===\n');

const movies = [
    { id: 1, title: 'The Dark Knight', genre: 'action', rating: 9.0,
      embedding: [0.9, 0.1, 0.8, 0.2, 0.1, 0.3, 0.1, 0.1] },
    { id: 2, title: 'Inception', genre: 'sci-fi', rating: 8.8,
      embedding: [0.7, 0.3, 0.9, 0.1, 0.2, 0.5, 0.2, 0.1] },
    { id: 3, title: 'The Notebook', genre: 'romance', rating: 7.9,
      embedding: [0.1, 0.9, 0.1, 0.8, 0.3, 0.1, 0.1, 0.9] },
    { id: 4, title: 'Titanic', genre: 'romance', rating: 7.9,
      embedding: [0.15, 0.85, 0.1, 0.75, 0.35, 0.15, 0.1, 0.85] },
    { id: 5, title: 'Avengers: Endgame', genre: 'action', rating: 8.4,
      embedding: [0.95, 0.05, 0.7, 0.15, 0.1, 0.25, 0.1, 0.1] },
    { id: 6, title: 'Interstellar', genre: 'sci-fi', rating: 8.6,
      embedding: [0.65, 0.25, 0.95, 0.1, 0.15, 0.6, 0.2, 0.1] },
    { id: 7, title: 'La La Land', genre: 'musical', rating: 8.0,
      embedding: [0.2, 0.7, 0.15, 0.6, 0.4, 0.2, 0.8, 0.5] }
];

// User liked: "Inception" and "Interstellar" (sci-fi movies)
const userLikedMovies = [0.675, 0.275, 0.925, 0.1, 0.175, 0.55, 0.2, 0.1];

function recommendMovies(userPreference, movies, topK = 3) {
    const results = movies.map(movie => ({
        ...movie,
        score: cosineSimilarity(userPreference, movie.embedding)
    }));
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
}

console.log('User liked: "Inception", "Interstellar" (sci-fi fan)');
console.log('\nRecommended Movies:');
const movieRecs = recommendMovies(userLikedMovies, movies);
movieRecs.forEach((movie, i) => {
    console.log(`${i + 1}. ${movie.title} (${movie.genre}) - Match: ${movie.score.toFixed(4)}`);
});


// =============================================================================
// EXAMPLE 4: QUESTION ANSWERING (RAG PATTERN)
// =============================================================================

console.log('\n=== EXAMPLE 4: QUESTION ANSWERING (RAG) ===\n');

const knowledgeBase = [
    { id: 1, topic: 'javascript', content: 'JavaScript is a programming language for web development.',
      embedding: [0.9, 0.1, 0.85, 0.15] },
    { id: 2, topic: 'python', content: 'Python is known for its simplicity and data science capabilities.',
      embedding: [0.1, 0.9, 0.15, 0.85] },
    { id: 3, topic: 'react', content: 'React is a JavaScript library for building user interfaces.',
      embedding: [0.85, 0.15, 0.8, 0.2] },
    { id: 4, topic: 'machine_learning', content: 'Machine learning enables computers to learn from data.',
      embedding: [0.3, 0.7, 0.4, 0.6] }
];

// User asks a question
const userQuestionEmbedding = [0.88, 0.12, 0.82, 0.18];  // "Tell me about JavaScript frameworks"

function answerQuestion(questionEmbedding, knowledgeBase) {
    const contextResults = knowledgeBase.map(kb => ({
        ...kb,
        relevance: cosineSimilarity(questionEmbedding, kb.embedding)
    }));
    
    contextResults.sort((a, b) => b.relevance - a.relevance);
    const bestMatch = contextResults[0];
    
    return {
        retrievedContext: bestMatch,
        simulatedAnswer: `Based on: "${bestMatch.content}"`
    };
}

console.log('User Question: "Tell me about JavaScript frameworks"');
const qaResult = answerQuestion(userQuestionEmbedding, knowledgeBase);
console.log(`\nRetrieved Context: ${qaResult.retrievedContext.content}`);
console.log(`Relevance Score: ${qaResult.retrievedContext.relevance.toFixed(4)}`);


// =============================================================================
// EXAMPLE 5: IMAGE SEARCH
// =============================================================================

console.log('\n=== EXAMPLE 5: IMAGE SEARCH ===\n');

const images = [
    { id: 1, description: 'Red sunset over ocean', tags: ['red', 'sunset', 'ocean', 'nature'],
      embedding: [0.9, 0.1, 0.85, 0.2, 0.8, 0.15, 0.1, 0.9] },
    { id: 2, description: 'Blue sky with clouds', tags: ['blue', 'sky', 'clouds', 'nature'],
      embedding: [0.1, 0.9, 0.2, 0.8, 0.15, 0.85, 0.1, 0.7] },
    { id: 3, description: 'Red rose flower', tags: ['red', 'flower', 'rose', 'nature'],
      embedding: [0.95, 0.05, 0.8, 0.15, 0.75, 0.2, 0.2, 0.8] },
    { id: 4, description: 'Mountain landscape', tags: ['mountain', 'nature', 'landscape', 'sky'],
      embedding: [0.3, 0.7, 0.4, 0.6, 0.5, 0.5, 0.3, 0.9] }
];

// User uploads an image of a red flower
const uploadedImageEmbedding = [0.92, 0.08, 0.78, 0.18, 0.7, 0.25, 0.25, 0.75];

function searchImages(queryEmbedding, images, topK = 2) {
    const results = images.map(img => ({
        ...img,
        similarity: cosineSimilarity(queryEmbedding, img.embedding)
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
}

console.log('User uploads: Image of a red flower');
console.log('\nSimilar Images Found:');
const imageResults = searchImages(uploadedImageEmbedding, images);
imageResults.forEach((img, i) => {
    console.log(`${i + 1}. "${img.description}" - Similarity: ${img.similarity.toFixed(4)}`);
    console.log(`   Tags: ${img.tags.join(', ')}`);
});


// =============================================================================
// HOW VECTOR DB WORKS - STEP BY STEP
// =============================================================================

console.log('\n=== HOW VECTOR DB WORKS ===\n');

console.log(`
1. DATA PREPARATION
   Raw Data (text, image, audio) → Embedding Model → Vector [0.9, 0.1, 0.85]

2. STORAGE & INDEXING
   Store vectors in database with index (HNSW, IVF) for fast search

3. QUERY PROCESS
   User Query → Convert to Vector → Search Index → Find nearest neighbors

4. RETURN RESULTS
   Return top-K most similar items

Key Points:
✓ Similar items have similar vectors
✓ Distance metrics measure similarity
✓ Used in: Search, Recommendations, RAG, Anomaly Detection
`);
