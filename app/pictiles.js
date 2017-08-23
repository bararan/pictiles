//@ts-check
"use strict";
const oID = require("mongodb").ObjectID;

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
}

module.exports = (app, db, passport) => {
    /* GET routes */
    //Main page
    app.get("/", (req, res) => {
        const user = req.user || false;
        db.collection("pictiles").find().toArray((err, pics) => {
            if (err) console.error(err);
            res.render("index", {pics: pics, user: user, addEnabled: user !== false});
        })
    });
    //Twitter authorisation routes
    app.get("/auth/twitter", passport.authenticate("twitter"));
    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", 
            {successRedirect: "/loggedIn",
            failureRedirect: "/"})
    );
    // Redirect to user's page after login
    app.get("/loggedIn", (req, res) => {
        res.redirect("/user/" + req.user.userName);
    })
    //User's board (accessible to any authenticated user)
    app.get("/user/:userName", isLoggedIn, (req, res) => {
        const userName = req.params.userName;
        db.collection("pictilesUsers").findOne({userName: userName}, {fields: {_id: 1, pics: 1}}, (err, user) => {
            if (err) return console.error(err);
            const uid = user._id;
            const userPics = user.pics;
            db.collection("pictiles")
                .find({pinnedBy: {$in: [uid]}})
                .toArray((err, pics) => {
                    if (err) console.error(err);
                    return res.render("user", {pics: pics, user: req.user, addEnabled: req.user.userName === userName});
                })
        })
    });
    // Log out
    app.get("/logout", (req, res) => {
        req.logout();
        req.session.destroy(()=>{res.redirect("/");})
    })

    /* POST routes */
    //Add new photo
    app.post("/addphoto", isLoggedIn, (req, res) => {
        const newPic = {
            uid: req.user._id
            , postedBy: req.user.userName
            , imgUrl: req.body.imgUrl
            , title: req.body.title
            , pinnedBy: [req.user._id]
        };
        db.collection("pictiles").insertOne(
            newPic
            , (err, response) => {
                if (err) return console.error(err);
                req.flash("userMessage", "You added a new picture!")
                return res.redirect("/user/" + req.user.userName);
            }
        )

    })
    //Pin picture to own board
    app.post("/pin", isLoggedIn, (req, res) => {
        const uid = req.user._id
            , pic_id = new oID(req.body.pictureID);
        db.collection("pictiles").findOneAndUpdate(
            {_id: pic_id}
            , {$addToSet: 
                {
                    pinnedBy: uid
                }
            }
            , {
                upsert: false
                , returnOriginal: false
            }
            , (err, response) => {
                if (err) return console.error(err);
                req.flash("userMessage", "Picture added to your board");
                return res.redirect("/user/" + req.user.userName);
            }
        )
    })
    //Unpin picture
    app.post("/unpin", isLoggedIn, (req, res) => {
        // Should make sure that unpin button is inactive for the picture owner! (Or should I not bother?)
        const uid = req.user._id
        , pic_id = new oID(req.body.pictureID)
        , userName = req.user.userName;

        db.collection("pictiles").findOneAndUpdate(
            {$and:
                [
                    {
                        _id: pic_id
                    }
                    , {
                        postedBy: {$not: {$eq: req.user.userName} }
                    }
                ]
            }
            , {$pull:
                {
                    pinnedBy: uid
                }
            }
            , {
                upsert: false
                , returnOriginal: false
            }
            , (err, response) => {
                if (err) return console.error(err);
                req.flash("userMessage", "Picture removed from your board.");
                res.redirect("/user/" + req.user.userName);
            }
        )
    })
}