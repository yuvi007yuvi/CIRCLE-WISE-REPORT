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
    const reportContainer = document.getElementById('reportContainer');
    reportContainer.innerHTML = ''; // Clear previous content

    let circleNumber = 1;
    for (const circleName in processedData) {
        const circleHeading = document.createElement('h1');
        circleHeading.textContent = `Circle ${circleNumber}: ${circleName}`;
        reportContainer.appendChild(circleHeading);
        circleNumber++;

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

        for (const zone in processedData[circleName]) {
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                const percentage = rowData.total > 0 ? ((rowData.covered / rowData.total) * 100).toFixed(2) : 0;

                const tr = document.createElement('tr');
                const tdZone = document.createElement('td');
                tdZone.textContent = zone;
                tr.appendChild(tdZone);

                const tdWard = document.createElement('td');
                tdWard.textContent = ward;
                tr.appendChild(tdWard);

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

                circleTbody.appendChild(tr);
            }
        }
        circleTable.appendChild(circleTbody);
        reportContainer.appendChild(circleTable);

        // Calculate and display summary for the current circle
        let circleTotalSum = 0;
        let circleCoveredSum = 0;

        for (const zone in processedData[circleName]) {
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                circleTotalSum += rowData.total;
                circleCoveredSum += rowData.covered;
            }
        }


    }

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

    // Render overall summary table
    const overallSummaryTable = document.createElement('table');
    overallSummaryTable.classList.add('overall-summary-table');

    const overallThead = document.createElement('thead');
    const overallHeaderRow = document.createElement('tr');
    ['Circle', 'Total Households', 'Covered Households', 'Percentage(%)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        overallHeaderRow.appendChild(th);
    });
    overallThead.appendChild(overallHeaderRow);
    overallSummaryTable.appendChild(overallThead);

    const overallTbody = document.createElement('tbody');
    for (const circleName in processedData) {
        let circleTotalSum = 0;
        let circleCoveredSum = 0;
        for (const zone in processedData[circleName]) {
            for (const ward in processedData[circleName][zone]) {
                const rowData = processedData[circleName][zone][ward];
                circleTotalSum += rowData.total;
                circleCoveredSum += rowData.covered;
            }
        }
        const tr = document.createElement('tr');
        const tdCircle = document.createElement('td');
        tdCircle.textContent = circleName;
        tr.appendChild(tdCircle);
        const tdTotal = document.createElement('td');
        tdTotal.textContent = circleTotalSum;
        tr.appendChild(tdTotal);
        const tdCovered = document.createElement('td');
        tdCovered.textContent = circleCoveredSum;
        tr.appendChild(tdCovered);

        const tdPercentage = document.createElement('td');
        const circlePercentage = circleTotalSum > 0 ? ((circleCoveredSum / circleTotalSum) * 100).toFixed(2) : 0;
        tdPercentage.textContent = circlePercentage + '%';
        tr.appendChild(tdPercentage);

        overallTbody.appendChild(tr);
    }

    // Add overall totals row
    const totalRow = document.createElement('tr');
    totalRow.classList.add('total-row');
    const totalLabel = document.createElement('td');
    totalLabel.textContent = 'Overall Total';
    totalLabel.colSpan = 1; // Span across Circle column
    totalRow.appendChild(totalLabel);
    const totalSumCell = document.createElement('td');
    totalSumCell.textContent = overallTotalSum;
    totalRow.appendChild(totalSumCell);
    const coveredSumCell = document.createElement('td');
    coveredSumCell.textContent = overallCoveredSum;
    totalRow.appendChild(coveredSumCell);

    const overallPercentageCell = document.createElement('td');
    const overallPercentage = overallTotalSum > 0 ? ((overallCoveredSum / overallTotalSum) * 100).toFixed(2) : 0;
    overallPercentageCell.textContent = overallPercentage + '%';
    totalRow.appendChild(overallPercentageCell);

    overallTbody.appendChild(totalRow);

    overallSummaryTable.appendChild(overallTbody);
    reportContainer.prepend(overallSummaryTable);

    // Add a heading for the overall summary
    const overallSummaryHeading = document.createElement('h2');
    overallSummaryHeading.textContent = 'Overall Circle Summary';
    reportContainer.prepend(overallSummaryHeading);




}



document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFileInput');
    const loadCsvButton = document.getElementById('loadCsvButton');
    const reportContainer = document.getElementById('report-container');

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

    loadCsvButton.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const csvText = e.target.result;
                    const parsedData = parseCsv(csvText);
                    const processedData = groupDataByCircle(parsedData, circle1Wards, circle2Wards, circle3Wards, circle4Wards, circle5Wards, circle6Wards);
                    renderReport(processedData, 'report-container');
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
});
