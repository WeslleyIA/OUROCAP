import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Exact production configuration of OUROCAP
const firebaseConfig = {
    apiKey: "AIzaSyADFrQH__itlLVX4s3svENktUurejWpD-g",
    authDomain: "ourocap-f96a9.firebaseapp.com",
    projectId: "ourocap-f96a9",
    storageBucket: "ourocap-f96a9.firebasestorage.app",
    messagingSenderId: "736888471312",
    appId: "1:736888471312:web:f197f2cf7d6df224ddef95",
    measurementId: "G-3JWK1H79LC"
};

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let auth, db;
let _addDoc, _onSnapshot, _deleteDoc, _doc, _updateDoc, _collection, _query, _orderBy, _limit, _onAuthStateChanged, _signInWithEmailAndPassword, _signOut;

if (isDev) {
    // Isolated Local Storage Mock Engine for safe local development & design review
    const mockStorage = {
        get: (col) => {
            const raw = localStorage.getItem('mock_' + col);
            if (!raw || raw === '[]') {
                if (col === 'os') {
                    const sample = [
                        { id: 1042, cliente: 'Transportadora Silva', marca: 'Vipal', itens: [{ medida: '295/80R22.5', qtd: 4, preco: 450 }], preco: 1800, status: 'Pronto', data: '28/09/2026', createdAt: Date.now() - 3600000, firebaseId: 'mock_os_1' },
                        { id: 1041, cliente: 'Auto Posto Alvorada', marca: 'Maggion', itens: [{ medida: '110/90-17 Broz', qtd: 2, preco: 180 }], preco: 360, status: 'Na Raspagem', data: '28/09/2026', createdAt: Date.now() - 7200000, firebaseId: 'mock_os_2' }
                    ];
                    localStorage.setItem('mock_os', JSON.stringify(sample));
                    return sample;
                }
                if (col === 'financeiro') {
                    const sample = [
                        { desc: 'OS #1042 - Transportadora Silva', val: 1800, tipo: 'in', data: '28/09/2026', createdAt: Date.now() - 3600000, firebaseId: 'mock_fin_1' },
                        { desc: 'Matéria-Prima Borracha Vipal', val: 420, tipo: 'out', data: '27/09/2026', createdAt: Date.now() - 86400000, firebaseId: 'mock_fin_2' },
                        { desc: 'OS #1041 - Auto Posto Alvorada', val: 360, tipo: 'in', data: '28/09/2026', createdAt: Date.now() - 7200000, firebaseId: 'mock_fin_3' }
                    ];
                    localStorage.setItem('mock_financeiro', JSON.stringify(sample));
                    return sample;
                }
                if (col === 'estoque') {
                    const sample = [
                        { id: 'mock_stk_1', nome: 'Banda de Rodagem VT100', qtd: 14, min: 4 },
                        { id: 'mock_stk_2', nome: 'Pneu Broz 110/90-17', qtd: 8, min: 3 },
                        { id: 'mock_stk_3', nome: 'Cola Vulcanizante 5L', qtd: 2, min: 3 }
                    ];
                    localStorage.setItem('mock_estoque', JSON.stringify(sample));
                    return sample;
                }
                if (col === 'clientes') {
                    const sample = [
                        { id: 'mock_cli_1', nome: 'Transportadora Silva', doc: '12.345.678/0001-90', fone: '(11) 98765-4321', endereco: 'Av. Brasil, 1500 - Centro, SP' },
                        { id: 'mock_cli_2', nome: 'Auto Posto Alvorada', doc: '98.765.432/0001-10', fone: '(11) 91234-5678', endereco: 'Rod. Anhanguera, km 45 - Jundiaí/SP' }
                    ];
                    localStorage.setItem('mock_clientes', JSON.stringify(sample));
                    return sample;
                }
                return [];
            }
            return JSON.parse(raw);
        },
        save: (col, data) => localStorage.setItem('mock_' + col, JSON.stringify(data)),
        listeners: {}
    };

    const notify = (col) => {
        if (mockStorage.listeners[col]) {
            const data = mockStorage.get(col);
            mockStorage.listeners[col].forEach(cb => cb({ 
                docs: data.map(d => ({ 
                    id: d.firebaseId || d.id, 
                    data: () => d 
                })) 
            }));
        }
    };

    _collection = (d, name) => name;
    _doc = (d, col, id) => ({ col, id });
    _query = (col) => col;
    _orderBy = () => {};
    _limit = () => {};

    _addDoc = async (col, data) => {
        const items = mockStorage.get(col);
        const newItem = { ...data, firebaseId: 'mock_' + Date.now(), id: data.id || ('mock_' + Date.now()) };
        items.push(newItem);
        mockStorage.save(col, items);
        notify(col);
        return newItem;
    };

    _onSnapshot = (col, cb) => {
        if (!mockStorage.listeners[col]) mockStorage.listeners[col] = [];
        mockStorage.listeners[col].push(cb);
        notify(col);
        return () => { 
            mockStorage.listeners[col] = mockStorage.listeners[col].filter(l => l !== cb); 
        };
    };

    _updateDoc = async (docRef, data) => {
        const items = mockStorage.get(docRef.col);
        const idx = items.findIndex(i => (i.firebaseId || i.id) === docRef.id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...data };
            mockStorage.save(docRef.col, items);
            notify(docRef.col);
        }
    };

    _deleteDoc = async (docRef) => {
        const items = mockStorage.get(docRef.col);
        const newItems = items.filter(i => (i.firebaseId || i.id) !== docRef.id);
        mockStorage.save(docRef.col, newItems);
        notify(docRef.col);
    };

    _onAuthStateChanged = (a, cb) => {
        const user = JSON.parse(localStorage.getItem('mock_user') || '{"email":"admin@ourocap.com","uid":"dev-user"}');
        setTimeout(() => cb(user), 150);
    };

    _signInWithEmailAndPassword = async (a, email) => {
        const user = { email: email || 'admin@ourocap.com', uid: 'dev-user-ourocap' };
        localStorage.setItem('mock_user', JSON.stringify(user));
        location.reload();
    };

    _signOut = async () => {
        localStorage.removeItem('mock_user');
        location.reload();
    };

    db = {};
    auth = {};
} else {
    // REAL PRODUCTION FIREBASE
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    _addDoc = addDoc; 
    _onSnapshot = onSnapshot; 
    _deleteDoc = deleteDoc; 
    _doc = doc;
    _updateDoc = updateDoc; 
    _collection = collection; 
    _query = query;
    _orderBy = orderBy; 
    _limit = limit; 
    _onAuthStateChanged = onAuthStateChanged;
    _signInWithEmailAndPassword = signInWithEmailAndPassword; 
    _signOut = signOut;
}

export {
    isDev,
    auth,
    db,
    _addDoc as addDoc,
    _updateDoc as updateDoc,
    _deleteDoc as deleteDoc,
    _doc as doc,
    _collection as collection,
    _query as query,
    _orderBy as orderBy,
    _limit as limit,
    _onSnapshot as onSnapshot,
    _onAuthStateChanged as onAuthStateChanged,
    _signInWithEmailAndPassword as signInWithEmailAndPassword,
    _signOut as signOut
};
