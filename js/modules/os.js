import { db, addDoc, updateDoc, deleteDoc, doc, collection } from '../config.js';
import { state, setItensAtuaisOS } from '../state.js';
import { showToast, limparValor, gerarDocumento } from '../ui.js';

export function initOSModule() {
    const form = document.getElementById('formOS');
    if (!form) return;

    // Prevent accidental form submission when pressing Enter inside item fields
    const itemInputs = ['os-medida', 'os-qtd', 'os-preco-item'];
    itemInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addItemOS();
                }
            });
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (state.itensAtuaisOS.length === 0) {
            showToast('Adicione pelo menos um item ou pneu na lista da OS.', 'error');
            return;
        }

        const inputVal = document.getElementById('os-cliente').value.trim();
        const clienteEncontrado = state.clientes.find(c => {
            const nomeCompleto = `${c.nome || ''} - ${c.doc || ''}`;
            const nomeSimples = (c.nome || '').toLowerCase();
            const buscaSimples = inputVal.toLowerCase().split(' - ')[0];
            return nomeCompleto === inputVal || nomeSimples === buscaSimples;
        });

        if (!clienteEncontrado) {
            showToast('Cliente não encontrado! Cadastre-o primeiro na aba Clientes.', 'error');
            return; 
        }

        const precoTotal = limparValor(document.getElementById('os-preco').value);
        const printType = form.dataset.printType || 'saveonly';
        const idVisual = Math.floor(1000 + Math.random() * 9000);

        const novaOS = {
            id: idVisual, 
            cliente: clienteEncontrado.nome,
            doc: clienteEncontrado.doc || '',
            ie: clienteEncontrado.ie || 'Isento',
            endereco: clienteEncontrado.endereco || '',
            fone: clienteEncontrado.fone || '',
            placa: clienteEncontrado.placa || '',
            marca: document.getElementById('os-marca').value.trim(),
            itens: [...state.itensAtuaisOS],
            preco: precoTotal,
            status: document.getElementById('os-status').value,
            data: new Date().toLocaleDateString('pt-BR'),
            createdAt: Date.now() 
        };

        try {
            await addDoc(collection(db, 'os'), novaOS);

            // Automatically record revenue entry in financial history
            const finEntry = { 
                createdAt: Date.now(), 
                data: novaOS.data, 
                desc: `OS #${novaOS.id} - ${novaOS.cliente}`, 
                val: novaOS.preco, 
                tipo: 'in' 
            };
            await addDoc(collection(db, 'financeiro'), finEntry);

            if (printType !== 'saveonly') {
                gerarDocumento(novaOS, printType);
            } else {
                showToast(`OS #${novaOS.id} Salva com Sucesso!`, 'success');
            }

            form.reset();
            setItensAtuaisOS([]);
            renderItensOS();

        } catch (err) {
            console.error('Erro ao salvar OS:', err);
            showToast('Erro ao salvar Ordem de Serviço. Tente novamente.', 'error');
        }
    });
}

export function addItemOS() {
    const medidaInput = document.getElementById('os-medida');
    const qtdInput = document.getElementById('os-qtd');
    const precoInput = document.getElementById('os-preco-item');

    const medida = (medidaInput.value || '').trim();
    const qtd = parseInt(qtdInput.value) || 1;
    const precoItem = limparValor(precoInput.value);

    if (!medida) {
        showToast('Informe o modelo, medida ou produto.', 'error');
        medidaInput.focus();
        return;
    }

    if (isNaN(qtd) || qtd <= 0) {
        showToast('Informe uma quantidade válida.', 'error');
        qtdInput.focus();
        return;
    }

    const novosItens = [...state.itensAtuaisOS, { medida, qtd, preco: precoItem }];
    setItensAtuaisOS(novosItens);
    renderItensOS();
    
    // Reset item inputs
    medidaInput.value = '';
    qtdInput.value = '1';
    precoInput.value = '';
    medidaInput.focus();
}

export function removeItemOS(index) {
    const novosItens = [...state.itensAtuaisOS];
    novosItens.splice(index, 1);
    setItensAtuaisOS(novosItens);
    renderItensOS();
}

export function renderItensOS() {
    const container = document.getElementById('lista-itens-selecionados');
    if (!container) return;

    if (state.itensAtuaisOS.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">Nenhum item adicionado ainda. Preencha os campos acima e clique em "+ Adicionar Item".</div>`;
        const inputTotal = document.getElementById('os-preco');
        if (inputTotal) inputTotal.value = '0,00';
        return;
    }

    let totalGeral = 0;
    
    container.innerHTML = state.itensAtuaisOS.map((it, idx) => {
        const subtotal = it.qtd * it.preco;
        totalGeral += subtotal;
        return `
            <div class="item-row-os">
                <div class="item-info-os">
                    <b>${it.medida}</b>
                    <span>Qtd: ${it.qtd} &bull; Unit: R$ ${it.preco.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <b style="color:var(--gold-400); font-size:0.95rem;">R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</b>
                    <button type="button" class="btn-del-item" onclick="window.removeItemOS(${idx})" title="Remover item">
                        <i class="material-icons" style="font-size:18px;">delete</i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const inputTotal = document.getElementById('os-preco');
    if (inputTotal) {
        inputTotal.value = totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    }
}

export function renderOS() {
    const tbody = document.getElementById('lista-prod');
    if (!tbody) return;

    if (state.os.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">Nenhuma Ordem de Serviço na fila de produção.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.os.map(os => {
        const itens = os.itens || [{ medida: os.medida || 'Pneu', qtd: os.qtd || 1 }];
        const qtdTotal = itens.reduce((acc, i) => acc + parseInt(i.qtd || 0), 0);
        const descItens = itens.map(i => `${i.qtd}x ${i.medida}`).join('<br>');

        let badgeStatus = 'badge-gold';
        if (os.status === 'Pronto') badgeStatus = 'badge-success';
        if (os.status === 'Na Raspagem') badgeStatus = 'badge-info';

        return `
            <tr>
                <td>
                    <span style="font-size:1.1rem; font-weight:900; color:var(--gold-400);">#${os.id}</span>
                </td>
                <td>
                    <span style="font-weight:700;">${qtdTotal}</span> un
                </td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">
                    ${descItens}
                </td>
                <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${os.cliente}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${os.doc || ''}</div>
                </td>
                <td>
                    <span class="badge ${badgeStatus}">${os.status}</span>
                </td>
                <td>
                    <div style="display:inline-flex; align-items:center; gap:6px;">
                        <button class="action-btn" title="Imprimir A4" onclick="window.reimprimir('${os.firebaseId}', 'a4')">
                            <i class="material-icons" style="font-size:18px;">print</i>
                        </button>
                        <button class="action-btn" title="Imprimir Recibo Térmico (80mm)" onclick="window.reimprimir('${os.firebaseId}', 'recibo')">
                            <i class="material-icons" style="font-size:18px;">receipt</i>
                        </button>
                        <button class="action-btn btn-del" title="Excluir OS" onclick="window.deletarItemOS('${os.firebaseId}')">
                            <i class="material-icons" style="font-size:18px;">delete</i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.addItemOS = addItemOS;
window.removeItemOS = removeItemOS;

window.reimprimir = function(firebaseId, tipo) {
    const os = state.os.find(x => x.firebaseId === firebaseId);
    if (os) gerarDocumento(os, tipo);
};

window.deletarItemOS = async function(firebaseId) {
    if (confirm('Deseja excluir esta Ordem de Serviço?')) {
        try {
            await deleteDoc(doc(db, 'os', firebaseId));
            showToast('OS removida.', 'info');
        } catch (e) {
            showToast('Erro ao excluir OS.', 'error');
        }
    }
};
