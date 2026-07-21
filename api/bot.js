module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Super Bot Operativo con Tastiera a Pulsanti!');
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_NAME = "pcnicosia/pcnicosia.github.io";
  const CANALE_AUTORIZZATO = "-1003754572274";

  try {
    const body = req.body;
    
    // ==========================================
    // A. GESTIONE DEI PULSANTI CLICCATI (CALLBACK QUERIES)
    // ==========================================
    if (body.callback_query) {
      const callback = body.callback_query;
      const data = callback.data;
      const chatId = callback.message.chat.id;

      if (chatId.toString() !== CANALE_AUTORIZZATO) {
        return res.status(200).send('Non autorizzato');
      }

      // -- MENU NOTIZIE --
      if (data === 'menu_notizie') {
        await editMessageText(TELEGRAM_TOKEN, chatId, callback.message.message_id, "Gestione 📰 NOTIZIE. Cosa vuoi fare?", {
          inline_keyboard: [
            [{ text: "➕ Aggiungi Notizia", callback_data: 'add_news' }],
            [{ text: "🗑️ Elimina Ultima Notizia", callback_data: 'del_news' }],
            [{ text: "🔙 Torna al Menu Principale", callback_data: 'menu_main' }]
          ]
        });
        return res.status(200).send('OK');
      }
      if (data === 'add_news') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "Per aggiungere una notizia, **invia una foto** in questa chat e metti come didascalia:\n\n#news\n**Il tuo Titolo**\nQui metti la descrizione.", {parse_mode: 'Markdown'});
        return res.status(200).send('OK');
      }
      if (data === 'del_news') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "Sto rimuovendo l'ultima news...");
        await eliminaUltimaNews(GITHUB_TOKEN, REPO_NAME, TELEGRAM_TOKEN, chatId);
        return res.status(200).send('OK');
      }

      // -- MENU BOLLETTINI --
      if (data === 'menu_bollettini') {
        await editMessageText(TELEGRAM_TOKEN, chatId, callback.message.message_id, "Gestione ⚠️ BOLLETTINI. Vuoi pubblicare o eliminare?", {
          inline_keyboard: [
            [{ text: "➕ Pubblica Nuovo", callback_data: 'add_boll' }],
            [{ text: "🗑️ Elimina Scaduto", callback_data: 'del_boll_menu' }],
            [{ text: "🔙 Torna al Menu", callback_data: 'menu_main' }]
          ]
        });
        return res.status(200).send('OK');
      }
      if (data === 'add_boll') {
        await sendMessage(TELEGRAM_TOKEN, chatId, "Per pubblicare, **invia il PDF** e metti come didascalia uno di questi hashtag:\n`#meteo`\n`#antincendio`\n`#alluvioni`", {parse_mode: 'Markdown'});
        return res.status(200).send('OK');
      }
      if (data === 'del_boll_menu') {
         await editMessageText(TELEGRAM_TOKEN, chatId, callback.message.message_id, "Quale bollettino vuoi eliminare dalla home?", {
          inline_keyboard: [
            [{ text: "Meteo", callback_data: 'del_boll_meteo' }, { text: "Antincendio", callback_data: 'del_boll_antincendio' }, { text: "Alluvioni", callback_data: 'del_boll_alluvioni' }],
            [{ text: "🔙 Indietro", callback_data: 'menu_bollettini' }]
          ]
        });
        return res.status(200).send('OK');
      }

      // -- AZIONI ELIMINA BOLLETTINO --
      if (data.startsWith('del_boll_')) {
        const sezione = data.replace('del_boll_', '');
        await sendMessage(TELEGRAM_TOKEN, chatId, `Sto resettando il bollettino '${sezione}'...`);
        await eliminaBollettino(GITHUB_TOKEN, REPO_NAME, sezione);
        await sendMessage(TELEGRAM_TOKEN, chatId, `✅ Bollettino ${sezione} chiuso con successo!`);
        return res.status(200).send('OK');
      }

      // -- MENU PRINCIPALE --
      if (data === 'menu_main') {
        await sendMainMenu(TELEGRAM_TOKEN, chatId, callback.message.message_id);
        return res.status(200).send('OK');
      }
    }

    // ==========================================
    // B. GESTIONE DEI MESSAGGI NORMALI
    // ==========================================
    const message = body.message || body.channel_post;
    if (!message) return res.status(200).send('Nessun messaggio');

    if (message.chat.id.toString() !== CANALE_AUTORIZZATO) {
      return res.status(200).send('Accesso negato');
    }

    const text = message.text || message.caption || "";
    const lowerText = text.toLowerCase();

    // COMANDO PER APRIRE IL MENU
    if (lowerText === '/start' || lowerText === '/menu') {
       await sendMessage(TELEGRAM_TOKEN, message.chat.id, "🎛 **Pannello di Controllo P.A. Nicosia**\nSeleziona un'area da gestire:", {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: "📰 NOTIZIE", callback_data: 'menu_notizie' }],
            [{ text: "⚠️ BOLLETTINI", callback_data: 'menu_bollettini' }]
          ]
        }
      });
      return res.status(200).send('Menu inviato');
    }

    // ELIMINAZIONI TESTUALI (Mantenute per sicurezza)
    if (lowerText.includes("#elimina")) {
      let sez = null;
      if (lowerText.includes("meteo")) sez = "meteo";
      else if (lowerText.includes("antincendio")) sez = "antincendio";
      else if (lowerText.includes("alluvioni")) sez = "alluvioni";

      if (sez) {
        await eliminaBollettino(GITHUB_TOKEN, REPO_NAME, sez);
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, `✅ Bollettino ${sez} chiuso!`);
        return res.status(200).send('OK');
      }
      if (lowerText.includes("ultima news") || lowerText.includes("news")) {
         await eliminaUltimaNews(GITHUB_TOKEN, REPO_NAME, TELEGRAM_TOKEN, message.chat.id);
         return res.status(200).send('OK');
      }
    }

    // CARICAMENTO NEWS
    if (lowerText.includes("#news")) {
      if (!message.photo) {
        await sendMessage(TELEGRAM_TOKEN, message.chat.id, "❌ Invia una FOTO con didascalia.");
        return res.status(200).send('No foto');
      }
      await elaboraEsalvaNews(message, text, TELEGRAM_TOKEN, GITHUB_TOKEN, REPO_NAME);
      return res.status(200).send('News OK');
    }

    // CARICAMENTO BOLLETTINI
    if (message.document && message.document.mime_type === 'application/pdf') {
      const SEZIONI = { "#meteo": "meteo", "#antincendio": "antincendio", "#alluvioni": "alluvioni" };
      let sez = null;
      for (const [hashtag, name] of Object.entries(SEZIONI)) {
        if (lowerText.includes(hashtag)) { sez = name; break; }
      }
      if (sez) {
        await elaboraEsalvaBollettino(message, text, sez, TELEGRAM_TOKEN, GITHUB_TOKEN, REPO_NAME);
        return res.status(200).send('Boll OK');
      }
    }

    res.status(200).send('Ignorato');
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore');
  }
};

// ==========================================
// FUNZIONI MODULARI (Per tenere in ordine il codice)
// ==========================================

async function sendMainMenu(token, chatId, messageId) {
  await editMessageText(token, chatId, messageId, "🎛 **Pannello di Controllo P.A. Nicosia**\nSeleziona un'area da gestire:", {
        parse_mode: 'Markdown',
        inline_keyboard: [
          [{ text: "📰 NOTIZIE", callback_data: 'menu_notizie' }],
          [{ text: "⚠️ BOLLETTINI", callback_data: 'menu_bollettini' }]
        ]
      });
}

async function eliminaBollettino(gitToken, repo, sezione) {
    await deleteFromGitHub(gitToken, repo, `bollettini/${sezione}.pdf`, `Eliminato PDF ${sezione}`);
    const jsonData = JSON.stringify({ descrizione: "Nessun bollettino attivo al momento." });
    await uploadToGitHub(gitToken, repo, `bollettini/${sezione}.json`, Buffer.from(jsonData).toString('base64'), `Reset descrizione`);
}

async function eliminaUltimaNews(gitToken, repo, teleToken, chatId) {
     let storicoNews = [];
        try {
          const getJsonRes = await fetch(`https://api.github.com/repos/${repo}/contents/news.json`, {
            headers: { 'Authorization': `Bearer ${gitToken}` }
          });
          if (getJsonRes.ok) {
            const data = await getJsonRes.json();
            const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
            storicoNews = JSON.parse(decodedContent);
          }
        } catch (e) {}

        if (storicoNews.length > 0) {
          const newsEliminata = storicoNews.shift();
          const newJsonBase64 = Buffer.from(JSON.stringify(storicoNews, null, 2)).toString('base64');
          await uploadToGitHub(gitToken, repo, `news.json`, newJsonBase64, `Rimossa ultima news`);
          await sendMessage(teleToken, chatId, `✅ L'ultima news intitolata "${newsEliminata.titolo}" è stata rimossa.`);
        } else {
            await sendMessage(teleToken, chatId, `L'archivio delle news è vuoto.`);
        }
}

async function elaboraEsalvaNews(message, text, teleToken, gitToken, repo) {
    await sendMessage(teleToken, message.chat.id, "Creazione articolo in corso...");
    let cleanText = text.replace(/#news/gi, '').trim();
    let righe = cleanText.split('\n').filter(riga => riga.trim() !== '');
    let titolo = righe.length > 0 ? righe[0].trim() : "Nuova Comunicazione";
    let descrizione = righe.length > 1 ? righe.slice(1).join(' ').trim() : "Nessun dettaglio aggiuntivo.";
    let dataOggi = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    const photo = message.photo[message.photo.length - 1];
    const fileRes = await fetch(`https://api.telegram.org/bot${teleToken}/getFile?file_id=${photo.file_id}`);
    const fileData = await fileRes.json();
    const downloadRes = await fetch(`https://api.telegram.org/file/bot${teleToken}/${fileData.result.file_path}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    
    const nomeImmagine = `news_images/img_${Date.now()}.jpg`;
    await uploadToGitHub(gitToken, repo, nomeImmagine, Buffer.from(arrayBuffer).toString('base64'), `Caricata immagine news`);

    let storicoNews = [];
    try {
      const getJsonRes = await fetch(`https://api.github.com/repos/${repo}/contents/news.json`, { headers: { 'Authorization': `Bearer ${gitToken}` } });
      if (getJsonRes.ok) {
        storicoNews = JSON.parse(Buffer.from((await getJsonRes.json()).content, 'base64').toString('utf-8'));
      }
    } catch (e) {}

    storicoNews.unshift({ immagine: nomeImmagine, categoria: "Comunicazione", data: dataOggi, titolo: titolo, descrizione_breve: descrizione, badgeClass: "bg-success" });
    await uploadToGitHub(gitToken, repo, `news.json`, Buffer.from(JSON.stringify(storicoNews, null, 2)).toString('base64'), `Nuova news`);
    await sendMessage(teleToken, message.chat.id, `✅ Notizia pubblicata!\n\n*Titolo:* ${titolo}`, {parse_mode: 'Markdown'});
}

async function elaboraEsalvaBollettino(message, text, sezione, teleToken, gitToken, repo) {
    const didascalia_pulita = text.replace(/#\w+/g, '').trim();
    await sendMessage(teleToken, message.chat.id, `Pubblicazione bollettino '${sezione}'...`);

    const fileRes = await fetch(`https://api.telegram.org/bot${teleToken}/getFile?file_id=${message.document.file_id}`);
    const fileData = await fileRes.json();
    const downloadRes = await fetch(`https://api.telegram.org/file/bot${teleToken}/${fileData.result.file_path}`);
    
    await uploadToGitHub(gitToken, repo, `bollettini/${sezione}.pdf`, Buffer.from(await downloadRes.arrayBuffer()).toString('base64'), `Aggiornato PDF ${sezione}`);
    await uploadToGitHub(gitToken, repo, `bollettini/${sezione}.json`, Buffer.from(JSON.stringify({ descrizione: didascalia_pulita })).toString('base64'), `Aggiornata descrizione`);
    await sendMessage(teleToken, message.chat.id, `✅ Bollettino ${sezione} aggiornato!`);
}

// --- FUNZIONI DI BASE API ---
async function sendMessage(token, chatId, text, options = {}) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, ...options })
  });
}

async function editMessageText(token, chatId, messageId, text, replyMarkup) {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: text, reply_markup: replyMarkup, parse_mode: 'Markdown' })
    });
}

async function uploadToGitHub(token, repo, path, base64Content, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' } });
  let body = { message: commitMessage, content: base64Content };
  if (getRes.ok) body.sha = (await getRes.json()).sha;
  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' }, body: JSON.stringify(body)
  });
  if (!putRes.ok) throw new Error(`Errore GitHub Upload`);
}

async function deleteFromGitHub(token, repo, path, commitMessage) {
  const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'VercelBot' } });
  if (!getRes.ok) return; 
  const sha = (await getRes.json()).sha;
  await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VercelBot' },
    body: JSON.stringify({ message: commitMessage, sha: sha })
  });
}
