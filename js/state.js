// Centralized Application State Store
export const state = {
    clientes: [],
    os: [],
    estoque: [],
    financeiro: [],
    itensAtuaisOS: [],
    listeners: {
        clientes: [],
        os: [],
        estoque: [],
        financeiro: [],
        itensAtuaisOS: []
    }
};

export function subscribe(key, callback) {
    if (state.listeners[key]) {
        state.listeners[key].push(callback);
    }
}

export function notify(key) {
    if (state.listeners[key]) {
        state.listeners[key].forEach(cb => cb(state[key]));
    }
}

export function setClientes(data) {
    state.clientes = data;
    notify('clientes');
}

export function setOS(data) {
    state.os = data;
    notify('os');
}

export function setEstoque(data) {
    state.estoque = data;
    notify('estoque');
}

export function setFinanceiro(data) {
    state.financeiro = data;
    notify('financeiro');
}

export function setItensAtuaisOS(data) {
    state.itensAtuaisOS = data;
    notify('itensAtuaisOS');
}
