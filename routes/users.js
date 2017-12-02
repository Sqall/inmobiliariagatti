var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './uploads'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//Modelos
var User = require('../models/user');

router.post('/login',
  passport.authenticate('local',{failureRedirect:'/hg-admin', failureFlash: 'Usuario o Contraseña invalida'}),
  function(req, res) {
   req.flash('success', 'Has iniciado Sesión');
   res.redirect('/admin');
});


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
  User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Usuario Desconocido'});
    }

    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      } else {
        return done(null, false, {message:'Contraseña Invalida'});
      }
    });
  });
}));

router.get('/logout',function(req,res){
  req.logout();
  req.flash('success','Has Cerrado Sesión');
  res.redirect('/');
});

router.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: 'hgatti-production',
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: 'https:'+S3_BUCKET+'.s3.amazonaws.com'+fileName,
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

module.exports = router;
