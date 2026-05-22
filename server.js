const express = require('express');
const cors = require('cors');
const { createClient } = require('@deepgram/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.raw({ type: '*/*', limit: '20mb' }));

const DG_KEY = process.env.DEEPGRAM_API_KEY;

app.get('/', (req, res) => {
  res.send('Tarteel serveur actif');
});

app.post('/transcrire', async (req, res) => {
  try {
    if (!DG_KEY) {
      return res.status(500).json({ erreur: 'Cle Deepgram non configuree' });
    }
    const audioBuffer = req.body;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ erreur: 'Aucun audio recu' });
    }
    console.log('Audio recu, taille =', audioBuffer.length);

    const deepgram = createClient(DG_KEY);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        language: 'ar',
        model: 'nova-2',
        punctuate: false,
        smart_format: false,
        mimetype: 'audio/mp4',
      }
    );
    if (error) {
      console.error('Erreur Deepgram:', JSON.stringify(error));
      return res.status(500).json({ erreur: 'Erreur Deepgram', detail: String(error) });
    }
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('Transcription =', transcript);
    res.json({ transcript: transcript });
  } catch (erreur) {
    console.error('Erreur serveur:', erreur);
    res.status(500).json({ erreur: erreur.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Serveur Tarteel demarre sur le port ' + PORT);
});
