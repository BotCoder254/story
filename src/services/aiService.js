import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key');

class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async suggestTitle(content, location = '') {
    try {
      const prompt = `Based on this travel story content and location, suggest 3 compelling, creative titles that would attract readers. Keep them under 60 characters each.

Content: ${content.substring(0, 500)}
Location: ${location}

Format your response as a JSON array of strings like: ["Title 1", "Title 2", "Title 3"]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        // Fallback if JSON parsing fails
        return text.split('\n').filter(line => line.trim()).slice(0, 3);
      }
    } catch (error) {
      console.error('Error generating title suggestions:', error);
      return ['My Travel Adventure', 'Journey to Remember', 'Wanderlust Moments'];
    }
  }

  async autoTag(content, location = '') {
    try {
      const prompt = `Analyze this travel story content and suggest relevant hashtags/tags. Focus on travel themes, activities, emotions, and location-specific tags.

Content: ${content.substring(0, 500)}
Location: ${location}

Return 5-8 relevant tags as a JSON array of strings (without # symbols): ["tag1", "tag2", "tag3"]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        // Fallback parsing
        const tags = text.match(/["']([^"']+)["']/g);
        return tags ? tags.map(tag => tag.replace(/["']/g, '')) : ['travel', 'adventure', 'wanderlust'];
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      return ['travel', 'adventure', 'wanderlust', 'explore'];
    }
  }

  async summarizeContent(content, targetWords = 50) {
    try {
      const prompt = `Summarize this travel story content in approximately ${targetWords} words. Keep the essence and excitement of the original story while making it concise and engaging.

Content: ${content}

Return only the summary text, no additional formatting.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error summarizing content:', error);
      return content.substring(0, targetWords * 6); // Rough fallback
    }
  }

  async generateInstagramCaption(title, content, location = '', tags = []) {
    try {
      const prompt = `Create an engaging Instagram caption for this travel story. Include emojis, relevant hashtags, and a call-to-action. Keep it under 150 words.

Title: ${title}
Content: ${content.substring(0, 300)}
Location: ${location}
Existing tags: ${tags.join(', ')}

Format: Caption text with emojis, followed by hashtags on new lines.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating Instagram caption:', error);
      return `${title} ✈️\n\n${content.substring(0, 100)}...\n\n#travel #wanderlust #adventure`;
    }
  }

  async enhanceStory(content, tone = 'engaging') {
    try {
      const prompt = `Enhance this travel story to make it more ${tone} and compelling. Maintain the original facts and experiences but improve the storytelling, add vivid descriptions, and make it more engaging for readers.

Original content: ${content}

Return the enhanced version maintaining the same structure and key points.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error enhancing story:', error);
      return content;
    }
  }

  async suggestNextParagraph(currentContent) {
    try {
      const prompt = `Based on this travel story content, suggest what the next paragraph could be about. Provide 2-3 brief suggestions (1-2 sentences each) that would naturally continue the story.

Current content: ${currentContent}

Format as a JSON array of strings: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return text.split('\n').filter(line => line.trim()).slice(0, 3);
      }
    } catch (error) {
      console.error('Error generating next paragraph suggestions:', error);
      return ['Continue with more details about the experience', 'Describe the local culture or people you met', 'Share what you learned from this adventure'];
    }
  }
}

export default new AIService();