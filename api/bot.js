module.exports = async function (req, res) {
  // Test di attività visibile dal browser
  if (req.method !== 'POST') {
    return res.status(200).send('Il bot è attivo, aggiornato e in ascolto!');
  }

  // Prende i token dalle impostazioni segrete di Vercel
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_NAME = "pcnicosia/pcnicosia.github.io";

  const SEZIONI = {
    "#meteo": "meteo",
    "#antincendio": "antincendio",
    "#alluvioni": "alluvioni"
  };

  try {
    const body = req.body;
    const message = body.message || body.channel_post;
    
    if (!message || !message.document) {
      return res.status(200).send('Nessun documento in arrivo');
    }

    const document = message.document;
    const caption = message.caption || "";

    if (document.mime_type !== 'application/pdf') {
      await sendMessage(TELEGRAM_TOKEN, message.chat.id, "Per favore, invia solo file PDF.");
      return res.status(200).send('File ignorato, non era un PDF');
    }

    let sezione_trovata = null;
    for (const [hashtag, name] of Object.entries(SEZIONI)) {
      if (caption.toLowerCase().includes(hashtag)) {
        sezione_trovata = name;
        break;
      }
    }

    if (!sezione_trovata) {
      await sendMessage(TELEGRAM_TOKEN, message.chat.id, "Non ho trovato l'hashtag. Includi uno tra: #meteo, #antincendio, #alluvioni");
      return res.status(200).send('Hashtag mancante');
    }

    const didascalia_pulita = caption.replace(/#\w+/g, '').trim();
    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `Sto elaborando il PDF per la sezione '${sezione_trovata}'...`);

    // Scarica il file
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${document.file_id}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString('base64');

    // Carica il PDF
    await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.pdf`, base64File, `Aggiornato PDF ${sezione_trovata}`);

    // Carica il JSON
    const jsonData = JSON.stringify({ descrizione: didascalia_pulita });
    const base64Json = Buffer.from(jsonData).toString('base64');
    await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.json`, base64Json, `Aggiornata descrizione ${sezione_trovata}`);

    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Perfetto! Il file ${sezione_trovata}.pdf è stato pubblicato.`);
    
    res.status(200).send('Completato con successo');
  } catch (error) {
    console.error("Errore rilevato: ", error);
    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `❌ Si è verificato un errore durante l'operazione.`);
    res.status(500).send('Errore interno');
  }
};

// --- Funzioni secondarie per inviare e caricare dati ---
async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function uploadToGitHub(token, repo, path, base64Content, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' }
  });
  
  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = { message: commitMessage, content: base64Content };
  if (sha) body.sha = sha;

  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VercelBot'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) throw new Error(`Problema nell'invio a GitHub`);
}
