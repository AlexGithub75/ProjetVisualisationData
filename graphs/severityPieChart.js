export default function renderSeverityPieChart(svg, data) {
    // Dimensions de l'SVG avec valeurs par défaut
    const width = +svg.attr('width') || 600;
    const height = +svg.attr('height') || 600;
    const radius = Math.min(width, height) / 2 - 40;

    // Agrégation des données par Severity Level
    const severityCounts = d3.rollup(data, v => v.length, d => d['Severity Level']);
    const pieData = Array.from(severityCounts, ([key, value]) => ({ key, value }));

    // Calcul des pourcentages
    const total = d3.sum(pieData, d => d.value);
    pieData.forEach(d => {
        d.percentage = ((d.value / total) * 100).toFixed(1) + '%';
    });

    // Générateur de camembert
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    // Générateur d'arcs
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Échelle de couleurs
    const color = d3.scaleOrdinal()
        .domain(pieData.map(d => d.key))
        .range(['#FFA500', '#1E90FF', '#32CD32']); // Orange pour High, Bleu pour Medium, Vert pour Low

    // Groupe principal centré
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    // Dessin des secteurs
    g.selectAll('.arc')
        .data(pie(pieData))
        .enter()
        .append('path')
        .attr('class', 'arc')
        .attr('d', arc)
        .attr('fill', d => color(d.data.key))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

    // Ajout des étiquettes avec pourcentages
    g.selectAll('.label')
        .data(pie(pieData))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(d => `${d.data.key}: ${d.data.percentage}`)
        .style('font-size', '14px')
        .style('fill', '#fff');

    // Ajout du titre
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Pie Chart of Severity Level');
}