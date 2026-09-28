import { db, addDoc, updateDoc, deleteDoc, doc, collection } from '../config.js';
import { state } from '../state.js';
import { showToast } from '../ui.js';

export function initStockModule() {
    const form = document.getElementById('formStock');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const itemInput = document.getElementById('st-item');
        const qtdInput = document.getElementById('st-qtd');
        const minInput = document.getElementById('st-min');
        
        const itemNome = (itemInput.value || '').trim();
        const qtdAdicionar = parseInt(qtdInput.value) || 0;
        const minAlerta = parseInt(minInput.value) || 5;

        if (!itemNome) {
            showToast('Informe o nome ou medida do produto.', 'error');
            return;
        }

        // Safe search protecting against null or undefined property names in older records
        const existe = state.estoque.find(x => {
            const nomeGravado = (x.nome || x.item || '').toLowerCase().trim();
            return nomeGravado === itemNome.toLowerCase();
        });

        try {
            if (existe) {
                const novaQtd = (parseInt(existe.qtd) || 0) + qtdAdicionar;
                const docRef = doc(db, 'estoque', existe.id);
                await updateDoc(docRef, { qtd: novaQtd });
                showToast(`Quantidade de "${itemNome}" atualizada para ${novaQtd}!`, 'success');
            } else {
                const novoItem = {
                    nome: itemNome,
                    qtd: qtdAdicionar,
                    min: minAlerta,
                    createdAt: Date.now()
                };
                await addDoc(collection(db, 'estoque'), novoItem);
                showToast(`Produto "${itemNome}" cadastrado com sucesso!`, 'success');
            }
            form.reset();
            if (minInput) minInput.value = '5';
            updateStockSuggestions();
        } catch (err) {
            console.error('Erro ao salvar no estoque:', err);
            showToast('Erro ao salvar produto no estoque.', 'error');
        }
    });
}

export function renderStock() {
    const tbody = document.getElementById('lista-estoque');
    if (!tbody) return;

    if (state.estoque.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:24px;">Nenhum produto cadastrado no estoque.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.estoque.map(item => {
        const nome = item.nome || item.item || 'Item sem nome';
        const qtd = typeof item.qtd === 'number' ? item.qtd : parseInt(item.qtd) || 0;
        const min = typeof item.min === 'number' ? item.min : parseInt(item.min) || 5;
        const isBaixo = qtd <= min;

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${nome}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Mínimo recomendado: ${min} un</div>
                </td>
                <td>
                    <span style="font-size:1.1rem; font-weight:800; color:${isBaixo ? 'var(--danger)' : 'var(--text-primary)'}">
                        ${qtd} <span style="font-size:0.8rem; font-weight:500; color:var(--text-muted);">un</span>
                    </span>
                </td>
                <td>
                    <div style="display:inline-flex; align-items:center; gap:6px;">
                        <button type="button" class="stepper-btn" onclick="window.alterarEstoque('${item.id}', ${qtd}, -1)" title="Diminuir 1 un">-</button>
                        <button type="button" class="stepper-btn" onclick="window.alterarEstoque('${item.id}', ${qtd}, 1)" title="Aumentar 1 un">+</button>
                    </div>
                </td>
                <td>
                    <span class="badge ${isBaixo ? 'badge-danger' : 'badge-success'}">
                        ${isBaixo ? 'Estoque Baixo' : 'Em Estoque'}
                    </span>
                </td>
                <td>
                    <button class="action-btn btn-del" title="Excluir do Estoque" onclick="window.deletarEstoque('${item.id}')">
                        <i class="material-icons" style="font-size:18px;">delete</i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    updateStockSuggestions();
}

export function updateStockSuggestions() {
    const datalist = document.getElementById('lista-produtos-sugestao');
    if (!datalist) return;
    
    // Default common tire measures plus whatever products are in stock
    const defaultPneus = [
        "Pneu Broz traseiro 110/90-17",
        "Pneu Broz dianteiro 90/90-19",
        "Pneu Titan traseiro 90/90-18",
        "Pneu Titan dianteiro 2.75-18",
        "Pneu Biz traseiro 80/100-14",
        "Pneu Biz dianteiro 2.50-17"
    ];
    
    const stockItems = state.estoque.map(x => x.nome || x.item).filter(Boolean);
    const allOptions = Array.from(new Set([...stockItems, ...defaultPneus]));
    
    datalist.innerHTML = allOptions.map(p => `<option value="${p}">`).join('');
}

window.alterarEstoque = async function(docId, qtdAtual, delta) {
    const novaQtd = qtdAtual + delta;
    if (novaQtd < 0) {
        showToast('Quantidade não pode ser negativa.', 'error');
        return;
    }
    try {
        const docRef = doc(db, 'estoque', docId);
        await updateDoc(docRef, { qtd: novaQtd });
    } catch (e) {
        console.error(e);
        showToast('Erro ao atualizar quantidade.', 'error');
    }
};

window.deletarEstoque = async function(docId) {
    if (confirm('Deseja excluir este item do estoque?')) {
        try {
            await deleteDoc(doc(db, 'estoque', docId));
            showToast('Produto removido do estoque.', 'info');
        } catch (e) {
            showToast('Erro ao excluir item.', 'error');
        }
    }
};
