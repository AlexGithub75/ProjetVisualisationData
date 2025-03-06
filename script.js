// Main script to dynamically load graph modules and handle menu interactions

// Function to dynamically load all JS files from the graphs folder with error handling
async function loadGraphModules() {
    const graphModules = {};
    const graphFiles = [
        'pieChart.js',
        'barChart.js',
        'severityPieChart.js',
        'actionTakenPieChart.js',
        'protocolPieChart.js',
        'deviceOsBarChart.js',
        'violinPlots.js'
    ];

    for (const file of graphFiles) {
        try {
            const module = await import(`./graphs/${file}`);
            const moduleName = file.replace('.js', '');
            graphModules[moduleName] = module.default; // Assume each module exports a default function
            console.log(`Successfully loaded ${file}`);
        } catch (error) {
            console.warn(`Failed to load ${file}:`, error.message);
            // Optionally notify the user via the UI
        }
    }
    return graphModules;
}

// Function to create the menu
function createMenu(graphModules) {
    const menu = document.getElementById('menu');
    const ul = document.createElement('ul');

    if (Object.keys(graphModules).length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No graphs available. Please check the graphs folder.';
        li.style.color = 'red';
        ul.appendChild(li);
    } else {
        Object.keys(graphModules).forEach((moduleName) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/([A-Z])/g, ' $1').trim();
            a.addEventListener('click', (e) => {
                e.preventDefault();
                renderGraph(moduleName, graphModules[moduleName]);
            });
            li.appendChild(a);
            ul.appendChild(li);
        });
    }

    menu.appendChild(ul);
}

// Function to render the selected graph with error handling
function renderGraph(moduleName, renderFunction) {
    const svg = d3.select('#visualization svg');
    svg.selectAll('*').remove(); // Clear previous visualization

    // Load the CSV data and handle potential errors
    d3.csv('./data/cybersecurityattacks.csv').then((data) => {
        if (!data || data.length === 0) {
            svg.append('text')
                .attr('x', 50)
                .attr('y', 50)
                .attr('fill', 'red')
                .text('Error: No data loaded from CSV file.');
            console.error('No data loaded from CSV');
            return;
        }
        try {
            renderFunction(svg, data); // Call the specific graph's render function
        } catch (error) {
            svg.append('text')
                .attr('x', 50)
                .attr('y', 50)
                .attr('fill', 'red')
                .text(`Error rendering ${moduleName}: ${error.message}`);
            console.error(`Error rendering ${moduleName}:`, error);
        }
    }).catch((error) => {
        svg.append('text')
            .attr('x', 50)
            .attr('y', 50)
            .attr('fill', 'red')
            .text(`Error loading CSV: ${error.message}`);
        console.error('Error loading CSV:', error);
    });
}

// Initialize the application
async function init() {
    const graphModules = await loadGraphModules();
    createMenu(graphModules);

    // Render the first graph by default if available (optional)
    const firstModule = Object.keys(graphModules)[0];
    if (firstModule) {
        renderGraph(firstModule, graphModules[firstModule]);
    } else {
        const svg = d3.select('#visualization svg');
        svg.append('text')
            .attr('x', 50)
            .attr('y', 50)
            .attr('fill', 'red')
            .text('Error: No graph modules found. Please add files to the graphs folder.');
    }
}

init();