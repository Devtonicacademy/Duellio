export class ChatModerationService {
  // A simple list of profane words to filter.
  // In a production app, this would be more comprehensive or use an external API.
  private static readonly BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'bastard', 'slut', 'whore'
  ];

  /**
   * Filters a message by replacing bad words with asterisks.
   */
  static filterMessage(text: string): string {
    if (!text) return text;
    
    let filteredText = text;
    
    for (const word of this.BAD_WORDS) {
      // Create a regex to match the word case-insensitively, with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      
      // Replace the word with a string of asterisks of the same length
      filteredText = filteredText.replace(regex, (match) => '*'.repeat(match.length));
    }
    
    return filteredText;
  }
}
