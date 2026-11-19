let telaAnterior = 'tela-home';
let telaAtual = 'tela-home';
var response;

function navegar(destino) {

    let telas = document.getElementsByClassName('tela');
    Array.from(telas).forEach(element => {
        element.classList.remove('show');
        element.classList.add('collapse');
    });
    document.getElementById(destino).classList.remove('collapse');
    document.getElementById(destino).classList.add('show');
    telaAnterior = telaAtual;
    telaAtual = destino;

}

function voltar() {
    navegar('tela-home');
}

// Valida dados de cliente e veículo, e confirma o agendamento
// da ordem de serviço 
function agendarServicos() {

    const botaoVerAgenda = document.getElementById("btn-ver-ordem");
    botaoVerAgenda.classList.replace("show", "collapse");

    const dadosCliente = document.getElementById("dados-cliente");

    navegar("tela-cliente");

    dadosCliente.innerHTML = `
    
        <div class="row g-3">
           <h5>Preencha seus dados</h5>
           <div class="col-md-8">
                <label for = "cpf" class = "form-label">CPF</label>
                <input type = "text" class = "form-control" id = "cpf" placeholder = "Digite seu CPF">

                <label for = "placa" class = "form-label">Placa do Veículo</label>
                <input type = "text" class = "form-control" id = "placa" placeholder = "Digite a placa do veículo">

                <label for = "data" class = "form-label">Data de Agendamento</label>
                <input type = "date" class = "form-control" id = "data" placeholder = "Digite a data do agendamento">
           </div>
           
        </div>`;
}

let ultimaOS;
async function reagendarOrdemServico(dados) {

    try {
        let dataAgendada;

        const ultimaOrdemServico = document.getElementById("detalhes-os");

        //Recupera os dados da última Ordem de Serviço
        navegar("tela-reagendar");

        dataAgendada = `<p><strong>Data agendada:</strong> ${ultimaOS.agenda} </p>`;

        console.log(dataAgendada)

        dadosRestantes = `
                <div class="row g-3">
                    <div class="col-md-8">
                                                 
                        <p><strong>Status:</strong> ${ultimaOS.status} </p>
                        <p><strong>Cliente:</strong> ${ultimaOS.cliente} </p>
                        <p><strong>Veículo/placa:</strong> ${ultimaOS.placa} </p>
                        <p><strong>Serviços:</strong></p>

                        <ul>
                            ${ultimaOS.itens_servicos.map(item => `<li>${item}</li>`).join(" ")}
                        </ul>

                        <p><strong>SUBTOTAL:</strong> ${ultimaOS.sub_total} </p>
                        <p><strong>DESCONTO:</strong> ${ultimaOS.desconto}% </p>
                        <p><strong>TOTAL A PAGAR:</strong> ${ultimaOS.total} </p>
                    </div>
                </div>
            `;

        ultimaOrdemServico.innerHTML = `
            ${dataAgendada}
            ${dadosRestantes}
        `
        const botaoReagendar = document.getElementById("btn-reagendar");
        botaoReagendar.addEventListener("click", () => {
            const reagendar = document.getElementById("nova-data");
            reagendar.innerHTML = `
                <input type = "date" class = "form-control" id = "data" placeholder = "Digite a data do agendamento">
               `
        });

        //Salva a data Reagendada
        const novaData = document.getElementById("data").value;

        if (novaData && !isNaN(Date.parse(novaData))) {
            const id = ultimaOS.numero;

            response = await axios.patch(
                `http://localhost:3000/ordens_servico/${id}`,
                { agenda: novaData }
            );
        }

        navegar("tela-reagendar");
        dataAgendada = `<p><strong>Data agendada:</strong> ${novaData} </p>`;

        ultimaOrdemServico.innerHTML = `
            ${dataAgendada}
            ${dadosRestantes}
        `
    } catch (error) {
        console.error("Erro ao carregar as ordens de serviço:", error);
    }
}

let dadosOS;
async function salvarAgendamento(dados) {

    const dadosCliente = document.getElementById("dados-cliente");

    try {
        const cpf = document.getElementById("cpf").value;
        const placa = document.getElementById("placa").value;
        const data = document.getElementById("data").value;

        response = await axios.get(
            `http://localhost:3000/clientes?cpf=${cpf}`
        );

        const cliente = response.data[0];
        if (!cliente) {
            dadosCliente.innerHTML = "Cliente não encontrado Faça click no botão <strong>Confirmar</strong> e tente de novo";

            return;
        }

        const clienteNome = response.data[0].nome;

        response = await axios.get(
            `http://localhost:3000/veiculos?placa=${placa}`
        );

        const veiculo = response.data[0];
        if (!veiculo) {
            dadosCliente.innerHTML = "Veículo não encontrado. Faça click no botão <strong>Confirmar</strong> e tente de novo";

            return;
        }

        const ordemServico = {
            total: dadosOS.valorTotal,
            agenda: data,
            desconto: dadosOS.desconto,
            id_veiculo: veiculo.id,
            status: "ABERTA"
        };

        //Cria a nova Ordem de Serviço
        response = await axios.post(
            "http://localhost:3000/ordens_servico",
            ordemServico
        );

        const botaoConfirmarAgenda = document.getElementById("btn-confirmar");
        botaoConfirmarAgenda.classList.replace("show", "collapse");

        if (response.status === 201) {

            const botaoVerAgenda = document.getElementById("btn-ver-ordem");
            botaoVerAgenda.classList.replace("collapse", "show");

            dadosCliente.innerHTML = "Ordem de serviço agendada com sucesso!!!";

            ultimaOS = {
                numero: response.data.id,
                agenda: response.data.agenda,
                status: response.data.status,
                cliente: clienteNome,
                placa,
                itens_servicos: dadosOS.tituloPreco,
                sub_total: response.data.total,
                desconto: response.data.desconto,
                total: dadosOS.valorDesconto
            };

            return;

        } else {
            dadosCliente.innerHTML = "Ordem de serviço NÃO foi cadastrada";
        }

        botaoVerAgenda.addEventListener("click", () => {
            reagendarOrdemServico(ultimaOS);
        });

    } catch (error) {
        console.error("Erro ao carregar as ordens de serviço:", error);
    }

}

async function carregarPorCategorias(categoria) {

    const categoriaRenderizada = categoria;

    try {
        let url = 'http://localhost:3000/servicos';

        // Faz requisição dos serviços diponíveis
        const response = await axios.get(url);
        const servicos = response.data;

        // Organiza os serviços agrupados por categorias
        const servicosCategorias = [];
        const categorias = [...new Set(servicos.map(s => s.categoria))];
        for (const categoria of categorias) {
            servicosCategorias.push(
                servicos.filter(s => s.categoria === categoria)
            );
        }

        if (categoriaRenderizada === 'todos') {

            const telaLista = document.getElementById("tela-home");
            telaLista.innerHTML = "";

            servicosCategorias.forEach(itens => {

                const galeria = itens.map(item => `
                    <img
                        src="${item.imagem}"
                        class="img-fluid"
                        style="width: 100px; height: 100px; object-fit: contain;"
                    >
                `).join("");

                const titulo = itens.map(item => item.titulo).join(" + ");
                const valorTotal = itens.map(item => item.valor).reduce((total, valor) => { return total + valor }, 0);
                const valorDesconto = valorTotal * (1 - itens[0].desconto / 100);

                // Renderiza as ofertas de serviços na tela home
                const card = document.createElement("div");
                card.className = "col";
                card.innerHTML = `
                    <div class="card h-100">
                        <div 
                            class="d-flex justify-content-center gap-2">
                            ${galeria}
                        </div>

                        <div class="card-body">
                            <h6 class="card-title">${titulo}</h6>
                            <h6 class="card-title">
                                Categoria: ${itens[0].categoria}
                            </h6>
                            <p class="card-text">${itens[0].descricao}</p>
                            <h5 class="card-title">
                                Você paga apenas R$ ${valorDesconto.toFixed(2)}
                            </h5>
                            <h5 class="card-title">
                                E ganha ${itens[0].desconto}% de Desconto!!!
                            </h5>
         
                        </div>
                    </div>
                `;

                card.addEventListener("click", () => {
                    carregarPorCategorias(itens[0].categoria);
                });

                telaLista.appendChild(card);
            });

            navegar('tela-home')

        } else {
            // Mostra apenas os serviços da categoria selecionada
            const detalhesCategoria = document.getElementById("detalhes-categoria");

            navegar('tela-categoria');
            const botaoConfirmarAgenda = document.getElementById("btn-confirmar");

            detalhesCategoria.innerHTML = "Carregando...";

            const servicosDaCategoria = servicosCategorias.find(
                grupo => grupo[0].categoria === categoriaRenderizada
            );

            if (!servicosDaCategoria || servicosDaCategoria.length === 0) {
                detalhesCategoria.innerHTML = "Nenhum serviço encontrado.";
                return;
            }

            const galeria = servicosDaCategoria.map(item => `
                <img
                    src="${item.imagem}"
                    class="img-fluid"
                    style="width: 100px; height: 100px; object-fit: contain;"
                >
            `).join("");

            const tituloPreco = servicosDaCategoria.map(item => `${item.titulo}  Preço: R$ ${item.valor.toFixed(2)}`);

            const titulo = servicosDaCategoria.map(item => item.titulo).join(" + ");

            const valorTotal = servicosDaCategoria.reduce(
                (total, item) => total + Number(item.valor), 0);

            const valorDesconto = valorTotal * (1 - servicosDaCategoria[0].desconto / 100);

            const idServicos = servicosDaCategoria.map(item => item.id);

            dadosOS = {
                idServicos,
                tituloPreco,
                valorTotal,
                valorDesconto,
                desconto: servicosDaCategoria[0].desconto
            };

            botaoConfirmarAgenda.addEventListener("click", () => {
                agendarServicos(dadosOS);
            });

            // Renderiza os detalhes da categoria
            detalhesCategoria.innerHTML = `
                <div class="row g-3">
                    <div class="d-flex justify-content-center gap-2">
                        ${galeria}
                    </div>

                    <div class="col-md-8">
                        <h5>${titulo}</h5>
                        <ul>
                            ${tituloPreco.map(item => `<li>${item}</li>`).join(" ")}
                        </ul>
                        <p>
                            <strong>Preço total:</strong>
                            R$ ${valorTotal.toFixed(2)}
                        </p>
                        <p>
                            <strong>Total com desconto:</strong>
                            R$ ${valorDesconto.toFixed(2)}
                        </p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
    }
}

carregarPorCategorias('todos')

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
}

var pedidoInstalacao;
window.addEventListener('beforeinstallprompt', function (installPrompt) {
    if (installPrompt) {
        document.getElementById("installAppBt").classList.add('show')
        pedidoInstalacao = installPrompt
    }
});

function installApp() {
    pedidoInstalacao.prompt();
}