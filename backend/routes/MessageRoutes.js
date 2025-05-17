const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/messages/:channel
router.get('/:channel', async (req, res) => {
    const { channel } = req.params;
    try {
        const messages = await Message.find({ channel }).populate('user', 'name');
        res.json(messages);
    } catch (error) {
        console.error("Error al obtener mensajes:", error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

module.exports = router;