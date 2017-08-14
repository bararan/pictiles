//@ts-check
"use strict";
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
            res.render("index", {pics: pics, user: user});
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
        let userName = req.params.userName;
        const isOwner = userName === req.user.userName;
        db.collection("pictilesUsers").findOne({userName: userName}, {fields: {_id: 1, pics: 1}}, (err, user) => {
            if (err) return console.error(err);
            const uid = user._id;
            const userPics = user.pics;
            db.collection("pictiles")
                .find({_id: {$in: userPics}})
                .toArray((err, pics) => {
                    if (err) console.error(err);
                    return res.render("user", {pics: pics, isOwner: isOwner});
                })
        })
    });
    // Log out
    app.get("/logout", (req, res) => {
        req.logout();
        req.session.destroy(()=>{res.redirect("/");})
    })

    /* POST routes */
    //Pin picture to own board
    app.post("/pin", isLoggedIn, (req, res) => {

    })
    //Unpin picture
    app.post("/unpin", isLoggedIn, (req, res) => {

    })
}