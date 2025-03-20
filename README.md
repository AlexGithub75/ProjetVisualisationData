# Visualisation des Données d'Attaques de Cybersécurité

Ce projet propose une interface interactive de visualisation des données d'attaques de cybersécurité basée sur le jeu de données [Cyber Security Attacks](https://www.kaggle.com/datasets/teamincribo/cyber-security-attacks) de Kaggle.

## 📊 Aperçu

Cette application web permet d'explorer visuellement différentes dimensions des attaques de cybersécurité à travers plusieurs graphiques interactifs :

- Distribution des types d'attaques
- Sévérité des incidents
- Actions prises face aux attaques
- Distributions par protocole utilisé
- Analyse par système d'exploitation des appareils ciblés
- Évolution temporelle des attaques
- Graphiques en violon pour l'analyse de distributions

## 🚀 Installation et démarrage

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/votre-username/ProjetVisualisationData.git
   cd ProjetVisualisationData
   ```

2. Lancez un serveur HTTP simple :
   ```bash
   python -m http.server 8000
   ```

3. Ouvrez votre navigateur et accédez à :
   ```
   http://localhost:8000
   ```

## 🔍 Structure du projet

```
ProjetVisualisationData/
│── data/
│   └── cybersecurityattacks.csv    # Jeu de données d'attaques cybersécurité
│── graphs/
│   ├── actionTakenPieChart.js      # Graphique des actions entreprises
│   ├── barChart.js                 # Graphique à barres générique
│   ├── deviceOsBarChart.js         # Distribution par OS
│   ├── pieChart.js                 # Graphique circulaire générique
│   ├── protocolPieChart.js         # Distribution par protocole
│   ├── severityPieChart.js         # Distribution par sévérité
│   ├── timelineChart.js            # Évolution temporelle des attaques
│   └── violinPlots.js              # Graphiques en violon pour distributions
│── index.html                      # Interface utilisateur principale
│── script.js                       # Logique principale JavaScript
│── style.css                       # Styles CSS de l'application
└── README.md                       # Ce fichier de documentation
```

## 💻 Technologies utilisées

- JavaScript (ES6+)
- D3.js pour les visualisations de données
- HTML5/CSS3 pour l'interface utilisateur
- Python (uniquement pour héberger un serveur de développement simple)

## 📊 Jeu de données

Les données proviennent du jeu de données [Cyber Security Attacks](https://www.kaggle.com/datasets/teamincribo/cyber-security-attacks) disponible sur Kaggle, qui contient des informations détaillées sur divers incidents de cybersécurité.

## 🔒 Confidentialité et utilisation

Ce projet est destiné à des fins éducatives et analytiques uniquement. Les données visualisées sont issues d'un ensemble de données public et ne contiennent pas d'informations personnelles identifiables.

## 📝 Licence

Licence Propriétaire - Toute utilisation, modification, distribution, ou reproduction de ce projet sans autorisation explicite écrite du propriétaire est strictement interdite. Ce projet est fourni tel quel, sans garantie d'aucune sorte. L'utilisation non autorisée de ce projet entraînera des poursuites judiciaires.
© 2025 Tous Droits Réservés.


## 👥 Contributeurs

Mehdi L - Alexandre Pl - Alexandre Po
