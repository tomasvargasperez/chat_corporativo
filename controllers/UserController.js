const bcrypt = require('bcrypt'); 
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

class UserController 
    { constructor(){} 
} 
module.exports = UserController

async login(email, password) { 
    try { 
        // Buscar al usuario por correo electrónico 
        const user = await User.findOne({ email }); 
        if (!user) {
            return { "status": "error", "message": "El usuario no existe" }; }   
        // Comparar la contraseña proporcionada con la contraseña almacenada
        const passwordMatch = await bcrypt.compare(password, user.password); 
            if (!passwordMatch) { 
                return { "status": "error", "message": "Contraseña incorrecta" }; } 
        // Generar un token JWT para el usuario 
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' }); 
            return { "status": "success", "token": token }; 
            } catch (error) { 
                console.log(error); return { "status": "error", "message": "Error al iniciar sesión" 

            };
             } 
}