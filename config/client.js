const Twitter = require('twitter');

var client;


function getUser (user){
   client = new Twitter({
    consumer_key: process.env.TWITTERKEY,
    consumer_secret: process.env.TWITTERSECRET,
    access_token_key: user.token,
    access_token_secret: user.tokenSec
  })
  return client;
}

module.exports = getUser;
