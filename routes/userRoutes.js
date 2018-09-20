const express = require('express');
const router = express.Router();
const User = require('../models/user')
const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const Twitter = require('twitter');
const ensureLogin = require("connect-ensure-login");
const flash = require("connect-flash");
const axios = require("axios")
var Twit = require('twit')
var client;


// function getUser(user){
// var T = new Twit({
//   consumer_key: process.env.TWITTERKEY,
//   consumer_secret: process.env.TWITTERSECRET,
//   access_token_key: user.token,
//   access_token_secret: user.tokenSec
// })
//   return client;
// }




function getUser(user) {
  client = new Twitter({
    consumer_key: process.env.TWITTERKEY,
    consumer_secret: process.env.TWITTERSECRET,
    access_token_key: user.token,
    access_token_secret: user.tokenSec
  })
  return client;
}


router.get('/login', (req, res, next) => {
  res.render("userViews/login")
})



router.get('/auth/twitter', passport.authenticate('twitter'));

router.get("https://twit-bot-1.herokuapp.com/signup/twitter/return", passport.authenticate("twitter", {
    failureRedirect: "/"
  }),
  function(req, res) {
    // console.log(req)
    // console.log(req.user.id)
    res.redirect(`/profile/:id`)

  }
);


router.get("/profile/:id", ensureLogin.ensureLoggedIn(), (req, res, next) => {
  console.log("req1", req.user.id)
  var id = req.user.id
  // console.log("carajo", tweetId)
  User.findById(id)
    .then((user) => {
      //  calling funciton to create new Client from twitter
      getUser(user);
      //
      let date1 = user.created_at
      let cleanDate = date1.toISOString().split `T` [0]
      var cleanId = ""

      res.render("userViews/profile", {
        user: user,
        userImage: user.image,
        dateCreated: cleanDate,

      })

    })
})

router.get('/search/user', (req, res) => {
  console.log("nm", req.query.name);
  console.log("all", req.query);
  var name = req.query.name


  if(name === ''){
    res.redirect('/profile/:id')
  }else {


    var param1 = {
      screen_name: name
    }
    client.get("users/lookup", param1, function(error, data, response) {
      console.log("xxx1", data[0])
      var modifedImage2 = ""
      data.forEach((one) => {
        modifedImage2 = one.profile_image_url.replace("_normal", "")
      })
      console.log("xxx1", modifedImage2)

      function convert(value) {
        if (value >= 1000000) {
          value = Math.round((value / 1000000) * 10) / 10 + "M"
        } else if (value >= 1000) {
          value = Math.round((value / 1000) * 10) / 10 + "K";
        }
        return value;
      }
      var followersRound = convert(data[0].followers_count)
      var statusRound = convert(data[0].statuses_count)
      let myResponse = {
        name: data[0].name,
        image2: modifedImage2,
        followers: followersRound,
        statuses: statusRound,
        twitterId: data[0].id_str
      }

      var id = req.user.id
      User.findById(id)
      .then((user) => {
        getUser(user);
        //
        let date1 = user.created_at
        let cleanDate = date1.toISOString().split `T` [0]
        var cleanId = ""

        res.render(`userViews/profile`, {
          myResponse: myResponse,
          user: user,
          userImage: user.image,
          dateCreated: cleanDate,
        })

      })

    })
  }

})


router.post('/profile/edit', (req, res, next) => {
  console.log("working1", req.body);
  console.log("musk",req.body.twitterId);
  console.log(req.user.id);



    User.findByIdAndUpdate(req.user.id, {
        $push: {
          botFollowing: req.body.twitterId
        }
      })
      .then((data) => {
        console.log(data)
        res.redirect("/profile/:id")
      })
      .catch(next)

    res.redirect("/profile/:id")

})


router.get('/user/stream', (req, res) => {
  User.findById(req.user.id)
    .then((data) => {
      console.log("doug:", data.botFollowing)
      var following1 = data.botFollowing.join(',')
      // var following3 = following1.toString()
      console.log('jlajlfjalfjlajf: ', following1)

      console.log("==============================");
      var x = following1
      console.log('x is  = = = = =  =', x);
      console.log(typeof x)
      console.log(following1);
      console.log("==============================")

      following2 = {
        follow: data.botFollowing.map(Number)
      }
      var following4 = {
        // follow: '1042038052816863234,1308211178,2148233600,3840,1020416827330039808'
        follow: following1
      }
      //tried following1, following2
      var stream = client.stream('statuses/filter', {
        follow: data.botFollowing.join(',')
      });
      // var stream = client.stream('statuses/filter', {follow: '1042038052816863234,1041851440350810112'});

      console.log(`waiting  for tweet, ID: ` + following4.follow)

      stream.on('data', function(tweet) {
        console.log(tweet)
        var data = tweet.id_str
        // getUser2()
        var tweet = {
          status: tweet.text
        }

        client.post('statuses/retweet/' + data, tweeted)

        function tweeted(err, data, response) {
          if (err) {
            console.log('something went wrong')
            console.log(err)
          } else {
            console.log("it worked");
          }
        }

        tweeted()
      })
      res.redirect('/profile/:id')
    })

})


router.get("/logout", (req, res) => {
  console.log("LOGOUT", req.user.id);
  let id = req.user.id

  User.findByIdAndRemove(id, function(err, data) {
    if (!err) {
      console.log("Deleted");
      req.logout();
      res.redirect("/");
    }
  });
});





module.exports = router;
