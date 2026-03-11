/**
 * VECTOR DATABASE - LEARNING GUIDE
 * ================================
 * This guide covers the fundamentals of vector databases and similarity metrics.
 * 
 * WHAT IS A VECTOR DATABASE?
 * --------------------------
 * A vector database is a specialized database that stores and queries high-dimensional
 * vector embeddings. It's optimized for similarity search - finding data points
 * that are "close" or "similar" to each other.
 * 
 * KEY CONCEPTS:
 * 1. Vector Embeddings: Numerical representations of data (text, images, audio)
 * 2. Dimensions: Number of values in each vector (e.g., 128, 256, 768, 1536)
 * 3. Similarity Search: Finding closest vectors to a query vector
 * 4. Distance Metrics: Ways to measure "closeness" between vectors
 */

// =============================================================================
// SIMILARITY METRICS - The Core of Vector Databases
// =============================================================================

/**
 * 1. COSINE SIMILARITY
 * --------------------
 * Measures the angle between two vectors.
 * Range: -1 to 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 * 
 * Best for: Text embeddings, document similarity, when direction matters more than magnitude
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
        return 0;
    }
    
    return dotProduct / (normA * normB);
}

/**
 * 2. EUCLIDEAN DISTANCE (L2 Distance)
 * -----------------------------------
 * Straight-line distance between two points in space.
 * Range: 0 to infinity (0 = identical)
 * 
 * Best for: Geographic data, image similarity, when absolute distance matters
 */
function euclideanDistance(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }
    
    let sumSquaredDiff = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquaredDiff += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiff);
}

/**
 * 3. MANHATTAN DISTANCE (L1 Distance)
 * ------------------------------------
 * Sum of absolute differences between coordinates.
 * Range: 0 to infinity (0 = identical)
 * 
 * Best for: High-dimensional spaces, when you want less sensitive to outliers
 */
function manhattanDistance(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }
    
    let sumAbsoluteDiff = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        sumAbsoluteDiff += Math.abs(vecA[i] - vecB[i]);
    }
    
    return sumAbsoluteDiff;
}

/**
 * 4. DOT PRODUCT
 * --------------
 * Sum of element-wise products.
 * Range: -infinity to +infinity
 * 
 * Best for: Neural network activations, when direction matters
 */
function dotProduct(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }
    
    let result = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        result += vecA[i] * vecB[i];
    }
    
    return result;
}

/**
 * 5. JACCARD SIMILARITY
 * ---------------------
 * For binary/sparse vectors - measures intersection over union.
 * Range: 0 to 1 (1 = identical)
 * 
 * Best for: Set-based data, presence/absence data
 */
function jaccardSimilarity(vecA, vecB) {
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        if (vecA[i] > 0 || vecB[i] > 0) {
            union++;
            if (vecA[i] > 0 && vecB[i] > 0) {
                intersection++;
            }
        }
    }
    
    return union === 0 ? 0 : intersection / union;
}

// =============================================================================
// Export functions for use in other files
// =============================================================================

module.exports = {
    cosineSimilarity,
    euclideanDistance,
    manhattanDistance,
    dotProduct,
    jaccardSimilarity
};

// =============================================================================
// DEMO - Only run when executed directly
// =============================================================================

if (require.main === module) {
    console.log('=== VECTOR DATABASE METRICS DEMO ===\n');

    // Example vectors
    const vec1 = [1, 2, 3];
    const vec2 = [4, 5, 6];
    const vec3 = [1, 2, 3];

    console.log('Vector A:', vec1);
    console.log('Vector B:', vec2);
    console.log('Vector C (same as A):', vec3);
    console.log('');

    console.log('--- Comparing A with B ---');
    console.log('Cosine Similarity:', cosineSimilarity(vec1, vec2).toFixed(4));
    console.log('Euclidean Distance:', euclideanDistance(vec1, vec2).toFixed(4));
    console.log('Manhattan Distance:', manhattanDistance(vec1, vec2).toFixed(4));
    console.log('Dot Product:', dotProduct(vec1, vec2));
    console.log('');

    console.log('--- Comparing A with C (identical) ---');
    console.log('Cosine Similarity:', cosineSimilarity(vec1, vec3).toFixed(4));
    console.log('Euclidean Distance:', euclideanDistance(vec1, vec3).toFixed(4));
    console.log('');

    // Simulated word embeddings
    const wordEmbeddings = {
        'king': [0.9, 0.1, 0.3, 0.8],
        'queen': [0.85, 0.15, 0.35, 0.75],
        'man': [0.7, 0.8, 0.2, 0.1],
        'woman': [0.65, 0.85, 0.25, 0.15],
        'apple': [0.1, 0.9, 0.4, 0.2],
        'orange': [0.15, 0.85, 0.45, 0.25],
        'computer': [0.3, 0.2, 0.9, 0.8],
        'laptop': [0.35, 0.25, 0.85, 0.75]
    };

    function findSimilarWords(query, embeddings, topK = 3) {
        const queryVector = embeddings[query];
        if (!queryVector) {
            throw new Error(`Word "${query}" not found in embeddings`);
        }
        
        const similarities = [];
        
        for (const [word, vector] of Object.entries(embeddings)) {
            if (word !== query) {
                similarities.push({
                    word,
                    cosineSim: cosineSimilarity(queryVector, vector),
                    euclideanDist: euclideanDistance(queryVector, vector)
                });
            }
        }
        
        similarities.sort((a, b) => b.cosineSim - a.cosineSim);
        return similarities.slice(0, topK);
    }

    console.log('=== SEMANTIC SEARCH DEMO ===\n');
    console.log('Finding words similar to "king":');
    const similarToKing = findSimilarWords('king', wordEmbeddings);
    similarToKing.forEach((result, i) => {
        console.log(`${i + 1}. ${result.word} - Cosine: ${result.cosineSim.toFixed(4)}, Euclidean: ${result.euclideanDist.toFixed(4)}`);
    });

    console.log('\nFinding words similar to "apple":');
    const similarToApple = findSimilarWords('apple', wordEmbeddings);
    similarToApple.forEach((result, i) => {
        console.log(`${i + 1}. ${result.word} - Cosine: ${result.cosineSim.toFixed(4)}, Euclidean: ${result.euclideanDist.toFixed(4)}`);
    });

    console.log('\n=== LEARNING COMPLETE ===');
    console.log('Key takeaways:');
    console.log('1. Cosine similarity is most common for text/embeddings');
    console.log('2. Euclidean distance for absolute proximity');
    console.log('3. Choose metric based on your use case');
    console.log('4. Vector databases use indexing for fast search');
}
