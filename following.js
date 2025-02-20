const { Scraper } = require('agent-twitter-client');
const fs = require('fs');
const { TWITTER_USERNAME, TWITTER_PASSWORD, TARGET_USERNAME } = require('./constants');


async function saveFollowingList(targetUsername, maxUsers = 100) {
  console.log(`Fetching following list for ${targetUsername}...`);
  
  try {
    // Initialize the scraper
    const scraper = new Scraper();
    
    // Login to Twitter
    console.log('Logging in to Twitter...');
    await scraper.login(TWITTER_USERNAME, TWITTER_PASSWORD);
    
    // Check if login was successful
    const isLoggedIn = await scraper.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Failed to log in to Twitter');
    }
    console.log('Successfully logged in to Twitter');
    
    // Get user ID from screen name
    console.log(`Getting user ID for ${targetUsername}...`);
    const userId = await scraper.getUserIdByScreenName(targetUsername);
    
    if (!userId) {
      throw new Error(`Could not find user ID for ${targetUsername}`);
    }
    
    console.log(`User ID for ${targetUsername}: ${userId}`);
    
    // Get following list with specified limit
    console.log(`\nFetching up to ${maxUsers} accounts that ${targetUsername} is following...`);
    
    const followingGenerator = scraper.getFollowing(userId, maxUsers);
    const following = [];
    let count = 0;
    
    // Process following
    for await (const user of followingGenerator) {
      following.push({
        id: user.id,
        screenName: user.screenName,
        name: user.name,
        bio: user.description || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        verified: user.verified || false
      });
      
      count++;
      if (count % 10 === 0) {
        console.log(`Fetched ${count} accounts so far...`);
      }
      
      if (count >= maxUsers) {
        console.log(`Reached limit of ${maxUsers} accounts.`);
        break;
      }
    }
    
    // Save to file
    const filename = `${targetUsername}_following_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(following, null, 2), 'utf8');
    
    console.log(`\nSuccessfully saved ${following.length} accounts to ${filename}`);
    
    // Print sample
    console.log("\nSample of accounts being followed:");
    const sample = following.slice(0, 5);
    sample.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.screenName}) - Followers: ${user.followersCount}`);
    });
    
    return {
      userId,
      followingCount: following.length,
      filename
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Change maxUsers parameter as needed
    await saveFollowingList(TARGET_USERNAME, 100);
  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
})();