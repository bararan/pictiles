//@ts-check
"use strict";
require("dotenv").config();
const express = require("express")
      , session = require("express-session")
      , http = require("http")
      , socketIO = require("socket.io")
      , bodyParser = require("body-parser")
      , mongo = require("mongodb")
      , MongoStore = require("connect-mongo")(session)
      , path = require("path")
      , pug = require("pug")
      , morgan = require("morgan")
      , passport = require("passport")
      , TwitterStrategy = require("passport-twitter").Strategy
      , flash = require("connect-flash")
      , pictiles = require("./app/pictiles")
      ;

const url = "mongodb://" + process.env.DBUSR + ":" + process.env.DBPW + "@" + process.env.DB_URI;
const dbClient = mongo.MongoClient;

dbClient.connect(url, (err, db) => {
    if (err) throw err;
    let app = express();
    const server = http.Server(app);
    const io = socketIO(server);
    const sessionStore = session({
        secret: "myDirtyLittleSecret"
        , resave: false
        , saveUninitialized: false
        , store: new MongoStore(
            {
                db: db
                , collection: "pictilesSessions"
            }
            
        )
        , cookie: {maxAge: 24 * 60 * 60 * 1000}
    });
    app.set("view engine", "pug");
    app.set("views", path.join(__dirname, "views"));
    app.engine("pug", pug.__express);
    app.set("port", (process.env.PORT || 5000));
    app.use(
        express.static(path.join(__dirname, "static"))
        , morgan("error")
        , bodyParser.json()
        , bodyParser.urlencoded({extended: true})
        

        
        , flash()
        , sessionStore
    );

    passport.use(new TwitterStrategy(
        {
            consumerKey: process.env.TWITTER_KEY,
            consumerSecret: process.env.TWITTER_SECRET,
            callbackURL: "http://localhost:5000/auth/twitter/callback"
        },
        function(token, tokenSecret, profile, done) {
            db.collection("pictilesUsers").findOne({_id: profile.id}, function(err, user) {
            if (err) return done(err);
            if (user) {
                return done(null, user)
            }
            const newUser = {
                _id: profile.id,
                userName: profile.username,
                displayName: profile.displayName,
                pics: []
            };
            db.collection("pictilesUsers").insertOne(newUser, function(err, user) {
                if (err) return console.error(err);
                done(null, newUser);
            });
            });
        }
    ));
        
    passport.serializeUser((user, done) => {
        done(null, user)
    })

    passport.deserializeUser((user, done) => {
        db.collection("pictilesUsers").findOne({_id: user._id}, function (err, user) {
            if (err) { return done(err); }
            return done(null, user);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());

    server.listen(app.get("port"), function() {
        console.log(app.name + " running on port " + app.get("port"))
    })
    pictiles(app, db, passport);
})