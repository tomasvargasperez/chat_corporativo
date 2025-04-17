// Importaciones
const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/UserRoutes'); 
const http = require('http'); // Nuevo: Para Socket.io
const path = require('path'); // Nuevo: Para manejar rutas de archivos
const Message = require('./models/Message'); // Nuevo: Modelo de mensajes

// Configuración de variables de entorno 
dotenv.config();

// Creación de una instancia de Express 
const app = express();
const server = http.createServer(app); // Nuevo: Crear servidor HTTP para Socket.io
const io = require('socket.io')(server);

// Conexion a BBDD Mongodb
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd'; 
mongoose.connect(DB_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}) 
        .then(() => { console.log("Conexión a la base de datos exitosa"); }) // Si la conexión es exitosa, mostramos un mensaje de éxito.
        .catch((error) => { console.error("Error al conectar a la base de datos:", error); }); // Si hay un error al conectar, mostramos un mensaje de error con la descripción del error.     
        
// Middlewares
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 

// Nuevo: Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'html');

// Configuración de Socket.io
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('join_channel', async (channel) => {
        socket.join(channel);
        console.log(`📨 Usuario unido al canal: ${channel}`);

        try {
            const messages = await Message.find({ channel })
            .limit(50)
            .populate('user');
        socket.emit('message_history', messages);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        }
    });

    socket.on('send_message', async ({ channel, text, userId }) => {
        try {
            const newMessage = new Message({ 
                channel, 
                user: userId, 
                text 
            });

            const savedMessage = await newMessage.save();
            const populatedMessage = await Message.populate(savedMessage, { path: 'user', select: 'name' });
        
            io.to(channel).emit('new_message', {
                text: populatedMessage.text,
                user: {
                    _id: populatedMessage.user._id,
                    name: populatedMessage.user.name
                },
                timestamp: savedMessage.timestamp
            });
        } catch (error) {
            console.error("Error al guardar mensaje:", error);
        }
    });
    socket.on('disconnect', () => {
        console.log('⚠️ Usuario desconectado:', socket.id);
    });
});
                

// Rutas API
app.use('/', userRoutes);

// Nuevo: Rutas para vistas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/chat.html'));
});

// Puerto en el que escuchará el servidor
const port = process.env.PORT || 3000;

// Cambiamos app.listen por server.listen para Socket.io
server.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});

// Inicialización del servidor Express 
//app.listen(port, () => { 
    // Imprime un mensaje en la consola cuando el servidor se inicia correctamente 
//    console.log(`Servidor escuchando en el puerto ${port}`); 
//});



// Inicialización del servidor Express 
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente');
});