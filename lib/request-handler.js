var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
//var Links = require('../app/collections/links');
// var testLink = new Link({url: 'www.this.com', visits: 0});
// testLink.makeCode();
// testLink.save()
// .then(function(link) {
//   console.log(link);
// });

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.find()
  .then(function(links) {
    res.status(200).send(links);
  });
};
// save link if not in database, send shortened link to client
exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.status(200).send(found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.sendStatus(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         baseUrl: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.status(200).send(newLink);
  //       });
  //     });
  //   }
  // });
  Link.findOne({url: uri})
    .then(function(link) {
      res.status(200).send(link);
    })
    .catch(function(err) {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log(err);
          res.status(404).send();
        } else {
          var link = new Link({
            url: uri,
            baseUrl: req.headers.origin,
            title: title
          });

          link.makeCode();

          link.save()
          .then(function(link) {
            res.status(200).send(link);
          });
        }
      });
    });
};

//   Link.findOne({url: uri}, function (err, link) {
//     if (err) {
//       // get the URL title
//       util.getUrlTitle(uri, function (err, title) {
//         if (err) {
//           // if not found send 404
//           console.log(err);
//           res.status(404).send();
//         } else {
//         // if link is has not been previously shortened create a new link
//           var link = new Link({
//             url: uri,
//             baseUrl: req.headers.origin,
//             title: title
//           });
//           console.log(link);
//           link.makeCode();
//           // save to database
//           link.save(function (err, link) {
//             if (err) {
//               console.log(err);
//             } else {
//               // send 200 with the new link
//               console.log(link);
//               res.status(200).send(link);
//             }
//           });
//         }
//       });
//     } else {
//       res.status(200).send(link);
//     }
//   });
// };
// check user exits and verify their credentials
exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username })
    .then(function(user) {
      user.comparePassword(password, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    })
    .catch(function() {
      res.redirect('/login');
    });
};
// create new user
exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username })
    .then(function(user) {
      console.log('Account already exists');
      res.redirect('/signup');
    })
    .catch(function() {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.hashPassword();
      
      newUser.save()
        .then(function(newUser) {
          util.createSession(req, res, newUser);
        })
        .catch(function(err) {
          res.redirect('/signup');
        });
    });
};
// increases visit count
exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] })
  .then(function(link) {
    link.visits++;
    link.save();
    return res.redirect(link.url);
  })
  .catch(function(err) {
    res.redirect('/');
  });
};