export default function renderDeviceOSBarChart(svg, data) {
    // Dimensions de l'SVG avec valeurs par défaut
    const width = +svg.attr('width') || 800;
    const height = +svg.attr('height') || 400;
    const margin = { top: 20, right: 20, bottom: 70, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Fonction pour extraire Device/OS à partir de Device Information (logique améliorée)
    function extractDeviceOS(deviceInfo) {
        if (!deviceInfo) return 'Unknown';
        const info = deviceInfo.toLowerCase().trim();
        if (info.includes('windows')) return 'Windows';
        if (info.includes('linux')) return 'Linux';
        if (info.includes('macintosh') || info.includes('mac')) return 'Macintosh';
        if (info.includes('ipod') || info.includes('i pod')) return 'iPod'; // Ajout de variations
        if (info.includes('iphone') || info.includes('i phone')) return 'iPhone'; // Ajout de variations
        if (info.includes('ipad') || info.includes('i pad')) return 'iPad'; // Ajout de variations
        if (info.includes('android')) return 'Android';
        return 'Unknown';
    }

    // Préparer la colonne Device/OS
    data.forEach(d => {
        d['Device/OS'] = extractDeviceOS(d['Device Information']);
    });

    // Agrégation des données par Device/OS
    const osCounts = d3.rollup(data, v => v.length, d => d['Device/OS']);
    const barData = Array.from(osCounts, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
    console.log('Bar Data:', barData); // Débogage

    if (barData.length === 0) {
        svg.append('text')
            .attr('x', 50)
            .attr('y', 50)
            .attr('fill', 'red')
            .text('Error: No data available for Device/OS.');
        return;
    }

    // Échelles
    const x = d3.scaleBand()
        .domain(barData.map(d => d.key))
        .range([0, chartWidth])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value) * 1.1]) // Ajouter un peu de marge
        .nice()
        .range([chartHeight, 0]);

    // Couleurs
    const color = d3.scaleOrdinal()
        .domain(barData.map(d => d.key))
        .range(['#1E90FF', '#FFA500', '#32CD32', '#FF4500', '#9370DB', '#8B4513', '#FF69B4']);

    // Groupe principal
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Dessin des barres
    g.selectAll('.bar')
        .data(barData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.key))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d.value))
        .attr('fill', d => color(d.key));

    // Axe X (Device/OS)
    g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em')
        .style('font-size', '12px');

    // Axe Y (count)
    g.append('g')
        .call(d3.axisLeft(y));

    // Ajout du titre
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Bar Chart of Device/OS');
}