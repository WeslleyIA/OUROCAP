import { db, addDoc, deleteDoc, doc, collection } from '../config.js';
import { state } from '../state.js';
import { showToast } from '../ui.js';

export function initClientsModule() {
    const form = document.getElementById('formCliente');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const radioPf = document.querySelector('input[name="tipoPessoa"][value="PF"]');
        const tipoPessoa = radioPf && radioPf.checked ? 'PF' : 'PJ';
        
        const novoCliente = {
            tipo: tipoPessoa,
            nome: document.getElementById('cli-nome').value.trim(),
            doc: document.getElementById('cli-doc').value.trim(),
            ie: document.getElementById('cli-ie').value.trim() || 'Isento',
            fone: document.getElementById('cli-fone').value.trim(),
            email: document.getElementById('cli-email').value.trim() || '',
            placa: document.getElementById('cli-placa').value.trim() || '',
            cep: document.getElementById('cli-cep').value.trim() || '',
            endereco: `${document.getElementById('cli-rua').value.trim()}, ${document.getElementById('cli-num').value.trim()} - ${document.getElementById('cli-bairro').value.trim()}, ${document.getElementById('cli-cidade').value.trim()}`,
            createdAt: Date.now()
        };

        try {
            await addDoc(collection(db, 'clientes'), novoCliente);
            showToast(`Cliente ${novoCliente.nome} salvo com sucesso!`, 'success');
            form.reset();
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
            showToast('Erro ao salvar cliente. Verifique a conexão.', 'error');
        }
    });
}

export function renderClientes() {
    const tbody = document.getElementById('lista-clientes');
    if (!tbody) return;

    if (state.clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:24px;">Nenhum cliente cadastrado ainda.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.clientes.map(cli => `
        <tr>
            <td>
                <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${cli.nome}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${cli.email || (cli.placa ? 'Placa: ' + cli.placa : '')}</div>
            </td>
            <td><span class="badge badge-gold">${cli.doc || '---'}</span></td>
            <td><span style="color:var(--text-secondary);">${cli.ie || 'Isento'}</span></td>
            <td><span style="color:var(--text-secondary);">${cli.cidade || (cli.endereco ? cli.endereco.split('-')[1] || cli.endereco : '---')}</span></td>
            <td>
                <button class="action-btn btn-del" title="Excluir Cliente" onclick="window.deletarCliente('${cli.id}')">
                    <i class="material-icons" style="font-size:18px;">delete</i>
                </button>
            </td>
        </tr>
    `).join('');
}

export function updateClientSuggestions() {
    const dataList = document.getElementById('lista-clientes-sugestao');
    if (!dataList) return;
    dataList.innerHTML = state.clientes.map(c => `<option value="${c.nome} - ${c.doc}">`).join('');
}

window.deletarCliente = async function(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            await deleteDoc(doc(db, 'clientes', id));
            showToast('Cliente removido.', 'info');
        } catch (e) {
            showToast('Erro ao excluir cliente.', 'error');
        }
    }
};
