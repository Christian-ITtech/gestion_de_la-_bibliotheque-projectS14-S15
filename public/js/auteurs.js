// ============================================================
// js/auteurs.js
// Gère la page Auteurs : liste, ajout, modification, suppression.
// ============================================================

const messageEl = document.getElementById('message');
const corpsTableau = document.getElementById('corps-tableau');

const formCard = document.getElementById('form-card');
const formAuteur = document.getElementById('form-auteur');
const formTitre = document.getElementById('form-titre');
const btnSoumettre = document.getElementById('btn-soumettre');
const btnAfficherFormulaire = document.getElementById('btn-afficher-formulaire');
const btnAnnuler = document.getElementById('btn-annuler');

const champId = document.getElementById('auteur-id');
const champNom = document.getElementById('nom');
const champNationalite = document.getElementById('nationalite');

// ------------------------------------------------------------
// Chargement et affichage de la liste
// ------------------------------------------------------------

async function chargerAuteurs() {
  try {
    const auteurs = await appelerApi('/auteurs');
    afficherLignesAuteurs(auteurs);
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherLignesAuteurs(auteurs) {
  if (auteurs.length === 0) {
    corpsTableau.innerHTML = '<tr><td colspan="3" class="text-muted">Aucun auteur enregistré.</td></tr>';
    return;
  }

  corpsTableau.innerHTML = auteurs.map((auteur) => `
    <tr>
      <td>${auteur.nom}</td>
      <td>${auteur.nationalite ?? '—'}</td>
      <td class="actions-cell">
        <button class="secondary" onclick="ouvrirModification(${auteur.id})">Modifier</button>
        <button class="danger" onclick="supprimerAuteur(${auteur.id})">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
// Affichage / masquage du formulaire
// ------------------------------------------------------------

function ouvrirAjout() {
  formAuteur.reset();
  champId.value = '';
  formTitre.textContent = 'Ajouter un auteur';
  btnSoumettre.textContent = 'Ajouter';
  formCard.classList.add('show');
}

function fermerFormulaire() {
  formAuteur.reset();
  formCard.classList.remove('show');
  masquerMessage(messageEl);
}

btnAfficherFormulaire.addEventListener('click', ouvrirAjout);
btnAnnuler.addEventListener('click', fermerFormulaire);

// ------------------------------------------------------------
// Modification d'un auteur existant
// ------------------------------------------------------------

async function ouvrirModification(id) {
  try {
    const auteur = await appelerApi(`/auteurs/${id}`);

    champId.value = auteur.id;
    champNom.value = auteur.nom;
    champNationalite.value = auteur.nationalite ?? '';

    formTitre.textContent = 'Modifier l\'auteur';
    btnSoumettre.textContent = 'Enregistrer les modifications';
    formCard.classList.add('show');
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// ------------------------------------------------------------
// Soumission du formulaire (création ou modification)
// ------------------------------------------------------------

formAuteur.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();

  const donnees = {
    nom: champNom.value.trim(),
    nationalite: champNationalite.value.trim() || null
  };

  const idExistant = champId.value;

  try {
    if (idExistant) {
      await appelerApi(`/auteurs/${idExistant}`, {
        method: 'PUT',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Auteur modifié avec succès.', 'success');
    } else {
      await appelerApi('/auteurs', {
        method: 'POST',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Auteur ajouté avec succès.', 'success');
    }

    fermerFormulaire();
    chargerAuteurs();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
});

// ------------------------------------------------------------
// Suppression d'un auteur
// ------------------------------------------------------------

async function supprimerAuteur(id) {
  const confirmation = confirm('Supprimer définitivement cet auteur ?');
  if (!confirmation) {
    return;
  }

  try {
    await appelerApi(`/auteurs/${id}`, { method: 'DELETE' });
    afficherMessage(messageEl, 'Auteur supprimé.', 'success');
    chargerAuteurs();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// ------------------------------------------------------------
// Initialisation de la page
// ------------------------------------------------------------

chargerAuteurs();
