export default function renderBarChart(svg, data) {
    // Dimensions de l'SVG avec valeurs par défaut
    const width = +svg.attr('width') || 600;
    const height = +svg.attr('height') || 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Filtrer et agréger les données
    const attackTypes = [...new Set(data.map(d => d['Attack Type']))].sort();
    const malwareIndicators = [...new Set(data.map(d => d['Malware Indicators'] === "" ? "No Detection" : d['Malware Indicators']))].sort();
    console.log('Malware Indicators:', malwareIndicators); // Débogage

    // Compter les occurrences pour chaque combinaison
    const counts = {};
    attackTypes.forEach(attack => {
        counts[attack] = {};
        malwareIndicators.forEach(indicator => {
            counts[attack][indicator] = data.filter(d => d['Attack Type'] === attack && (d['Malware Indicators'] === "" ? "No Detection" : d['Malware Indicators']) === indicator).length;
        });
    });

    // Préparer les données pour D3
    const barData = attackTypes.map(attack => ({
        attack,
        values: malwareIndicators.map(indicator => ({
            indicator,
            count: counts[attack][indicator]
        }))
    }));

    // Échelles
    const x0 = d3.scaleBand()
        .domain(attackTypes)
        .range([0, chartWidth])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(malwareIndicators)
        .range([0, x0.bandwidth()])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d3.max(d.values, v => v.count)) * 1.1]) // Ajouter un peu de marge
        .nice()
        .range([chartHeight, 0]);

    // Couleurs (No Detection = bleu, IoC Detected = orange)
    const color = d3.scaleOrdinal()
        .domain(['No Detection', 'IoC Detected']) // Ordre forcé
        .range(['#1E90FF', '#FFA500']); // Bleu pour No Detection, Orange pour IoC Detected

    // Groupe principal
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Dessiner les barres
    barData.forEach(d => {
        g.selectAll(`.bar-${d.attack}`)
            .data(d.values)
            .enter()
            .append('rect')
            .attr('class', `bar-${d.attack}`)
            .attr('x', group => x0(d.attack) + x1(group.indicator))
            .attr('y', group => y(group.count))
            .attr('width', x1.bandwidth())
            .attr('height', group => chartHeight - y(group.count))
            .attr('fill', group => color(group.indicator));
    });

    // Axe X (attaques)
    g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x0));

    // Axe Y (comptes)
    g.append('g')
        .call(d3.axisLeft(y));

    // Légende
    const legend = g.selectAll('.legend')
        .data(malwareIndicators)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${chartWidth - 100},${i * 20})`);

    legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', color);

    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .text(d => d);
}