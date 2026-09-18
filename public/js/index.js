const conteneurStats = document.getElementById('stats');
const messageEl = document.getElementById('message');

async function chargerStatistiques() {
  try {
    const stats = await appelerApi('/statistiques');
    afficherStats(stats);
    afficherLivrePopulaire(stats.livrePlusEmprunte);
    afficherAdherentActif(stats.adherentLePlusActif);
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherStats(stats) {
  conteneurStats.innerHTML = `
    <div class="stat-card">
      <span class="label">Livres au catalogue</span>
      <span class="value">${stats.totalLivres}</span>
    </div>
    <div class="stat-card">
      <span class="label">Adhérents inscrits</span>
      <span class="value">${stats.totalAdherents}</span>
    </div>
    <div class="stat-card">
      <span class="label">Emprunts en cours</span>
      <span class="value">${stats.empruntsEnCours}</span>
    </div>
    <div class="stat-card alert">
      <span class="label">Emprunts en retard</span>
      <span class="value">${stats.empruntsEnRetard}</span>
    </div>
  `;
}

function afficherLivrePopulaire(livre) {
  const nomEl = document.getElementById('livre-populaire-nom');
  const compteEl = document.getElementById('livre-populaire-compte');

  if (!livre) {
    nomEl.textContent = 'Aucun emprunt enregistré pour le moment';
    compteEl.textContent = '';
    return;
  }

  nomEl.textContent = livre.titre;
  compteEl.textContent = `${livre.nombre_emprunts} emprunt(s)`;
}

function afficherAdherentActif(adherent) {
  const nomEl = document.getElementById('adherent-actif-nom');
  const compteEl = document.getElementById('adherent-actif-compte');

  if (!adherent) {
    nomEl.textContent = 'Aucun emprunt enregistré pour le moment';
    compteEl.textContent = '';
    return;
  }

  nomEl.textContent = adherent.nom;
  compteEl.textContent = `${adherent.nombre_emprunts} emprunt(s)`;
}

chargerStatistiques();
