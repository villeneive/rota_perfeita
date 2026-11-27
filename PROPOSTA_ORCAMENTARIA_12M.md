# PROPOSTA TÉCNICO-COMERCIAL E ORÇAMENTÁRIA — SISTEMA ROTA PERFEITA

- **Proponente / Integradora Tecnológica:** Equipe **Truck Tracker** — Engenharia de Sistemas Logísticos, Telemetria & IA
- **Objeto:** Ampliação e modernização tecnológica embarcada em **650 caminhões pesados**, implantação da Torre de Controle Logística **Rota Perfeita**, Gêmeo Digital de Peças, Multimídia CarPlay de Cabine e Sustentação Operacional (12 meses)
- **Teto Orçamentário Estabelecido:** `R$ 12.000.000,00`
- **Valor Global da Proposta (Turnkey — Ano 1):** **`R$ 11.838.500,00`** *(margem de segurança abaixo do teto: `R$ 161.500,00`)*
- **Validade da Proposta:** 30 dias corridos · Moeda: Real (`BRL`)

---

## 1. Sumário Executivo e Premissas de Realismo

Esta proposta estrutura a modernização tecnológica de **650 caminhões da frota** dentro do limite máximo de `R$ 12.000.000,00`, destinando **65,1% de todo o investimento diretamente aos ativos rodantes** (equipamentos embarcados em lote corporativo B2B, instalação eletroeletrônica 24V em pátio e conectividade híbrida).

Para garantir viabilidade financeira real sem comprometer a cobertura nacional:
1. **Escala nos Caminhões (650 unidades ativas + 20 kits reserva):** Todos os 650 caminhões recebem central multimídia pesada 10" (padrão CarPlay), gateway CAN-Bus J1939/OBD-II com processamento em borda (Edge AI), conjunto de 4 câmeras **RotaCAM** com gravação SSD, sensores físicos de tanque/freios/baú e conectividade **Dual-SIM 5G/4G Multi-Operadora + contingência satelital M2M**.
2. **Alocação Inteligente de Banda Larga Satelital LEO:** Em vez de instalar antenas satelitais de alto custo em veículos que rodam apenas em rodovias já cobertas por 4G/5G (como eixo SP–RJ–PR), concentram-se **100 terminais satelitais LEO (Starlink Mobilidade)** exclusivamente na subfrota que opera em corredores de sombra crítica (Norte e Centro-Oeste: BR-153, BR-163 e BR-364).
3. **Faturamento Transparente sem Bitributação:** Os equipamentos embarcados (Bloco A) e a nuvem/APIs (Bloco B) são faturados diretamente pelos fabricantes/provedores homologados contra o CNPJ da transportadora sob gestão técnica da **Truck Tracker**, enquanto o Bloco C remunera formalmente a **Equipe Truck Tracker** pelo desenvolvimento das aplicações, IA, implantação e licenciamento SaaS.

---

## 2. Quadro Resumo Consolidado do Orçamento (Ano 1)

| Bloco Orçamentário | Escopo Principal | Valor Total (`BRL`) | Participação |
|---|---|---:|---:|
| **Bloco A — Tecnologia Embarcada nos Caminhões** | Equipagem completa de **650 caminhões** + 100 antenas LEO + 20 kits reserva (RMA) + instalação 24V | `R$ 7.704.500,00` | **65,1%** |
| **Bloco B — Infraestrutura Cloud, GPU & APIs (12m)** | Servidores Cloud/GPU sob demanda, Google Maps Routes/Traffic API, clima, risco e mensageria IoT | `R$ 1.056.000,00` | **8,9%** |
| **Bloco C — Equipe Truck Tracker (Aplicações, IA & SaaS)** | Engenharia Web/CarPlay/Firmware, IA Preditiva, rollout em pátio e licença SaaS + suporte 24x7 (12m) | `R$ 3.078.000,00` | **26,0%** |
| **TOTAL GLOBAL DO PROJETO (ANO 1)** | **650 caminhões operacionais (`R$ 18.213,08`/caminhão tudo incluso no Ano 1)** | **`R$ 11.838.500,00`** | **100,0%** |

---

## 3. Detalhamento Analítico por Bloco

### 3.1 Bloco A — Ampliação Tecnológica nos Caminhões (650 Unidades)
*Custo médio de hardware, conectividade embarcada e instalação por caminhão: **`R$ 11.853,08 / veículo`** (cotação atacado frotista B2B).*

| Item | Especificação Técnica Embarcada | Qtd. | Valor Unitário | Subtotal (`BRL`) |
|---|---|---:|---:|---:|
| **A.1** | Central Multimídia Industrial 10" Antirreflexo (CarPlay, GPS Offline, Comando de Voz, 24V) | 650 un. | `R$ 1.480,00` | `R$ 962.000,00` |
| **A.2** | Gateway Telemetria CAN-Bus SAE J1939 / OBD-II + Unidade Edge AI (leitura RPM, bicos, falhas) | 650 un. | `R$ 2.200,00` | `R$ 1.430.000,00` |
| **A.3** | Conjunto **RotaCAM IA** (MDVR SSD + 4 Câmeras Full-HD IP68 IR: frontal, fadiga DMS e pontos cegos) | 650 un. | `R$ 2.900,00` | `R$ 1.885.000,00` |
| **A.4** | Kit Sensores de Integridade (sonda capacitiva de diesel no tanque, térmico de freio/eixo e trava de baú) | 650 un. | `R$ 1.950,00` | `R$ 1.267.500,00` |
| **A.5** | Modem Dual-SIM 5G/4G Multi-Operadora + Contingência Satelital M2M (hardware + franquia 12 meses) | 650 un. | `R$ 1.620,00` | `R$ 1.053.000,00` |
| **A.6** | Terminal Satelital Banda Larga LEO (Starlink Mobilidade) p/ subfrota em rotas críticas sem rede celular | 100 un. | `R$ 3.200,00` | `R$ 320.000,00` |
| **A.7** | Instalação Eletroeletrônica 24V em Pátio, Chicotes Corrugados Blindados e Calibração Individual | 650 serv. | `R$ 920,00` | `R$ 598.000,00` |
| **A.8** | Lote Técnico de Reposição Imediata nos Hubs (~3% *Spare Parts* / RMA p/ zero caminhão parado) | 20 kits | `R$ 9.450,00` | `R$ 189.000,00` |
| — | **Subtotal Bloco A (Frota Equipada: 650 Caminhões)** | — | — | **`R$ 7.704.500,00`** |

### 3.2 Bloco B — Infraestrutura Cloud, Processamento IA e APIs (12 Meses)

| Item | Descrição de Infraestrutura e Licenciamento de Terceiros | Período | Mensalidade | Subtotal (`BRL`) |
|---|---|---:|---:|---:|
| **B.1** | Cluster Cloud Elástico + Instâncias GPU sob demanda (Motor IA Preditiva, Roteirização e Gêmeo Digital) | 12 meses | `R$ 46.000,00` | `R$ 552.000,00` |
| **B.2** | Licenças Corporativas Google Maps Platform (Routes API, Tráfego Real-Time), Radar Climático e Risco | 12 meses | `R$ 27.500,00` | `R$ 330.000,00` |
| **B.3** | Broker IoT de Alta Disponibilidade (MQTT/Kafka), Segurança Zero-Trust (mTLS/WAF) e Backups | 12 meses | `R$ 14.500,00` | `R$ 174.000,00` |
| — | **Subtotal Bloco B (Cloud & APIs — Ano 1)** | — | **`R$ 88.000,00`** | **`R$ 1.056.000,00`** |

### 3.3 Bloco C — Engenharia de Aplicação, Implantação e SaaS (**Equipe Truck Tracker**)

| Item | Entregável sob Responsabilidade da Equipe Truck Tracker | Escopo / Métrica | Valor (`BRL`) |
|---|---|---|---:|
| **C.1** | **Plataforma Web Torre de Controle:** Painel geoespacial em tempo real, Gêmeo Digital 1:1, Match de Frete de Retorno e Gestão de Hubs/ZMRC | Projeto Fechado | `R$ 760.000,00` |
| **C.2** | **Aplicação Embarcada CarPlay & Integração IoT:** Interface de cabine por motorista/placa, integração RotaCAM 4 câmeras e parser CAN J1939 | Projeto Fechado | `R$ 620.000,00` |
| **C.3** | **Motor de IA Preditiva ("IA GOAT"):** Algoritmos de desgaste térmico/mecânico de peças, score horário de risco criminal/climático e Eco-Driving | Projeto Fechado | `R$ 490.000,00` |
| **C.4** | **Implantação, Integração ERP/TMS & Treinamento:** Conector fiscal/manifesto (MDF-e/CT-e), acompanhamento em pátio e capacitação de 650+ motoristas | Projeto Fechado | `R$ 350.000,00` |
| **C.5** | **Licenciamento SaaS Truck Tracker & Suporte 24x7 (SLA 99,9%):** `R$ 110,00`/caminhão/mês × 650 caminhões × 12 meses (evolução contínua e Nível 3) | 12 × `R$ 71.500,00` | `R$ 858.000,00` |
| — | **Subtotal Bloco C (Faturamento Bruto Equipe Truck Tracker — Ano 1)** | — | **`R$ 3.078.000,00`** |

---

## 4. Estrutura de Custos e Ganho Líquido da Equipe Truck Tracker (DRE do Contrato)

Demonstrativo transparente da viabilidade econômica para a **Truck Tracker**, comprovando cobertura integral da folha de engenharia, encargos tributários e margem líquida saudável de software B2B:

### 4.1 Alocação da Squad Dedicada Truck Tracker (12 Meses)

| Função na Equipe Truck Tracker | Profissionais | Custo Mensal Total | Custo Anual (`12m`) |
|---|---:|---:|---:|
| Arquiteto de Software Sênior / Tech Lead | 1 | `R$ 18.000,00` | `R$ 216.000,00` |
| Engenheiros Full-Stack (Torre Web, Mapas & Integrações TMS) | 2 | `R$ 26.000,00` | `R$ 312.000,00` |
| Engenheiros Mobile/CarPlay & Sistemas Embarcados CAN-Bus | 2 | `R$ 28.000,00` | `R$ 336.000,00` |
| Engenheiro de Dados & Machine Learning (IA Preditiva) | 1 | `R$ 15.000,00` | `R$ 180.000,00` |
| Especialista em UX Automotivo, QA & Homologação de Hardware | 1 | `R$ 10.000,00` | `R$ 120.000,00` |
| Coordenador de Implantação em Campo & Suporte Nível 3 | 1 | `R$ 10.000,00` | `R$ 120.000,00` |
| **Total da Folha / Alocação Técnica (8 Especialistas)** | **8** | **`R$ 107.000,00`** | **`R$ 1.284.000,00`** |

### 4.2 Demonstrativo de Resultado (Ganho Real da Truck Tracker)

| Linha Financeira (DRE Truck Tracker — Ano 1) | Valor (`BRL`) | % s/ Receita TT |
|---|---:|---:|
| **(+) Receita Bruta de Engenharia, Implantação e SaaS (Bloco C)** | **`R$ 3.078.000,00`** | **100,0%** |
| (-) Tributos sobre Nota Fiscal de Serviços/Software (Lucro Presumido: ISS, PIS, COFINS, IRPJ, CSLL ~14,0%) | `- R$ 430.920,00` | 14,0% |
| (-) Custo Direto da Squad de Engenharia e Implantação (8 profissionais × 12 meses) | `- R$ 1.284.000,00` | 41,7% |
| (-) Despesas Operacionais (viagens técnicas aos hubs, bancada de testes CAN, licenças DevSecOps e adm.) | `- R$ 141.080,00` | 4,6% |
| **(=) GANHO LÍQUIDO (LUCRO LÍQUIDO) DA EQUIPE TRUCK TRACKER NO ANO 1** | **`R$ 1.222.000,00`** | **39,7%** |
| **(+) Receita Recorrente Anual Garantida a partir do Ano 2 (ARR SaaS — 650 caminhões × `R$ 110`/mês)** | **`R$ 858.000,00` / ano** | *Lucro líq. ~`R$ 471.900`/ano* |

---

## 5. Retorno sobre o Investimento (ROI) para o Cliente e Cronograma de Desembolso

### 5.1 Viabilidade Econômica para a Transportadora (Premissas Conservadoras)
Considerando **650 caminhões** rodando em média `10.500 km/mês` (`6.825.000 km/mês` na frota):
- **Economia direta em diesel (`-8,5%` via telemetria CAN + condução assistida CarPlay):** `R$ 1.180.000,00 / mês`
- **Redução de frete morto (alocação de cargas de retorno em apenas 15% das viagens ociosas):** `R$ 585.000,00 / mês`
- **Queda em manutenção corretiva na estrada (Gêmeo Digital de peças) e redução de prêmio de seguro/sinistros:** `R$ 347.500,00 / mês`
- **Benefício Operacional Mensal Consolidado:** **`R$ 2.112.500,00 / mês`** (`R$ 3.250,00` de ganho mensal por caminhão equipado, equivalente a **`R$ 25.350.000,00 / ano`**).
- **Payback do Investimento Integral (`R$ 11,84M`):** **5,6 meses** após entrada em operação plena · **ROI Líquido no Ano 1:** **114,1%**.

### 5.2 Cronograma Físico-Financeiro de Execução (4 Marcos — 24 Semanas)

| Etapa | Prazo | Entregas Físicas nos Caminhões e Software | Desembolso (`BRL`) | % |
|---|---|---|---|---:|
| **Marco 1 — Mobilização & Lote Piloto** | Semanas 1 a 6 | Compra do 1º lote de hardware, arquitetura Cloud/CAN, app base e piloto validado em **50 caminhões** | `R$ 3.551.550,00` | 30% |
| **Marco 2 — Escala Industrial Fase I** | Semanas 7 a 12 | Entrega da Torre de Controle Web + CarPlay + instalação homologada em **+250 caminhões** (acum. 300) | `R$ 3.551.550,00` | 30% |
| **Marco 3 — Escala Nacional Fase II** | Semanas 13 a 18 | Ativação da IA Preditiva de peças/risco + instalação nos **+350 caminhões finais** (**650 ativos**) | `R$ 2.959.625,00` | 25% |
| **Marco 4 — Operação Assistida & SaaS** | Semanas 19 a 24 (+ suporte até mês 12) | Aceite definitivo (Go-Live Nacional), integração TMS concluída e sustentação mensal SaaS/Cloud | `R$ 1.775.775,00` | 15% |
| **Total Contratual** | **12 Meses** | **650 Caminhões Modernizados + Plataforma Completa + Suporte 24x7** | **`R$ 11.838.500,00`** | **100%** |
