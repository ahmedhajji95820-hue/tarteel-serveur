const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@deepgram/sdk');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const DG_KEY = process.env.DEEPGRAM_API_KEY;

app.get('/', (req, res) => {
  res.send('Tarteel serveur actif');
});

wss.on('connection', (clientWs) => {
  console.log('Nouvelle connexion app');

  const deepgram = createClient(DG_KEY);
  const dgConnection = deepgram.listen.live({
    language: 'ar',
    model: 'nova-2',
    interim_results: true,
    punctuate: false,
    smart_format: false,
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
  });

  dgConnection.on('open', () => {
    console.log('Deepgram connecte');
  });

  dgConnection.on('Results', (data) => {
    const transcript = data?.channel?.alternatives?.[0]?.transcript;
    if (transcript && clientWs.readyState === 1) {
      clientWs.send(JSON.stringify({ transcript }));
    }
  });

  dgConnection.on('error', (err) => {
    console.error('Erreur Deepgram:', err);
  });

  clientWs.on('message', (audioData) => {
    if (dgConnection.getReadyState() === 1) {
      dgConnection.send(audioData);
    }
  });

  clientWs.on('close', () => {
    console.log('App deconnectee');
    try { dgConnection.finish(); } catch (e) {}
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Serveur demarre sur le port ' + PORT);
});
