// ============================================================
// js/adherents.js
// Gère la page Adhérents : liste, ajout, modification,
// suppression, et consultation de l'historique des emprunts.
// ============================================================

const messageEl = document.getElementById('message');
const corpsTableau = document.getElementById('corps-tableau');

const formCard = document.getElementById('form-card');
const formAdherent = document.getElementById('form-adherent');
const formTitre = document.getElementById('form-titre');
const btnSoumettre = document.getElementById('btn-soumettre');
const btnAfficherFormulaire = document.getElementById('btn-afficher-formulaire');
const btnAnnuler = document.getElementById('btn-annuler');

const champId = document.getElementById('adherent-id');
const champNom = document.getElementById('nom');
const champContact = document.getElementById('contact');

const historiqueCard = document.getElementById('historique-card');
const historiqueTitre = document.getElementById('historique-titre');
const corpsHistorique = document.getElementById('corps-historique');
const btnFermerHistorique = document.getElementById('btn-fermer-historique');

// ------------------------------------------------------------
// Chargement et affichage de la liste
// ------------------------------------------------------------

async function chargerAdherents() {
  try {
    const adherents = await appelerApi('/adherents');
    afficherLignesAdherents(adherents);
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherLignesAdherents(adherents) {
  if (adherents.length === 0) {
    corpsTableau.innerHTML = '<tr><td colspan="3" class="text-muted">Aucun adhérent enregistré.</td></tr>';
    return;
  }

  corpsTableau.innerHTML = adherents.map((adherent) => `
    <tr>
      <td>${adherent.nom}</td>
      <td>${adherent.contact}</td>
      <td class="actions-cell">
        <button class="secondary" onclick="afficherHistorique(${adherent.id}, '${adherent.nom.replace(/'/g, "\\'")}')">Historique</button>
        <button class="secondary" onclick="ouvrirModification(${adherent.id})">Modifier</button>
        <button class="danger" onclick="supprimerAdherent(${adherent.id})">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
// Historique des emprunts d'un adhérent
// ------------------------------------------------------------

async function afficherHistorique(id, nom) {
  try {
    const historique = await appelerApi(`/adherents/${id}/emprunts`);

    historiqueTitre.textContent = `Historique des emprunts — ${nom}`;
    afficherLignesHistorique(historique);
    historiqueCard.classList.add('show');
    historiqueCard.scrollIntoView({ behavior: 'smooth' });
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherLignesHistorique(emprunts) {
  if (emprunts.length === 0) {
    corpsHistorique.innerHTML = '<tr><td colspan="4" class="text-muted">Aucun emprunt enregistré.</td></tr>';
    return;
  }

  corpsHistorique.innerHTML = emprunts.map((emprunt) => `
    <tr>
      <td>${emprunt.livre_titre}</td>
      <td>${emprunt.date_emprunt}</td>
      <td>${emprunt.date_retour_prevue}</td>
      <td>${creerBadgeHistorique(emprunt)}</td>
    </tr>
  `).join('');
}

function creerBadgeHistorique(emprunt) {
  if (emprunt.en_retard) {
    return '<span class="badge badge-retard">En retard</span>';
  }
  if (emprunt.statut_emprunt === 'en cours') {
    return '<span class="badge badge-encours">En cours</span>';
  }
  return '<span class="badge badge-emprunte">Terminé</span>';
}

btnFermerHistorique.addEventListener('click', () => {
  historiqueCard.classList.remove('show');
});

// ------------------------------------------------------------
// Affichage / masquage du formulaire
// ------------------------------------------------------------

function ouvrirAjout() {
  formAdherent.reset();
  champId.value = '';
  formTitre.textContent = 'Ajouter un adhérent';
  btnSoumettre.textContent = 'Ajouter';
  formCard.classList.add('show');
}

function fermerFormulaire() {
  formAdherent.reset();
  formCard.classList.remove('show');
  masquerMessage(messageEl);
}

btnAfficherFormulaire.addEventListener('click', ouvrirAjout);
btnAnnuler.addEventListener('click', fermerFormulaire);

// ------------------------------------------------------------
// Modification d'un adhérent existant
// ------------------------------------------------------------

async function ouvrirModification(id) {
  try {
    const adherent = await appelerApi(`/adherents/${id}`);

    champId.value = adherent.id;
    champNom.value = adherent.nom;
    champContact.value = adherent.contact;

    formTitre.textContent = 'Modifier l\'adhérent';
    btnSoumettre.textContent = 'Enregistrer les modifications';
    formCard.classList.add('show');
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// ------------------------------------------------------------
// Soumission du formulaire (création ou modification)
// ------------------------------------------------------------

formAdherent.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();

  const donnees = {
    nom: champNom.value.trim(),
    contact: champContact.value.trim()
  };

  const idExistant = champId.value;

  try {
    if (idExistant) {
      await appelerApi(`/adherents/${idExistant}`, {
        method: 'PUT',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Adhérent modifié avec succès.', 'success');
    } else {
      await appelerApi('/adherents', {
        method: 'POST',
        body: JSON.stringify(donnees)
      });
      afficherMessage(messageEl, 'Adhérent ajouté avec succès.', 'success');
    }

    fermerFormulaire();
    chargerAdherents();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
});

// ------------------------------------------------------------
// Suppression d'un adhérent
// ------------------------------------------------------------

async function supprimerAdherent(id) {
  const confirmation = confirm('Supprimer définitivement cet adhérent ?');
  if (!confirmation) {
    return;
  }

  try {
    await appelerApi(`/adherents/${id}`, { method: 'DELETE' });
    afficherMessage(messageEl, 'Adhérent supprimé.', 'success');
    chargerAdherents();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// ------------------------------------------------------------
// Initialisation de la page
// ------------------------------------------------------------

chargerAdherents();
