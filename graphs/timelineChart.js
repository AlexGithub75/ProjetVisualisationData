// Graphique de timeline pour visualiser les attaques au fil du temps
export default function renderTimelineChart(svg, data) {
    // Dimensions avec marges pour les axes
    const width = +svg.attr('width') || 1000;
    const height = +svg.attr('height') || 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Groupe principal avec transformation pour respecter les marges
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Conversion des dates en objets Date
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formattedData = data.map(d => ({
        ...d,
        date: parseDate(d.Timestamp)
    })).filter(d => d.date !== null);

    // Grouper les données par jour et type d'attaque
    const aggregatedData = Array.from(
        d3.rollup(
            formattedData,
            v => v.length,
            d => d3.timeDay(d.date),
            d => d['Attack Type']
        ),
        ([date, attackTypes]) => ({
            date,
            ...Object.fromEntries(attackTypes)
        })
    ).sort((a, b) => a.date - b.date);

    // Récupérer tous les types d'attaques uniques
    const attackTypes = [...new Set(formattedData.map(d => d['Attack Type']))];

    // Échelle pour l'axe X (temps)
    const x = d3.scaleTime()
        .domain(d3.extent(formattedData, d => d.date))
        .range([0, innerWidth]);

    // Échelle pour l'axe Y (nombre d'attaques)
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => {
            return d3.sum(attackTypes, type => d[type] || 0);
        })])
        .nice()
        .range([innerHeight, 0]);

    // Générateur d'aires empilées
    const stack = d3.stack()
        .keys(attackTypes)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(aggregatedData);

    // Échelle de couleurs
    const color = d3.scaleOrdinal()
        .domain(attackTypes)
        .range(d3.schemeCategory10);

    // Générateur d'aire
    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    // Création des groupes pour chaque type d'attaque
    const attackGroup = g.selectAll('.attack-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'attack-group')
        .attr('fill', d => color(d.key));

    // Ajout des aires
    attackGroup.append('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('opacity', 0.7)
        .attr('stroke', '#262940')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            // Highlight on hover
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1);

            // Tooltip
            const [mouseX, mouseY] = d3.pointer(event);
            const date = x.invert(mouseX);
            const xDate = d3.timeDay(date);
            
            // Trouver les données pour cette date
            const dataForDate = aggregatedData.find(item => 
                +item.date === +xDate
            );
            
            let tooltipContent = `<strong>Date: ${xDate.toLocaleDateString()}</strong><br>`;
            if (dataForDate) {
                tooltipContent += `<strong>${d.key}:</strong> ${dataForDate[d.key] || 0} attaques<br>`;
                tooltipContent += `<hr style="margin: 5px 0">`;
                tooltipContent += `<strong>Total:</strong> ${d3.sum(attackTypes, type => dataForDate[type] || 0)} attaques`;
            } else {
                tooltipContent += `Pas de données disponibles`;
            }
            
            d3.select('#tooltip')
                .style('opacity', 0.9)
                .html(tooltipContent)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.7);
                
            d3.select('#tooltip')
                .style('opacity', 0);
        });

    // Ligne de référence pour aujourd'hui
    const today = new Date();
    if (today >= x.domain()[0] && today <= x.domain()[1]) {
        g.append('line')
            .attr('x1', x(today))
            .attr('x2', x(today))
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');
            
        g.append('text')
            .attr('x', x(today))
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ff6b6b')
            .text("Aujourd'hui");
    }

    // Axe X
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x)
            .ticks(Math.min(width/100, 10))
            .tickFormat(d3.timeFormat("%d/%m/%Y")))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('dy', '0.7em')
        .attr('dx', '-0.8em')
        .attr('fill', '#b3b3b3');
        
    // Axe Y
    g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .attr('fill', '#b3b3b3');

    // Titre du graphique
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Évolution des cyberattaques dans le temps');

    // Légende
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - margin.right - 200}, ${margin.top})`);

    attackTypes.forEach((type, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
            
        legendRow.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color(type))
            .attr('opacity', 0.7);
            
        legendRow.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#e0e0e0')
            .text(type);
    });

    // Label pour l'axe Y
    g.append('text')
        .attr('class', 'axis-title')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -innerHeight / 2);
}
