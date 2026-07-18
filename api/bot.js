module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Super Bot Operativo: Gestione Emergenze e News attiva!');
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_NAME = "pcnicosia/pcnicosia.github.io";

  try {
    const body = req.body;
    const message = body.message || body.channel_post;
    if (!message) return res.status(200).send('Nessun messaggio');

    const text = message.text || message.caption || "";
    const lowerText = text.toLowerCase();

    // ==========================================
    // 1. ELIMINA BOLLETTINO
    // ==========================================
    if (lowerText.includes("#elimina")) {
      let sezione_trovata = null;
      if (lowerText.includes("meteo")) sezione_trovata = "meteo";
      else if (lowerText.includes("antincendio")) sezione_trovata = "antincendio";
      else if (lowerText.includes("alluvioni")) sezione_trovata = "alluvioni";

      if (sezione_trovata) {
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `Sto resettando il bollettino '${sezione_trovata}'...`);
        await deleteFromGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.pdf`, `Eliminato PDF ${sezione_trovata}`);
        const jsonData = JSON.stringify({ descrizione: "Nessun bollettino attivo al momento." });
        await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.json`, Buffer.from(jsonData).toString('base64'), `Reset descrizione`);
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Bollettino ${sezione_trovata} chiuso con successo!`);
        return res.status(200).send('Eliminato');
      }
    }

    // ==========================================
    // 2. NUOVA FUNZIONE: AGGIUNGI NEWS
    // ==========================================
    if (lowerText.includes("#news")) {
      if (!message.photo) {
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, "❌ Per pubblicare una news devi inviare una FOTO con didascalia (non un file o solo testo).");
        return res.status(200).send('Nessuna foto');
      }

      await sendMessage(TELEGRAM_TOKEN, message.chat.id, "Sto creando il nuovo articolo e salvando l'immagine...");

      // 1. Elaborazione Testo (Divide Titolo e Descrizione)
      let cleanText = text.replace(/#news/gi, '').trim();
      let righe = cleanText.split('\n').filter(riga => riga.trim() !== '');
      let titolo = righe.length > 0 ? righe[0].trim() : "Nuova Comunicazione";
      let descrizione = righe.length > 1 ? righe.slice(1).join(' ').trim() : "Nessun dettaglio aggiuntivo.";
      
      // Calcola la data di oggi in italiano
      let dataOggi = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

      // 2. Scarica e Salva l'Immagine (Prende la risoluzione più alta)
      const photo = message.photo[message.photo.length - 1];
      const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${photo.file_id}`);
      const fileData = await fileRes.json();
      const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`);
      const arrayBuffer = await downloadRes.arrayBuffer();
      const base64Photo = Buffer.from(arrayBuffer).toString('base64');
      
      const nomeImmagine = `news_images/img_${Date.now()}.jpg`; // Nome univoco basato sul tempo
      await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, nomeImmagine, base64Photo, `Caricata immagine news`);

      // 3. Aggiorna il file news.json (Lo storico)
      let storicoNews = [];
      try {
        const getJsonRes = await fetch(`https://api.github.com/repos/${REPO_NAME}/contents/news.json`, {
          headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });
        if (getJsonRes.ok) {
          const data = await getJsonRes.json();
          const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
          storicoNews = JSON.parse(decodedContent);
        }
      } catch (e) { console.log("Nessun json precedente, creo da zero."); }

      // Crea il blocco della nuova notizia
      const nuovaNotizia = {
        immagine: nomeImmagine,
        categoria: "Comunicazione",
        data: dataOggi,
        titolo: titolo,
        descrizione_breve: descrizione,
        badgeClass: "bg-success"
      };

      storicoNews.unshift(nuovaNotizia); // Mette la news nuova in cima alla lista

      const newJsonBase64 = Buffer.from(JSON.stringify(storicoNews, null, 2)).toString('base64');
      await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `news.json`, newJsonBase64, `Aggiunta nuova news: ${titolo}`);

      await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Notizia pubblicata in homepage!\n\n*Titolo:* ${titolo}\n*Data:* ${dataOggi}`, {parse_mode: 'Markdown'});
      return res.status(200).send('News pubblicata');
    }

    // ==========================================
    // 3. AGGIORNA BOLLETTINI (PDF)
    // ==========================================
    if (message.document && message.document.mime_type === 'application/pdf') {
      const SEZIONI = { "#meteo": "meteo", "#antincendio": "antincendio", "#alluvioni": "alluvioni" };
      let sezione_trovata = null;
      for (const [hashtag, name] of Object.entries(SEZIONI)) {
        if (lowerText.includes(hashtag)) { sezione_trovata = name; break; }
      }

      if (sezione_trovata) {
        const didascalia_pulita = text.replace(/#\w+/g, '').trim();
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `Pubblico bollettino '${sezione_trovata}'...`);

        const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${message.document.file_id}`);
        const fileData = await fileRes.json();
        const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`);
        const arrayBuffer = await downloadRes.arrayBuffer();
        
        await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.pdf`, Buffer.from(arrayBuffer).toString('base64'), `Aggiornato PDF ${sezione_trovata}`);
        const jsonData = JSON.stringify({ descrizione: didascalia_pulita });
        await uploadToGitHub(GITHUB_TOKEN, REPO_NAME, `bollettini/${sezione_trovata}.json`, Buffer.from(jsonData).toString('base64'), `Aggiornata descrizione`);

        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Bollettino ${sezione_trovata} aggiornato!`);
        return res.status(200).send('Bollettino OK');
      }
    }

    res.status(200).send('Comando ignorato');
  } catch (error) {
    console.error(error);
    await sendMessage(TELEGRAM_TOKEN, req.body?.message?.chat?.id, `❌ Errore durante l'operazione. Riprova.`);
    res.status(500).send('Errore');
  }
};

// --- FUNZIONI DI SUPPORTO ---
async function sendMessage(token, chatId, text, options = {}) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, ...options })
  });
}

async function uploadToGitHub(token, repo, path, base64Content, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' }
  });
  let body = { message: commitMessage, content: base64Content };
  if (getRes.ok) body.sha = (await getRes.json()).sha;

  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' },
    body: JSON.stringify(body)
  });
  if (!putRes.ok) throw new Error(`Errore GitHub Upload`);
}

async function deleteFromGitHub(token, repo, path, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' } });
  if (!getRes.ok) return; 
  const sha = (await getRes.json()).sha;
  await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' },
    body: JSON.stringify({ message: commitMessage, sha: sha })
  });
}
