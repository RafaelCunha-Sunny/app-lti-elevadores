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

                let cepEmpresa = dados.cep.replace(/^(d{5})(\d)/, "$1-2");
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
const inputEndereco = document.getElementById('endereco')

inputCep.addEventListener('input', async function (event) {
    let cep = event.target.value;

    cep = cep.replace(/\D/g, "");

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
                console.log("Erro na conexão com a API")
            }
    }
})