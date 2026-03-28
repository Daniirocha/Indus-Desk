/** Mesmos dados iniciais do front (seed no SQLite). */
export const CHAMADOS_SEED = [
  {
    id: 1, usuario: "João Silva", descricao: "Computador não liga na linha de produção 3. Teclado e mouse também sem resposta.",
    categoria: "hardware", prioridade: "alta", status: "Resolvido",
    tecnico: "Carlos Mendes", data: "2024-06-10T08:22:00", dataResolucao: "2024-06-10T11:45:00",
    comentarios: [
      { autor: "Carlos Mendes", texto: "Verificado: fonte de alimentação queimada. Substituída por reserva.", data: "2024-06-10T10:00:00" },
      { autor: "Carlos Mendes", texto: "Chamado resolvido. Computador operando normalmente.", data: "2024-06-10T11:45:00" },
    ],
    imagem: null,
  },
  {
    id: 2, usuario: "Maria Ferreira", descricao: "Sistema de controle SCADA apresentando tela preta ao inicializar. Produção parada.",
    categoria: "software", prioridade: "alta", status: "Em andamento",
    tecnico: "Ana Lima", data: "2024-06-11T06:30:00", dataResolucao: null,
    comentarios: [
      { autor: "Ana Lima", texto: "Analisando logs do sistema SCADA. Possível corrompimento de DLL.", data: "2024-06-11T07:15:00" },
    ],
    imagem: null,
  },
  {
    id: 3, usuario: "Paulo Rodrigues", descricao: "Impressora da etiquetagem parou de funcionar. Labels não estão sendo geradas.",
    categoria: "hardware", prioridade: "média", status: "Aberto",
    tecnico: null, data: "2024-06-11T09:10:00", dataResolucao: null,
    comentarios: [],
    imagem: null,
  },
  {
    id: 4, usuario: "Fernanda Souza", descricao: "Rede Wi-Fi do galpão B intermitente. Coletores de dados perdem conexão com frequência.",
    categoria: "rede", prioridade: "alta", status: "Em andamento",
    tecnico: "Roberto Faria", data: "2024-06-11T10:00:00", dataResolucao: null,
    comentarios: [
      { autor: "Roberto Faria", texto: "Access point com falha identificado. Aguardando equipamento de substituição.", data: "2024-06-11T12:30:00" },
    ],
    imagem: null,
  },
  {
    id: 5, usuario: "Lucas Oliveira", descricao: "Email corporativo não sincroniza no celular do supervisor de turno.",
    categoria: "comunicação", prioridade: "baixa", status: "Resolvido",
    tecnico: "Juliana Costa", data: "2024-06-09T14:00:00", dataResolucao: "2024-06-09T15:30:00",
    comentarios: [
      { autor: "Juliana Costa", texto: "Configuração de perfil Exchange refeita. Sincronização normalizada.", data: "2024-06-09T15:30:00" },
    ],
    imagem: null,
  },
  {
    id: 6, usuario: "Carla Nunes", descricao: "Sistema de ponto eletrônico não reconhece biometria de 3 funcionários.",
    categoria: "software", prioridade: "média", status: "Aberto",
    tecnico: null, data: "2024-06-12T07:45:00", dataResolucao: null,
    comentarios: [],
    imagem: null,
  },
  {
    id: 7, usuario: "Marcos Alves", descricao: "Câmera de segurança do setor de embalagem offline há 2 dias.",
    categoria: "comunicação", prioridade: "alta", status: "Resolvido",
    tecnico: "Carlos Mendes", data: "2024-06-08T16:00:00", dataResolucao: "2024-06-09T09:00:00",
    comentarios: [
      { autor: "Carlos Mendes", texto: "Cabo de rede danificado. Substituído. Câmera online.", data: "2024-06-09T09:00:00" },
    ],
    imagem: null,
  },
  {
    id: 8, usuario: "Tatiana Lima", descricao: "Notebook do gerente de produção com tela piscando. Impossível utilizar.",
    categoria: "hardware", prioridade: "alta", status: "Aberto",
    tecnico: null, data: "2024-06-12T08:30:00", dataResolucao: null,
    comentarios: [],
    imagem: null,
  },
]
