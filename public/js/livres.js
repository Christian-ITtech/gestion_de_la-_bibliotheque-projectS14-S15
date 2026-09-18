const messageEl = document.getElementById('message');
const corpsTableau = document.getElementById('corps-tableau');
const paginationEl = document.getElementById('pagination');
const totalResultatsEl = document.getElementById('total-resultats');

const formCard = document.getElementById('form-card');
const formLivre = document.getElementById('form-livre');
const formTitre = document.getElementById('form-titre');
const btnSoumettre = document.getElementById('btn-soumettre');
const btnAfficherFormulaire = document.getElementById('btn-afficher-formulaire');
const btnAnnuler = document.getElementById('btn-annuler');

const champId = document.getElementById('livre-id');
const champTitre = document.getElementById('titre');
const champAuteurId = document.getElementById('auteur_id');
const champAnnee = document.getElementById('annee_publication');

const champRecherche = document.getElementById('recherche');
const btnRechercher = document.getElementById('btn-rechercher');

let pageActuelle = 1;
let rechercheActuelle = '';
let minuteurRecherche = null;


// Chargement de la liste des auteurs pour le menu déroulant
async function chargerAuteursDansFormulaire() {
  try {
    const auteurs = await appelerApi('/auteurs');

    for (const auteur of auteurs) {
      const option = document.createElement('option');
      option.value = auteur.id;
      option.textContent = auteur.nom;
      champAuteurId.appendChild(option);
    }
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// Chargement et affichage des livres (recherche + pagination)
async function chargerLivres() {
  try {
    const parametres = new URLSearchParams({
      page: pageActuelle,
      limite: 10
    });

    if (rechercheActuelle) {
      parametres.set('recherche', rechercheActuelle);
    }

    const resultat = await appelerApi(`/livres?${parametres}`);

    afficherLignesLivres(resultat.donnees);
    afficherPagination(resultat.pagination);

    totalResultatsEl.textContent = `${resultat.pagination.total} résultat(s)`;
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherLignesLivres(livres) {
  if (livres.length === 0) {
    corpsTableau.innerHTML = '<tr><td colspan="5" class="text-muted">Aucun livre trouvé.</td></tr>';
    return;
  }

  corpsTableau.innerHTML = livres.map((livre) => `
    <tr>
      <td>${livre.titre}</td>
      <td>${livre.auteur_nom}</td>
      <td>${livre.annee_publication ?? '—'}</td>
      <td>${creerBadgeStatut(livre.statut)}</td>
      <td class="actions-cell">
        <button class="secondary" onclick="ouvrirModification(${livre.id})">Modifier</button>
        <button class="danger" onclick="supprimerLivre(${livre.id})">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

function creerBadgeStatut(statut) {
  if (statut === 'disponible') {
    return '<span class="badge badge-disponible">Disponible</span>';
  }
  return '<span class="badge badge-emprunte">Emprunté</span>';
}

function afficherPagination(pagination) {
  const { page, totalPages } = pagination;

  paginationEl.innerHTML = `
    <button ${page <= 1 ? 'disabled' : ''} onclick="changerPage(${page - 1})">Précédent</button>
    <span>Page ${page} sur ${Math.max(totalPages, 1)}</span>
    <button ${page >= totalPages ? 'disabled' : ''} onclick="changerPage(${page + 1})">Suivant</button>
  `;
}

function changerPage(nouvellePage) {
  pageActuelle = nouvellePage;
  chargerLivres();
}

// Recherche (avec un léger délai pour éviter un appel par lettre)
champRecherche.addEventListener('input', () => {
  clearTimeout(minuteurRecherche);

  minuteurRecherche = setTimeout(() => {
    rechercheActuelle = champRecherche.value.trim();
    pageActuelle = 1;
    chargerLivres();
  }, 350);
});

btnRechercher.addEventListener('click', () => {
  clearTimeout(minuteurRecherche);
  rechercheActuelle = champRecherche.value.trim();
  pageActuelle = 1;
  chargerLivres();
});

// Affichage / masquage du formulaire
function ouvrirAjout() {
  formLivre.reset();
  champId.value = '';
  formTitre.textContent = 'Ajouter un livre';
  btnSoumettre.textContent = 'Ajouter';
  formCard.classList.add('show');
}

function fermerFormulaire() {
  formLivre.reset();
  formCard.classList.remove('show');
  masquerMessage(messageEl);
}

btnAfficherFormulaire.addEventListener('click', ouvrirAjout);
btnAnnuler.addEventListener('click', fermerFormulaire);

// Modification d'un livre existant
async function ouvrirModification(id) {
  try {
    const livre = await appelerApi(`/livres/${id}`);

    champId.value = livre.id;
    champTitre.value = livre.titre;
    champAuteurId.value = livre.auteur_id;
    champAnnee.value = livre.annee_publication ?? '';

    formTitre.textContent = 'Modifier le livre';
    btnSoumettre.textContent = 'Enregistrer les modifications';
    formCard.classList.add('show');
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// Soumission du formulaire (création ou modification)
formLivre.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();

  const donnees = {
    titre: champTitre.value.trim(),
    auteur_id: Number(champAuteurId.value),
    annee_publication: champAnnee.value ? Number(champAnnee.value) : null
  };

  const idExistant = champId.value;

  try {
    if (idExistant) {
      await appelerApi(`/livres/${idExistant}`, {
        method: 'PUT',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Livre modifié avec succès.', 'success');
    } else {
      await appelerApi('/livres', {
        method: 'POST',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Livre ajouté avec succès.', 'success');
    }

    fermerFormulaire();
    chargerLivres();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
});

// Suppression d'un livre
async function supprimerLivre(id) {
  const confirmation = confirm('Supprimer définitivement ce livre ?');
  if (!confirmation) {
    return;
  }

  try {
    await appelerApi(`/livres/${id}`, { method: 'DELETE' });
    afficherMessage(messageEl, 'Livre supprimé.', 'success');
    chargerLivres();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// Initialisation de la page
chargerAuteursDansFormulaire();
chargerLivres();