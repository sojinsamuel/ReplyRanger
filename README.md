# ReplyRanger
This is a Twitter bot powered by OpenAI's GPT-3 language model. The bot can generate short replies to tweets based on user prompts. It searches for tweets containing specific keywords and replies to them. The bot also replies to recent tweets from followed users.

## Getting Started

To get started with the Twitter bot, follow the instructions below.

### Prerequisites

- Node.js (version 12 or higher)
- Twitter API credentials
- OpenAI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sojinsamuel/ReplyRanger.git
   ```

2. Install the dependencies:

   ```bash
      cd Directory
      npm install
    ```

3. Set up environment variables:

- rename  `.env.example` file to `.env` in the project root directory.

## Usage
1. Run the bot:
```bash
node bot.js
```
2. Customize the bot behavior:
- Modify the keywords in the getKeywords function to search for specific topics.
- Adjust the delay between API calls in the delay function to avoid rate limiting.

3. Customize replied tweets persistence (optional):
- The bot keeps track of replied tweets to avoid replying to the same tweet multiple times. The replied tweet IDs are stored in the repliedTweets.json file.
- If the file doesn't exist, the bot will start with an empty set.
- You can manually create the repliedTweets.json file and populate it with tweet IDs to skip replying to specific tweets.
- If the file is deleted or empty, the bot will start with an empty set and reply to all tweets.
