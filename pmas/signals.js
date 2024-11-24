import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    where, 
    onSnapshot,
    Timestamp 
} from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    initializeSignalsPage();
});

function initializeSignalsPage() {
    const filters = {
        type: 'all',
        dateFrom: null,
        dateTo: null,
        status: 'all'
    };

    // Initialize filters
    setupFilterListeners(filters);

    // Initial signals load
    loadSignals(filters);
}

function setupFilterListeners(filters) {
    // Type filter
    document.getElementById('typeFilter').addEventListener('change', (e) => {
        filters.type = e.target.value;
        loadSignals(filters);
    });

    // Date filters
    document.getElementById('dateFrom').addEventListener('change', (e) => {
        filters.dateFrom = e.target.value ? new Date(e.target.value) : null;
        loadSignals(filters);
    });

    document.getElementById('dateTo').addEventListener('change', (e) => {
        filters.dateTo = e.target.value ? new Date(e.target.value) : null;
        loadSignals(filters);
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        filters.status = e.target.value;
        loadSignals(filters);
    });

    // Reset filters
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('statusFilter').value = 'all';
        
        Object.keys(filters).forEach(key => filters[key] = null);
        filters.type = 'all';
        filters.status = 'all';
        
        loadSignals(filters);
    });
}

function loadSignals(filters) {
    const tableBody = document.getElementById('signalsTableBody');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    
    // Build query
    let signalsQuery = query(collection(db, "signals"), orderBy("timestamp", "desc"));

    // Apply filters
    if (filters.type !== 'all') {
        signalsQuery = query(signalsQuery, where("type", "==", filters.type));
    }
    if (filters.status !== 'all') {
        signalsQuery = query(signalsQuery, where("status", "==", filters.status));
    }
    if (filters.dateFrom) {
        signalsQuery = query(signalsQuery, 
            where("timestamp", ">=", Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters.dateTo) {
        signalsQuery = query(signalsQuery, 
            where("timestamp", "<=", Timestamp.fromDate(filters.dateTo)));
    }

    // Real-time listener
    const unsubscribe = onSnapshot(signalsQuery, (snapshot) => {
        loadingSpinner.style.display = 'none';
        tableBody.innerHTML = '';

        snapshot.forEach((doc) => {
            const signal = doc.data();
            const row = createSignalRow(signal, doc.id);
            tableBody.appendChild(row);
        });

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        No signals found matching the current filters
                    </td>
                </tr>
            `;
        }
    });

    return unsubscribe;
}

function createSignalRow(signal, signalId) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', signalId);
    
    row.innerHTML = `
        <td>${formatTimestamp(signal.timestamp)}</td>
        <td>
            <span class="signal-type ${signal.type.toLowerCase()}">
                ${signal.type}
            </span>
        </td>
        <td>${signal.entry}</td>
        <td>${signal.stopLoss}</td>
        <td>${signal.takeProfits[0] || '-'}</td>
        <td>${signal.takeProfits[1] || '-'}</td>
        <td>${signal.takeProfits[2] || '-'}</td>
        <td>${signal.status}</td>
        <td>${formatResult(signal)}</td>
    `;

    return row;
}

function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleString();
}

function formatResult(signal) {
    if (signal.status !== 'completed') return '-';
    
    const result = signal.result || 0;
    const color = result >= 0 ? '#00ff00' : '#ff0000';
    const sign = result >= 0 ? '+' : '';
    
    return `<span style="color: ${color}">${sign}${result}%</span>`;
} 