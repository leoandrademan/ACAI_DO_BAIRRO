
'use strict';

const tamanhos = document.querySelectorAll('input[name="tamanho"]');
const adicionais = document.querySelectorAll('input[name="adicional"]');

const nomeInput = document.getElementById('nome');
const telefoneInput = document.getElementById('telefone');
const bairroInput = document.getElementById('bairro');

const resumoTamanho = document.getElementById('resumo-tamanho');
const listaAdicionais = document.getElementById('lista-adicionais');
const subtotalElemento = document.getElementById('subtotal');
const taxaElemento = document.getElementById('taxa-entrega');
const resumoBairro = document.getElementById('resumo-bairro');
const valorTotal = document.getElementById('valor-total');

const botaoConfirmar = document.getElementById('btn-confirmar');
const mensagem = document.getElementById('mensagem');

let subtotalAtual = 0;
let taxaAtual = null;
let totalAtual = null;

function obterLimite(volume) {
    if (volume === '300') return 2;
    if (volume === '500') return 4;
    return Infinity;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function obterTaxa(bairro) {
    if (!bairro) return null;
    return bairro === 'Centro' ? 5 : 10;
}

function limparMensagem() {
    mensagem.textContent = '';
    mensagem.classList.remove('sucesso');
}

function mostrarMensagem(texto, sucesso = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('sucesso', sucesso);
}

function obterSelecionados() {
    return Array.from(adicionais).filter(item => item.checked);
}

function atualizarPedido() {
    const tamanho = document.querySelector(
        'input[name="tamanho"]:checked'
    );

    const volume = tamanho.value;
    const precoBase = Number(tamanho.dataset.preco);
    const selecionados = obterSelecionados();

    resumoTamanho.textContent = `${volume} ml`;
    listaAdicionais.replaceChildren();

    subtotalAtual = precoBase;

    if (selecionados.length === 0) {
        const item = document.createElement('li');
        item.textContent = 'Nenhum adicional';
        listaAdicionais.appendChild(item);
    } else {
        selecionados.forEach(adicional => {
            const preco = Number(adicional.dataset.preco);
            subtotalAtual += preco;

            const item = document.createElement('li');
            item.textContent =
                `${adicional.value} — ${formatarMoeda(preco)}`;

            listaAdicionais.appendChild(item);
        });
    }

    const limite = obterLimite(volume);
    const contador = document.createElement('li');

    contador.textContent = Number.isFinite(limite)
        ? `Adicionais: ${selecionados.length} de ${limite}`
        : `Adicionais selecionados: ${selecionados.length}`;

    listaAdicionais.appendChild(contador);

    subtotalElemento.textContent = formatarMoeda(subtotalAtual);

    const bairro = bairroInput.value;
    resumoBairro.textContent = bairro || 'selecione o bairro';

    taxaAtual = obterTaxa(bairro);

    if (taxaAtual === null) {
        taxaElemento.textContent = '—';
        valorTotal.textContent = '—';
        totalAtual = null;
    } else {
        taxaElemento.textContent = formatarMoeda(taxaAtual);
        totalAtual = subtotalAtual + taxaAtual;
        valorTotal.textContent = formatarMoeda(totalAtual);
    }
}

function validarTelefone() {
    const digitos = telefoneInput.value.replace(/\D/g, '');

    // Aceita telefone fixo ou celular brasileiro com DDD.
    const valido = digitos.length === 10 || digitos.length === 11;

    telefoneInput.setCustomValidity(
        valido
            ? ''
            : 'Informe um telefone válido com DDD, incluindo o código de área.'
    );

    return valido;
}

function validarNome() {
    const nome = nomeInput.value.trim();
    const valido = nome.length >= 2;

    nomeInput.setCustomValidity(
        valido ? '' : 'Informe seu nome completo.'
    );

    return valido;
}

function validarPedido() {
    validarNome();
    validarTelefone();

    if (!nomeInput.value.trim()) {
        nomeInput.setCustomValidity('O nome é obrigatório.');
    }

    if (!telefoneInput.value.trim()) {
        telefoneInput.setCustomValidity('O telefone com DDD é obrigatório.');
    }

    if (!bairroInput.value) {
        bairroInput.setCustomValidity('Selecione seu bairro.');
    } else {
        bairroInput.setCustomValidity('');
    }

    if (!nomeInput.checkValidity()) {
        nomeInput.reportValidity();
        return false;
    }

    if (!telefoneInput.checkValidity()) {
        telefoneInput.reportValidity();
        return false;
    }

    if (!bairroInput.checkValidity()) {
        bairroInput.reportValidity();
        return false;
    }

    const tamanho = document.querySelector(
        'input[name="tamanho"]:checked'
    );

    const limite = obterLimite(tamanho.value);

    if (obterSelecionados().length > limite) {
        mostrarMensagem(
            `O copo de ${tamanho.value} ml permite até ${limite} adicionais.`
        );
        return false;
    }

    return true;
}

// Atualiza os valores ao alterar o tamanho.
tamanhos.forEach(tamanho => {
    tamanho.addEventListener('change', () => {
        const limite = obterLimite(tamanho.value);
        const selecionados = obterSelecionados();

        if (selecionados.length > limite) {
            selecionados.slice(limite).forEach(item => {
                item.checked = false;
            });

            mostrarMensagem(
                `O copo de ${tamanho.value} ml permite até ${limite} adicionais. ` +
                'Os adicionais excedentes foram removidos.'
            );
        } else {
            limparMensagem();
        }

        atualizarPedido();
    });
});

// Impede ultrapassar o limite de adicionais.
adicionais.forEach(adicional => {
    adicional.addEventListener('change', () => {
        const tamanho = document.querySelector(
            'input[name="tamanho"]:checked'
        );

        const limite = obterLimite(tamanho.value);
        const selecionados = obterSelecionados();

        if (selecionados.length > limite) {
            adicional.checked = false;

            mostrarMensagem(
                `Limite de ${limite} adicionais para o copo de ${tamanho.value} ml.`
            );
        } else {
            limparMensagem();
        }

        atualizarPedido();
    });
});

// Recalcula a taxa quando o cliente escolhe outro bairro.
bairroInput.addEventListener('change', () => {
    bairroInput.setCustomValidity('');
    limparMensagem();
    atualizarPedido();
});

nomeInput.addEventListener('input', () => {
    nomeInput.setCustomValidity('');
    limparMensagem();
});

telefoneInput.addEventListener('input', () => {
    telefoneInput.setCustomValidity('');
    limparMensagem();
});

// Confirma somente após validar os dados e o valor total.
botaoConfirmar.addEventListener('click', () => {
    if (!validarPedido()) return;

    atualizarPedido();

    if (totalAtual === null || taxaAtual === null) {
        mostrarMensagem('Selecione seu bairro para calcular a entrega.');
        bairroInput.reportValidity();
        return;
    }

    const tamanho = document.querySelector(
        'input[name="tamanho"]:checked'
    );

    const selecionados = obterSelecionados().map(item => item.value);
    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const bairro = bairroInput.value;

    const detalhes =
        `CONFIRMAR PEDIDO - AÇAÍ DO BAIRRO\n\n` +
        `Cliente: ${nome}\n` +
        `Telefone: ${telefone}\n` +
        `Bairro: ${bairro}\n\n` +
        `Açaí: ${tamanho.value} ml\n` +
        `Adicionais: ${selecionados.length
            ? selecionados.join(', ')
            : 'Nenhum'}\n` +
        `Subtotal do açaí: ${formatarMoeda(subtotalAtual)}\n` +
        `Taxa de entrega: ${formatarMoeda(taxaAtual)}\n` +
        `TOTAL: ${formatarMoeda(totalAtual)}\n\n` +
        `Confirma essas informações?`;

    if (window.confirm(detalhes)) {
        mostrarMensagem(
            `Pedido confirmado na tela! Total: ${formatarMoeda(totalAtual)}. ` +
            'Anote seus dados para referência.',
            true
        );
    }
});

// Calcula o subtotal inicial. A entrega depende do bairro selecionado.
atualizarPedido();
