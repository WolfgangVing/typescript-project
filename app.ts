// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu 
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que: 
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction

enum EHttpClient {
    get = "GET",
    post = "POST"
}

interface IHttpClient {
    url: string,
    method: EHttpClient,
    body?: {} | null
}

interface IRequest_token {
    success: boolean
    expires_at: string
    request_token: string
}

interface ICreateSession {
    success: boolean
    session_id: string
}

const credentials = {
    apiKey: '3f301be7381a03ad8d352314dcc3ec1d',
    requestToken: "string",
    username: "string",
    password: "string",
    sessionId: "string",
    listId: '7101979'
}

let loginButton = document.getElementById('login-button') as HTMLButtonElement;
let searchButton = document.getElementById('search-button') as HTMLButtonElement;
let searchContainer = document.getElementById('search-container') as HTMLElement;

loginButton.addEventListener('click', async () => {
    await criarRequestToken();
    await logar();
    await criarSessao();
})

searchButton.addEventListener('click', async () => {
    let lista = document.getElementById("lista");
    if (lista) {
        lista.outerHTML = "";
    }
    let query = document.getElementById('search') as HTMLInputElement;
    let listaDeFilmes = await procurarFilme(query.value) as { results: any };
    let ul = document.createElement('ul');
    ul.id = "lista"
    for (const item of listaDeFilmes.results) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(item.original_title))
        ul.appendChild(li)
    }
    console.log(listaDeFilmes);
    searchContainer.appendChild(ul);
})

const getCredentials = (whichOne: string): string => {
    const credential = document.getElementById(whichOne) as HTMLInputElement
    return credential.value
}

function preencherSenha() {
    credentials.password = getCredentials("senha");
    validateLoginButton();
}

function preencherLogin() {
    credentials.username = getCredentials("login");
    validateLoginButton();
}

function preencherApi() {
    credentials.apiKey = getCredentials("api-key");
    validateLoginButton();
}

function validateLoginButton() {
    if (credentials.password && credentials.username && credentials.apiKey) {
        loginButton.disabled = false;
    } else {
        loginButton.disabled = true;
    }
}

class HttpClient {
    static async get({ url, method, body = null }: IHttpClient) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open(method, url, true);

            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.responseText));
                } else {
                    reject({
                        status: request.status,
                        statusText: request.statusText
                    })
                }
            }
            request.onerror = () => {
                reject({
                    status: request.status,
                    statusText: request.statusText
                })
            }

            if (body) {
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                body = JSON.stringify(body);
            }
            body ?? request.send(body);
        })
    }
}

async function procurarFilme(query: string) {
    query = encodeURI(query)
    console.log(query)
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/search/movie?api_key=${credentials.apiKey}&query=${query}`,
        method: EHttpClient.get
    })
    return result
}

async function adicionarFilme(filmeId: string) {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${credentials.apiKey}&language=en-US`,
        method: EHttpClient.get
    })
    console.log(result);
}

async function criarRequestToken() {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${credentials.apiKey}`,
        method: EHttpClient.get
    }) as IRequest_token
    credentials.requestToken = result.request_token
}

async function logar() {
    let login = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${credentials.apiKey}`,
        method: EHttpClient.post,
        body: {
            username: `${credentials.username}`,
            password: `${credentials.password}`,
            request_token: `${credentials.requestToken}`
        }
    })
    console.log(login)
}

async function criarSessao() {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${credentials.apiKey}&request_token=${credentials.requestToken}`,
        method: EHttpClient.get
    }) as ICreateSession
    credentials.sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list?api_key=${credentials.apiKey}&session_id=${credentials.sessionId}`,
        method: EHttpClient.post,
        body: {
            name: nomeDaLista,
            description: descricao,
            language: "pt-br"
        }
    })
    console.log(result);
}

async function adicionarFilmeNaLista(filmeId: string, listaId: string) {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${credentials.apiKey}&session_id=${credentials.sessionId}`,
        method: EHttpClient.post,
        body: {
            media_id: filmeId
        }
    })
    console.log(result);
}

async function pegarLista() {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${credentials.listId}?api_key=${credentials.apiKey}`,
        method: EHttpClient.get
    })
    console.log(result);
}

{/* <div style="display: flex;">
  <div style="display: flex; width: 300px; height: 100px; justify-content: space-between; flex-direction: column;">
      <input id="login" placeholder="Login" onchange="preencherLogin(event)">
      <input id="senha" placeholder="Senha" type="password" onchange="preencherSenha(event)">
      <input id="api-key" placeholder="Api Key" onchange="preencherApi()">
      <button id="login-button" disabled>Login</button>
  </div>
  <div id="search-container" style="margin-left: 20px">
      <input id="search" placeholder="Escreva...">
      <button id="search-button">Pesquisar Filme</button>
  </div>
</div>*/}