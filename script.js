// Variables globales
let globalData = [];
let filteredData = [];
let currentChart = null;
let tooltip = d3.select('#tooltip');
let graphModules = {};

// Configuration pour les couleurs et thèmes
const colorScheme = {
    category: d3.scaleOrdinal(d3.schemeCategory10),
    severity: {
        'High': '#ff5252',
        'Medium': '#ffb142',
        'Low': '#2ed573'
    },
    action: {
        'Blocked': '#1e90ff',
        'Logged': '#32cd32',
        'Ignored': '#ffa500'
    },
    protocol: {
        'TCP': '#5352ed',
        'UDP': '#ff9ff3',
        'ICMP': '#70a1ff',
        'HTTP': '#1dd1a1'
    }
};

// Fonctions utilitaires
const formatNumber = (num) => new Intl.NumberFormat().format(num);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR');
const formatPercent = (num) => `${(num * 100).toFixed(1)}%`;

// Charge dynamiquement tous les modules de graphiques avec gestion d'erreurs
async function loadGraphModules() {
    showLoader(true);
    const modules = {};
    const graphFiles = [
        'pieChart.js',
        'barChart.js',
        'severityPieChart.js',
        'actionTakenPieChart.js',
        'protocolPieChart.js',
        'deviceOsBarChart.js',
        'violinPlots.js',
        'timelineChart.js',
        'geoMapChart.js',
        'anomalyScoreChart.js',
        'networkSegmentChart.js',
        'correlationMatrix.js',
        'trafficTypeChart.js'
    ];

    for (const file of graphFiles) {
        try {
            const module = await import(`./graphs/${file}`);
            const moduleName = file.replace('.js', '');
            modules[moduleName] = module.default;
            console.log(`Successfully loaded ${file}`);
        } catch (error) {
            console.warn(`Failed to load ${file}:`, error.message);
            // Optionnel: notification à l'utilisateur via l'UI
        }
    }
    
    showLoader(false);
    return modules;
}

// Affiche ou masque le loader
function showLoader(visible) {
    document.getElementById('loader').style.display = visible ? 'flex' : 'none';
}

// Crée le menu principal avec animation et suivi actif
function createMenu(modules) {
    const menu = document.getElementById('menu');
    const ul = document.createElement('ul');
    menu.innerHTML = '';

    if (Object.keys(modules).length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun graphique disponible. Vérifiez le dossier graphs.';
        li.style.color = 'red';
        ul.appendChild(li);
    } else {
        Object.keys(modules).forEach((moduleName) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.module = moduleName;
            
            // Format du nom avec capitalisation et espaces
            a.textContent = moduleName
                .replace('Chart', '')
                .replace('Pie', '')
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .replace(/^[a-z]/, (match) => match.toUpperCase());
            
            // Ajouter des icônes selon le type de graphique
            if (moduleName.includes('Pie')) {
                a.innerHTML = `<i class="fas fa-chart-pie"></i> ${a.textContent}`;
            } else if (moduleName.includes('Bar')) {
                a.innerHTML = `<i class="fas fa-chart-bar"></i> ${a.textContent}`;
            } else if (moduleName.includes('timeline')) {
                a.innerHTML = `<i class="fas fa-clock"></i> ${a.textContent}`;
            } else if (moduleName.includes('geo')) {
                a.innerHTML = `<i class="fas fa-globe"></i> ${a.textContent}`;
            } else if (moduleName.includes('violin')) {
                a.innerHTML = `<i class="fas fa-chart-line"></i> ${a.textContent}`;
            } else if (moduleName.includes('correlation')) {
                a.innerHTML = `<i class="fas fa-th"></i> ${a.textContent}`;
            } else {
                a.innerHTML = `<i class="fas fa-chart-line"></i> ${a.textContent}`;
            }
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Marquer l'élément comme actif
                document.querySelectorAll('#menu a').forEach(el => el.classList.remove('active'));
                a.classList.add('active');
                
                renderGraph(moduleName, modules[moduleName]);
            });
            
            li.appendChild(a);
            ul.appendChild(li);
        });
    }

    menu.appendChild(ul);
    
    // Activer le premier élément par défaut
    if (ul.querySelector('a')) {
        ul.querySelector('a').classList.add('active');
    }
}

// Fonction pour filtrer les données selon les sélections de l'utilisateur
function filterData() {
    showLoader(true);
    
    const timeRange = document.getElementById('timeRangeFilter').value;
    const attackType = document.getElementById('attackTypeFilter').value;
    const severity = document.getElementById('severityFilter').value;
    
    // Copie des données originales
    filteredData = [...globalData];
    
    // Filtrer par date
    if (timeRange !== 'all') {
        const now = new Date();
        let threshold = new Date();
        
        switch (timeRange) {
            case 'day':
                threshold.setDate(now.getDate() - 1);
                break;
            case 'week':
                threshold.setDate(now.getDate() - 7);
                break;
            case 'month':
                threshold.setMonth(now.getMonth() - 1);
                break;
        }
        
        filteredData = filteredData.filter(d => new Date(d.Timestamp) >= threshold);
    }
    
    // Filtrer par type d'attaque
    if (attackType !== 'all') {
        filteredData = filteredData.filter(d => d['Attack Type'] === attackType);
    }
    
    // Filtrer par niveau de sévérité
    if (severity !== 'all') {
        filteredData = filteredData.filter(d => d['Severity Level'] === severity);
    }
    
    // Mettre à jour les KPIs
    updateKPIs(filteredData);
    
    // Mettre à jour le graphique actuel s'il existe
    const activeModule = document.querySelector('#menu a.active')?.dataset.module;
    if (activeModule && graphModules[activeModule]) {
        renderGraph(activeModule, graphModules[activeModule]);
    }
    
    showLoader(false);
}

// Mise à jour des indicateurs de performance clés (KPIs)
function updateKPIs(data) {
    // Total des attaques
    document.querySelector('#totalAttacks .kpi-value').textContent = formatNumber(data.length);
    
    // Attaques bloquées
    const blockedCount = data.filter(d => d['Action Taken'] === 'Blocked').length;
    const blockedPercent = data.length > 0 ? blockedCount / data.length : 0;
    document.querySelector('#blockedAttacks .kpi-value').textContent = formatNumber(blockedCount);
    document.querySelector('#blockedAttacks .kpi-percent').textContent = `(${formatPercent(blockedPercent)})`;
    
    // Répartition des attaques (mini graphique)
    updateAttackDistribution(data);
    
    // Répartition des sévérités (mini graphique)
    updateSeverityDistribution(data);
}

// Mini graphique pour la répartition des attaques
function updateAttackDistribution(data) {
    const container = document.querySelector('#attackDistribution .kpi-chart');
    container.innerHTML = '';
    
    // Dimensions
    const width = container.clientWidth;
    const height = 150;
    const radius = Math.min(width, height) / 2 - 10;
    
    // SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Agrégation des données
    const attackCounts = d3.rollup(data, v => v.length, d => d['Attack Type']);
    const pieData = Array.from(attackCounts, ([key, value]) => ({ key, value }));
    
    // Générateur de pie
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    // Générateur d'arcs
    const arc = d3.arc()
        .innerRadius(radius * 0.5) // Donut au lieu de pie
        .outerRadius(radius);
    
    // Couleurs
    const color = d3.scaleOrdinal()
        .domain(pieData.map(d => d.key))
        .range(d3.schemeCategory10);
    
    // Dessin des arcs
    svg.selectAll('path')
        .data(pie(pieData))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.key))
        .attr('stroke', '#262940')
        .attr('stroke-width', 1)
        .attr('class', 'arc')
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${d.data.key}</strong><br>
                Nombre: ${formatNumber(d.data.value)}<br>
                Pourcentage: ${formatPercent(d.data.value / data.length)}
            `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
            
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1.05)');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1)');
        });
}

// Mini graphique pour la répartition des sévérités
function updateSeverityDistribution(data) {
    const container = document.querySelector('#severityDistribution .kpi-chart');
    container.innerHTML = '';
    
    // Dimensions
    const width = container.clientWidth;
    const height = 150;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Agrégation des données
    const severityCounts = d3.rollup(data, v => v.length, d => d['Severity Level']);
    const barData = Array.from(severityCounts, ([key, value]) => ({ key, value }))
        .sort((a, b) => {
            const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
            return order[a.key] - order[b.key];
        });
    
    // Échelles
    const x = d3.scaleBand()
        .domain(barData.map(d => d.key))
        .range([0, innerWidth])
        .padding(0.2);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value)])
        .nice()
        .range([innerHeight, 0]);
    
    // Couleurs
    const color = d3.scaleOrdinal()
        .domain(['High', 'Medium', 'Low'])
        .range([colorScheme.severity.High, colorScheme.severity.Medium, colorScheme.severity.Low]);
    
    // Dessin des barres
    svg.selectAll('.bar')
        .data(barData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.key))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => innerHeight - y(d.value))
        .attr('fill', d => color(d.key))
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>Sévérité: ${d.key}</strong><br>
                Nombre: ${formatNumber(d.value)}<br>
                Pourcentage: ${formatPercent(d.value / data.length)}
            `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
            
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1);
        });
    
    // Ajouter des étiquettes sur les barres
    svg.selectAll('.label')
        .data(barData)
        .join('text')
        .attr('class', 'label')
        .attr('x', d => x(d.key) + x.bandwidth() / 2)
        .attr('y', d => y(d.value) - 5)
        .attr('text-anchor', 'middle')
        .text(d => formatNumber(d.value))
        .attr('fill', '#fff')
        .attr('font-size', '10px');
}

// Fonction pour rendre le graphique sélectionné avec gestion d'erreurs
function renderGraph(moduleName, renderFunction) {
    showLoader(true);
    
    const svg = d3.select('#visualization svg');
    svg.selectAll('*').remove(); // Effacer le graphique précédent
    
    // Ajouter une classe pour l'animation
    svg.classed('fade-in', true);
    setTimeout(() => svg.classed('fade-in', false), 500);
    
    try {
        // Si le module existe, appeler sa fonction de rendu
        if (renderFunction) {
            currentChart = { name: moduleName, render: renderFunction };
            renderFunction(svg, filteredData);
        } else {
            displayError(svg, `Le module ${moduleName} n'est pas disponible.`);
        }
    } catch (error) {
        console.error(`Erreur lors du rendu de ${moduleName}:`, error);
        displayError(svg, `Erreur lors du rendu de ${moduleName}: ${error.message}`);
    }
    
    showLoader(false);
}

// Affiche un message d'erreur dans le SVG
function displayError(svg, message) {
    svg.append('text')
        .attr('x', 50)
        .attr('y', 50)
        .attr('fill', '#ff6b6b')
        .text(message);
}

// Initialisation des filtres dynamiques avec les valeurs du dataset
function initFilters(data) {
    // Remplir le filtre des types d'attaques
    const attackTypeSelect = document.getElementById('attackTypeFilter');
    const attackTypes = [...new Set(data.map(d => d['Attack Type']))].sort();
    
    attackTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        attackTypeSelect.appendChild(option);
    });
    
    // Configuration des écouteurs d'événements pour les filtres
    document.getElementById('applyFilters').addEventListener('click', filterData);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Configuration du changement de thème
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// Réinitialiser tous les filtres
function resetFilters() {
    document.getElementById('timeRangeFilter').value = 'all';
    document.getElementById('attackTypeFilter').value = 'all';
    document.getElementById('severityFilter').value = 'all';
    
    filteredData = [...globalData];
    updateKPIs(filteredData);
    
    // Mettre à jour le graphique actuel
    if (currentChart) {
        renderGraph(currentChart.name, currentChart.render);
    }
}

// Exportation des données filtrées
function exportData() {
    const exportData = filteredData.map(d => ({
        Date: d.Timestamp,
        Source: d['Source IP Address'],
        Destination: d['Destination IP Address'],
        AttackType: d['Attack Type'],
        Severity: d['Severity Level'],
        Action: d['Action Taken']
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + Object.keys(exportData[0]).join(",") + "\n"
        + exportData.map(row => 
            Object.values(row).map(val => `"${val}"`).join(",")
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cybersecurity_data_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Basculer entre thème clair et sombre
function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('.theme-toggle i');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    }
    
    // Mettre à jour le graphique actuel pour appliquer le nouveau thème
    if (currentChart) {
        renderGraph(currentChart.name, currentChart.render);
    }
}

// Appliquer le thème sauvegardé
function applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const icon = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        body.classList.remove('light-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Fonction principale d'initialisation
async function init() {
    showLoader(true);
    
    try {
        // Chargement des données
        const response = await d3.csv('./data/cybersecurityattacks.csv');
        if (!response || response.length === 0) {
            throw new Error('Impossible de charger les données CSV');
        }
        
        globalData = response;
        filteredData = [...globalData];
        
        // Initialisation des composants de l'UI
        initFilters(globalData);
        updateKPIs(globalData);
        
        // Chargement des modules de graphiques
        graphModules = await loadGraphModules();
        createMenu(graphModules);
        
        // Rendre le premier graphique par défaut
        const firstModule = Object.keys(graphModules)[0];
        if (firstModule) {
            document.querySelector(`#menu a[data-module="${firstModule}"]`).classList.add('active');
            renderGraph(firstModule, graphModules[firstModule]);
        }
        
        // Appliquer le thème sauvegardé
        applyTheme();
        
        // Initialiser la timeline (toujours visible)
        if (graphModules.timelineChart) {
            const timelineSvg = d3.select('#timelineChart svg');
            graphModules.timelineChart(timelineSvg, globalData);
        }
        
        // Initialiser la carte géographique
        if (graphModules.geoMapChart) {
            const mapSvg = d3.select('#geoMapChart svg');
            graphModules.geoMapChart(mapSvg, globalData);
        }
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        const svg = d3.select('#visualization svg');
        displayError(svg, `Erreur d'initialisation: ${error.message}`);
    }
    
    showLoader(false);
}

// Lancer l'initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', init);
