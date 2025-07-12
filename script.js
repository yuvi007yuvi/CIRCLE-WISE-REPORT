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

// Function to group data by circle, zone, and ward
function groupDataByCircle(data, circle1Wards, circle2Wards, circle3Wards, circle4Wards, circle5Wards, circle6Wards) {
    const circleData = {};
    data.forEach(row => {
        const zone = row['Zone'];
        const ward = row['Ward'];
        const total = parseInt(row['Total']) || 0;
        const covered = parseInt(row['Covered']) || 0;
        const notCovered = parseInt(row['Not Covered']) || 0;

        let circleName = 'Other Circles';
        if (circle1Wards.includes(ward)) {
            circleName = 'Aniket';
        } else if (circle2Wards.includes(ward)) {
            circleName = 'Abhinav';
        } else if (circle3Wards.includes(ward)) {
            circleName = 'Bharat';
        } else if (circle4Wards.includes(ward)) {
            circleName = 'Nishant';
        } else if (circle5Wards.includes(ward)) {
            circleName = 'Rahul';
        } else if (circle6Wards.includes(ward)) {
            circleName = 'Ranveer';
        }

        if (!circleData[circleName]) {
            circleData[circleName] = {};
        }
        if (!circleData[circleName][zone]) {
            circleData[circleName][zone] = {};
        }
        if (!circleData[circleName][zone][ward]) {
            circleData[circleName][zone][ward] = { total: 0, covered: 0, notCovered: 0 };
        }

        circleData[circleName][zone][ward].total += total;
        circleData[circleName][zone][ward].covered += covered;
        circleData[circleName][zone][ward].notCovered += notCovered;
    });
    return circleData;
}

// Function to render the report
function renderReport(processedData, containerId) {
    console.log('Starting to render circle report...');
    console.time('Total render time');
    
    const reportContainer = document.getElementById('reportContainer');
    
    // Clear previous content
    console.time('Clear containers');
    reportContainer.innerHTML = '';
    console.timeEnd('Clear containers');

    // Prepare data for tables
    const circleDataArray = [];
    
    // First pass: calculate all data without DOM manipulation
    let circleNumber = 1;
    for (const circleName in processedData) {
        let circleTotalSum = 0;
        let circleCoveredSum = 0;
        let circleNotCoveredSum = 0;
        const circleZoneWardData = [];

        for (const zone in processedData[circleName]) {
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                circleTotalSum += rowData.total;
                circleCoveredSum += rowData.covered;
                circleNotCoveredSum += rowData.notCovered;
                
                // Store the data for later use
                const percentage = rowData.total > 0 ? ((rowData.covered / rowData.total) * 100).toFixed(2) : 0;
                circleZoneWardData.push({
                    zone,
                    ward,
                    total: rowData.total,
                    covered: rowData.covered,
                    notCovered: rowData.notCovered,
                    percentage
                });
            }
        }
        
        // Store circle data
        circleDataArray.push({
            circleName,
            circleNumber,
            circleTotalSum,
            circleCoveredSum,
            circleNotCoveredSum,
            zoneWardData: circleZoneWardData
        });
        
        circleNumber++;
    }
    
    // Create and append all tables at once
    console.time('Create all tables');
    const tablesFragment = document.createDocumentFragment();
    
    circleDataArray.forEach(circleData => {
        const { circleName, circleNumber, zoneWardData } = circleData;
        
        // Create a section for each circle
        const circleSection = document.createElement('div');
        circleSection.classList.add('circle-section');
        
        // Create the circle heading
        const circleHeading = document.createElement('h1');
        circleHeading.textContent = `Circle ${circleNumber}: ${circleName}`;
        circleSection.appendChild(circleHeading);
        
        // Create visual circle with circle name in center
        const circleVisual = document.createElement('div');
        circleVisual.classList.add('circle-visual');
        circleVisual.textContent = circleName;
        circleSection.appendChild(circleVisual);
        
        // Create the data table
        const circleTable = document.createElement('table');
        const circleThead = document.createElement('thead');
        const circleTbody = document.createElement('tbody');

        const circleHeaderRow = document.createElement('tr');
        ['Zone', 'Ward', 'Total', 'Covered', 'Not Covered', 'Percentage(%)'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            circleHeaderRow.appendChild(th);
        });
        circleThead.appendChild(circleHeaderRow);
        circleTable.appendChild(circleThead);

        // Create all rows at once using innerHTML for better performance
        let tbodyHTML = '';
        zoneWardData.forEach(data => {
            tbodyHTML += `
                <tr>
                    <td>${data.zone}</td>
                    <td>${data.ward}</td>
                    <td>${data.total}</td>
                    <td>${data.covered}</td>
                    <td>${data.notCovered}</td>
                    <td>${data.percentage}%</td>
                </tr>
            `;
        });
        circleTbody.innerHTML = tbodyHTML;
        
        circleTable.appendChild(circleTbody);
        circleSection.appendChild(circleTable);
        
        // Append the entire circle section to the fragment
        tablesFragment.appendChild(circleSection);
    });
    
    // Append all tables at once
    reportContainer.appendChild(tablesFragment);
    console.timeEnd('Create all tables');

    // Calculate overall summary
    let overallTotalSum = 0;
    let overallCoveredSum = 0;

    for (const circleName in processedData) {
        for (const zone in processedData[circleName]) {
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                overallTotalSum += rowData.total;
                overallCoveredSum += rowData.covered;
            }
        }
    }

    // Create overall summary table
    console.time('Create summary table');
    
    // Prepare summary data
    const summaryData = [];
    
    // Reset the overall totals to calculate them from the circle data
    overallTotalSum = 0;
    overallCoveredSum = 0;
    
    for (const circleName in processedData) {
        let circleTotalSum = 0;
        let circleCoveredSum = 0;
        let circleWardCount = 0;
        
        for (const zone in processedData[circleName]) {
            circleWardCount += Object.keys(processedData[circleName][zone]).length;
            
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                circleTotalSum += rowData.total;
                circleCoveredSum += rowData.covered;
            }
        }
        
        overallTotalSum += circleTotalSum;
        overallCoveredSum += circleCoveredSum;
        
        const circlePercentage = circleTotalSum > 0 ? ((circleCoveredSum / circleTotalSum) * 100).toFixed(2) : 0;
        
        summaryData.push({
            circleName,
            circleWardCount,
            circleTotalSum,
            circleCoveredSum,
            circlePercentage
        });
    }
    
    // Create the summary table using innerHTML for better performance
    const overallSummaryTable = document.createElement('table');
    overallSummaryTable.classList.add('overall-summary-table');
    
    // Create header
    const headerHTML = `
        <thead>
            <tr>
                <th>Circle</th>
                <th>Total Wards</th>
                <th>Total Households</th>
                <th>Covered Households</th>
                <th>Percentage(%)</th>
            </tr>
        </thead>
    `;
    
    // Create body rows
    let bodyHTML = '<tbody>';
    
    summaryData.forEach(data => {
        bodyHTML += `
            <tr>
                <td>${data.circleName}</td>
                <td>${data.circleWardCount}</td>
                <td>${data.circleTotalSum}</td>
                <td>${data.circleCoveredSum}</td>
                <td>${data.circlePercentage}%</td>
            </tr>
        `;
    });
    
    // Add overall totals row
    const overallPercentage = overallTotalSum > 0 ? ((overallCoveredSum / overallTotalSum) * 100).toFixed(2) : 0;
    
    bodyHTML += `
        <tr class="total-row">
            <td colspan="2">Overall Total</td>
            <td>${overallTotalSum}</td>
            <td>${overallCoveredSum}</td>
            <td>${overallPercentage}%</td>
        </tr>
    `;
    
    bodyHTML += '</tbody>';
    
    // Set the table HTML
    overallSummaryTable.innerHTML = headerHTML + bodyHTML;
    // Use document fragment for batch DOM operations
    const summaryFragment = document.createDocumentFragment();
    summaryFragment.appendChild(overallSummaryTable);

    // Add a heading for the overall summary
    const overallSummaryHeading = document.createElement('h2');
    overallSummaryHeading.textContent = 'Overall Circle Summary';
    summaryFragment.appendChild(overallSummaryHeading);
    
    // Append all summary elements at once
    reportContainer.prepend(summaryFragment);
    
    console.timeEnd('Total render time');
    console.log('Finished rendering circle report.');
}



// Function to detect forced reflows
function detectForcedReflows() {
    // List of properties that trigger layout recalculation when accessed
    const layoutProperties = [
        'offsetHeight', 'offsetWidth', 'offsetLeft', 'offsetTop',
        'clientHeight', 'clientWidth', 'clientLeft', 'clientTop',
        'scrollHeight', 'scrollWidth', 'scrollLeft', 'scrollTop',
        'getBoundingClientRect', 'getClientRects'
    ];
    
    // Store original methods
    const originalGetters = {};
    const originalMethods = {};
    
    // Override property getters
    layoutProperties.forEach(prop => {
        if (prop === 'getBoundingClientRect' || prop === 'getClientRects') {
            // These are methods
            const originalMethod = Element.prototype[prop];
            originalMethods[prop] = originalMethod;
            
            Element.prototype[prop] = function() {
                console.warn(`Forced reflow detected: ${prop} called on ${this.tagName}`, new Error().stack);
                return originalMethod.apply(this, arguments);
            };
        } else {
            // These are properties
            const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, prop);
            if (descriptor && descriptor.get) {
                originalGetters[prop] = descriptor.get;
                
                Object.defineProperty(Element.prototype, prop, {
                    get: function() {
                        console.warn(`Forced reflow detected: ${prop} accessed on ${this.tagName}`, new Error().stack);
                        return originalGetters[prop].call(this);
                    },
                    configurable: true
                });
            }
        }
    });
    
    console.log('Forced reflow detection installed');
}

// Call the detection function after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to let other scripts initialize
    setTimeout(detectForcedReflows, 1000);
});

// Override scroll methods to detect programmatic scrolling
(function() {
    // Store original methods
    const originalScrollTo = window.scrollTo;
    const originalScrollBy = window.scrollBy;
    const originalElementScrollIntoView = Element.prototype.scrollIntoView;
    
    // Override window.scrollTo
    window.scrollTo = function() {
        console.log('window.scrollTo called with args:', Array.from(arguments));
        console.trace('scrollTo call stack');
        return originalScrollTo.apply(this, arguments);
    };
    
    // Override window.scrollBy
    window.scrollBy = function() {
        console.log('window.scrollBy called with args:', Array.from(arguments));
        console.trace('scrollBy call stack');
        return originalScrollBy.apply(this, arguments);
    };
    
    // Override element.scrollIntoView
    Element.prototype.scrollIntoView = function() {
        console.log('Element.scrollIntoView called on:', this);
        console.log('with args:', Array.from(arguments));
        console.trace('scrollIntoView call stack');
        return originalElementScrollIntoView.apply(this, arguments);
    };
    
    console.log('Scroll method monitoring installed');
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Add scroll event listener to detect when scrolling occurs
    window.addEventListener('scroll', function() {
        console.log('Page scrolled', {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            timestamp: new Date().toISOString()
        });
    });
    
    // Monitor focus events
    document.addEventListener('focusin', function(e) {
        console.log('Element received focus:', {
            element: e.target.tagName,
            id: e.target.id,
            class: e.target.className,
            timestamp: new Date().toISOString()
        });
    });
    
    // Monitor animation and transition events
    ['animationstart', 'animationend', 'transitionstart', 'transitionend'].forEach(function(eventType) {
        document.addEventListener(eventType, function(e) {
            console.log(`${eventType} event detected:`, {
                element: e.target.tagName,
                id: e.target.id,
                class: e.target.className,
                propertyName: e.propertyName,
                timestamp: new Date().toISOString()
            });
        });
    });
    
    const csvFileInput = document.getElementById('csvFileInput');
    const loadCsvButton = document.getElementById('loadCsvButton');
    const reportContainer = document.getElementById('reportContainer');
    
    // Define circle wards first before using them
    const circle1Wards = [
        '09-Gandhi Nagar',
        '34-Radhaniwas',
        '50-Patharpura',
        '51-Gaushala Nagar',
        '62-Mathura Darwaza',
        '66-Keshighat',
        '70-Biharipur'
    ];

    const circle2Wards = [
        '08-Atas',
        '13-Sunrakh',
        '21-Chaitanya Bihar',
        '25-Chharaura',
        '67-Kemar Van',
        '69-Ratan Chhatri'
    ];

    const circle3Wards = [
        '01-Birjapur',
        '03-Girdharpur',
        '11-Tarsi',
        '15-Maholi First',
        '16-Bakalpur',
        '20-Krishna Nagar First',
        '30-Krishna Nagar Second',
        '31-Navneet Nagar',
        '33-Palikhera',
        '37-Baldevpuri',
        '44-Radhika Bihar',
        '47-Dwarkapuri',
        '48-Satoha Asangpur',
        '54-Pratap Nagar',
        '59-Maholi Second',
        '68-Shanti Nagar'
    ];

    const circle4Wards = [
        '06-Aduki',
        '10-Aurangabad First',
        '23-Aheer Pada',
        '27-Baad',
        '28-Aurangabad Second',
        '29-Koyla Alipur',
        '32-Ranchibagar',
        '38-Civil lines',
        '41-Dhaulipiau',
        '52-Chandrapuri',
        '57-Balajipuram',
        '63-Maliyaan Sadar'
    ];

    const circle5Wards = [
        '02-Ambedkar Nagar',
        '04-Ishapur Yamunapar',
        '05-Bharatpur Gate',
        '07-Lohvan',
        '14-Lakshmi Nagar Yamunapar',
        '18-General ganj',
        '19-Ramnagar Yamunapar',
        '26-Naya Nagla',
        '35-Bankhandi',
        '49-Daimpiriyal Nagar',
        '53-Krishna puri',
        '61-Chaubia para',
        '64-Ghati Bahalray',
        '65-Holi Gali'
    ];

    const circle6Wards = [
        '12-Radhe Shyam Colony',
        '17-Bairaagpura',
        '22-Badhri Nagar',
        '24-Sarai Azamabad',
        '36-Jaisingh Pura',
        '39-Mahavidhya Colony',
        '40-Rajkumar',
        '42-Manoharpur',
        '43-Ganeshra',
        '45-Birla Mandir',
        '46-Radha Nagar',
        '55-Govind Nagar',
        '56-Mandi Randas',
        '58-Gau Ghat',
        '60-Jagannath Puri'
    ];

    // Add debugging to see if the CSV file exists
    console.log('Attempting to load CSV file...');
    
    // Auto-load CSV file for testing - use encodeURI to handle spaces in filename
    fetch(encodeURI('Vehicle & Route Wise House Holds Coverage Summary  (98).csv'))
        .then(response => {
            console.log('CSV fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log('CSV file loaded successfully, length:', csvText.length);
            console.log('First 100 characters:', csvText.substring(0, 100));
            try {
                console.time('Data processing');
                const parsedData = parseCsv(csvText);
                console.log('CSV parsed successfully, rows:', parsedData.length);
                const processedData = groupDataByCircle(parsedData, circle1Wards, circle2Wards, circle3Wards, circle4Wards, circle5Wards, circle6Wards);
                console.timeEnd('Data processing');
                
                // Use requestAnimationFrame to separate data processing from rendering
                requestAnimationFrame(() => {
                    renderReport(processedData, 'reportContainer');
                    console.log('CSV data processed and report rendered for circle report.');
                });
            } catch (error) {
                console.error('Error processing CSV:', error);
                console.error('Error stack:', error.stack);
                reportContainer.textContent = 'Failed to process CSV file: ' + error.message;
            }
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
            console.error('Error stack:', error.stack);
            reportContainer.textContent = 'Failed to load CSV file: ' + error.message;
        });

    // Circle wards definitions moved above

    loadCsvButton.addEventListener('click', () => {
        console.log('Load CSV button clicked');
        const file = csvFileInput.files[0];
        if (file) {
            console.log('File selected:', file.name);
            const reader = new FileReader();
            reader.onload = async (e) => {
                console.log('File loaded, processing data...');
                try {
                    console.time('Data processing');
                    const csvText = e.target.result;
                    const parsedData = parseCsv(csvText);
                    const processedData = groupDataByCircle(parsedData, circle1Wards, circle2Wards, circle3Wards, circle4Wards, circle5Wards, circle6Wards);
                    console.timeEnd('Data processing');
                    
                    // Use requestAnimationFrame to separate data processing from rendering
                    requestAnimationFrame(() => {
                        renderReport(processedData, 'reportContainer');
                        console.log('CSV data processed and report rendered for circle report.');
                    });
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    reportContainer.textContent = 'Failed to process CSV file.';
                }
            };
            reader.onerror = () => {
                console.error('Error reading file:', reader.error);
                reportContainer.textContent = 'Failed to read file.';
            };
            reader.readAsText(file);
        } else {
            reportContainer.textContent = 'Please select a CSV file to upload.';
        }
    });

    // Print functionality
    const printButton = document.getElementById('printButton');
    const printOptions = document.getElementById('printOptions');
    const printAll = document.getElementById('printAll');
    const printSummary = document.getElementById('printSummary');

    // Toggle print options panel
    printButton.addEventListener('click', () => {
        printOptions.classList.toggle('show');
    });

    // Print all circles
    printAll.addEventListener('click', () => {
        printOptions.classList.remove('show');
        
        // Add a class to the report container for print-specific styling
        reportContainer.classList.add('printing-all');
        
        // Set the print date
        document.getElementById('printDate').textContent = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
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
        console.log('Printing all circles report');
        
        // Use setTimeout to allow the browser to apply the class before printing
        setTimeout(() => {
            window.print();
            // Remove the class after printing
            reportContainer.classList.remove('printing-all');
        }, 100);
    });

    // Print summary only
    printSummary.addEventListener('click', () => {
        printOptions.classList.remove('show');
        
        // Store the original HTML
        const originalHTML = reportContainer.innerHTML;
        
        // Find the summary table
        const summaryTable = reportContainer.querySelector('.overall-summary-table');
        const summaryHeading = reportContainer.querySelector('h2');
        
        if (summaryTable && summaryHeading) {
            // Set the print date
            document.getElementById('printDate').textContent = new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            // Create a temporary div to hold just the summary
            const tempDiv = document.createElement('div');
            
            // Include the print header
            const printHeader = document.querySelector('.print-header').cloneNode(true);
            printHeader.style.display = 'flex';
            
            // Make sure the logo is visible
            const logoContainer = printHeader.querySelector('.logo-container');
            if (logoContainer) {
                logoContainer.style.display = 'flex';
                const logoImg = logoContainer.querySelector('img');
                if (logoImg) {
                    logoImg.style.display = 'block';
                }
            }
            
            tempDiv.appendChild(printHeader);
            
            tempDiv.appendChild(summaryHeading.cloneNode(true));
            tempDiv.appendChild(summaryTable.cloneNode(true));
            
            // Replace the report container content with just the summary
            reportContainer.innerHTML = '';
            reportContainer.appendChild(tempDiv);
            
            // Log print action
            console.log('Printing summary only');
            
            // Print the summary
            setTimeout(() => {
                window.print();
                
                // Restore the original content after printing
                reportContainer.innerHTML = originalHTML;
            }, 100);
        } else {
            console.error('Summary table or heading not found');
            alert('Summary table not found. Please load data first.');
        }
    });

    // Close print options panel when clicking outside
    document.addEventListener('click', (event) => {
        if (!printButton.contains(event.target) && !printOptions.contains(event.target)) {
            printOptions.classList.remove('show');
        }
    });
});
