// =======================================================
// 1. MÁSCARA CPF/CNPJ E BUSCA DE RAZÃO SOCIAL
// =======================================================
const inputCnpjCpf = document.getElementById('cnpjContratante');
const inputNomeCliente = document.getElementById('contratante');

inputCnpjCpf.addEventListener('input', async function (event) {
    let doc = event.target.value;
    
    doc = doc.replace(/\D/g, "");
    let docParaBusca = doc;

    if (doc.length >14) {
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
// GRATUIDADE (ESCONDER/MOSTRAR CAIXOTE)
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
// 4. CALCULADORA FINANCEIRA (VALOR UNITÁRIO X QUANTIDADE)
// =======================================================

const inputQuantidade = document.getElementById('quantidade');
const inputValorEquipamento = document.getElementById('valorEquipamento');
const inputValorTotal = document.getElementById('valorTotal');

function calcularTotal() {
    let qtd = parseInt(inputQuantidade.value) || 0;
    let valorSujo = inputValorEquipamento.value.replace(/\D/g,"");
    let valorNumerico = (parseFloat(valorSujo) / 100) || 0;

    let total = qtd * valorNumerico;

    if (total > 0) {
        inputValorTotal.value = total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL' });
        } else {
            inputValorTotal.value = "";
        }
    }

    inputValorEquipamento.addEventListener('input', function(event){
        let valor = event.target.value.replace(/\D/g, "");

        if (valor === "") {
            event.target.value = "";
            calcularTotal();
            return;
        }

        valor = (parseFloat(valor) / 100 ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL' });
            event.target.value = valor;
            calcularTotal();
    })

    if (inputQuantidade) {
        inputQuantidade.addEventListener('change', calcularTotal);
    }
