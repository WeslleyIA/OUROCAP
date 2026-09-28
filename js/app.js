import { 
    auth, 
    db, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from './config.js';

import { 
    state, 
    subscribe, 
    setClientes, 
    setOS, 
    setEstoque, 
    setFinanceiro 
} from './state.js';

import { 
    showPage, 
    showToast, 
    mascaraMoeda, 
    mascaraFone, 
    mascaraCep, 
    mascaraDoc, 
    buscarCep 
} from './ui.js';

import { initClientsModule, renderClientes, updateClientSuggestions } from './modules/clients.js';
import { initStockModule, renderStock } from './modules/stock.js';
import { initOSModule, renderOS, renderItensOS } from './modules/os.js';
import { initFinanceModule, renderFinance } from './modules/finance.js';
import { updateDashboard } from './modules/dash.js';

// Expose necessary UI helpers globally for DOM event handlers
window.showPage = showPage;
window.mascaraMoeda = mascaraMoeda;
window.mascaraFone = mascaraFone;
window.mascaraCep = mascaraCep;
window.mascaraDoc = mascaraDoc;
window.buscarCep = buscarCep;
window.toggleDocMask = function() {
    const docInput = document.getElementById('cli-doc');
    if (docInput) docInput.value = '';
};

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize all feature modules
    initClientsModule();
    initStockModule();
    initOSModule();
    initFinanceModule();

    // 2. Subscribe renderers to state changes
    subscribe('clientes', () => {
        renderClientes();
        updateClientSuggestions();
    });

    subscribe('os', () => {
        renderOS();
        updateDashboard();
    });

    subscribe('estoque', () => {
        renderStock();
    });

    subscribe('financeiro', () => {
        renderFinance();
        updateDashboard();
    });

    // 3. Setup Login & Session handlers
    const loginScreen = document.getElementById('login-screen');
    const appLayout = document.getElementById('app-layout');
    const displayEmail = document.getElementById('display-email');
    const mobileUserEmail = document.getElementById('mobile-user-email');
    const loginError = document.getElementById('login-error');
    const formLogin = document.getElementById('formLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('l-email').value;
            const pass = document.getElementById('l-pass').value;
            const btn = document.getElementById('btn-entrar');
            
            btn.innerText = 'VERIFICANDO...';
            if (loginError) loginError.style.display = 'none';

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                btn.innerText = 'ENTRAR NO SISTEMA';
            } catch (err) {
                btn.innerText = 'ENTRAR NO SISTEMA';
                if (loginError) loginError.style.display = 'block';
                console.error('Erro de autenticação:', err);
            }
        });
    }

    const logoutBtns = document.querySelectorAll('.btn-logout-trigger');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Deseja realmente sair do sistema?')) {
                await signOut(auth);
            }
        });
    });

    // 4. Listen to Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (loginScreen) loginScreen.style.display = 'none';
            if (appLayout) appLayout.style.display = 'flex';
            if (displayEmail) displayEmail.innerText = user.email || 'Admin';
            if (mobileUserEmail) mobileUserEmail.innerText = (user.email || 'Admin').split('@')[0];
            iniciarSincronizacaoEmTempoReal();
            showPage('dash');
        } else {
            if (loginScreen) loginScreen.style.display = 'flex';
            if (appLayout) appLayout.style.display = 'none';
            if (displayEmail) displayEmail.innerText = '';
        }
    });
});

// Real-Time Synchronization with Firestore
function iniciarSincronizacaoEmTempoReal() {
    // 1. Clientes
    try {
        const qCli = query(collection(db, 'clientes'), orderBy('nome'));
        onSnapshot(qCli, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClientes(list);
        }, (err) => console.error('Erro ao sincronizar clientes:', err));
    } catch (e) {
        onSnapshot(collection(db, 'clientes'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClientes(list);
        });
    }

    // 2. Ordens de Serviço
    onSnapshot(collection(db, 'os'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        setOS(list);
    }, (err) => console.error('Erro ao sincronizar OS:', err));

    // 3. Estoque
    onSnapshot(collection(db, 'estoque'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEstoque(list);
    }, (err) => console.error('Erro ao sincronizar estoque:', err));

    // 4. Financeiro
    try {
        const qFin = query(collection(db, 'financeiro'), orderBy('createdAt', 'desc'), limit(50));
        onSnapshot(qFin, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
            setFinanceiro(list);
        }, (err) => console.error('Erro ao sincronizar financeiro:', err));
    } catch (e) {
        onSnapshot(collection(db, 'financeiro'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
            setFinanceiro(list);
        });
    }
}
