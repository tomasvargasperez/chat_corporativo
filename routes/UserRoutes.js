const express = require('express'); 
const router = express.Router();
const bcrypt = require('bcrypt'); 
const UserSchema = require('../models/User'); 
const UserController = require('../controllers/UserController'); 
//Importando el controllador 
const userController = new UserController(); // creando una instancia de ese controlador

//Obtener todos los usuarios.
router.get('/user', userController.validateToken, async (req, res) => {
     //Traer todos los usuarios 
     //Esta ruta obtiene todos los usuarios de la base de datos 
     //Usando el método find() del modelo UserSchema. 
     let users = await UserSchema.find(); 
     res.json(users); 
});

//Obtener un usuario por su ID
router.get('/user/:id', async (req, res) => { 
    //Traer un usuario especifico pasando el ID 
    //Esta ruta obtiene un usuario específico de la base de datos 
    //usando el método findById() del modelo UserSchema. 
    var id = req.params.id; 
    let user = await UserSchema.findById(id); 
    res.json(user);  cancelAnimationFrame
    
    //Obtener un usuario por su Mail
    const query = UserSchema.where({ email: email }); // 
    const user = await query.findOne() 
});

//Crear un nuevo usuario
router.post('/user', async (req, res) => { 
    //Crear un usuario
    //Esta ruta crea un nuevo usuario en la base de datos. 
    //Primero se cifra la contraseña usando bcrypt. 
    const hashedPassword = await bcrypt.hash(req.body.password, 10); 
    //Se crea un nuevo objeto usuario utilizando los datos recibidos en la solicitud. 
    let user = UserSchema({
        name: req.body.name, 
        lastname: req.body.lastname, 
        email: req.body.email, 
        id: req.body.id, 
        password: hashedPassword 
    }); 
    // Se guarda el usuario en la base de datos. 
    user.save().then((result) => { 
        res.send(result);
     }).catch((err) => { 
    // Se manejan los errores que pueden ocurrir al guardar el usuario. 
            // Si el correo electrónico ya está registrado, se envía un mensaje de error. 
        if(err.code == 11000){ 
            res.send({"status" : "error", "message" :"El correo ya fue registrado"}); 
        } else { 
            // Si ocurre algún otro error, se envía un mensaje de error genérico. 
            res.send({"status" : "error", "message" :err.message}); 
        } 
    }); 
});

//Actualizar un usuario.
router.patch('/user/:id', (req, res) => {
    //Actualizar un usuario 
    //Esta ruta actualiza un usuario existente en la base de datos. 
    //Se obtiene el ID del usuario de los parámetros de la URL.
    var id = req.params.id;
   //Se crea un objeto con los datos actualizados del usuario.
   var updateUser = { 
        name: req.body.name, 
        lastname: req.body.lastname, 
        email: req.body.email, 
        id: req.body.id
    };
    // Se actualiza el usuario en la base de datos utilizando findByIdAndUpdate(). 
    UserSchema.findByIdAndUpdate(id, updateUser, {new: true}).then((result) =>   { 
        res.send(result);
        }).catch((error) => {
     // Se maneja cualquier error que pueda ocurrir al actualizar el usuario. 
        console.log(error); 
        res.send("Error actualizando el registro"); 
    }); 
});

//Eliminar un usuario.
router.delete('/user/:id', (req, res) => { 
    //Eliminar un usuario 
    // Esta ruta elimina un usuario de la base de datos.
    // Se obtiene el ID del usuario de los parámetros de la URL. 
    var id = req.params.id; 
    // Se elimina el usuario de la base de datos utilizando deleteOne(). 
    UserSchema.deleteOne({_id: id}).then(() => { 
        res.json({"status": "success", "message": "User deleted successfully"});
         }).catch((error) => { 
        // Se maneja cualquier error que pueda ocurrir al eliminar el usuario. 
        console.log(error); 
        res.json({"status": "failed", "message": "Error deleting user"}); 
    }); 
});

//Iniciar sesión de usuario.
router.post('/login', (req, res) => { 
    //Inicio de sesión 
    //Esta ruta maneja la autenticación del usuario. 
    //Se obtienen el correo electrónico y la contraseña de la solicitud. 
    const email = req.body.email; 
    const password = req.body.password; 
    // Se llama al método login del controlador de usuario para iniciar sesión. 
    userController.login(email, password).then((result) => { 
        res.send(result); 
    }); 
});