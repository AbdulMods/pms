import { db, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    doc, 
    onSnapshot,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

document.addEventListener('DOMContentLoaded', () => {
    initializeExchangeForms();
    setupWalletCopy();
    setupTransactionTabs();
});

function initializeExchangeForms() {
    setupBuyForm();
    setupSellForm();
    setupRateCalculations();
    loadUserTransactions();
}

function setupBuyForm() {
    const buyForm = document.getElementById('buyRequestForm');
    if (!buyForm) return;

    buyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = buyForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                showNotification('Please login to submit a request', 'error');
                return;
            }

            const formData = {
                userId,
                type: 'buy',
                currency: buyForm.buyCurrency.value,
                amount: parseFloat(buyForm.buyAmount.value),
                walletAddress: buyForm.receivingWallet.value,
                timestamp: serverTimestamp(),
                status: 'pending'
            };

            // Upload payment proof
            const proofFile = buyForm.querySelector('input[type="file"]').files[0];
            if (proofFile) {
                const proofUrl = await uploadProof(proofFile, 'buy_proofs');
                formData.proofUrl = proofUrl;
            }

            // Save to Firebase
            await addDoc(collection(db, "exchange_requests"), formData);
            
            showNotification('Buy request submitted successfully!', 'success');
            buyForm.reset();
            
        } catch (error) {
            console.error("Error submitting buy request:", error);
            showNotification('Error submitting request. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function setupSellForm() {
    const sellForm = document.getElementById('sellRequestForm');
    if (!sellForm) return;

    sellForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = sellForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                showNotification('Please login to submit a request', 'error');
                return;
            }

            const formData = {
                userId,
                type: 'sell',
                currency: sellForm.sellCurrency.value,
                amount: parseFloat(sellForm.sellAmount.value),
                bankType: sellForm.bankType.value,
                accountNumber: sellForm.accountNumber.value,
                accountName: sellForm.accountName.value,
                timestamp: serverTimestamp(),
                status: 'pending'
            };

            // Upload transaction proof
            const proofFile = sellForm.querySelector('input[type="file"]').files[0];
            if (proofFile) {
                const proofUrl = await uploadProof(proofFile, 'sell_proofs');
                formData.proofUrl = proofUrl;
            }

            // Save to Firebase
            await addDoc(collection(db, "exchange_requests"), formData);
            
            showNotification('Sell request submitted successfully!', 'success');
            sellForm.reset();
            
        } catch (error) {
            console.error("Error submitting sell request:", error);
            showNotification('Error submitting request. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function setupRateCalculations() {
    // Buy rate calculation
    const buyAmount = document.getElementById('buyAmount');
    const totalPay = document.getElementById('totalPay');
    const buyCurrency = document.getElementById('buyCurrency');

    if (buyAmount && totalPay && buyCurrency) {
        [buyAmount, buyCurrency].forEach(element => {
            element.addEventListener('input', () => calculateBuyTotal());
        });
    }

    // Sell rate calculation
    const sellAmount = document.getElementById('sellAmount');
    const totalReceive = document.getElementById('totalReceive');
    const sellCurrency = document.getElementById('sellCurrency');

    if (sellAmount && totalReceive && sellCurrency) {
        [sellAmount, sellCurrency].forEach(element => {
            element.addEventListener('input', () => calculateSellTotal());
        });
    }
}

async function calculateBuyTotal() {
    const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
    const currency = document.getElementById('buyCurrency').value;
    
    // Get rate from Firebase
    const rateDoc = await doc(db, 'exchange_rates', `${currency}_PKR`);
    onSnapshot(rateDoc, (doc) => {
        if (doc.exists()) {
            const rate = doc.data().buyRate;
            const total = amount * rate;
            document.getElementById('totalPay').textContent = `${total.toFixed(2)} PKR`;
            document.getElementById('buyRate').textContent = `1 ${currency} = ${rate} PKR`;
        }
    });
}

async function calculateSellTotal() {
    const amount = parseFloat(document.getElementById('sellAmount').value) || 0;
    const currency = document.getElementById('sellCurrency').value;
    
    // Get rate from Firebase
    const rateDoc = await doc(db, 'exchange_rates', `PKR_${currency}`);
    onSnapshot(rateDoc, (doc) => {
        if (doc.exists()) {
            const rate = doc.data().sellRate;
            const total = amount * rate;
            document.getElementById('totalReceive').textContent = `${total.toFixed(2)} PKR`;
            document.getElementById('sellRate').textContent = `1 ${currency} = ${rate} PKR`;
        }
    });
}

async function uploadProof(file, folder) {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

function setupWalletCopy() {
    const copyBtns = document.querySelectorAll('.copy-btn');
    
    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.clipboardText;
            navigator.clipboard.writeText(text)
                .then(() => {
                    showNotification('Address copied to clipboard!', 'success');
                })
                .catch(() => {
                    showNotification('Failed to copy address', 'error');
                });
        });
    });
}

function setupTransactionTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.transaction-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}Form`).classList.add('active');
        });
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function loadUserTransactions() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const transactionsList = document.getElementById('userTransactions');
    
    // Query only user's transactions
    const userTransactionsQuery = query(
        collection(db, "exchange_requests"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
    );

    onSnapshot(userTransactionsQuery, (snapshot) => {
        transactionsList.innerHTML = '';
        snapshot.forEach((doc) => {
            const transaction = doc.data();
            transactionsList.insertAdjacentHTML('beforeend', createTransactionCard(transaction));
        });
    });
}

function createTransactionCard(transaction) {
    return `
        <div class="transaction-card ${transaction.status}">
            <div class="transaction-header">
                <span class="transaction-type">${transaction.type.toUpperCase()}</span>
                <span class="transaction-date">${formatTimestamp(transaction.timestamp)}</span>
            </div>
            <div class="transaction-details">
                <p>Amount: ${transaction.amount} ${transaction.currency}</p>
                <p>Status: <span class="status ${transaction.status}">${transaction.status}</span></p>
            </div>
        </div>
    `;
} 