/**
 * INTERACTIVE VECTOR DATABASE LEARNER
 * ===================================
 * Run this and type any text to see how vector embeddings work!
 * 
 * How it works:
 * 1. Type any text when prompted
 * 2. System converts text to a simple vector (word-based)
 * 3. Shows similarity with stored example texts
 * 4. Find similar items in the database
 */

const readline = require('readline');

// =============================================================================
// Vocabulary for word-based embeddings
// =============================================================================

const vocabulary = [
    'javascript', 'programming', 'language', 'web', 'development', 
    'python', 'great', 'data', 'science', 'machine', 'learning', 'java', 'object', 'oriented',
    'pizza', 'italian', 'dish', 'cheese', 'toppings', 'sushi', 'japanese', 'raw', 'fish', 'rice',
    'football', 'popular', 'team', 'sport', 'ball', 'cricket', 'bat', 'england', 'india',
    'physics', 'studies', 'matter', 'energy', 'interactions', 'chemistry', 'properties', 'composition', 'substances',
    'rock', 'music', 'electric', 'guitars', 'loud', 'drums', 'classical', 'orchestras', 'symphonies',
    'action', 'movies', 'exciting', 'stunts', 'explosions', 'comedy', 'meant', 'make', 'laugh',
    'computer', 'code', 'software', 'ai', 'artificial', 'intelligence', 'neural', 'network'
];

// =============================================================================
// Text to Vector Converter (Word-based with fuzzy matching)
// =============================================================================

function textToVector(text) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const vector = new Array(vocabulary.length).fill(0);
    
    // Exact word matches
    words.forEach(word => {
        const index = vocabulary.indexOf(word);
        if (index !== -1) {
            vector[index] = 1;
        }
    });
    
    // Partial matches (fuzzy)
    words.forEach(word => {
        if (word.length < 3) return;
        vocabulary.forEach((vocabWord, i) => {
            if (word.includes(vocabWord) || vocabWord.includes(word)) {
                vector[i] = Math.max(vector[i], 0.7);
            }
        });
    });
    
    // Character frequency for short words
    const charFreq = {};
    words.forEach(word => {
        for (let i = 0; i < word.length; i++) {
            const c = word[i];
            charFreq[c] = (charFreq[c] || 0) + 1;
        }
    });
    
    return vector;
}

// =============================================================================
// Similarity Functions
// =============================================================================

function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
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
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
}

function euclideanDistance(vecA, vecB) {
    if (vecA.length !== vecB.length) return Infinity;
    
    let sumSquaredDiff = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquaredDiff += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiff);
}

// =============================================================================
// Sample Database
// =============================================================================

const database = [
    { id: 1, category: 'programming', text: 'javascript is a programming language for web development', 
      description: 'JavaScript - Web dev' },
    { id: 2, category: 'programming', text: 'python is great for data science and machine learning',
      description: 'Python - AI/ML' },
    { id: 3, category: 'programming', text: 'java is an object oriented programming language',
      description: 'Java - Enterprise' },
    { id: 4, category: 'food', text: 'pizza is an italian dish with cheese and toppings',
      description: 'Pizza' },
    { id: 5, category: 'food', text: 'sushi is a japanese dish with raw fish and rice',
      description: 'Sushi' },
    { id: 6, category: 'sports', text: 'football is a popular team sport played with a ball',
      description: 'Football' },
    { id: 7, category: 'sports', text: 'cricket is a bat and ball sport popular in england and india',
      description: 'Cricket' },
    { id: 8, category: 'science', text: 'physics studies matter energy and their interactions',
      description: 'Physics' },
    { id: 9, category: 'science', text: 'chemistry studies the properties and composition of substances',
      description: 'Chemistry' },
    { id: 10, category: 'music', text: 'rock music has electric guitars and loud drums',
      description: 'Rock Music' },
    { id: 11, category: 'music', text: 'classical music has orchestras and symphonies',
      description: 'Classical Music' },
    { id: 12, category: 'movies', text: 'action movies have exciting stunts and explosions',
      description: 'Action Movies' },
    { id: 13, category: 'movies', text: 'comedy movies are meant to make you laugh',
      description: 'Comedy Movies' }
];

// Pre-compute embeddings
database.forEach(item => {
    item.embedding = textToVector(item.text);
});

// =============================================================================
// Search Function
// =============================================================================

function searchSimilar(queryText, topK = 3) {
    const queryVector = textToVector(queryText);
    
    const results = database.map(item => ({
        ...item,
        cosineSim: cosineSimilarity(queryVector, item.embedding),
        euclideanDist: euclideanDistance(queryVector, item.embedding)
    }));
    console.log(results)
    results.sort((a, b) => b.cosineSim - a.cosineSim);
    
    return results.slice(0, topK);
}

// =============================================================================
// Interactive CLI
// =============================================================================

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n' + '='.repeat(60));
console.log('    VECTOR DATABASE - INTERACTIVE LEARNER');
console.log('='.repeat(60));
console.log('\nHow it works:');
console.log('1. Type any text (question, word, phrase)');
console.log('2. System converts it to a VECTOR');
console.log('3. Compares with database using COSINE SIMILARITY');
console.log('4. Shows most similar items!\n');

console.log('Database contains:');
console.log('  - Programming: JavaScript, Python, Java');
console.log('  - Food: Pizza, Sushi');
console.log('  - Sports: Football, Cricket');
console.log('  - Science: Physics, Chemistry');
console.log('  - Music: Rock, Classical');
console.log('  - Movies: Action, Comedy\n');

console.log('Try typing: "python", "pizza", "cricket", "physics"');
console.log('Or try: "tell me about programming", "i love music"\n');

function askQuestion() {
    rl.question('>>> Enter your text: ', (input) => {
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
            console.log('\nThanks for learning! Goodbye!');
            rl.close();
            return;
        }
        
        if (!input.trim()) {
            askQuestion();
            return;
        }
        
        console.log('\n' + '-'.repeat(50));
        console.log('STEP 1: Converting text to VECTOR...');
        const queryVector = textToVector(input);
        const activeFeatures = vocabulary.filter((w, i) => queryVector[i] > 0);
        console.log('Your text: "' + input + '"');
        console.log('Matched words: ' + activeFeatures.join(', '));
        
        console.log('\nSTEP 2: Comparing with database...');
        
        const results = searchSimilar(input, 5);
        
        console.log('\n' + '='.repeat(50));
        console.log('TOP MATCHES:');
        console.log('='.repeat(50));
        
        results.forEach((result, i) => {
            const matchPercent = (result.cosineSim * 100).toFixed(1);
            console.log(`\n${i + 1}. ${result.description}`);
            console.log(`   Category: ${result.category}`);
            console.log(`   Similarity: ${matchPercent}%`);
            console.log(`   Text: "${result.text}"`);
        });
        
        console.log('\n' + '-'.repeat(50));
        
        if (results[0].cosineSim > 0.1) {
            console.log(`✓ Best match: "${results[0].text}" (${results[0].category})`);
        } else {
            console.log('⚠ Low similarity found');
        }
        
        console.log('\n');
        askQuestion();
    });
}

console.log('\n');
askQuestion();
