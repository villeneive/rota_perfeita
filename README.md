# Rota Perfeita — Arquitetura Enterprise, SRS & Protótipo

Documentação executiva e de engenharia do sistema **Rota Perfeita** (Torre de Controle Logística com IA Preditiva, Gêmeo Digital, Telemetria Satelital LEO e Multimídia de Cabine).

- **Protótipo Único Interativo:** [`index.html`](./index.html)

---

## 1. Proposta Comercial e Justificativa Técnica

### 1.1 Problema vs. Solução (Base: Frota de 500 Caminhões Pesados)

| Dor Operacional | Solução Rota Perfeita | Impacto / ROI Mensurável |
|---|---|---|
| Alto consumo de diesel e desgaste prematuro | Telemetria OBD-II/CAN J1939 + sensores capacitivos de tanque + Copiloto Eco-Driving IA GOAT | Redução de R$ 5,94/km para **R$ 4,82/km** (-18,8% a -21%) |
| Frete morto (retorno vazio ~38% das viagens) | Motor geoespacial de Match de Retorno em tempo real no corredor da rota | Ocupação de retorno elevada para **>94%** (+28% margem líquida) |
| Roubo de carga e sinistros climáticos | Bloqueio dinâmico de rodovias por mancha criminal horária + radar meteorológico + trava satelital | **-92% em sinistros** e -35% no prêmio de seguro (RCTR-C/RC-DC) |
| Ociosidade por Lei do Descanso (Lei 13.103/2015) | Orquestração *drop-and-hook* em Hubs de revezamento (troca de carreta/motorista) | Ativo rodando **22h/dia** legalmente (+40% giro de frota) |
| Restrições urbanas de peso (ZMRC) e quebras | Sugestão automática de baldeação p/ VUC + Manutenção Preditiva via Gêmeo Digital | **-78% em panes na estrada** e -22% no custo de última milha |

- **Payback Estimado:** 7,4 meses | **ROI em 24 meses:** 342% (economia líquida anual projetada: R$ 54,8 milhões).

### 1.2 Stack Tecnológica Enterprise

- **IA Preditiva ("IA GOAT") & Roteirização:** Cluster Cloud GPU NVIDIA H200 + NVIDIA cuOpt (VRP dinâmico `< 500 ms`) + PyTorch / TensorRT + Apache Kafka & Apache Flink.
- **Digital Twin (Gêmeo Digital):** NVIDIA Omniverse / Azure Digital Twins sincronizado a 10 Hz por veículo (motor, freios, pneus TPMS, suspensão e consumo).
- **Telemetria IoT & Borda (Edge AI):** Módulo embarcado NVIDIA Jetson Orin Nano + interface CAN-Bus SAE J1939 / OBD-II + sensor ultrassônico/capacitivo de diesel (`±0,2%`) + **RotaCAM** (4 câmeras PoE Full-HD IR com visão computacional ADAS/DMS).
- **Conectividade Híbrida:** Antenas planas **Starlink Flat High Performance (LEO)** em movimento + Dual-SIM 5G Multi-Operadora com failover SD-WAN sub-segundo + cache SQLite criptografado em borda.
- **Segurança & Cabine:** HSM Automotivo TPM 2.0, mTLS 1.3 + AES-256-GCM; Central Multimídia 10" antirreflexo Android Automotive com síntese e comando de voz offline.

### 1.3 Orçamento Estimado — Ano 1 (500 Caminhões)

| Categoria | Investimento (Ano 1) | Justificativa Técnica |
|---|---|---|
| Infraestrutura Cloud & Cluster GPU IA | R$ 4.800.000 | Instâncias NVIDIA H200 redundantes multi-região, streaming Kafka/Flink e réplicas Digital Twin em tempo real (`<500 ms` p99). |
| Hardware IoT, RotaCAM & Satélite LEO | R$ 11.250.000 | Kits por caminhão (Jetson Orin Edge, terminal Starlink móvel, 4 câmeras RotaCAM IR, leitor CAN J1939, sensores de tanque e TPM 2.0). |
| Desenvolvimento & Engenharia Sênior | R$ 6.400.000 | Squads dedicadas (Arquitetura Distribuída, MLOps/Visão Computacional, Engenharia Embarcada CAN, UX Cabine Nielsen, SecOps). |
| Licenças de APIs & Dados Externos | R$ 1.550.000 | Mapas HD logísticos (restrição de altura/peso/pedágio por eixo), radar meteorológico hiperlocal, bases de inteligência criminal SSP/seguradoras e bolsas de frete. |
| **Total CAPEX + OPEX Ano 1** | **R$ 24.000.000** | **Retorno bruto anual de ~R$ 54,8M em economia de diesel, frete de retorno e queda de sinistralidade.** |

### 1.4 Cronograma Macro de Execução (12 Sprints / 24 Semanas)

| Fase | Sprints | Entregáveis Principais | Marco |
|---|---|---|---|
| 1. Fundação & Telemetria Edge | Sprints 1–3 | Ingestão CAN/OBD-II + sensores de tanque, failover 5G/Starlink e segurança mTLS/TPM 2.0 | Telemetria Real-Time |
| 2. Gêmeo Digital & IA GOAT | Sprints 4–6 | Réplica Digital Twin da frota, modelos preditivos de falha/consumo e motor NVIDIA cuOpt (`<500 ms`) | Motor Preditivo Ativo |
| 3. Reversa, Hubs & Risco | Sprints 7–9 | Match de frete de retorno, orquestrador de revezamento/baldeação VUC e bloqueio dinâmico de risco | Torre de Controle Web |
| 4. Cabine UX & Rollout Nacional | Sprints 10–12 | Multimídia GPS + RotaCAM validado pelas Heurísticas de Nielsen, piloto em 50 carretas e escala p/ 500 | **Go-Live Nacional** |

---

## 2. Engenharia de Requisitos (SRS Enxuto)

### 2.1 Requisitos Funcionais (RF01 a RF08)

| ID | Módulo | Requisito Funcional |
|---|---|---|
| **RF01** | Telemetria e Consumo Real | Integrar sensores IoT no tanque e barramento OBD-II/CAN J1939 para calcular em tempo real o gasto exato em `R$/km`, ajustando a rota conforme peso atual (PBTC) e altimetria. |
| **RF02** | Telemetria e Consumo Real | Analisar cubagem, peso e restrições municipais (ex: ZMRC) para recomendar baldeação de carreta pesada para caminhões menores (VUC/Toco) em hubs urbanos. |
| **RF03** | IA "GOAT" Preditiva | Monitorar condução (RPM, frenagem brusca, inércia em rampa) via ML e orientar marcha/velocidade ideal na cabine em linguagem simples para economia de diesel. |
| **RF04** | Logística Reversa & Hubs | Identificar caminhões em retorno vazio (frete morto) e alocar cargas compatíveis em tempo real no corredor da rota, rateando o custo operacional. |
| **RF05** | Logística Reversa & Hubs | Calcular janelas e hubs estratégicos para troca de motoristas ou desengate rápido de semirreboques (*drop-and-hook*), operando 24h sem violar a Lei 13.103/2015. |
| **RF06** | Gestão de Risco Dinâmico | Cruzar manchas criminais por faixa horária, severidade climática e tráfego para bloquear rotas perigosas (ex: madrugada/tempestade) e desviar automaticamente. |
| **RF07** | IA "GOAT" Preditiva | Processar sinais térmicos/vibração do motor e freios junto às 4 câmeras **RotaCAM** para manutenção preditiva antes de pane na rodovia e eliminação de pontos cegos. |
| **RF08** | Multimídia do Motorista | Exibir guia visual de faixa estilo rodoviário e avisos sonoros/visuais não-técnicos na central multimídia, seguindo as Heurísticas de Usabilidade de Nielsen. |

### 2.2 Requisitos Não-Funcionais (RNF01 a RNF05)

| ID | Categoria | Especificação Mensurável |
|---|---|---|
| **RNF01** | Baixa Latência / Big Data | Recalcular milhões de variáveis (tráfego, clima, risco, PBTC e cargas de retorno) e atualizar a rota ativa em **`< 500 ms` (p99)** via cluster GPU. |
| **RNF02** | Conectividade Satélite & Offline | Operar em malha híbrida 5G Dual-SIM + Satélite LEO (Starlink) com buffer local Edge AI para **zero perda de pacotes** e navegação offline integral em áreas remotas. |
| **RNF03** | Gêmeo Digital (Digital Twin) | Manter réplica virtual 1:1 de cada caminhão na nuvem (sincronismo 10 Hz) para simular desgaste mecânico, consumo e baldeação antes e durante a viagem. |
| **RNF04** | Segurança Zero-Trust | Criptografar localização, telemetria e manifesto de carga ponta a ponta (`AES-256-GCM` + `mTLS 1.3` + `TPM 2.0`) com detecção de *jamming* e bloqueio autônomo via satélite. |
| **RNF05** | Usabilidade (Nielsen) | Interface de cabine sem jargão técnico, contraste `>= 7:1` (WCAG AAA), botões `>= 48px`, máximo de 1 alerta prioritário por vez, leitura por voz e confirmação em 1 toque. |

### 2.3 Fórmulas das Regras de Negócio

**1. Custo Total Líquido da Rota ($CT_{rota}$) e Custo Real por Quilômetro ($C_{km}$):**

$$CT_{rota} = \sum_{i=1}^{n} d_i \cdot \left[ \frac{P_{diesel}}{\eta_0} \cdot \left(1 + \alpha \cdot \frac{M_{carga,i}}{M_{max}} + \beta \cdot I_{relevo,i}\right) + C_{manut,i} \right] + C_{pedagio}(E) + C_{motorista}(t) + C_{baldeacao} - R_{retorno}$$

$$C_{km} = \frac{CT_{rota}}{\sum_{i=1}^{n} d_i}$$

**2. Score de Risco Dinâmico ($SR(t) \in [0, 100]$):**

$$SR(t) = \min\Big(100,\; 100 \cdot \big(0{,}35 \cdot I_{crim}(r,h) + 0{,}25 \cdot I_{clima}(r,t) + 0{,}20 \cdot V_{carga} + 0{,}10 \cdot F_{condutor}(t) + 0{,}10 \cdot S_{sombra}(r)\big)\Big)$$

- **Gatilho de Bloqueio Automático (`RF06`):** Se $SR(t) \ge 70$, o trecho $r$ recebe bloqueio imediato no grafo e a IA GOAT recalcula desvio seguro em `< 500 ms`.

---

## 3. Modelagem UML (Mermaid.js)

### 3.1 Diagrama de Casos de Uso
```mermaid
flowchart LR
  MOT["Ator: Motorista"]
  TOR["Ator: Torre de Controle"]
  GOAT["Ator: IA GOAT (GPU)"]
  IOT["Ator: Sensores IoT / OBD-II / Starlink"]

  subgraph RP["Sistema Rota Perfeita"]
    UC1["UC01: Calcular Custo Real R$/km por Carga"]
    UC2["UC02: Sugerir Baldeação p/ VUC Urbano"]
    UC3["UC03: Guiar Condução Eco-Driving e Prever Falhas"]
    UC4["UC04: Alocar Frete de Retorno (Zero Frete Morto)"]
    UC5["UC05: Orquestrar Revezamento em Hub (Lei Descanso)"]
    UC6["UC06: Bloquear Rota de Risco por Horário/Clima"]
    UC7["UC07: Navegar via Multimídia e RotaCAM 4 Câmeras"]
  end

  IOT --> UC1
  IOT --> UC3
  GOAT --> UC1
  GOAT --> UC2
  GOAT --> UC3
  GOAT --> UC4
  GOAT --> UC5
  GOAT --> UC6
  TOR --> UC2
  TOR --> UC4
  TOR --> UC5
  TOR --> UC6
  MOT --> UC3
  MOT --> UC5
  MOT --> UC7
```

### 3.2 Diagrama de Classes
```mermaid
classDiagram
  class Caminhao {
    +String idVeiculo
    +String placa
    +String tipo Conjunto_VUC
    +Float pesoAtualTons
    +Float capacidadeMaxTons
    +String linkAtivo_5G_Starlink
    +calcularCustoAtualKm() Float
    +solicitarBaldeacaoVUC() Boolean
  }

  class TelemetriaOBD {
    +DateTime timestamp
    +Float nivelTanqueLitros
    +Float consumoInstantaneoKmL
    +Int rpmMotor
    +Float tempFreiosC
    +lerBarramentoCAN() TelemetriaOBD
  }

  class GemeoDigital {
    +String idReplica
    +Float indiceSaudeMecanica
    +Float desgastePrevistoFreios
    +simularViagemPrevia(Rota) Float
    +preverFalhaMecanica() AlertaCabine
  }

  class Rota {
    +String idRota
    +List~Trecho~ trechos
    +Float distanciaTotalKm
    +Float custoTotalLiquido
    +Int scoreRiscoAtual
    +aplicarDesvioSeguro(List~Trecho~) Void
  }

  class MotorIAGoat {
    +Int latenciaMs
    +recalcularRotaSub500ms(Caminhao, Rota) Rota
    +avaliarRiscoHorarioClima(Rota, Int) Int
    +buscarMatchRetorno(Caminhao) FreteRetorno
    +orquestrarHubRevezamento(Caminhao, Caminhao) HubRevezamento
  }

  class FreteRetorno {
    +String idCarga
    +String origemColeta
    +Float pesoTons
    +Float receitaLiquida
    +alocarAoVeiculo(Caminhao) Void
  }

  class HubRevezamento {
    +String idHub
    +String rodoviaKm
    +DateTime janelaEncontro
    +validarLeiDescanso(String) Boolean
    +registrarTrocaCarreta(Caminhao, Caminhao) Void
  }

  class AlertaCabine {
    +String tipo Eco_Seguranca_Hub
    +String mensagemSimples
    +Boolean leituraVozAtiva
    +exibirNoMultimidia() Void
  }

  Caminhao "1" *-- "1" TelemetriaOBD : coleta 10Hz
  Caminhao "1" -- "1" GemeoDigital : sincroniza
  Caminhao "1" --> "1" Rota : percorre
  MotorIAGoat ..> Rota : otimiza
  MotorIAGoat ..> FreteRetorno : aloca
  MotorIAGoat ..> HubRevezamento : agenda
  MotorIAGoat ..> AlertaCabine : emite
```

### 3.3 Diagrama de Sequência (Recálculo `<500 ms` por Risco ou Frete de Retorno)
```mermaid
sequenceDiagram
  autonumber
  participant IOT as Sensores OBD-II & Starlink
  participant TWIN as Gêmeo Digital (Cloud)
  participant GOAT as Motor IA GOAT (GPU)
  participant TORRE as Torre de Controle Web
  participant CAB as Multimídia Motorista

  IOT->>TWIN: Stream mTLS (GPS, Peso PBTC, RPM, Clima Local)
  TWIN->>GOAT: Atualiza estado da frota + consulta Risco/Bolsas Frete
  alt Score de Risco >= 70 (Ex: BR-X às 22h + Chuva Intensa)
    GOAT->>GOAT: Bloqueia trecho crítico e recalcula grafo (<500ms)
    GOAT-->>TORRE: Atualiza Mapa Brasil + KPI Risco (86 -> 19/100)
    GOAT-->>CAB: Push Alerta Simples + Voz ("Evitando BR-X p/ sua segurança")
    CAB-->>IOT: Confirma recebimento via link redundante LEO/5G
  else Caminhão Vazio Detectado (Frete Morto no Retorno)
    GOAT->>GOAT: Match geoespacial de carga no raio da rota (<500ms)
    GOAT-->>TORRE: Exibe card "Oportunidade de Retorno" (+R$ líquidos)
    TORRE->>GOAT: Aprova alocação (ou auto-match parametrizado)
    GOAT-->>CAB: Atualiza parada de coleta clara no Guia de Estrada
  end
```
