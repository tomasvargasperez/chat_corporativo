// Importaciones
const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/UserRoutes'); 

// Configuración de variables de entorno 
dotenv.config();

// Creación de una instancia de Express 
const app = express();

// Estableciendo la URL de conexión a la base de datos. 
// // Si existe una variable de entorno DB_URL, la usamos; de lo contrario, utilizamos una cadena de conexión local.
const DB_URL = process.env.DB_URL || 
'mongodb://localhost:27017/chat_bbdd'; 

// Conexión a la base de datos MongoDB utilizando Mongoose. 
// // Usamos useNewUrlParser y useUnifiedTopology para evitar advertencias de deprecación.
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: 
    true }) 
        .then(() => 
            // Si la conexión es exitosa, mostramos un mensaje de éxito.
            { console.log("Conexión a la base de datos exitosa"); }) 
        .catch((error) => 
            // Si hay un error al conectar, mostramos un mensaje de error con la descripción del error.
            { console.error("Error al conectar a la base de datos:", error);     
        });

// Middlewares
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use('/', userRoutes);

// Puerto en el que escuchará el servidor
const port = process.env.PORT || 3000; 
//const port = 3000; 

// Inicialización del servidor Express 
app.listen(port, () => { 
    // Imprime un mensaje en la consola cuando el servidor se inicia correctamente 
    console.log(`Servidor escuchando en el puerto ${port}`); 
});

// Inicialización del servidor Express 
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente');
});