require('dotenv').config();
const session    = require("express-session");
const MongoStore = require("connect-mongo")(session);
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const passport = require('passport')
const User = require('./models/user')
const TwitterStrategy = require('passport-twitter').Strategy

const LocalStrategy = require("passport-local").Strategy;



mongoose
  .connect(process.env.MONGODB_URI {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTERKEY,
  consumerSecret: process.env.TWITTERSECRET,
  callbackURL: process.env.CALLBACK
},(accessToken, tokenSecret, profile, done) => {
  // console.log(">>>>this is the profile", profile)
var modifedImage = ""

  profile.photos.forEach((one)=>{
    // console.log("oneguy",one.value)
    modifedImage = one.value.replace("_normal", "")
  })
  // console.log(">>>>p", profile)
  User.findOne({ twitterUsername: profile.username })
  .then((user, err) => {
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null, user);
    }

    const newUser = new User({
      twitterUsername: profile.username,
      twitterId: profile.id,
      displayName: profile.displayName,
      description: profile._json.description,
      image: modifedImage,
      token: accessToken,
      tokenSec: tokenSecret
    });

    return newUser.save()
    .then(user => {
      done(null, newUser);
    })
  })
  .catch(error => {
    console.log(error)
  })
}));

app.use(passport.initialize());
app.use(passport.session());






// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';



const index = require('./routes/index');
app.use('/', index);

const userRoutes = require('./routes/userRoutes')
app.use('/', userRoutes)

module.exports = app;
