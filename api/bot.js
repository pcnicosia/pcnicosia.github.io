module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Il bot è operativo e supporta i comandi di eliminazione!');
  }

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
    
    if (!message) return res.status(200).send('Nessun messaggio');

    // Estraiamo il testo (sia se è un messaggio normale, sia se è la didascalia di un file)
    const text = message.text || message.caption || "";
    const lowerText = text.toLowerCase();

    // ==========================================
    // 1. NUOVO COMANDO: ELIMINA BOLLETTINO
    // ==========================================
    if (lowerText.includes("#elimina")) {
      let sezione_trovata = null;
      if (lowerText.includes("meteo")) sezione_trovata = "meteo";
      else if (lowerText.includes("antincendio")) sezione_trovata = "antincendio";
      else if (lowerText.includes("alluvioni")) sezione_trovata = "alluvioni";

      if (sezione_trovata) {
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `Sto resettando il bollettino per la sezione '${sezione_trovata}'...`);
        
        // Cancella il PDF fisicamente da GitHub
        await deleteFromGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.pdf`, `Eliminato PDF ${sezione_trovata}`);
        
        // Sovrascrive il file di testo con una frase standard di sicurezza
        const jsonData = JSON.stringify({ descrizione: "Nessun bollettino attivo al momento." });
        const base64Json = Buffer.from(jsonData).toString('base64');
        await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.json`, base64Json, `Reset descrizione ${sezione_trovata}`);

        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Bollettino ${sezione_trovata} eliminato con successo! Sulla home non apparirà più.`);
        return res.status(200).send('Eliminato');
      }
    }

    // ==========================================
    // 2. COMANDO TRADIZIONALE: CARICA BOLLETTINO
    // ==========================================
    if (!message.document) {
      return res.status(200).send('Non è un comando di eliminazione né un file PDF');
    }

    const document = message.document;

    if (document.mime_type !== 'application/pdf') {
      await sendMessage(TELEGRAM_TOKEN, message.chat.id, "Per favore, invia solo file PDF.");
      return res.status(200).send('Non è un PDF');
    }

    let sezione_trovata = null;
    for (const [hashtag, name] of Object.entries(SEZIONI)) {
      if (lowerText.includes(hashtag)) {
        sezione_trovata = name;
        break;
      }
    }

    if (!sezione_trovata) {
      await sendMessage(TELEGRAM_TOKEN, message.chat.id, "Non ho trovato l'hashtag. Includi uno tra: #meteo, #antincendio, #alluvioni");
      return res.status(200).send('Nessun hashtag');
    }

    const didascalia_pulita = text.replace(/#\w+/g, '').trim();
    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `Sto scaricando il PDF per la sezione '${sezione_trovata}'...`);

    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${document.file_id}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString('base64');

    await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.pdf`, base64File, `Aggiornato PDF ${sezione_trovata}`);

    const jsonData = JSON.stringify({ descrizione: didascalia_pulita });
    const base64Json = Buffer.from(jsonData).toString('base64');
    await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.json`, base64Json, `Aggiornata descrizione ${sezione_trovata}`);

    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Successo! Il file ${sezione_trovata}.pdf è in fase di pubblicazione.`);
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    await sendMessage(TELEGRAM_TOKEN, message.chat.id, `❌ Errore durante l'operazione.`);
    res.status(500).send('Errore');
  }
};

// --- FUNZIONI DI SUPPORTO ---
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
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' },
    body: JSON.stringify(body)
  });
  if (!putRes.ok) throw new Error(`Errore GitHub Upload`);
}

// Nuova funzione per eliminare file
async function deleteFromGitHub(token, repo, path, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' }
  });
  if (!getRes.ok) return; // Se il file non esiste già, non facciamo niente
  
  const data = await getRes.json();
  const sha = data.sha;

  const delRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' },
    body: JSON.stringify({ message: commitMessage, sha: sha })
  });
  if (!delRes.ok) throw new Error(`Errore GitHub Delete`);
}
