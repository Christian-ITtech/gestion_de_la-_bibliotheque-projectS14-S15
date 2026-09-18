// ============================================================
// js/emprunts.js
// Gère la page Emprunts : filtres (en cours / en retard / tous),
// création d'un emprunt, enregistrement d'un retour.
// ============================================================

const messageEl = document.getElementById('message');
const corpsTableau = document.getElementById('corps-tableau');

const formCard = document.getElementById('form-card');
const formEmprunt = document.getElementById('form-emprunt');
const btnAfficherFormulaire = document.getElementById('btn-afficher-formulaire');
const btnAnnuler = document.getElementById('btn-annuler');

const champAdherentId = document.getElementById('adherent_id');
const champLivreId = document.getElementById('livre_id');
const champDateRetour = document.getElementById('date_retour_prevue');

const boutonsFiltre = document.querySelectorAll('.filtres button');

let filtreActuel = 'en-cours';

// ------------------------------------------------------------
// Chargement des menus déroulants (adhérents, livres disponibles)
// ------------------------------------------------------------

async function chargerAdherentsDansFormulaire() {
  const adherents = await appelerApi('/adherents');

  champAdherentId.innerHTML = '<option value="">Sélectionner un adhérent</option>';

  for (const adherent of adherents) {
    const option = document.createElement('option');
    option.value = adherent.id;
    option.textContent = adherent.nom;
    champAdherentId.appendChild(option);
  }
}

async function chargerLivresDisponiblesDansFormulaire() {
  const resultat = await appelerApi('/livres?limite=100');
  const livresDisponibles = resultat.donnees.filter((livre) => livre.statut === 'disponible');

  champLivreId.innerHTML = '<option value="">Sélectionner un livre</option>';

  for (const livre of livresDisponibles) {
    const option = document.createElement('option');
    option.value = livre.id;
    option.textContent = `${livre.titre} — ${livre.auteur_nom}`;
    champLivreId.appendChild(option);
  }
}

// ------------------------------------------------------------
// Filtres (en cours / en retard / tous)
// ------------------------------------------------------------

boutonsFiltre.forEach((bouton) => {
  bouton.addEventListener('click', () => {
    boutonsFiltre.forEach((b) => b.classList.remove('active'));
    bouton.classList.add('active');
    filtreActuel = bouton.dataset.filtre;
    chargerEmprunts();
  });
});

// ------------------------------------------------------------
// Chargement et affichage des emprunts selon le filtre actif
// ------------------------------------------------------------

async function chargerEmprunts() {
  try {
    const chemin = filtreActuel === 'tous' ? '/emprunts' : `/emprunts/${filtreActuel}`;
    const emprunts = await appelerApi(chemin);
    afficherLignesEmprunts(emprunts);
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

function afficherLignesEmprunts(emprunts) {
  if (emprunts.length === 0) {
    corpsTableau.innerHTML = '<tr><td colspan="6" class="text-muted">Aucun emprunt à afficher.</td></tr>';
    return;
  }

  corpsTableau.innerHTML = emprunts.map((emprunt) => construireLigneEmprunt(emprunt)).join('');
}

function construireLigneEmprunt(emprunt) {
  const enRetard = filtreActuel === 'en-retard' || emprunt.en_retard === true;
  const classeRetard = enRetard ? 'row-retard' : '';

  const badge = construireBadgeEmprunt(emprunt, enRetard);
  const bouton = construireBoutonAction(emprunt);

  return `
    <tr class="${classeRetard}">
      <td>${emprunt.adherent_nom}</td>
      <td>${emprunt.livre_titre}</td>
      <td>${emprunt.date_emprunt}</td>
      <td>${emprunt.date_retour_prevue}</td>
      <td>${badge}</td>
      <td class="actions-cell">${bouton}</td>
    </tr>
  `;
}

function construireBadgeEmprunt(emprunt, enRetard) {
  if (enRetard) {
    const jours = emprunt.jours_de_retard;
    return `<span class="badge badge-retard">En retard${jours ? ` (${jours} j)` : ''}</span>`;
  }
  if (emprunt.statut_emprunt === 'termine') {
    return '<span class="badge badge-emprunte">Terminé</span>';
  }
  return '<span class="badge badge-encours">En cours</span>';
}

function construireBoutonAction(emprunt) {
  const estClos = emprunt.statut_emprunt === 'termine';
  if (estClos) {
    return '';
  }
  return `<button class="secondary" onclick="enregistrerRetour(${emprunt.id})">Enregistrer le retour</button>`;
}

// ------------------------------------------------------------
// Affichage / masquage du formulaire de création
// ------------------------------------------------------------

async function ouvrirFormulaire() {
  formEmprunt.reset();
  formCard.classList.add('show');
  await chargerLivresDisponiblesDansFormulaire();
}

function fermerFormulaire() {
  formEmprunt.reset();
  formCard.classList.remove('show');
  masquerMessage(messageEl);
}

btnAfficherFormulaire.addEventListener('click', ouvrirFormulaire);
btnAnnuler.addEventListener('click', fermerFormulaire);

// ------------------------------------------------------------
// Création d'un emprunt
// ------------------------------------------------------------

formEmprunt.addEventListener('submit', async (evenement) => {
  evenement.preventDefault();

  const donnees = {
    adherent_id: Number(champAdherentId.value),
    livre_id: Number(champLivreId.value),
    date_retour_prevue: champDateRetour.value
  };

  try {
    await appelerApi('/emprunts', {
      method: 'POST',
      body: JSON.stringify(donnees)
    });

    afficherMessage(messageEl, 'Emprunt enregistré avec succès.', 'success');
    fermerFormulaire();
    chargerEmprunts();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
});

// ------------------------------------------------------------
// Enregistrement du retour d'un livre
// ------------------------------------------------------------

async function enregistrerRetour(id) {
  try {
    await appelerApi(`/emprunts/${id}/retour`, { method: 'PUT' });
    afficherMessage(messageEl, 'Retour enregistré avec succès.', 'success');
    chargerEmprunts();
  } catch (erreur) {
    afficherMessage(messageEl, erreur.message, 'error');
  }
}

// ------------------------------------------------------------
// Initialisation de la page
// ------------------------------------------------------------

chargerAdherentsDansFormulaire();
chargerEmprunts();
