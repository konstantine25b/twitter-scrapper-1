const { Scraper } = require('agent-twitter-client');
const fs = require('fs');
const { TWITTER_USERNAME, TWITTER_PASSWORD,TARGET_USERNAME } = require('./constants');


async function saveFollowersList(targetUsername, maxUsers = 100) {
  console.log(`Fetching followers list for ${targetUsername}...`);
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
    
    // Get followers list with specified limit
    console.log(`\nFetching up to ${maxUsers} followers of ${targetUsername}...`);
    const followersGenerator = scraper.getFollowers(userId, maxUsers);
    const followers = [];
    let count = 0;
    
    // Process followers
    for await (const user of followersGenerator) {
      followers.push({
        id: user.id,
        screenName: user.screenName,
        name: user.name,
        bio: user.description || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        verified: user.verified || false,
        profileImageUrl: user.profileImageUrl || ''
      });
      count++;
      if (count % 10 === 0) {
        console.log(`Fetched ${count} followers so far...`);
      }
      if (count >= maxUsers) {
        console.log(`Reached limit of ${maxUsers} followers.`);
        break;
      }
    }
    
    // Save to file
    const filename = `${targetUsername}_followers_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(followers, null, 2), 'utf8');
    console.log(`\nSuccessfully saved ${followers.length} followers to ${filename}`);
    
    // Print sample and basic stats
    console.log("\nSample of followers:");
    const sample = followers.slice(0, 5);
    sample.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.screenName}) - Followers: ${user.followersCount}`);
    });
    
    // Calculate some basic statistics
    if (followers.length > 0) {
      const averageFollowers = followers.reduce((sum, user) => sum + (user.followersCount || 0), 0) / followers.length;
      const mostFollowedUser = [...followers].sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))[0];
      console.log("\nBasic Follower Statistics:");
      console.log(`Average followers per user: ${averageFollowers.toFixed(0)}`);
      console.log(`Most influential follower: @${mostFollowedUser.screenName} with ${mostFollowedUser.followersCount} followers`);
    }
    
    return { 
      userId, 
      followerCount: followers.length, 
      filename 
    };
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Change maxUsers parameter as needed
    await saveFollowersList(TARGET_USERNAME, 100);
  } catch (error) {
    console.error('Application error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();