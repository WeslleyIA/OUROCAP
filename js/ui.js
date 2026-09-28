// UI Utilities, Navigation and Input Masking

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    if (type === 'error') iconName = 'error';
    
    toast.innerHTML = `<i class="material-icons" style="font-size:1.1rem; color:var(--gold-400)">${iconName}</i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

const pageTitles = {
    dash: 'Dashboard',
    os: 'Nova Ordem de Serviço',
    prod: 'Fila de Produção',
    stock: 'Controle de Estoque & Produtos',
    clientes: 'Base de Clientes',
    fin: 'Financeiro & Movimentações'
};

export function showPage(id) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Deactivate all navigation items (desktop sidebar and mobile dock)
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
    
    const targetPage = document.getElementById(id);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Sync active state in desktop sidebar
    document.querySelectorAll(`.nav-item[data-page="${id}"]`).forEach(i => i.classList.add('active'));
    // Sync active state in mobile bottom dock
    document.querySelectorAll(`.dock-item[data-page="${id}"]`).forEach(i => i.classList.add('active'));
    
    // Update mobile top bar title if exists
    const titleEl = document.getElementById('mobile-current-page-title');
    if (titleEl && pageTitles[id]) {
        titleEl.innerText = pageTitles[id];
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Input Formatters & Masking
export function limparValor(valStr) {
    if (!valStr) return 0;
    if (typeof valStr === 'number') return valStr;
    const sanitized = valStr.toString().replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
}

export function mascaraMoeda(i) {
    let v = i.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    i.value = v;
}

export function mascaraFone(i) {
    let v = i.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    i.value = v.substring(0, 15);
}

export function mascaraCep(i) {
    let v = i.value.replace(/\D/g, '');
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    i.value = v.substring(0, 9);
}

export function mascaraDoc(i) {
    const radioPf = document.querySelector('input[name="tipoPessoa"][value="PF"]');
    const isPf = radioPf ? radioPf.checked : true;
    let v = i.value.replace(/\D/g, '');
    
    if (isPf) {
        v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        v = v.substring(0, 14);
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    i.value = v;
}

export async function buscarCep(cep) {
    const rawCep = (cep || '').replace(/\D/g, '');
    if (rawCep.length === 8) {
        try {
            const ruaEl = document.getElementById('cli-rua');
            const bairroEl = document.getElementById('cli-bairro');
            const cidEl = document.getElementById('cli-cidade');
            const numEl = document.getElementById('cli-num');
            
            if (ruaEl) ruaEl.value = 'Buscando...';
            const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
            const data = await res.json();
            
            if (!data.erro) {
                if (ruaEl) ruaEl.value = data.logradouro || '';
                if (bairroEl) bairroEl.value = data.bairro || '';
                if (cidEl) cidEl.value = `${data.localidade}/${data.uf}`;
                if (numEl) numEl.focus();
            } else {
                showToast('CEP não encontrado.', 'error');
                if (ruaEl) ruaEl.value = '';
            }
        } catch (e) {
            console.error(e);
            showToast('Erro ao consultar CEP.', 'error');
        }
    }
}

// Print Generator (Exact faithful support for A4 and 80mm receipts)
export function gerarDocumento(os, tipo) {
    document.getElementById('p-id').innerText = '#' + os.id;
    document.getElementById('p-data').innerText = os.data || '';
    document.getElementById('p-cliente').innerText = os.cliente || '';
    document.getElementById('p-doc').innerText = os.doc || '---'; 
    document.getElementById('p-ie').innerText = os.ie || 'Isento';
    document.getElementById('p-fone').innerText = os.fone || '---';
    document.getElementById('p-placa').innerText = os.placa || '---';
    document.getElementById('p-endereco').innerText = os.endereco || 'Não informado'; 
    
    const itens = os.itens && os.itens.length > 0 ? os.itens : [{ medida: os.medida || 'Pneu', qtd: os.qtd || 1, preco: os.preco || 0 }];
    
    document.getElementById('p-lista-itens').innerHTML = itens.map(it => {
        const unit = (it.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const total = ((it.qtd || 1) * (it.preco || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        
        return `
            <tr>
                <td style="font-weight:bold">${it.medida}</td>
                <td>${os.marca || ''}</td>
                <td style="text-align:center">${it.qtd}</td>
                <td style="text-align:right">R$ ${unit}</td>
                <td style="text-align:right; font-weight:bold">R$ ${total}</td>
            </tr>
        `;
    }).join('');

    const valorPrint = (typeof os.preco === 'number') ? os.preco : 0;
    document.getElementById('p-valor').innerText = valorPrint.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    
    const printArea = document.getElementById('printArea');
    if (tipo === 'recibo') {
        printArea.classList.add('modo-recibo');
    } else {
        printArea.classList.remove('modo-recibo');
    }
    
    setTimeout(() => { 
        window.print(); 
    }, 300);
}
