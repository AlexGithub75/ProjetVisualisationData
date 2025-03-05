d3.csv('cybersecurity_attacks.csv').then(function(data) {
    console.log(data);

    const attackTypes = d3.nest()
        .key(d => d.attack_type)
        .rollup(v => v.length)
        .entries(data);

    const width = 800;
    const height = 400;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(attackTypes.map(d => d.key))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(attackTypes, d => d.value)])
        .nice()
        .range([height, 0]);

    svg.selectAll(".bar")
        .data(attackTypes)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", "#4CAF50");

    svg.append("g")
        .selectAll(".x-axis")
        .data([0])
        .enter()
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .selectAll(".y-axis")
        .data([0])
        .enter()
        .append("g")
        .call(d3.axisLeft(y));
    
    svg.selectAll(".x-axis text")
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .style("transform", "rotate(-45deg)");

    svg.selectAll(".y-axis text")
        .style("font-size", "12px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Nombre d'attaques par type");
});
