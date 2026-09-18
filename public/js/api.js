const API_BASE = '/api';

async function appelerApi(chemin, options = {}) {
  const reponse = await fetch(`${API_BASE}${chemin}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  const corpsBrut = await reponse.text();
  const corps = corpsBrut ? JSON.parse(corpsBrut) : null;

  if (!reponse.ok) {
    const message = corps?.erreur
      || corps?.erreurs?.join(' ')
      || 'Une erreur est survenue.';
    throw new Error(message);
  }

  return corps;
}

function afficherMessage(element, texte, type) {
  element.textContent = texte;
  element.className = `message show ${type}`;
}

function masquerMessage(element) {
  element.className = 'message';
}
