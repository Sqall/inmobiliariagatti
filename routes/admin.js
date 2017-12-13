var express = require('express');
var router = express.Router();
var multer = require('multer');
const fs = require('fs');

var cloudinary = require('cloudinary');
var cloudinaryStorage = require('multer-storage-cloudinary');

cloudinary.config({ 
  cloud_name: 'inmobiliaria-gatti',
  folder: 'Gattidev',
  api_key: '167695282387732',
  api_secret: 'stxfgzblNBm-BUT2pTG1CLHqyGw'
});

var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'Gattidev',
  allowedFormats: ['jpg', 'png'],
  filename: function (req, file, cb) {
    cb(undefined, file.name);
  }
});

var parser = multer({ storage: storage });

var mongoose = require('mongoose');
//mongoose.connect('mongodb://hermangatti:gattipass@ds113668.mlab.com:13668/inmobiliariahermangatti');

var Grid = require('gridfs-stream');
var GridFS = Grid(mongoose.connection.db, mongoose.mongo);


var Propiedades = require('../models/propiedad');

//VAR <MODEL> PARA LLAMADOS A LA DB

/* GET home page. */
router.get('/',ensureAuthenticated, function(req, res, next) {
	res.render('admin');
});

router.get('/nuevapropiedad',ensureAuthenticated,function(req,res,next){
	res.render('newprop');
});

router.get('/edit/propiedad/:id',ensureAuthenticated,function(req,res,next){
	Propiedades.getPropiedadbyId(req.params.id,function(err,item){
	    if(err){
	      res.render('propiedades',{'error':'Hubo un error, pruebe nuevamente en unos minutos'});
	    }
	    else{
	      res.render('editprop',{ item: item });
	    }
	});
});

router.post('/new/propiedad',ensureAuthenticated,parser.array('images',5),function(req,res,next){

	var direccion = req.body.direccion;
	var categoria = req.body.categoria;
	var subcategoria = req.body.subcategoria;
	var precio = req.body.precio;
	var descripcion = req.body.descripcion;
	var images = [];
	var images_id = [];
	if (req.files){
		for (var i = 0, len = req.files.length; i < len; i++) {			
		  images.push(req.files[i].url);
		  images_id.push(req.files[i].public_id);
		}
	}
	else{
		images.push("noimage.png");
	}
	req.checkBody('direccion','Necesita una Dirección').notEmpty();
  	req.checkBody('categoria', 'Necesita una Categoria').notEmpty();
  	req.checkBody('precio', 'Necesita una Precio').notEmpty();
  	var errors = req.validationErrors();
  	if(errors){
  		res.render('newprop',{
  			"error":errors
  		})
  	} else{
      Propiedades.newPropiedad(direccion,categoria,subcategoria,precio,images,images_id,descripcion,function(err,status){
        if(err){
          res.render('propiedades',{'error':'Hubo un error, pruebe nuevamente en unos minutos'});
        }
        else{
          req.flash('success','Propiedad Agregada');
          res.location('/admin/nuevapropiedad');
          res.redirect('/admin/nuevapropiedad');
        }
      });
  	}
  });

router.post('/new/imagen/:prop',ensureAuthenticated,parser.array('images',1),function(req,res,next){
	var propiedad = req.params.prop;
	var images = req.files[0].url;
	var images_id = req.files[0].public_id;
	Propiedades.addImage(propiedad,images,images_id,function(resp){
	  if(resp == "sucess"){
	  	req.flash('success','Imagen agregada exitosamente');
		res.redirect('/admin/edit/propiedad/'+propiedad);	    
	  }
	  else{
	    req.flash('error',resp);
	    res.redirect('/admin/edit/propiedad/'+propiedad);
	  }
	});
});

router.post('/borrar/propiedad/:id',ensureAuthenticated,function(req,res,next){
	Propiedades.getPropiedadbyId(req.params.id,function(err,propiedad){
		if (err){
			res.render('admin',{'error':'Hubo un error, pruebe nuevamente'});
		}
		else{
			var arreglo_imgs = [];
			for (var i = propiedad.imagenes_id.length-1; i >= 0; i--) {
				arreglo_imgs.push(propiedad.imagenes_id[i]);
			};
			Propiedades.deletePropiedad(req.params.id,function(err,status){
					if (err){
						res.render('propiedades',{'error': 'Hubo un error, pruebe nuevamente en unos minutos'});
					}
					else{
						cloudinary.v2.api.delete_resources(arreglo_imgs,function(error, result){
							req.flash('success','Propiedad Borrada');
							res.location('/propiedades');
							res.redirect('/propiedades');	
						});						
					}
				});			
		}
	});
});

router.post('/borrar/imagen/:prop/Gattidev/:id',ensureAuthenticated,function(req,res,next){
	
	cloudinary.v2.api.delete_resources(['Gattidev/'+req.params.id],function(error, result){
		req.flash('success','Imagen Borrada');
		Propiedades.deleteImage(req.params.prop,req.params.id,function(error,result){});
		res.location('/admin/edit/propiedad/'+req.params.prop);
		res.redirect('/admin/edit/propiedad/'+req.params.prop);
	});
});

router.post('/edit/propiedad',ensureAuthenticated,parser.array('images',5),function(req,res,next){

	var id = req.body._id;
	var direccion = req.body.direccion;
	var categoria = req.body.categoria;
	var subcategoria = req.body.subcategoria;
	var precio = req.body.precio;
	var descripcion = req.body.descripcion;

	req.checkBody('direccion','Necesita una Dirección').notEmpty();
	req.checkBody('categoria', 'Necesita una Categoria').notEmpty();
  	req.checkBody('precio', 'Necesita una Precio').notEmpty();
	req.checkBody('subcategoria', 'Necesita una SubCategoria').notEmpty();  	

  	var errors = req.validationErrors();

  	if(errors){
  		res.render('editprop',{
  			"error":errors
  		})
  	} else{

      Propiedades.updatePropiedad(id,direccion,categoria,subcategoria,precio,descripcion,function(err,status){
        if(err){
          res.render('propiedades',{'error':'Hubo un error, pruebe nuevamente en unos minutos'});
        }
        else{
          req.flash('success','Propiedad Modificada');
          res.location('/admin/edit/propiedad/'+id);
          res.redirect('/admin/edit/propiedad/'+id);
        }
      });
  	}
});

function ensureAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
};

module.exports = router;
