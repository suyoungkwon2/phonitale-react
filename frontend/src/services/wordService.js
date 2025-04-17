import axios from 'axios';

class WordService {
    constructor() {
        this.words = [];
        this.loaded = false;
    }

    async loadWords() {
        if (this.loaded) return this.words;
        
        try {
            const response = await axios.get('/data/words.csv');
            const lines = response.data.split('\n');
            this.words = lines
                .slice(1) // Skip header
                .map(line => {
                    const [english, korean] = line.split(',');
                    return { english, korean };
                })
                .filter(word => word.english && word.korean);
            
            this.loaded = true;
            return this.words;
        } catch (error) {
            console.error('Error loading words:', error);
            throw error;
        }
    }

    getRandomWords(count = 12) {
        if (!this.loaded) {
            throw new Error('Words not loaded yet');
        }

        const shuffled = [...this.words].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

export default new WordService(); 