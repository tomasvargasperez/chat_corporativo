// Importaciones
const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const userRoutes = require('./routes/UserRoutes');
const messageRoutes = require('./routes/MessageRoutes');
const Message = require('./models/Message');
const User = require('./models/User')

// Cargar variables de entorno
dotenv.config();

// Inicialización de Express y servidor HTTP
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS para Vue
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:5173', // Para desarrollo Vue
        methods: ['GET', 'POST']
    }
});

// Conexión a MongoDB
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd'; 
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conexión a la base de datos exitosa'))
.catch((error) => console.error('❌ Error al conectar a la base de datos:', error));

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Socket.IO: Manejo de mensajes y canales
io.on('connection', (socket) => {
    console.log('🔌 Usuario conectado:', socket.id);

    socket.on('join_channel', async (channel) => {
        socket.join(channel);
        console.log(`📨 Usuario unido al canal: ${channel}`);
        try {
            const messages = await Message.find({ channel })
                .limit(50)
                .populate('user');
            socket.emit('message_history', messages);
        } catch (error) {
            console.error("❌ Error al cargar historial:", error);
        }
    });

    socket.on('send_message', async ({ channel, text, userId }) => {
        try {
            // Validar si userId existe
            if (!userId) {
                console.error("❌ No se recibió userId");
                return;
            }

            // Validar que userId sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.error("❌ userId no es un ObjectId válido:", userId);
                return;
            }

            // Convertir userId a ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Crear y guardar el mensaje
            const newMessage = new Message({ channel, user: userObjectId, text });
            const savedMessage = await newMessage.save();

            // Popular el usuario
            const populatedMessage = await Message.populate(savedMessage, {
                path: 'user',
                select: 'name'
            });

            // Emitir mensaje al canal
            io.to(channel).emit('new_message', {
                text: populatedMessage.text,
                user: {
                    _id: populatedMessage.user._id,
                    name: populatedMessage.user.name
                },
                timestamp: savedMessage.timestamp
            });
        } catch (error) {
            console.error("❌ Error al guardar mensaje:", error);
        }
    });

        socket.on('disconnect', () => {
            console.log('⚠️ Usuario desconectado:', socket.id);
        });
    });

// Rutas API
app.use('/api/users', userRoutes); // ejemplo: POST /api/users/register
app.use('/api/messages', messageRoutes); // ejemplo: GET /api/messages/general
app.use('/', userRoutes); // <-- esto es esencial

// Producción: servir frontend de Vue (si haces build)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/vue-app/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/vue-app/dist/index.html'));
    });
}

// Puerto y arranque del servidor
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Servidor backend escuchando en el puerto ${port}`);
});