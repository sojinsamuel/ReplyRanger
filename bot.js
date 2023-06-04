const { TwitterApi } = require("twitter-api-v2");
const Twit = require("twit");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

const he = require("he");

require("dotenv").config();

const twitterApiKey = process.env.TWITTER_API_KEY;
const twitterApiSecret = process.env.TWITTER_API_SECRET_KEY;
const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN;
const twitterAccessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;

// Visit https://tweeterid.com/ to get the user ID of your bot's account
const BOT_USER_ID = "XXXXXXXX";

// Tokens must have read and write access (elevated permissions)
const client = new TwitterApi({
  appKey: twitterApiKey,
  appSecret: twitterApiSecret,
  accessToken: twitterAccessToken,
  accessSecret: twitterAccessTokenSecret,
});

const api = new Twit({
  consumer_key: twitterApiKey,
  consumer_secret: twitterApiSecret,
  access_token: twitterAccessToken,
  access_token_secret: twitterAccessTokenSecret,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const twitterV2Client = new TwitterApi(twitterBearerToken);

// This function is used to add a delay between API calls to avoid rate limiting issues
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const renderMessage = (message) => {
  // Decode HTML entities
  const decodedMessage = he.decode(message);
  return decodedMessage;
};

const getKeywords = () => {
  const keywords = ["javascript", "react", "nodejs", "vuejs", "angular"];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  return randomKeyword;
};

// Load the replied tweets from a file
let repliedTweets = new Set();
try {
  const data = fs.readFileSync("repliedTweets.json", "utf8");
  repliedTweets = new Set(JSON.parse(data));
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("\nNo repliedTweets.json found. Starting with an empty set.");
  } else {
    console.log("\nError loading replied tweets:", error);
  }
}

const replyToTweet = async (tweetId, tweetText) => {
  if (repliedTweets.has(tweetId)) {
    console.log(`\nAlready replied to tweet ID ${tweetId}`);
    return;
  }

  // Add a delay of 1 minute before replying to the next user's tweet
  // increse the delay if you are getting Too Many Requests error
  await delay(1 * 60 * 1000);

  const prompt = `"Write a short reply to this tweet under 100 characters: ${tweetText}."`;
  const aiResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const responseContent = aiResponse.data.choices[0].message.content;

  try {
    await client.v1.reply(responseContent, tweetId);
    console.log(`\nReplied to tweet ID ${tweetId}. Msg: ${responseContent}`);

    // Add the tweetId to the repliedTweets set
    repliedTweets.add(tweetId);

    // Save the replied tweets to a file
    try {
      const data = JSON.stringify(Array.from(repliedTweets));
      fs.writeFileSync("repliedTweets.json", data, "utf8");
      console.log(`\nAdded tweet ID ${tweetId} to replied tweets.`);
    } catch (error) {
      console.log("\nError saving replied tweets:", error);
    }
  } catch (error) {
    console.error("\nAn error occurred:", error);
  }
};

const searchAndReplyToTweets = async (keyword) => {
  const searchResults = await api.get("search/tweets", {
    q: keyword,
    count: 2, // number of tweets you want to fetch (its value can be between 1 to 100)
  });

  console.log(
    `\nFound ${searchResults.data.statuses.length} tweets containing the keyword "${keyword}". Generating replies...`
  );

  for (const tweet of searchResults.data.statuses) {
    await replyToTweet(tweet.id_str, tweet.text);
    // console.log(`\nReplied to tweet ID ${tweet.id_str}`);
  }

  console.log(`\nReplied to all tweets containing the keyword "${keyword}".`);
};

const getFollowings = async (userId) => {
  const followings = await twitterV2Client.v2.following(userId, {
    // You can remove this parameter {max_results: XXXX} if you want to search for all followings
    max_results: 2, // max number of followings to fetch
  });

  return followings.data;
};

const replyToRecentTweets = async () => {
  const followedUsers = await getFollowings(BOT_USER_ID);

  for (const user of followedUsers) {
    const userId = user.id;
    const userName = user.username;

    console.log(
      `\nFinding recent tweets of user with ID ${userId} (${userName})`
    );

    const tweets = (
      await twitterV2Client.v2.userTimeline(userId, { exclude: "replies" })
    ).data.data;

    if (tweets.length > 0) {
      await replyToTweet(tweets[0].id, renderMessage(tweets[0].text));
      // console.log(`Replied to the recent tweet of user ${userName}`);
    } else {
      console.log(`\nNo recent tweets found for user ${userName}`);
    }
  }
};

const runTweetReply = async () => {
  try {
    console.log("Starting tweet reply...\n");

    await replyToRecentTweets();
    console.log("\n Replying to recent tweets completed.");

    console.log("\n Starting keyword search...");
    await delay(1 * 60 * 1000);

    await searchAndReplyToTweets(getKeywords());
    console.log("\n Keyword search completed.");
  } catch (error) {
    console.error("An error occurred:", error);
  }

  // Run the program again after 48 hours (its up to you)
  await new Promise((resolve) => setTimeout(resolve, 48 * 60 * 60 * 1000));
  runTweetReply();
};

runTweetReply();
