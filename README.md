# IndusDesk

**Helpdesk de TI com cara industrial** — protótipo de portfolio para gestão de chamados: dashboard com gráficos, área do técnico, histórico, relatórios e exportação em PDF e Excel.

> Projeto demonstrativo: não substitui um sistema corporativo completo; serve para exibir **React**, **API REST** e **persistência** de ponta a ponta.

![Stack](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=fff)
![Node](https://img.shields.io/badge/Node-Express-339933?style=flat&logo=node.js&logoColor=fff)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=fff)

---

## O que tem aqui

| Camada | Tecnologia |
|--------|------------|
| Front | React 19, Vite, Tailwind (login), Recharts, jsPDF, SheetJS |
| API | Express 5, SQLite (`better-sqlite3`), JWT, bcrypt |
| Dados | Banco local em `server/data/` (gerado ao rodar a API; **não** vai pro Git) |

**Fluxo:** login → token JWT → CRUD de chamados na API → interface atualiza em tempo real.

---

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+ (recomendado)

### Instalar e subir tudo

```bash
npm install
npm run dev
```

Isso sobe **o front (Vite)** e **a API (porta 4000)** ao mesmo tempo. Abra o endereço que o Vite mostrar (geralmente `http://localhost:5173`).

### Só o front ou só a API

```bash
npm run dev:client   # apenas Vite
npm run dev:api      # apenas node server/index.js
```

### Build do front (estático)

```bash
npm run build
npm run preview      # testar o build; a API precisa estar rodando ou use VITE_API_URL
```

---

## Login de demonstração

Na primeira execução a API cria um usuário padrão (e semeia os chamados de exemplo):

| Campo | Valor padrão |
|-------|----------------|
| E-mail | `ti@industria.com.br` |
| Senha | `indus2024` |

Você pode alterar no **ambiente do servidor** antes de subir o processo:

| Variável | Descrição |
|----------|-----------|
| `ADMIN_EMAIL` | E-mail do admin |
| `ADMIN_PASSWORD` | Senha em texto (hash gerado na primeira criação) |
| `JWT_SECRET` | Chave para assinar tokens (**troque em qualquer deploy público**) |
| `PORT` | Porta da API (padrão `4000`) |
| `INDUS_DB_PATH` | Caminho customizado do arquivo `.db` |

No **front**, opcional:

| Variável (Vite) | Descrição |
|-----------------|-----------|
| `VITE_API_URL` | URL base da API se não usar o proxy do Vite (ex.: deploy separado) |
| `VITE_DEFAULT_EMAIL` | E-mail sugerido na tela de login |

---

## O que entra no Git / o que fica de fora

**Commitar:** código-fonte (`src/`, `server/`), `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `public/`, este `README.md`.

**Não commitar** (já no `.gitignore`): `node_modules/`, `dist/`, `.env`, `server/data/*.db`, logs.

Depois do `npm install`, qualquer um gera o banco local de novo.

---

## Estrutura (resumo)

```
Indus-Desk/
├── server/           # API Express + SQLite + seed
│   ├── index.js
│   ├── db.js
│   └── seedData.js
├── src/
│   ├── IndusDesk.jsx # App principal (UI grande)
│   ├── Login.jsx
│   ├── api.js
│   ├── auth.js
│   └── …
├── public/
└── package.json
```

---

## Licença e crédito

Uso livre para portfolio e estudo. Se reutilizar trechos, um link para o repositório é um carinho.

---

**Dica para o GitHub:** pin o repositório, adicione tópicos (`react`, `vite`, `express`, `sqlite`, `helpdesk`) e, se quiser, um GIF da dashboard no topo do README.
