var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://hermangatti:gattipass@ds113668.mlab.com:13668/inmobiliariahermangatti');

var PropiedadSchema = mongoose.Schema({
	categoria:{
		type:String,
		index:true
	},
	subcategoria:{
		type:String,
		index:true
	},
	direccion:{
		type:String
	},
	precio:{
		type:String
	},
	descripcion:{
		type:String
	},
	imagenes: [],
	imagenes_id:[]
});

var Propiedad = module.exports = mongoose.model('Propiedad',PropiedadSchema);

module.exports.getHome = function(callback){
	Propiedad.find({},function(err,propiedadades){
		if(err){
			return callback(err);
		}
		return callback(null,propiedadades);
	}).limit(4);
};

module.exports.getPropiedades = function(text,callback){
	Propiedad.find({'categoria':text},function(err,propiedadades){
		if(err){
			return callback(err);
		}
		return callback(null,propiedadades);
	});
};

//Subcategorias difieren en todos
module.exports.getPropiedadesbyCategoria = function(subcategoria,callback){
	Propiedad.find({'subcategoria':subcategoria},function(err,propiedadades){
		if(err){
			return callback(err);
		}
		return callback(null,propiedadades);
	});
};

module.exports.getPropiedadbyId = function(id,callback){
	Propiedad.find({'_id':id},function(err,propiedad){
		if(err){
			return callback(err);
		}
		return callback(null,propiedad[0]);
	});
};

module.exports.newPropiedad = function(address,cat,subcat,price,images,images_id,descrip,callback){

	var query = new Propiedad({
		categoria:cat,
		subcategoria:subcat,
		direccion:address,
		precio:price,
		imagenes:images,
		imagenes_id:images_id,
		descripcion:descrip
	});
	
	query.save(function(err){
		if(err){
			return callback(err);
		}
		return callback(null,'sucess');
	});
};

module.exports.deletePropiedad = function(id,callback){
	Propiedad.findOneAndRemove({'_id':id},function(err){
		if(err){
			return callback(err);
		}
		return callback(null,'sucess');
	});
};

module.exports.deleteImage = function(id,imageid,callback){
	Propiedad.findOneAndUpdate({'_id':id},{$pull: {imagenes: {$regex:imageid},imagenes_id:{$regex:imageid}}},function(err){
		if(err){
			return err;
		}
		else{
			return 'sucess';
		}
	});
};

module.exports.addImage = function(id,image,imageid,callback){
	Propiedad.update({'_id':id},{$push:{imagenes:image,imagenes_id:imageid}},function(err){
		if(err){
			return callback(err);
		}
		else{
			return callback('sucess');
		}
	});
};

module.exports.updatePropiedad = function(id,address,cat,subcat,price,descrip,callback){
	Propiedad.findOne({'_id':id},function(err,doc){
		if(err){
			return callback(err);
		}
		else{
			doc.direccion = address;
			doc.precio = price;
			doc.categoria = cat;
			doc.subcategoria = subcat;
			doc.descripcion = descrip;
			doc.save();
			return callback(null,'success');
		}
	});
};
