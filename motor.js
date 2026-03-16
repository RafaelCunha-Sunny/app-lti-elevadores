// =======================================================
// 1. MÁSCARA CPF/CNPJ E BUSCA DE RAZÃO SOCIAL
// =======================================================
const inputCnpjCpf = document.getElementById('cnpjContratante');
const inputNomeCliente = document.getElementById('contratante');

inputCnpjCpf.addEventListener('input', async function (event) {
    let doc = event.target.value;

    doc = doc.replace(/\D/g, "");
    let docParaBusca = doc;

    if (doc.length > 14) {
        doc = doc.substring(0, 14);
        docParaBusca = doc;
    }

    if (doc.length <= 11) {
        doc = doc.replace(/(\d{3})(\d)/, "$1.$2");
        doc = doc.replace(/(\d{3})(\d)/, "$1.$2");
        doc = doc.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    else {
        doc = doc.replace(/^(\d{2})(\d)/, "$1.$2");
        doc = doc.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        doc = doc.replace(/\.(\d{3})(\d)/, ".$1/$2");
        doc = doc.replace(/(\d{4})(\d)/, "$1-$2");
    }

    event.target.value = doc;

    if (docParaBusca.length === 14) {
        try {
            const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${docParaBusca}`);
            const dados = await resposta.json();
            if (!dados.message) {
                inputNomeCliente.value = dados.razao_social;

                let cepEmpresa = dados.cep.replace(/^(\d{5})(\d)/, "$1-$2");
                document.getElementById('cep').value = cepEmpresa;

                document.getElementById('endereco').value = `${dados.logradouro}, ${dados.bairro}, ${dados.municipio}/${dados.uf}`;

                document.getElementById('numero').value = dados.numero;
            }
            else {
                alert('Opa! CNPJ não encontrado na base de dados da Receita Federal.');
            }
        }
        catch (erro) {
            console.log("Erro na conexão com a API de CNPJ.")
        }
    }
})

// =======================================================
// 2. MÁSCARA CEP E BUSCA DE ENDEREÇO
// =======================================================
const inputCep = document.getElementById('cep');
const inputEndereco = document.getElementById('endereco');

inputCep.addEventListener('input', async function (event) {
    let cep = event.target.value;

    cep = cep.replace(/\D/g, "");

    if (cep.length > 8) {
        cep = cep.substring(0, 8);
    }

    let cepParaBusca = cep;

    cep = cep.replace(/^(\d{5})(\d)/, "$1-$2");

    event.currentTarget.value = cep;

    if (cepParaBusca.length === 8) {
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cepParaBusca}/json/`);
            const dados = await resposta.json();
            if (!dados.erro) { inputEndereco.value = `${dados.logradouro}, ${dados.bairro} - ${dados.localidade}/${dados.uf}`; }
            else {
                alert("Opa! O CEP digitado não foi encontrado!");
            }
        }
        catch (erro) {
            console.log("Erro na conexão com a API");
        }
    }
})

// =======================================================
// 3. LISTA DINÂMICA DE EQUIPAMENTOS (CARRINHO)
// =======================================================
const btnAdicionar = document.getElementById('btnAdicionarEquipamento');
const tbodyEquipamentos = document.getElementById('lista-equipamentos-body');

btnAdicionar.addEventListener('click', function () {
    const qtd = document.getElementById('eqpQuantidade').value;
    const equipamento = document.getElementById('eqpEquipamento').value;
    const marca = document.getElementById('eqpMarca').value;
    const tipo = document.getElementById('eqpTipo').value;
    const paradas = document.getElementById('eqpParadas').value;

    if (!qtd || !equipamento || !marca || !tipo || !paradas) {
        alert("Opa! Preencha todas as 5 opções do equipamento antes de adicionar.");
        return; 
    }

    const novaLinha = document.createElement('tr');
    novaLinha.style.borderBottom = "1px solid #ccc";
    novaLinha.style.fontSize = "14px";
    
    // O SEGREDO: Guardamos a quantidade "invisível" na linha para a calculadora ler depois
    novaLinha.dataset.qtd = qtd;

    novaLinha.innerHTML = `
        <td style="padding: 10px; border-right: 1px solid #ccc;">${qtd} - ${equipamento}</td>
        <td style="padding: 10px; border-right: 1px solid #ccc;">${marca}</td>
        <td style="padding: 10px; border-right: 1px solid #ccc;">${tipo}</td>
        <td style="padding: 10px; border-right: 1px solid #ccc;">${paradas}</td>
        <td style="padding: 10px;">
            <button type="button" class="btnRemoverLinha" style="color: red; cursor: pointer; border: none; background: none; font-size: 16px;">❌</button>
        </td>
    `;

    novaLinha.querySelector('.btnRemoverLinha').addEventListener('click', function () {
        novaLinha.remove();
        calcularTotal(); // Manda recalcular o dinheiro se a lixeira for clicada
    });

    tbodyEquipamentos.appendChild(novaLinha);

    document.getElementById('eqpQuantidade').value = '';
    document.getElementById('eqpEquipamento').value = '';
    document.getElementById('eqpMarca').value = '';
    document.getElementById('eqpTipo').value = '';
    document.getElementById('eqpParadas').value = '';

    calcularTotal(); // Manda recalcular o dinheiro quando o equipamento entra na tabela
});
// =======================================================
// 4 GRATUIDADE (ESCONDER/MOSTRAR CAIXOTE)
// =======================================================

const radioSim = document.getElementById('gratuidadeSim');
const radioNao = document.getElementById('gratuidadeNao');
const areaGratuidade = document.getElementById('area-gratuidade');

function alternarCaixote() {
    if (radioSim.checked) {
        areaGratuidade.style.display = 'block';
        atualizarMesesGratuidade();
    } else {
        areaGratuidade.style.display = 'none';
        atualizarMesesGratuidade();
    }
}

radioSim.addEventListener('change', alternarCaixote);
radioNao.addEventListener('change', alternarCaixote);

// =======================================================
// 5. CALCULADORA FINANCEIRA (VALOR UNITÁRIO X QUANTIDADE)
// =======================================================

const inputValorEquipamento = document.getElementById('valorEquipamento');
const inputValorTotal = document.getElementById('valorTotal');

function calcularTotal() {
    // 1. Vai na tabela e soma todas as quantidades "invisíveis" (dataset.qtd)
    let linhas = document.querySelectorAll('#lista-equipamentos-body tr');
    let qtdTotal = 0;
    
    linhas.forEach(linha => {
        qtdTotal += parseInt(linha.dataset.qtd) || 0;
    });

    // 2. Pega o dinheiro digitado e converte para número
    let valorSujo = inputValorEquipamento.value.replace(/\D/g,"");
    let valorNumerico = (parseFloat(valorSujo) / 100) || 0;

    // 3. Multiplica o total de máquinas pelo valor unitário
    let total = qtdTotal * valorNumerico;

    // 4. Joga o resultado na tela
    if (total > 0) {
        inputValorTotal.value = total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL' });
    } else {
        inputValorTotal.value = "";
    }
}

// O espião do campo de valor
inputValorEquipamento.addEventListener('input', function(event){
    let valor = event.target.value.replace(/\D/g, "");

    if (valor === "") {
        event.target.value = "";
        calcularTotal();
        return;
    }

    valor = (parseFloat(valor) / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL' });
    event.target.value = valor;
    calcularTotal();
});
// =======================================================
// 6. INTELIGÊNCIA DAS DATAS (TRAVAR MESES AUTOMATICAMENTE)
// =======================================================
const inputVigencia = document.getElementById('vigencia');
const selectGratuidade = document.getElementById('gratuidade');

const idsMeses = [
    'mesJan', 'mesFev', 'mesMar', 'mesAbr', 'mesMai', 'mesJun',
    'mesJul', 'mesAgo', 'mesSet', 'mesOut', 'mesNov', 'mesDez'
];

function atualizarMesesGratuidade() {
    idsMeses.forEach(id => {
        let checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = false;
            checkbox.disabled = true;
            checkbox.parentElement.style.opacity = '0.4';
            checkbox.parentElement.style.cursor = 'not-allowed';
        }
    });

    if (radioNao.checked || !inputVigencia.value) return;

    let partesData = inputVigencia.value.split('-');
    if (partesData.length < 2) return;
    let mesInicial = parseInt(partesData[1]) - 1;

    let qtdGratuidade = parseInt(selectGratuidade.value.replace(/\D/g, "")) || 0;

    for (let i = 0; i < qtdGratuidade; i++) {
        let indiceMes = (mesInicial + i) % 12;
        let checkboxAlvo = document.getElementById(idsMeses[indiceMes]);
        if (checkboxAlvo) {
            checkboxAlvo.checked = true;
            checkboxAlvo.parentElement.style.opacity = '1';
        }
    }
}

inputVigencia.addEventListener('change', atualizarMesesGratuidade);
selectGratuidade.addEventListener('change', atualizarMesesGratuidade);