import { db, addDoc, deleteDoc, doc, collection } from '../config.js';
import { state } from '../state.js';
import { showToast, limparValor } from '../ui.js';

export function initFinanceModule() {
    const form = document.getElementById('formFin');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const valInput = document.getElementById('f-val');
        const descInput = document.getElementById('f-desc');
        const tipoInput = document.getElementById('f-tipo');

        const val = limparValor(valInput.value);
        if (isNaN(val) || val <= 0) {
            showToast('Informe um valor monetário válido maior que zero.', 'error');
            return;
        }

        const entry = {
            createdAt: Date.now(),
            data: new Date().toLocaleDateString('pt-BR'),
            desc: descInput.value.trim(), 
            val: val, 
            tipo: tipoInput.value
        };

        try {
            await addDoc(collection(db, 'financeiro'), entry);
            showToast('Lançamento registrado com sucesso!', 'success');
            form.reset();
            valInput.value = '';
        } catch (err) {
            console.error('Erro ao lançar movimentação:', err);
            showToast('Erro ao registrar lançamento financeiro.', 'error');
        }
    });
}

export function renderFinance() {
    const tbody = document.getElementById('lista-fin');
    if (!tbody) return;

    if (state.financeiro.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:24px;">Nenhuma movimentação financeira registrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.financeiro.map(f => {
        const valorSeguro = (typeof f.val === 'number' && !isNaN(f.val)) ? f.val : 0;
        const isIn = f.tipo === 'in';
        return `
            <tr>
                <td style="color:var(--text-muted); font-size:0.82rem;">${f.data || ''}</td>
                <td style="font-weight:600; color:var(--text-primary);">${f.desc || 'Sem descrição'}</td>
                <td class="${isIn ? 'val-in' : 'val-out'}">
                    ${isIn ? '+' : '-'} ${valorSeguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td>
                    <button class="action-btn btn-del" title="Excluir Lançamento" onclick="window.deletarLancamento('${f.firebaseId}')">
                        <i class="material-icons" style="font-size:18px;">delete</i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.deletarLancamento = async function(firebaseId) {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
        try {
            await deleteDoc(doc(db, 'financeiro', firebaseId));
            showToast('Lançamento excluído.', 'info');
        } catch (e) {
            showToast('Erro ao excluir lançamento.', 'error');
        }
    }
};
