let usuarioAtual;
let visibilidade;
let contato;

const chave_API = "INSIRA_SEU_ID";
const caminho_API = "https://mock-api.driven.com.br/api/v6/uol";

function solicitarNome(){
    const nomePrompt = prompt('Qual é seu nome?');
    const nomeObj = { name: nomePrompt };

    axios.post(`${caminho_API}/participants/` + `${chave_API}`, nomeObj)
        .then(() => {
            usuarioAtual = nomePrompt; 

            setInterval(() => verificarStatus(usuarioAtual), 5000);
            setInterval(buscarMensagens, 3000);
            setInterval(buscarParticipantes, 3000);
            
        })
        .catch(error => {
            alert("Escolha outro nome de usuário, este já está em uso.\nVocê será redirecionado para a página de cadastro novamente.");
            console.error("Erro ao cadastrar:", error);
            solicitarNome();
        });
}

function verificarStatus(usuarioAtual){

    const usuarioObj = {
        name: usuarioAtual
    }

    axios.post(`${caminho_API}/status/` + `${chave_API}`, usuarioObj)
        .then(() => {

        })
        .catch(error => {
            console.error("Erro ao verificar:", error);
        });
}

function buscarParticipantes(){
    const participantes = axios.get(`${caminho_API}/participants/${chave_API}`)
    .then(response => {
        renderizarParticipantes(response.data);
    })
    .catch(error => {
        console.error('Erro ao buscar participantes:', error);
    });
}

function renderizarParticipantes(participantes) {
    const participantesElement = document.getElementById("participantes");

    let selecionados = new Set();
    document.querySelectorAll(".participante.checked").forEach(el => {
        let nome = el.querySelector(".nome-usuario").textContent; 
        selecionados.add(nome); 
    });

    let participantesAtuais = new Set();
    document.querySelectorAll(".participante").forEach(el => {
        let nome = el.querySelector(".nome-usuario").textContent;
        participantesAtuais.add(nome);
    });

    document.querySelectorAll(".participante").forEach(el => {
        let nome = el.querySelector(".nome-usuario").textContent;
        if (!participantes.some(p => p.name === nome)) { 
            el.remove();
        }
    });

    participantes.forEach((participante) => {
        if (!participantesAtuais.has(participante.name)) {
            let div = document.createElement("div");
            div.className = `participante sidenavIcones ${selecionados.has(participante.name) ? "checked" : ""}`;
            div.setAttribute("onclick", "settings(this)");
            div.innerHTML = `
                <img src="assets/usuario.png" class="image contato">
                <p class="nome-usuario">${participante.name}</p>
                <img class="check contato hidden" src="assets/check.png">
            `;
            participantesElement.appendChild(div);
        }
    });
}



function buscarMensagens(){
    const mensagens = axios.get(`${caminho_API}/messages/${chave_API}`)
    .then(response => { 
        renderizarMensagens(response.data);
    })
    .catch(error => {
        console.error('Erro na requisição:', error);
    });

}

function renderizarMensagens(mensagens){
    const container_mensagens = document.querySelector(".container-mensagens");

    container_mensagens.innerHTML = '';

    mensagens.forEach((mensagem) => {

        const { from, time, text, to, type } = mensagem;

        switch(type){

            case "status":
                container_mensagens.innerHTML += `
                    <span class="mensagens ${type}">
                        <span class="mensagem ${type}"> 
                            <span class="mensagem-time">(${time})</span>
                            <span class="mensagem-from">${from}</span>
                            <span class="mensagem-text">${text}</span>
                        </span>
                    </span>
                `;

            break;

            case "message":
                container_mensagens.innerHTML += `
                    <span class="mensagens ${type}">
                        <span class="mensagem ${type}"> 
                            <span class="mensagem-time">(${time})</span>
                            <span class="mensagem-from">${from}</span>
                            <span class="para">para</span>
                            <span class="mensagem-to">${to}:</span>
                            <span class="mensagem-text">${text}</span>
                        </span>
                    </span>
                `;
            break;
            
            case "private_message":
                if(to == usuarioAtual || from == usuarioAtual){
                    container_mensagens.innerHTML += `
                        <span class="mensagens ${type}">
                            <span class="mensagem ${type}"> 
                                <span class="mensagem-time">(${time})</span>
                                <span class="mensagem-from">${from}</span>
                                <span class="para">reservadamente para</span>
                                <span class="mensagem-to">${to}:</span>
                                <span class="mensagem-text">${text}</span>
                            </span>
                        </span>
                    `;
                }
            break;
        }
    });

    container_mensagens.scrollIntoView({ behavior: "smooth", block: "end" });
}

function abrirNav() {
    const sidenav = document.getElementById("mySidenav");
    const overlay = document.getElementById("myOverlay");
    
    sidenav.classList.toggle("open");
    overlay.classList.toggle("hidden");
}

function settings(element) {

    let tipo;

    if(element.id == "publica" || element.id == "privada"){
        tipo = "visibilidade";
    }

    else{
        tipo = "contato";
    }

    document.querySelectorAll(`.check.${tipo}`).forEach(check => {
        check.classList.add("hidden");
        check.classList.remove("checked");
    });

    const check = element.querySelector(`.check.${tipo}`);
    
    if (check.classList.contains("hidden")) {
        check.classList.add("checked");
        check.classList.remove("hidden");
    }
}

function configurarVisualizacao() {
    const contatoSelecionado = document.querySelector(".check.contato.checked")?.parentElement.querySelector(".nome-usuario").textContent || "Todos";
    const visibilidadeSelecionada = document.querySelector(".check.visibilidade.checked")?.parentElement.textContent.trim() || "Pública";

    document.querySelector(".visualizacao").textContent = visibilidadeSelecionada.includes("Privada") 
        ? `Enviando para ${contatoSelecionado} (reservadamente)` 
        : `Enviando para ${contatoSelecionado} (público)`;
}


function enviarMensagem(mensagem){
    let mensagemElement = document.getElementById("msg").value;
    let visibilidade;

    const contatoSelecionado = document.querySelector(".check.contato.checked")?.parentElement.querySelector(".nome-usuario").textContent || "Todos";
    const visibilidadeSelecionada = document.querySelector(".check.visibilidade.checked")?.parentElement.textContent.trim() || "Pública";

    if(visibilidadeSelecionada.includes("Privada")){visibilidade = "private_message";}
    else{visibilidade = "message";}

    axios.post(`${caminho_API}/messages/${chave_API}`, {
        from: usuarioAtual,
        to: contatoSelecionado,
        text: mensagemElement,
        type: visibilidade
    })
    .then(() => {
        document.getElementById("msg").value = "";
        buscarMensagens();
    })

    .catch(error => {
        console.error("Erro ao enviar mensagem:", error);
        alert("Erro ao enviar mensagem. Por favor, tente novamente.");
        window.location.reload();
    });
    
}  




solicitarNome();