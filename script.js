const scriptURL = 'https://script.google.com/macros/s/AKfycbxCvGVNK5xCDCGOs3xY4XRXUdbW0rzdIN3bp1PNOtGlHfHTTD3gaMT0Is03n69Lo7z0lg/exec';
let performanceChart = null; // Global variable to manage chart instance

// 1. Data Sync Logic (index.html)
const entryForm = document.getElementById('octalSyncForm');
if(entryForm) {
    entryForm.addEventListener('submit', e => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.innerText = "Syncing...";
        btn.disabled = true;

        const data = {
            date: document.getElementById('date').value,
            topic: document.getElementById('topic').value,
            task: document.getElementById('task').value,
            remark: document.getElementById('remark').value,
            whatsapp: document.getElementById('whatsapp').value,
            address: document.getElementById('address').value,
            name: document.getElementById('name').value
        };

        fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
        .then(() => {
            alert("Data Synced Successfully!");
            location.reload();
        });
    });
}

// 2. Performance Report Logic (analytics.html)
async function generateVisualReport() {
    const name = document.getElementById('searchName').value;
    if (!name) return alert("Please select a name!");

    const btn = document.getElementById('searchBtn');
    btn.innerText = "Analysing...";
    
    try {
        const res = await fetch(scriptURL);
        const allData = await res.json();
        
        // Filter data for the specific member
        const memberData = allData.filter(item => item.name === name);
        const totalTeamEntries = allData.length;

        if (memberData.length === 0) {
            alert("No records found for " + name);
            btn.innerText = "Generate Report";
            return;
        }

        // --- CALCULATION LOGIC ---
        // Find the first submission date to calculate performance over time
        const firstEntryDate = new Date(Math.min(...memberData.map(item => new Date(item.date))));
        const today = new Date();
        const diffTime = Math.abs(today - firstEntryDate);
        const totalDaysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 

        // Identify completed vs due tasks
        const completed = memberData.filter(i => 
            !i.taskdetails.toLowerCase().includes('due') && 
            !i.remark.toLowerCase().includes('due')
        ).length;

        const individualScore = Math.min(Math.round((completed / totalDaysElapsed) * 100), 100);
        const teamContribution = Math.round((memberData.length / totalTeamEntries) * 100);
        const due = memberData.length - completed;
        const lastEntry = memberData[memberData.length - 1];

        // --- CHART DATA PROCESSING ---
        const dateCounts = {};
        memberData.forEach(entry => {
            const d = new Date(entry.date).toLocaleDateString();
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        });
        const labels = Object.keys(dateCounts);
        const counts = Object.values(dateCounts);

        // --- UI UPDATES ---
        document.getElementById('dispName').innerText = name;
        document.getElementById('dispDate').innerText = "Last Submission: " + new Date(lastEntry.date).toLocaleDateString();
        document.getElementById('statDone').innerText = completed;
        document.getElementById('statDue').innerText = due;
        document.getElementById('statDays').innerText = totalDaysElapsed;
        
        document.getElementById('indivPerc').innerText = individualScore + "%";
        document.getElementById('indivBar').style.width = individualScore + "%";
        
        document.getElementById('overallPerc').innerText = teamContribution + "%";
        document.getElementById('overallBar').style.width = teamContribution + "%";

        renderChart(labels, counts);

        document.getElementById('reportContainer').style.display = 'block';
        btn.innerText = "Generate Report";
        
    } catch (error) {
        console.error(error);
        alert("Error fetching data!");
        btn.innerText = "Generate Report";
    }
}

function renderChart(labels, data) {
    const ctx = document.getElementById('taskChart').getContext('2d');
    if (performanceChart) performanceChart.destroy();

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Submitted',
                data: data,
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                x: { ticks: { color: '#8b949e' }, grid: { display: false } }
            }
        }
    });
}