export default function renderViolinPlots(svg, data) {
    const width = +svg.attr('width') || 1000; 
    const height = +svg.attr('height') || 500;
    const margin = { top: 20, right: 40, bottom: 40, left: 40 };
    const chartWidth = (width - margin.left - margin.right) / 2 * 1.1; // Réduction de 50% par rapport à la version précédente
    const chartHeight = (height - margin.top - margin.bottom) / 2;

    const variables = [
        { key: 'Source Port', color: '#87CEEB', domain: [0, 70000], bandwidth: 2000 },
        { key: 'Destination Port', color: '#FA8072', domain: [0, 70000], bandwidth: 2000 },
        { key: 'Packet Length', color: '#32CD32', domain: [0, 1600], bandwidth: 100 },
        { key: 'Anomaly Scores', color: '#9370DB', domain: [0, 100], bandwidth: 5 }
    ];

    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(x => ({
                x: +x, 
                y: d3.mean(V, v => kernel(+x - (+v))) 
            }));
        };
    }

    function kernelEpanechnikov(k) {
        return function(v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

    const g = svg.selectAll('.subplot')
        .data(variables)
        .enter()
        .append('g')
        .attr('class', 'subplot')
        .attr('transform', (d, i) => `translate(${margin.left + (i % 2) * (chartWidth + margin.right)}, ${margin.top + Math.floor(i / 2) * (chartHeight + margin.bottom)})`);

    variables.forEach((varData, i) => {
        const values = data.map(d => +d[varData.key]).filter(v => !isNaN(v) && v !== null);
        if (values.length === 0) return;

        const xScale = d3.scaleLinear()
            .domain(varData.domain)
            .range([0, chartWidth * 1.1]); // Moins d'étirement

        const ticks = xScale.ticks(80);
        const kde = kernelDensityEstimator(kernelEpanechnikov(varData.bandwidth), ticks);
        let density = kde(values);

        const maxDensity = d3.max(density, d => d.y);
        density = density.map(d => ({ x: d.x, y: d.y / maxDensity * 80 }));

        const yScale = d3.scaleLinear()
            .domain([-80, 80])
            .range([chartHeight, 0]);

        const area = d3.area()
            .x(d => xScale(d.x))
            .y0(d => yScale(-d.y))
            .y1(d => yScale(d.y))
            .curve(d3.curveCatmullRom);

        g.filter((d, j) => j === i)
            .append('path')
            .datum(density)
            .attr('fill', varData.color)
            .attr('opacity', 0.7)
            .attr('d', area);

        const median = d3.median(values);
        g.filter((d, j) => j === i)
            .append('line')
            .attr('x1', xScale(median))
            .attr('x2', xScale(median))
            .attr('y1', yScale(-80))
            .attr('y2', yScale(80))
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        g.filter((d, j) => j === i)
            .append('g')
            .attr('transform', `translate(0,${chartHeight / 2})`)
            .call(d3.axisBottom(xScale));

        g.filter((d, j) => j === i)
            .append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(varData.key + ' Violin Plot');
    });

    svg.attr('height', height + margin.top + margin.bottom);
}
