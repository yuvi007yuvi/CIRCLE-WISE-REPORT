// Function to parse circle ward names from text
function parseCircleWardNames(text) {
    const circleWardMap = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let currentCircle = '';

    lines.forEach(line => {
        if (line.endsWith('Wards:')) {
            currentCircle = line.replace(' Wards:', '');
            circleWardMap[currentCircle] = [];
        } else if (line.startsWith('- ')) {
            const wardName = line.substring(2).trim();
            if (currentCircle) {
                circleWardMap[currentCircle].push(wardName);
            }
        }
    });
    return circleWardMap;
}

// Function to parse CSV text into an array of objects
function parseCsv(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1)
        .map(line => {
            const values = line.split(',');
            let row = {};
            headers.forEach((header, i) => {
                row[header] = values[i] ? values[i].trim() : '';
            });
            return row;
        })
        .filter(row => Object.values(row).some(val => val !== ''));
}

// Function to group data by vehicle
function groupDataByVehicle(data, circleWardMap) {
    const circleVehicleData = {};
    const routesWithoutVehicle = {};

    // Create a reverse map from ward to circle name for easier lookup
    const wardToCircleMap = {};
    for (const circleName in circleWardMap) {
        circleWardMap[circleName].forEach(ward => {
            wardToCircleMap[ward] = circleName;
        });
    }

    data.forEach(row => {
        const vehicleNo = row['Vehicle Number'];
        const ward = row['Ward'];
        const total = parseInt(row['Total']) || 0;
        const covered = parseInt(row['Covered']) || 0;
        const notCovered = parseInt(row['Not Covered']) || 0;

        const circleName = wardToCircleMap[ward] || 'Other Circles';

        if (!circleVehicleData[circleName]) {
            circleVehicleData[circleName] = {};
        }

        if (!circleVehicleData[circleName][vehicleNo]) {
            circleVehicleData[circleName][vehicleNo] = { total: 0, covered: 0, notCovered: 0, wards: new Set(), routeNames: new Set() };
        }

        circleVehicleData[circleName][vehicleNo].total += total;
        circleVehicleData[circleName][vehicleNo].covered += covered;
        circleVehicleData[circleName][vehicleNo].notCovered += notCovered;
        circleVehicleData[circleName][vehicleNo].wards.add(ward);
        circleVehicleData[circleName][vehicleNo].routeNames.add(row['Route Name']);

        if (!vehicleNo || vehicleNo.trim() === '') {
            if (!routesWithoutVehicle[circleName]) {
                routesWithoutVehicle[circleName] = [];
            }
            routesWithoutVehicle[circleName].push({ routeName: row['Route Name'], wardName: ward });
        }
    });
    return { circleVehicleData, routesWithoutVehicle };
}

// Function to render the vehicle report
function renderVehicleReport(circleVehicleData, routesWithoutVehicle) {
    const reportContainer = document.getElementById('reportContainer');
    reportContainer.innerHTML = ''; // Clear previous content

    // Get all unique circle names from both data sources
    const allCircleNames = new Set([
        ...Object.keys(circleVehicleData),
        ...Object.keys(routesWithoutVehicle)
    ]);

    // Create a document fragment to batch DOM operations
    const mainFragment = document.createDocumentFragment();
    
    allCircleNames.forEach(circleName => {
        const circleDiv = document.createElement('div');
        circleDiv.classList.add('circle-section'); // Add a class for styling if needed

        const circleHeading = document.createElement('h1');
        circleHeading.textContent = `Circle: ${circleName}`;
        circleDiv.appendChild(circleHeading);
        
        // Create visual circle with circle name in center
        const circleVisual = document.createElement('div');
        circleVisual.classList.add('circle-visual');
        circleVisual.textContent = circleName;
        circleDiv.appendChild(circleVisual);

        // Render vehicle data for the current circle
        if (circleVehicleData[circleName]) {
            const vehicleTable = document.createElement('table');
            const vehicleThead = document.createElement('thead');
            const vehicleTbody = document.createElement('tbody');

            const vehicleHeaderRow = document.createElement('tr');
            ['Vehicle No.', 'Total Households', 'Covered Households', 'Not Covered', 'Percentage(%)', 'Wards Covered', 'Route Name'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                vehicleHeaderRow.appendChild(th);
            });
            vehicleThead.appendChild(vehicleHeaderRow);
            vehicleTable.appendChild(vehicleThead);

            for (const vehicleNo in circleVehicleData[circleName]) {
                const rowData = circleVehicleData[circleName][vehicleNo];
                const percentage = rowData.total > 0 ? ((rowData.covered / rowData.total) * 100).toFixed(2) : 0;

                const tr = document.createElement('tr');
                const tdVehicleNo = document.createElement('td');
                tdVehicleNo.textContent = vehicleNo;
                tr.appendChild(tdVehicleNo);

                const tdTotal = document.createElement('td');
                tdTotal.textContent = rowData.total;
                tr.appendChild(tdTotal);

                const tdCovered = document.createElement('td');
                tdCovered.textContent = rowData.covered;
                tr.appendChild(tdCovered);

                const tdNotCovered = document.createElement('td');
                tdNotCovered.textContent = rowData.notCovered;
                tr.appendChild(tdNotCovered);

                const tdPercentage = document.createElement('td');
                tdPercentage.textContent = percentage + '%';
                tr.appendChild(tdPercentage);

                const tdWards = document.createElement('td');
                tdWards.textContent = Array.from(rowData.wards).join(', ');
                tr.appendChild(tdWards);

                const tdRouteNames = document.createElement('td');
                tdRouteNames.textContent = Array.from(rowData.routeNames).join(', ');
                tr.appendChild(tdRouteNames);

                vehicleTbody.appendChild(tr);
            }
            vehicleTable.appendChild(vehicleTbody);
            circleDiv.appendChild(vehicleTable);
        }

        // Render routes without vehicles for the current circle
        if (routesWithoutVehicle[circleName] && routesWithoutVehicle[circleName].length > 0) {
            const noVehicleCard = document.createElement('div');
            noVehicleCard.className = 'no-vehicle-card';

            const cardTitle = document.createElement('h3'); // Changed to h3 for sub-section
            cardTitle.textContent = `ABSENT VEHICLE ROUTE `;
            cardTitle.style.color = 'red';
            noVehicleCard.appendChild(cardTitle);

            const noVehicleTable = document.createElement('table');
            noVehicleTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Route Name</th>
                        <th>Ward Name</th>
                    </tr>
                </thead>
                <tbody>
                    ${routesWithoutVehicle[circleName].map(routeInfo => `
                        <tr style="color: red;">
                            <td>${routeInfo.routeName}</td>
                            <td>${routeInfo.wardName}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            noVehicleCard.appendChild(noVehicleTable);
            circleDiv.appendChild(noVehicleCard);
        }

        mainFragment.appendChild(circleDiv);
    });
    
    // Append all elements at once to minimize reflows
    reportContainer.appendChild(mainFragment);
}

// Function to set up print functionality
function setupPrintFunctionality() {
    const printButton = document.getElementById('printButton');
    const printOptions = document.getElementById('printOptions');
    const printAll = document.getElementById('printAll');
    const printByCircle = document.getElementById('printByCircle');
    const reportContainer = document.getElementById('reportContainer');

    if (!printButton || !printOptions || !printAll || !printByCircle) {
        console.error('Print elements not found in the DOM');
        return;
    }

    // Toggle print options panel
    printButton.addEventListener('click', () => {
        printOptions.classList.toggle('show');
    });

    // Print all circles
    printAll.addEventListener('click', () => {
        printOptions.classList.remove('show');
        
        // Set the print date
        const printDateElement = document.getElementById('printDate');
        if (printDateElement) {
            printDateElement.textContent = new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        
        // Add a class to the report container for print-specific styling
        reportContainer.classList.add('printing-all');
        
        // Make sure the logo is visible in the print header
        const printHeader = document.querySelector('.print-header');
        if (printHeader) {
            printHeader.style.display = 'flex';
            
            const logoContainer = printHeader.querySelector('.logo-container');
            if (logoContainer) {
                logoContainer.style.display = 'flex';
                
                const logoImg = logoContainer.querySelector('img');
                if (logoImg) {
                    logoImg.style.display = 'block';
                }
            }
        }
        
        // Log print action
        console.log('Printing all vehicle report');
        
        // Use setTimeout to allow the browser to apply the class before printing
        setTimeout(() => {
            window.print();
            // Remove the class after printing
            reportContainer.classList.remove('printing-all');
        }, 100);
    });

    // Print by circle
    printByCircle.addEventListener('click', () => {
        printOptions.classList.remove('show');
        
        // Check if there's data to print
        if (reportContainer.children.length === 0) {
            alert('Please load data first.');
            return;
        }
        
        // Create a dialog to select which circle to print
        const circleSections = reportContainer.querySelectorAll('.circle-section');
        if (circleSections.length === 0) {
            alert('No circle data found. Please load data first.');
            return;
        }
        
        // Create a simple modal for circle selection
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.maxWidth = '400px';
        modalContent.style.width = '100%';
        
        const modalHeader = document.createElement('h3');
        modalHeader.textContent = 'Select Circle to Print';
        modalHeader.style.marginTop = '0';
        
        const circleList = document.createElement('div');
        circleList.style.maxHeight = '300px';
        circleList.style.overflowY = 'auto';
        circleList.style.marginBottom = '15px';
        
        // Add each circle as an option
        circleSections.forEach((section, index) => {
            const circleName = section.querySelector('h1').textContent.replace('Circle: ', '');
            
            const circleOption = document.createElement('button');
            circleOption.textContent = circleName;
            circleOption.style.display = 'block';
            circleOption.style.width = '100%';
            circleOption.style.padding = '8px 12px';
            circleOption.style.marginBottom = '8px';
            circleOption.style.backgroundColor = '#f8f9fa';
            circleOption.style.border = '1px solid #dee2e6';
            circleOption.style.borderRadius = '4px';
            circleOption.style.textAlign = 'left';
            circleOption.style.cursor = 'pointer';
            
            circleOption.addEventListener('click', () => {
                // Remove the modal
                document.body.removeChild(modal);
                
                // Set the print date
                const printDateElement = document.getElementById('printDate');
                if (printDateElement) {
                    printDateElement.textContent = new Date().toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
                
                // Store the original HTML
                const originalHTML = reportContainer.innerHTML;
                
                // Create a temporary div with just the selected circle
                const tempDiv = document.createElement('div');
                
                // Include the print header
                const printHeader = document.querySelector('.print-header');
                if (printHeader) {
                    const clonedHeader = printHeader.cloneNode(true);
                    clonedHeader.style.display = 'flex';
                    
                    // Make sure the logo is visible
                    const logoContainer = clonedHeader.querySelector('.logo-container');
                    if (logoContainer) {
                        logoContainer.style.display = 'flex';
                        const logoImg = logoContainer.querySelector('img');
                        if (logoImg) {
                            logoImg.style.display = 'block';
                        }
                    }
                    
                    tempDiv.appendChild(clonedHeader);
                }
                
                tempDiv.appendChild(section.cloneNode(true));
                
                // Replace the report container content with just the selected circle
                reportContainer.innerHTML = '';
                reportContainer.appendChild(tempDiv);
                
                // Log print action
                console.log(`Printing vehicle report for circle: ${circleName}`);
                
                // Print the selected circle
                setTimeout(() => {
                    window.print();
                    
                    // Restore the original content after printing
                    reportContainer.innerHTML = originalHTML;
                }, 100);
            });
            
            circleList.appendChild(circleOption);
        });
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cancel';
        closeButton.style.display = 'block';
        closeButton.style.width = '100%';
        closeButton.style.padding = '10px';
        closeButton.style.backgroundColor = '#6c757d';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(circleList);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    });

    // Close print options panel when clicking outside
    document.addEventListener('click', (event) => {
        if (printButton && printOptions && !printButton.contains(event.target) && !printOptions.contains(event.target)) {
            printOptions.classList.remove('show');
        }
    });
}

// Add scroll event listener when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add scroll event listener to detect when scrolling occurs
    window.addEventListener('scroll', function() {});
    
    // Monitor focus events
    document.addEventListener('focusin', function(e) {
        console.log('Element received focus in vehicle page:', {
            element: e.target.tagName,
            id: e.target.id,
            class: e.target.className,
            timestamp: new Date().toISOString()
        });
    });
    
    // Set up print functionality
    setupPrintFunctionality();
});

document.getElementById('loadCsvButton').addEventListener('click', () => {
    console.log('Load CSV button clicked in vehicle report');
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('File selected in vehicle report:', file.name);
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log('File loaded in vehicle report, processing data...');
            console.time('Vehicle data processing');
            const csvText = e.target.result;
            const parsedData = parseCsv(csvText);
            fetch('circle_ward_names.txt')
                .then(response => response.text())
                .then(circleWardText => {
                    const circleWardMap = parseCircleWardNames(circleWardText);
                    const { circleVehicleData, routesWithoutVehicle } = groupDataByVehicle(parsedData, circleWardMap);
                    console.timeEnd('Vehicle data processing');
                    
                    // Use requestAnimationFrame to separate data processing from rendering
                    requestAnimationFrame(() => {
                        renderVehicleReport(circleVehicleData, routesWithoutVehicle);
                        console.log('CSV data processed and report rendered for vehicle report.');
                    });
                });
        };
        reader.readAsText(file);
    } else {
        alert('Please select a CSV file first.');
    }
});