// Rota Perfeita — Mapa Real (Google Routes API / Leaflet), Inspeção IA de Peças e Multimídia CarPlay

function calcRouteCost({ km, dieselPrice, baseKmL, loadTons, maxTons, slopeIdx = 0.15, toll = 0, driverCost = 0, transshipment = 0, backhaulRevenue = 0 }) {
  const loadFactor = 1 + 0.28 * (loadTons / maxTons) + 0.12 * slopeIdx;
  const fuelPerKm = (dieselPrice / baseKmL) * loadFactor;
  const maintPerKm = 0.92;
  const total = km * (fuelPerKm + maintPerKm) + toll + driverCost + transshipment - backhaulRevenue;
  return { total, perKm: total / km };
}

function calcRiskScore({ crimeIdx, weatherIdx, cargoValIdx, fatigueIdx, shadowIdx }) {
  return Math.min(
    100,
    Math.round(100 * (0.35 * crimeIdx + 0.25 * weatherIdx + 0.20 * cargoValIdx + 0.10 * fatigueIdx + 0.10 * shadowIdx))
  );
}

// Decodificador de Polyline Oficial da Google Routes API v2
function decodeGooglePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

(function selfCheck() {
  const c1 = calcRouteCost({ km: 434, dieselPrice: 6.1, baseKmL: 2.55, loadTons: 28.4, maxTons: 30, toll: 380, driverCost: 420 });
  console.assert(c1.perKm > 4 && c1.perKm < 7, 'Custo/km fora do esperado');
  console.assert(calcRiskScore({ crimeIdx: 0.92, weatherIdx: 0.88, cargoValIdx: 0.85, fatigueIdx: 0.15, shadowIdx: 0.25 }) >= 70, 'Risco crítico inválido');
})();

// Frota Real posicionada nas Rodovias Federais do Brasil (Coordenadas Reais Lat/Lng)
const fleet = [
  {
    id: 'CAM-01',
    driver: 'Seu Carlos Silva',
    model: 'Carreta 6 Eixos',
    route: 'São Paulo, SP → Rio de Janeiro, RJ (BR-116)',
    status: 'optimal',
    loadTons: 28.4,
    maxTons: 30,
    kmL: 2.42,
    costKm: 4.88,
    tankDesc: 'Meio tanque (+410 km)',
    restMin: 38,
    speedKmh: 78,
    idealKmh: 70,
    link: 'Starlink LEO + 5G',
    health: 'Saúde 98%',
    aiNote: 'IA GOAT: Reduzir p/ 70 km/h na subida (+4% diesel)',
    driverTip: 'Reduza para 70 km/h nos próximos 5 km para economizar 4% de diesel na subida.',
    hubNotice: 'Parada no Hub Km 120 (Resende-RJ) p/ troca de carreta c/ Caminhão B · Vaga 04 pronta.',
    waypoints: [[-23.5505, -46.6333], [-23.1896, -45.8841], [-22.8268, -45.1931], [-22.4705, -44.4509], [-22.7556, -43.4603], [-22.9068, -43.1729]],
    t: 0.34,
    step: 0.00055
  },
  {
    id: 'CAM-04',
    driver: 'Marcos Lima',
    model: 'Graneleiro · Vazio',
    route: 'Goiânia, GO → São Paulo, SP (BR-050)',
    status: 'empty',
    loadTons: 0.0,
    maxTons: 30,
    kmL: 3.15,
    costKm: 5.64,
    tankDesc: '3/4 tanque (+620 km)',
    restMin: 95,
    speedKmh: 80,
    idealKmh: 80,
    link: '5G + Satélite Standby',
    health: 'Vazio · Match IA',
    aiNote: 'Coletar 18t em Uberlândia (+R$ 6.400 líquidos)',
    driverTip: 'Mantenha 80 km/h constantes na BR-050 para máxima eficiência.',
    hubNotice: 'Coleta de retorno sugerida em Uberlândia (9 km da rodovia).',
    waypoints: [[-16.6869, -49.2648], [-18.4192, -49.2153], [-18.9186, -48.2772], [-21.1704, -47.8103], [-22.9099, -47.0626], [-23.5505, -46.6333]],
    t: 0.32,
    step: 0.0006
  },
  {
    id: 'CAM-08',
    driver: 'João Pedro',
    model: 'Cavalo + Baú (Revezamento)',
    route: 'Rio de Janeiro, RJ → Hub Resende (BR-116)',
    status: 'hub',
    loadTons: 26.0,
    maxTons: 30,
    kmL: 2.48,
    costKm: 4.76,
    tankDesc: 'Tanque cheio (+780 km)',
    restMin: 38,
    speedKmh: 74,
    idealKmh: 75,
    link: '5G + Starlink Ativo',
    health: 'Encontro em 38m',
    aiNote: 'Troca de semirreboque agendada c/ CAM-01 em Resende',
    driverTip: 'Ritmo ideal! Chegada sincronizada com o CAM-01 sem fila.',
    hubNotice: 'Estacione na Vaga 04 do Hub Resende para troca de carreta.',
    waypoints: [[-22.9068, -43.1729], [-22.7152, -43.5553], [-22.5202, -44.1041], [-22.4705, -44.4509]],
    t: 0.48,
    step: 0.0005
  },
  {
    id: 'CAM-12',
    driver: 'André Souza',
    model: 'Carreta 30t (Baldeação VUC)',
    route: 'Curitiba, PR → Hub Guarulhos, SP (BR-116)',
    status: 'hub',
    loadTons: 29.8,
    maxTons: 30,
    kmL: 2.36,
    costKm: 4.91,
    tankDesc: 'Meio tanque (+390 km)',
    restMin: 52,
    speedKmh: 72,
    idealKmh: 70,
    link: 'Starlink LEO Ativo',
    health: 'Baldeação ZMRC',
    aiNote: 'Transferir carga p/ 3 VUCs elétricos no Hub Guarulhos',
    driverTip: 'Use freio-motor na Serra do Cafezal para poupar os freios.',
    hubNotice: 'Evite a Marginal: pare na Doca 02 em Guarulhos p/ baldeação aos VUCs.',
    waypoints: [[-25.4284, -49.2733], [-24.4979, -47.8449], [-23.9819, -46.8833], [-23.4543, -46.5337]],
    t: 0.58,
    step: 0.00055
  },
  {
    id: 'CAM-15',
    driver: 'Raimundo Neto',
    model: 'Carreta Sider',
    route: 'Belém, PA → Goiânia, GO (BR-153)',
    status: 'optimal',
    loadTons: 25.2,
    maxTons: 30,
    kmL: 2.51,
    costKm: 4.72,
    tankDesc: '2/3 tanque (+530 km)',
    restMin: 110,
    speedKmh: 76,
    idealKmh: 75,
    link: 'Starlink LEO Exclusivo',
    health: 'Saúde 99%',
    aiNote: 'Área sem sinal celular · 100% conectado via Starlink LEO',
    driverTip: 'Pista livre à frente na BR-153. Mantenha 75 km/h.',
    hubNotice: 'Parada segura programada em Palmas (Posto Conveniado).',
    waypoints: [[-1.4558, -48.4902], [-5.5266, -47.4797], [-10.184, -48.3336], [-16.6869, -49.2648]],
    t: 0.44,
    step: 0.00045
  },
  {
    id: 'CAM-19',
    driver: 'Roberto Alves',
    model: 'Bitrem 37t',
    route: 'Cuiabá, MT → Goiânia, GO (BR-364)',
    status: 'optimal',
    loadTons: 36.5,
    maxTons: 38,
    kmL: 2.28,
    costKm: 4.79,
    tankDesc: 'Tanque cheio (+710 km)',
    restMin: 84,
    speedKmh: 75,
    idealKmh: 75,
    link: 'Starlink LEO Ativo',
    health: 'Saúde 97%',
    aiNote: 'Pressão dos 22 pneus e temperatura dos eixos estáveis',
    driverTip: 'Condução exemplar! Economia de 5% acima da meta hoje.',
    hubNotice: 'Descanso reservado no Hub Rondonópolis às 22:15.',
    waypoints: [[-15.6014, -56.0979], [-16.4673, -54.6372], [-17.8814, -51.7144], [-16.6869, -49.2648]],
    t: 0.42,
    step: 0.0005
  },
  {
    id: 'CAM-23',
    driver: 'Paulo Nunes',
    model: 'Baú Refrigerado (-18 °C)',
    route: 'Salvador, BA → Recife, PE (BR-101)',
    status: 'optimal',
    loadTons: 22.1,
    maxTons: 28,
    kmL: 2.59,
    costKm: 4.61,
    tankDesc: 'Meio tanque (+440 km)',
    restMin: 65,
    speedKmh: 78,
    idealKmh: 78,
    link: '5G + Starlink',
    health: 'Frio -18 °C OK',
    aiNote: 'Termometria da câmara fria cravada em -18,2 °C',
    driverTip: 'Baú refrigerado operando 100%. Siga na faixa direita.',
    hubNotice: 'Descarga direta no CD Recife Sul com senha liberada.',
    waypoints: [[-12.9714, -38.5014], [-10.9472, -37.0731], [-9.6658, -35.735], [-8.0476, -34.877]],
    t: 0.36,
    step: 0.0006
  },
  {
    id: 'CAM-27',
    driver: 'Sérgio Moraes',
    model: 'Carreta Prancha',
    route: 'Porto Alegre, RS → Curitiba, PR (BR-101)',
    status: 'optimal',
    loadTons: 24.0,
    maxTons: 30,
    kmL: 2.46,
    costKm: 4.81,
    tankDesc: '3/4 tanque (+590 km)',
    restMin: 72,
    speedKmh: 73,
    idealKmh: 75,
    link: '5G Multi-Operadora',
    health: 'Saúde 98%',
    aiNote: 'Fluxo normal no litoral catarinense · Sem retenções',
    driverTip: 'Vento lateral moderado em Laguna: mantenha 70 km/h na ponte.',
    hubNotice: 'Ponto de descanso em Joinville disponível em 1h 12m.',
    waypoints: [[-30.0346, -51.2177], [-28.6775, -49.3697], [-27.5954, -48.548], [-26.3045, -48.8487], [-25.4284, -49.2733]],
    t: 0.51,
    step: 0.00055
  }
];

// Subsistemas do Módulo de Inspeção IA de Peças do Caminhão
const truckParts = [
  {
    key: 'engine',
    num: 1,
    name: 'Motor Turbo-Diesel & Injeção',
    code: 'Protocolo SAE J1939 · Amostragem 100 ms',
    health: 98,
    status: 'ok',
    m1: '91 °C (Óleo normal)',
    m2: '2,1 bar (Turbo OK)',
    m3: '0,14 g (Vibração limpa)',
    m4: '14.200 km p/ revisão',
    verdict: 'Queima equilibrada nos 6 cilindros e bicos injetores calibrados. Sem risco de falha mecânica.'
  },
  {
    key: 'gearbox',
    num: 2,
    name: 'Transmissão Automatizada & Embreagem',
    code: 'Sensor TCU · Caixa 12 Velocidades',
    health: 96,
    status: 'ok',
    m1: '78 °C (Fluido OK)',
    m2: 'Desgaste disco: 12%',
    m3: 'Trocas suaves IA',
    m4: '38.000 km restantes',
    verdict: 'Trocas de marcha sincronizadas com a topografia da rodovia pela IA GOAT, reduzindo desgaste.'
  },
  {
    key: 'tanks',
    num: 3,
    name: 'Tanques de Diesel Duplos & Arla 32',
    code: 'Sensor Ultrassônico/Capacitivo (±0,2%)',
    health: 99,
    status: 'ok',
    m1: '412 L / 700 L (59%)',
    m2: 'Vazão: 2,42 km/L',
    m3: 'Arla 32: 74% nível',
    m4: 'Zero vazamento/furto',
    verdict: 'Curva de consumo compatível com carga de 28,4t. Nenhuma queda abrupta de nível detectada.'
  },
  {
    key: 'starlink',
    num: 4,
    name: 'Antena Starlink LEO + Câmeras RotaCAM',
    code: 'SD-WAN Híbrido 5G + Satélite Baixa Órbita',
    health: 100,
    status: 'ok',
    m1: 'Latência: 142 ms',
    m2: 'Uptime: 99,98%',
    m3: '4 Câmeras PoE IR OK',
    m4: 'Lentes limpas / REC',
    verdict: 'Visibilidade 360° ativa sem pontos cegos e telemetria contínua mesmo em serras sem sinal 5G.'
  },
  {
    key: 'coupling',
    num: 5,
    name: 'Quinta Roda, Pino-Rei & Suspensão Ar',
    code: 'Células de Carga por Eixo + Trava Eletrônica',
    health: 97,
    status: 'ok',
    m1: 'Carga: 28,4 t (PBTC)',
    m2: 'Trava: Engatada OK',
    m3: 'Bolsas ar: 6,8 bar',
    m4: '22.500 km p/ lubrif.',
    verdict: 'Peso distribuído uniformemente entre cavalo e semirreboque. Trava antifurto selada.'
  },
  {
    key: 'battery',
    num: 6,
    name: 'Sistema 24V, Alternador & Edge AI TPM',
    code: 'NVIDIA Jetson Orin + Chip Cripto TPM 2.0',
    health: 98,
    status: 'ok',
    m1: 'Tensão: 28,1 V',
    m2: 'GPU Borda: 54 °C',
    m3: 'Cripto AES-256 OK',
    m4: 'Baterias 95% SoH',
    verdict: 'Alimentação elétrica estável, processamento local ativo e telemetria criptografada ponta a ponta.'
  },
  {
    key: 'brakes',
    num: 7,
    name: 'Freios Pneumáticos ABS/EBS (6 Eixos)',
    code: 'Sensores Térmicos e Espessura de Lonas',
    health: 94,
    status: 'ok',
    m1: 'Temp. máx: 138 °C',
    m2: 'Linha ar: 8,4 bar',
    m3: 'Lonas: 82% vida',
    m4: '18.600 km restantes',
    verdict: 'Temperatura simétrica em todos os tambores/discos. Frenagem regenerativa/motor operando bem.'
  },
  {
    key: 'tires',
    num: 8,
    name: 'Conjunto de 22 Pneus (Sensores TPMS)',
    code: 'Monitoramento Sem Fio de Pressão e Banda',
    health: 95,
    status: 'ok',
    m1: 'Pressão: 115 PSI',
    m2: 'Temp. banda: 52 °C',
    m3: 'Sulco médio: 11,4 mm',
    m4: '26.000 km estimados',
    verdict: 'Calibragem ideal em todos os 22 pneus, evitando arrasto extra e economizando até 3% de diesel.'
  }
];

const radioStations = [
  'Rádio Estrada Brasil · Boletim BR-116',
  'Sertanejo Estrada · Clássicos da Rodovia',
  'Canal PX Digital · Avisos da Frota',
  'Boletim Clima & Polícia Rodoviária'
];

const state = {
  mainView: 'tower',
  selectedTruckId: 'CAM-01',
  selectedPartKey: 'engine',
  simSpeed: 1,
  riskActive: false,
  partAnomalyActive: false,
  backhaulDone: false,
  vucDone: false,
  savingsTotal: 418400,
  radioIdx: 0,
  radioPlaying: true,
  carplayApp: 'split',
  carplaySat: false,
  showHubs: true,
  showRisk: false,
  gmapsKey: '',
  usingNativeGoogle: false,
  dashOffset: 0
};

const statusColors = { optimal: '#10b981', empty: '#f59e0b', hub: '#38bdf8', danger: '#ef4444' };

// Ícones SVG Vetoriais Nativos
const svgIcons = {
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="12" x2="18.5" y2="5.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  navigation: '<polygon points="3 11 21 3 13 21 11 13 3 11"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.8"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  fuel: '<rect x="4" y="4" width="10" height="16" rx="1"/><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  repeat: '<polyline points="17 2 21 6 17 10"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 22 3 18 7 14"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  'package-plus': '<path d="M21 10V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l2-1.1"/><path d="M16 19h6M19 16v6"/>',
  'git-fork': '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9M12 13v2"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
};

function mountIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const key = el.getAttribute('data-icon');
    const size = el.getAttribute('data-size') || '18';
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcons[key] || '<circle cx="12" cy="12" r="8"/>'}</svg>`;
  });
}

// ==================== ENGINE DE MAPA REAL (LEAFLET + GOOGLE ROUTES API / OSRM) ====================
let towerMap = null;
let carplayMap = null;
let towerTileLayer = null;
let carplayTileLayer = null;
let activeRoutePolyline = null;
let detourRoutePolyline = null;
let carplayRoutePolyline = null;
let hubLayerGroup = null;
let riskCircleLayer = null;
const leafletTruckMarkers = {};
let carplayTruckMarker = null;

// Google Maps Native instances (quando API key oficial é ativada)
let gTowerMap = null;
let gCarplayMap = null;
let gRoutePoly = null;
let gCarplayPoly = null;
const gTruckMarkers = {};
let gCarplayMarker = null;

const TILE_URLS = {
  road: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

function interpLatLng(pts, t) {
  if (!pts || pts.length < 2) return [-23.5505, -46.6333];
  const segs = pts.length - 1;
  const scaled = Math.min(0.9999, Math.max(0, t)) * segs;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const [lat1, lng1] = pts[idx];
  const [lat2, lng2] = pts[idx + 1];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

function initRealMaps() {
  if (typeof window.L === 'undefined') {
    renderGeoFallbackBrazilMap();
    return;
  }

  // 1. Mapa Principal da Torre de Controle (Formato Real do Brasil)
  towerMap = L.map('towerMapCanvas', { zoomControl: true }).fitBounds([
    [-33.75, -73.98],
    [5.27, -34.79]
  ]);

  towerTileLayer = L.tileLayer(TILE_URLS.road, {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap · Rota Perfeita IA'
  }).addTo(towerMap);

  // Hubs estratégicos
  hubLayerGroup = L.layerGroup().addTo(towerMap);
  const hubs = [
    { pos: [-22.4705, -44.4509], label: 'Hub Km 120 (Resende-RJ)' },
    { pos: [-23.4543, -46.5337], label: 'Hub VUC (Guarulhos-SP)' },
    { pos: [-18.9186, -48.2772], label: 'Coleta Retorno (Uberlândia 18t)' }
  ];
  hubs.forEach((h) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="rp-hub-marker">${h.label}</div>`,
      iconAnchor: [55, 14]
    });
    L.marker(h.pos, { icon }).addTo(hubLayerGroup);
  });

  // Mancha de Risco Dinâmico (Serra das Araras / BR-116 às 22h)
  riskCircleLayer = L.circle([-22.66, -43.86], {
    radius: 26000,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.28,
    weight: 2
  }).bindPopup('<strong>BR-X / Serra Bloqueada (22h)</strong><br>Score de Risco: 86/100 (Horário + Tempestade)');

  // Marcadores em tempo real dos 8 caminhões
  fleet.forEach((tr) => {
    const pos = interpLatLng(tr.waypoints, tr.t);
    const marker = L.marker(pos, { icon: createTruckDivIcon(tr) }).addTo(towerMap);
    marker.on('click', () => {
      selectTruck(tr.id);
      towerMap.panTo(interpLatLng(tr.waypoints, tr.t));
    });
    leafletTruckMarkers[tr.id] = marker;
  });

  // 2. Mapa Real da Central Multimídia CarPlay
  carplayMap = L.map('carplayMapCanvas', { zoomControl: false }).setView([-23.05, -45.3], 9);
  carplayTileLayer = L.tileLayer(TILE_URLS.road, { maxZoom: 19 }).addTo(carplayMap);

  const cam01Pos = interpLatLng(fleet[0].waypoints, fleet[0].t);
  carplayTruckMarker = L.marker(cam01Pos, { icon: createTruckDivIcon(fleet[0]) }).addTo(carplayMap);

  // Traça a rota rodoviária real inicial (São Paulo -> Rio de Janeiro)
  computeAndRenderRealRoute([-23.5505, -46.6333], [-22.9068, -43.1729], 'São Paulo, SP', 'Rio de Janeiro, RJ', false);
}

function createTruckDivIcon(tr) {
  const color = statusColors[tr.status] || '#10b981';
  const border = tr.id === state.selectedTruckId ? '#ffffff' : color;
  return L.divIcon({
    className: '',
    html: `<div class="rp-truck-marker" style="border-color:${border}"><span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block"></span><span>${tr.id}</span></div>`,
    iconAnchor: [38, 14]
  });
}

// Consulta Real de Rota: Google Routes API v2 (se chave ativa) ou OSRM Real Road Routing API
async function fetchRoadRouteGeometry(originLatLng, destLatLng, viaPoint = null) {
  // 1. Tenta Google Routes API v2 Oficial se chave foi informada
  if (state.gmapsKey) {
    try {
      const body = {
        origin: { location: { latLng: { latitude: originLatLng[0], longitude: originLatLng[1] } } },
        destination: { location: { latLng: { latitude: destLatLng[0], longitude: destLatLng[1] } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL'
      };
      if (viaPoint) {
        body.intermediates = [{ location: { latLng: { latitude: viaPoint[0], longitude: viaPoint[1] } } }];
      }
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': state.gmapsKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const r = data.routes[0];
          const coords = decodeGooglePolyline(r.polyline.encodedPolyline);
          const km = Math.round(r.distanceMeters / 1000);
          const mins = Math.round(parseInt(r.duration, 10) / 60);
          return { coords, km, mins, provider: 'Google Routes API v2' };
        }
      }
    } catch (_) {
      // Continua para roteamento rodoviário OSRM caso a chave não tenha Routes API habilitada
    }
  }

  // 2. Roteamento Rodoviário Real via OSRM (Ruas e BRs reais do Brasil sem exigir chave)
  try {
    const coordsQuery = viaPoint
      ? `${originLatLng[1]},${originLatLng[0]};${viaPoint[1]},${viaPoint[0]};${destLatLng[1]},${destLatLng[0]}`
      : `${originLatLng[1]},${originLatLng[0]};${destLatLng[1]},${destLatLng[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const r = data.routes[0];
        const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const km = Math.round(r.distance / 1000);
        const mins = Math.round(r.duration / 60);
        return { coords, km, mins, provider: 'Malha Rodoviária Real' };
      }
    }
  } catch (_) {
    // Fallback offline usando waypoints reais da BR
  }

  const fallbackCoords = viaPoint ? [originLatLng, viaPoint, destLatLng] : fleet[0].waypoints;
  return { coords: fallbackCoords, km: 434, mins: 335, provider: 'Cache Satélite Offline' };
}

async function computeAndRenderRealRoute(originLatLng, destLatLng, originName, destName, zoomToRoute = true) {
  const result = await fetchRoadRouteGeometry(originLatLng, destLatLng);
  const cost = calcRouteCost({
    km: result.km,
    dieselPrice: 6.1,
    baseKmL: 2.45,
    loadTons: 28.4,
    maxTons: 30,
    toll: Math.round(result.km * 0.88),
    driverCost: Math.round((result.mins / 60) * 68)
  });

  const hours = Math.floor(result.mins / 60);
  const remMins = result.mins % 60;

  document.getElementById('activeRouteSummary').textContent =
    `Rota Real (${result.provider}): ${originName} → ${destName} · ${result.km} km · ${hours}h ${remMins}m · R$ ${formatBRL(cost.perKm)}/km (Total R$ ${Math.round(cost.total).toLocaleString('pt-BR')})`;

  // Atualiza waypoints do CAM-01 e rota geodésica
  fallbackActiveRoute = result.coords;
  if (result.coords.length > 2) {
    const stepStride = Math.max(1, Math.floor(result.coords.length / 40));
    fleet[0].waypoints = result.coords.filter((_, i) => i % stepStride === 0 || i === result.coords.length - 1);
  }
  updateFallbackMapFrame();

  if (state.usingNativeGoogle && gTowerMap && window.google) {
    if (gRoutePoly) gRoutePoly.setMap(null);
    if (gCarplayPoly) gCarplayPoly.setMap(null);
    const path = result.coords.map(([lat, lng]) => ({ lat, lng }));
    gRoutePoly = new google.maps.Polyline({ path, strokeColor: '#10b981', strokeOpacity: 0.92, strokeWeight: 5, map: gTowerMap });
    gCarplayPoly = new google.maps.Polyline({ path, strokeColor: '#38bdf8', strokeOpacity: 0.95, strokeWeight: 6, map: gCarplayMap });
    if (zoomToRoute) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      gTowerMap.fitBounds(bounds);
    }
    return;
  }

  if (towerMap && window.L) {
    if (activeRoutePolyline) towerMap.removeLayer(activeRoutePolyline);
    activeRoutePolyline = L.polyline(result.coords, { color: '#059669', weight: 5, opacity: 0.9 }).addTo(towerMap);
    if (zoomToRoute) towerMap.fitBounds(activeRoutePolyline.getBounds(), { padding: [30, 30] });
  }

  if (carplayMap && window.L) {
    if (carplayRoutePolyline) carplayMap.removeLayer(carplayRoutePolyline);
    carplayRoutePolyline = L.polyline(result.coords, { color: '#0284c7', weight: 6, opacity: 0.92 }).addTo(carplayMap);
  }
}

function calculateCustomRealRoute() {
  const [origCoord, origLabel] = document.getElementById('routeOriginSelect').value.split('|');
  const [destCoord, destLabel] = document.getElementById('routeDestSelect').value.split('|');
  const o = origCoord.split(',').map(Number);
  const d = destCoord.split(',').map(Number);
  computeAndRenderRealRoute(o, d, origLabel, destLabel, true);
  showToast(`Calculando rota rodoviária real: ${origLabel} → ${destLabel}...`);
}

function setMapTileStyle(styleKey) {
  fallbackStyle = styleKey;
  ['Road', 'Sat', 'Dark'].forEach((s) => {
    const el = document.getElementById(`btnTile${s}`);
    if (el) el.classList.remove('active');
  });
  if (styleKey === 'road') document.getElementById('btnTileRoad').classList.add('active');
  if (styleKey === 'satellite') document.getElementById('btnTileSat').classList.add('active');
  if (styleKey === 'dark') document.getElementById('btnTileDark').classList.add('active');

  updateFallbackMapFrame();

  if (state.usingNativeGoogle && gTowerMap && window.google) {
    gTowerMap.setMapTypeId(styleKey === 'satellite' ? 'hybrid' : 'roadmap');
    return;
  }

  if (towerMap && towerTileLayer && TILE_URLS[styleKey]) {
    towerMap.removeLayer(towerTileLayer);
    towerTileLayer = L.tileLayer(TILE_URLS[styleKey], { maxZoom: 19 }).addTo(towerMap);
  }
}

function fitBrazilBounds() {
  const fbSvg = document.getElementById('fallbackTowerSvg');
  if (fbSvg) fbSvg.setAttribute('viewBox', '0 0 760 510');
  if (state.usingNativeGoogle && gTowerMap && window.google) {
    const b = new google.maps.LatLngBounds({ lat: -33.75, lng: -73.98 }, { lat: 5.27, lng: -34.79 });
    gTowerMap.fitBounds(b);
    return;
  }
  if (towerMap) {
    towerMap.fitBounds([
      [-33.75, -73.98],
      [5.27, -34.79]
    ]);
  }
}

function focusSelectedTruckOnMap() {
  const tr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
  const pos = interpLatLng(tr.waypoints, tr.t);
  const fbSvg = document.getElementById('fallbackTowerSvg');
  if (fbSvg) {
    const [cx, cy] = projBr(pos);
    fbSvg.setAttribute('viewBox', `${(cx - 140).toFixed(0)} ${(cy - 95).toFixed(0)} 280 190`);
  }
  if (state.usingNativeGoogle && gTowerMap) {
    gTowerMap.setCenter({ lat: pos[0], lng: pos[1] });
    gTowerMap.setZoom(9);
    return;
  }
  if (towerMap) towerMap.setView(pos, 8);
}

function toggleTowerLayer(type) {
  if (type === 'hubs') {
    state.showHubs = !state.showHubs;
    document.getElementById('btnLayerHubs').classList.toggle('active', state.showHubs);
    if (towerMap && hubLayerGroup) {
      if (state.showHubs) hubLayerGroup.addTo(towerMap);
      else towerMap.removeLayer(hubLayerGroup);
    }
  } else if (type === 'risk') {
    state.showRisk = !state.showRisk;
    document.getElementById('btnLayerRisk').classList.toggle('active', state.showRisk);
    if (towerMap && riskCircleLayer) {
      if (state.showRisk) riskCircleLayer.addTo(towerMap);
      else towerMap.removeLayer(riskCircleLayer);
    }
  }
  updateFallbackMapFrame();
}

// Ativação Opcional da API Nativa Google Maps JavaScript + Google Traffic + Routes API v2
function toggleGoogleApiDrawer() {
  document.getElementById('googleApiDrawer').classList.toggle('hidden');
}

function applyGoogleMapsKey() {
  const key = document.getElementById('gmapsKeyInput').value.trim();
  if (!key) {
    showToast('Informe uma chave válida Google Maps API (AIza...).');
    return;
  }
  state.gmapsKey = key;
  try {
    localStorage.setItem('RP_GMAPS_KEY', key);
  } catch (_) {}

  window.gm_authFailure = function () {
    state.usingNativeGoogle = false;
    showToast('Chave Google Maps sem faturamento/permissão ativa. Mantendo Mapa Real Padrão.');
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
  script.async = true;
  script.onload = () => {
    if (!window.google || !window.google.maps) return;
    state.usingNativeGoogle = true;
    document.getElementById('apiEngineStatus').textContent = 'Google Maps Ativo';
    document.getElementById('googleApiDrawer').classList.add('hidden');

    if (towerMap) {
      towerMap.remove();
      towerMap = null;
    }
    if (carplayMap) {
      carplayMap.remove();
      carplayMap = null;
    }

    gTowerMap = new google.maps.Map(document.getElementById('towerMapCanvas'), {
      center: { lat: -15.78, lng: -47.93 },
      zoom: 4,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });
    const traffic = new google.maps.TrafficLayer();
    traffic.setMap(gTowerMap);

    gCarplayMap = new google.maps.Map(document.getElementById('carplayMapCanvas'), {
      center: { lat: -23.05, lng: -45.3 },
      zoom: 11,
      disableDefaultUI: true,
      zoomControl: true
    });
    new google.maps.TrafficLayer().setMap(gCarplayMap);

    fleet.forEach((tr) => {
      const p = interpLatLng(tr.waypoints, tr.t);
      const m = new google.maps.Marker({
        position: { lat: p[0], lng: p[1] },
        map: gTowerMap,
        label: { text: tr.id, color: '#ffffff', fontSize: '11px', fontWeight: 'bold' },
        title: `${tr.id} · ${tr.route}`
      });
      m.addListener('click', () => selectTruck(tr.id));
      gTruckMarkers[tr.id] = m;
    });

    const p0 = interpLatLng(fleet[0].waypoints, fleet[0].t);
    gCarplayMarker = new google.maps.Marker({
      position: { lat: p0[0], lng: p0[1] },
      map: gCarplayMap,
      title: 'Seu Caminhão'
    });

    calculateCustomRealRoute();
    showToast('Google Maps JS + TrafficLayer + Google Routes API v2 ativados com sucesso!');
  };
  script.onerror = () => {
    showToast('Não foi possível carregar maps.googleapis.com. Mantendo Mapa Real Padrão.');
  };
  document.head.appendChild(script);
}

function clearGoogleMapsKey() {
  state.gmapsKey = '';
  try {
    localStorage.removeItem('RP_GMAPS_KEY');
  } catch (_) {}
  window.location.reload();
}

// Mapa Geodésico Interativo do Brasil em Coordenadas Reais (usado offline ou em sandboxes sem CDN externo)
let usingGeoFallback = false;
let fallbackStyle = 'road';
let fallbackActiveRoute = fleet[0].waypoints;

function projBr([lat, lng]) {
  return [((lng + 75.2) / 41.8) * 760, ((6.2 - lat) / 41.2) * 510];
}

function renderGeoFallbackBrazilMap() {
  usingGeoFallback = true;
  const brCoastAndBorder = [
    [4.44, -51.55], [2.15, -50.52], [0.18, -49.85], [-0.72, -48.12], [-1.52, -46.15], [-2.52, -44.28],
    [-2.88, -41.68], [-3.72, -38.52], [-5.12, -35.48], [-7.12, -34.82], [-8.05, -34.88], [-9.66, -35.73],
    [-10.95, -37.07], [-12.97, -38.51], [-14.79, -39.03], [-17.73, -39.26], [-20.31, -40.29], [-22.02, -41.05],
    [-22.91, -42.02], [-22.95, -43.18], [-23.35, -44.72], [-23.96, -46.33], [-25.52, -48.51], [-27.59, -48.55],
    [-29.33, -49.72], [-31.77, -51.35], [-33.74, -53.39], [-32.55, -53.72], [-30.89, -55.53], [-30.18, -57.58],
    [-28.18, -56.01], [-27.28, -55.58], [-25.59, -54.58], [-24.05, -54.31], [-22.54, -55.72], [-22.12, -57.92],
    [-19.01, -57.65], [-17.78, -57.72], [-16.28, -58.38], [-15.12, -60.15], [-13.58, -60.45], [-12.48, -64.32],
    [-10.88, -65.34], [-9.92, -67.82], [-11.02, -69.58], [-10.68, -70.52], [-9.42, -72.88], [-7.42, -73.98],
    [-6.68, -71.85], [-4.22, -69.94], [-1.95, -69.45], [-1.18, -69.52], [1.18, -69.85], [1.88, -67.08],
    [0.88, -66.15], [1.62, -63.88], [3.88, -64.55], [4.25, -61.22], [5.27, -60.21], [4.15, -59.75],
    [1.85, -58.85], [1.45, -56.45], [2.25, -54.55], [3.85, -52.25]
  ];

  const brPath = brCoastAndBorder
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${projBr(pt).map((n) => n.toFixed(1)).join(',')}`)
    .join(' ') + ' Z';

  const cities = [
    [-3.11, -60.02, 'Manaus'], [-1.45, -48.49, 'Belém'], [-3.73, -38.52, 'Fortaleza'],
    [-8.05, -34.88, 'Recife'], [-12.97, -38.51, 'Salvador'], [-15.79, -47.89, 'Brasília'],
    [-16.68, -49.26, 'Goiânia'], [-15.6, -56.09, 'Cuiabá'], [-19.91, -43.93, 'BH'],
    [-22.9, -43.17, 'Rio'], [-23.55, -46.63, 'São Paulo'], [-25.42, -49.27, 'Curitiba'],
    [-30.03, -51.21, 'Porto Alegre']
  ];

  const cityLabels = cities
    .map(([lat, lng, name]) => {
      const [x, y] = projBr([lat, lng]);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#94a3b8"/><text x="${(x + 6).toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="#cbd5e1" font-size="12">${name}</text>`;
    })
    .join('');

  const allRoads = fleet
    .map((tr) => {
      const d = tr.waypoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${projBr(pt).map((n) => n.toFixed(1)).join(',')}`).join(' ');
      return `<path d="${d}" fill="none" stroke="#2c4a68" stroke-width="2.2"/>`;
    })
    .join('');

  document.getElementById('towerMapCanvas').innerHTML = `
    <svg id="fallbackTowerSvg" viewBox="0 0 760 510" style="width:100%;height:100%;display:block;background:#071320">
      <path id="fbLandPath" d="${brPath}" fill="#12273c" stroke="#38bdf8" stroke-width="1.8"/>
      <g>${allRoads}</g>
      <g id="fbActiveRouteGroup"></g>
      <g id="fbRiskGroup"></g>
      <g id="fbHubsGroup"></g>
      <g>${cityLabels}</g>
      <g id="fbTrucksGroup"></g>
    </svg>`;

  document.getElementById('carplayMapCanvas').innerHTML = `
    <svg id="fallbackCarplaySvg" viewBox="0 0 600 380" style="width:100%;height:100%;display:block;background:#091826">
      <path d="${brPath}" fill="#132b40" stroke="#38bdf8" stroke-width="1.5"/>
      <g>${allRoads}</g>
      <g id="fbCpRouteGroup"></g>
      <g>${cityLabels}</g>
      <g id="fbCpTruckGroup"></g>
    </svg>`;

  updateFallbackMapFrame();
}

function updateFallbackMapFrame() {
  if (!usingGeoFallback) return;
  const land = document.getElementById('fbLandPath');
  const towerSvg = document.getElementById('fallbackTowerSvg');
  if (land && towerSvg) {
    if (fallbackStyle === 'satellite') {
      towerSvg.style.background = '#061a24';
      land.setAttribute('fill', '#163828');
    } else if (fallbackStyle === 'dark') {
      towerSvg.style.background = '#050a10';
      land.setAttribute('fill', '#0d1722');
    } else {
      towerSvg.style.background = '#071320';
      land.setAttribute('fill', '#12273c');
    }
  }

  const routeStr = fallbackActiveRoute
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${projBr(pt).map((n) => n.toFixed(1)).join(',')}`)
    .join(' ');
  const rGroup = document.getElementById('fbActiveRouteGroup');
  if (rGroup) {
    rGroup.innerHTML = `<path d="${routeStr}" fill="none" stroke="#10b981" stroke-width="4" ${state.riskActive ? 'stroke-dasharray="7 5"' : ''}/>`;
  }
  const cpRGroup = document.getElementById('fbCpRouteGroup');
  if (cpRGroup) {
    cpRGroup.innerHTML = `<path d="${routeStr}" fill="none" stroke="#38bdf8" stroke-width="4.5"/>`;
  }

  const hubsGrp = document.getElementById('fbHubsGroup');
  if (hubsGrp) {
    if (state.showHubs) {
      const [hx, hy] = projBr([-22.4705, -44.4509]);
      const [ux, uy] = projBr([-18.9186, -48.2772]);
      hubsGrp.innerHTML = `
        <rect x="${(hx - 6).toFixed(1)}" y="${(hy - 6).toFixed(1)}" width="12" height="12" rx="3" fill="#0369a1" stroke="#bae6fd"/>
        <rect x="${(ux - 6).toFixed(1)}" y="${(uy - 6).toFixed(1)}" width="12" height="12" rx="3" fill="#d97706" stroke="#fde68a"/>`;
    } else {
      hubsGrp.innerHTML = '';
    }
  }

  const riskGrp = document.getElementById('fbRiskGroup');
  if (riskGrp) {
    if (state.showRisk || state.riskActive) {
      const [rx, ry] = projBr([-22.66, -43.86]);
      riskGrp.innerHTML = `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="16" fill="#ef4444" fill-opacity="0.28" stroke="#ef4444" stroke-width="1.8"/>`;
    } else {
      riskGrp.innerHTML = '';
    }
  }

  const trGroup = document.getElementById('fbTrucksGroup');
  if (trGroup) {
    trGroup.innerHTML = fleet
      .map((tr) => {
        const pos = interpLatLng(tr.waypoints, tr.t);
        const [x, y] = projBr(pos);
        const color = statusColors[tr.status] || '#10b981';
        const selRing = tr.id === state.selectedTruckId ? `<circle cx="0" cy="0" r="11" fill="none" stroke="#ffffff" stroke-width="2"/>` : '';
        return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})" style="cursor:pointer" onclick="selectTruck('${tr.id}')">${selRing}<circle cx="0" cy="0" r="6" fill="${color}" stroke="#091017" stroke-width="1.5"/><text x="9" y="-6" fill="#f8fafc" font-size="12" font-weight="700">${tr.id}</text></g>`;
      })
      .join('');
  }

  // Atualiza câmera aproximada (GPS Chase View) na Multimídia CarPlay
  const cpSvg = document.getElementById('fallbackCarplaySvg');
  const cpTrGroup = document.getElementById('fbCpTruckGroup');
  const selTr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
  const selPos = interpLatLng(selTr.waypoints, selTr.t);
  const [cx, cy] = projBr(selPos);
  if (cpSvg) {
    cpSvg.setAttribute('viewBox', `${(cx - 95).toFixed(1)} ${(cy - 62).toFixed(1)} 190 124`);
  }
  if (cpTrGroup) {
    cpTrGroup.innerHTML = `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})"><circle cx="0" cy="0" r="9" fill="#0284c7" fill-opacity="0.3"/><circle cx="0" cy="0" r="5" fill="#10b981" stroke="#ffffff" stroke-width="2"/></g>`;
  }
}

// ==================== NAVEGAÇÃO ENTRE MÓDULOS E INTERAÇÕES ====================
function formatBRL(num) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function switchMainView(view) {
  state.mainView = view;
  document.getElementById('viewTower').classList.toggle('hidden', view !== 'tower');
  document.getElementById('viewInspector').classList.toggle('hidden', view !== 'inspector');
  document.getElementById('viewDriver').classList.toggle('hidden', view !== 'driver');

  document.getElementById('tabTowerBtn').classList.toggle('active', view === 'tower');
  document.getElementById('tabInspectorBtn').classList.toggle('active', view === 'inspector');
  document.getElementById('tabDriverBtn').classList.toggle('active', view === 'driver');

  if (view === 'inspector') document.getElementById('partAlertBadge').classList.add('hidden');
  if (view === 'driver') {
    document.getElementById('driverAlertBadge').classList.add('hidden');
    requestAnimationFrame(() => {
      if (carplayMap) carplayMap.invalidateSize();
      recenterCarPlayMap();
    });
  }
  if (view === 'tower') {
    requestAnimationFrame(() => {
      if (towerMap) towerMap.invalidateSize();
    });
  }
}

function populateTruckSelector() {
  const sel = document.getElementById('truckSelect');
  sel.innerHTML = fleet
    .map((tr) => `<option value="${tr.id}" ${tr.id === state.selectedTruckId ? 'selected' : ''}>${tr.id} · ${tr.model}</option>`)
    .join('');
}

function selectTruck(id) {
  state.selectedTruckId = id;
  const tr = fleet.find((item) => item.id === id) || fleet[0];

  const sel = document.getElementById('truckSelect');
  if (sel && sel.value !== id) sel.value = id;

  document.getElementById('twinRoute').textContent = `${tr.route} · Mot. ${tr.driver}`;
  document.getElementById('twinBadge').textContent = tr.health;
  document.getElementById('twinBadge').className =
    tr.status === 'empty' ? 'status-pill pill-amber' : tr.status === 'danger' ? 'status-pill pill-danger' : 'status-pill pill-emerald';
  document.getElementById('twinCostKm').textContent = `R$ ${formatBRL(tr.costKm)}/km`;
  document.getElementById('twinKmL').textContent = `${tr.kmL.toFixed(2).replace('.', ',')} km/L`;
  document.getElementById('twinWeight').textContent = `${tr.loadTons.toFixed(1).replace('.', ',')} t`;
  document.getElementById('twinLink').textContent = tr.link;
  document.getElementById('twinAiNote').textContent = tr.aiNote;

  document.getElementById('inspectorHeaderTitle').textContent = `Gêmeo Digital de Peças · ${tr.id} (${tr.model})`;

  // Atualiza CarPlay do Motorista
  document.getElementById('driverGreeting').textContent = `${tr.driver} · ${tr.id}`;
  document.getElementById('driverTipText').textContent = tr.driverTip;
  document.getElementById('driverHubText').textContent = tr.hubNotice;
  document.getElementById('driverSpeedVal').textContent = `${tr.speedKmh} km/h`;
  document.getElementById('idealSpeedSign').textContent = String(tr.idealKmh);
  document.getElementById('driverRestVal').textContent = `Faltam ${tr.restMin} min`;
  document.getElementById('driverTankVal').textContent = tr.tankDesc;

  fleet.forEach((item) => {
    if (leafletTruckMarkers[item.id]) leafletTruckMarkers[item.id].setIcon(createTruckDivIcon(item));
  });

  recenterCarPlayMap();
}

function updateFleetKpis() {
  const avg = fleet.reduce((acc, item) => acc + item.costKm, 0) / fleet.length;
  document.getElementById('kpiCostKm').textContent = `R$ ${formatBRL(avg)}/km`;
  document.getElementById('kpiSavings').textContent = `R$ ${state.savingsTotal.toLocaleString('pt-BR')}`;
}

// ==================== MÓDULO 2: INSPEÇÃO IA DE COMPONENTES ====================
function renderPartsList() {
  const container = document.getElementById('partsListContainer');
  container.innerHTML = truckParts
    .map((p) => {
      const pillCls = p.health >= 90 ? 'pill-emerald' : p.health >= 75 ? 'pill-amber' : 'pill-danger';
      const selectedCls = p.key === state.selectedPartKey ? 'part-btn selected' : 'part-btn';
      return `
        <button type="button" class="${selectedCls}" onclick="selectPart('${p.key}')">
          <div>
            <strong style="font-size:13px">${p.num}. ${p.name}</strong>
            <div style="font-size:12px;color:var(--text-secondary)">${p.m1}</div>
          </div>
          <span class="status-pill ${pillCls} mono-num">${p.health}%</span>
        </button>`;
    })
    .join('');

  const avgHealth = Math.round(truckParts.reduce((s, p) => s + p.health, 0) / truckParts.length);
  const badge = document.getElementById('overallHealthBadge');
  badge.textContent = `Integridade ${avgHealth}%`;
  badge.className = avgHealth >= 92 ? 'status-pill pill-emerald' : 'status-pill pill-amber';
}

function selectPart(partKey) {
  state.selectedPartKey = partKey;
  const p = truckParts.find((item) => item.key === partKey) || truckParts[0];

  document.getElementById('partDetailTitle').textContent = `${p.num}. ${p.name}`;
  document.getElementById('partDetailCode').textContent = p.code;
  document.getElementById('partDetailBadge').textContent = p.health >= 85 ? `${p.health}% Íntegro` : `${p.health}% Atenção IA`;
  document.getElementById('partDetailBadge').className = p.health >= 85 ? 'status-pill pill-emerald' : 'status-pill pill-danger';
  document.getElementById('partDetailPct').textContent = `${p.health}%`;
  document.getElementById('partDetailPct').className = p.health >= 85 ? 'mono-num text-emerald' : 'mono-num text-danger';

  const bar = document.getElementById('partDetailBar');
  bar.style.width = `${p.health}%`;
  bar.style.backgroundColor = p.health >= 85 ? '#10b981' : '#ef4444';

  document.getElementById('partMetric1').textContent = p.m1;
  document.getElementById('partMetric2').textContent = p.m2;
  document.getElementById('partMetric3').textContent = p.m3;
  document.getElementById('partMetric4').textContent = p.m4;
  document.getElementById('partAiVerdict').textContent = p.verdict;

  renderPartsList();
}

function simulatePartAnomaly() {
  state.partAnomalyActive = !state.partAnomalyActive;
  const brakes = truckParts.find((p) => p.key === 'brakes');
  const wheelRect = document.getElementById('svgBrakeWheelHighlight');
  const circle = document.getElementById('hotspotBrakesCircle');

  if (state.partAnomalyActive) {
    brakes.health = 62;
    brakes.m1 = 'Temp. Eixo 2 Dir: 214 °C';
    brakes.m3 = 'Lona direita: 24% (Gasta)';
    brakes.m4 = 'Revisar em até 180 km';
    brakes.verdict =
      'ALERTA PREDITIVO IA: Aquecimento assimétrico no tambor do 2º eixo direito da carreta. Risco de travamento evitado! Ordem de troca já reservada no Hub Km 120.';
    wheelRect.setAttribute('stroke', '#ef4444');
    wheelRect.setAttribute('fill', '#7f1d1d');
    circle.setAttribute('fill', '#ef4444');
    document.getElementById('simPartLabel').textContent = 'Restaurar Saúde das Peças';
    document.getElementById('partAlertBadge').classList.remove('hidden');
    selectPart('brakes');
    showToast('IA Preditiva detectou superaquecimento no Freio Eixo 2 (214 °C) antes de falha na estrada!');
  } else {
    brakes.health = 94;
    brakes.m1 = 'Temp. máx: 138 °C';
    brakes.m3 = 'Lonas: 82% vida';
    brakes.m4 = '18.600 km restantes';
    brakes.verdict = 'Temperatura simétrica em todos os tambores/discos. Frenagem regenerativa/motor operando bem.';
    wheelRect.setAttribute('stroke', '#38bdf8');
    wheelRect.setAttribute('fill', '#0f2942');
    circle.setAttribute('fill', '#10b981');
    document.getElementById('simPartLabel').textContent = 'Simular Desgaste Preditivo em Peça';
    selectPart('brakes');
    showToast('Manutenção concluída no Gêmeo Digital: todos os componentes 100% operacionais.');
  }
}

function schedulePreventiveOrder() {
  const p = truckParts.find((item) => item.key === state.selectedPartKey);
  showToast(`Ordem preventiva registrada no Hub Km 120 para: ${p.name} (Box 02 reservado sem atraso).`);
}

// ==================== MÓDULO 3: CARPLAY DA CABINE ====================
function switchCarPlayApp(app) {
  state.carplayApp = app;
  const isMapOrSplit = app === 'split' || app === 'map';

  document.getElementById('cpScreenSplitAndMap').classList.toggle('hidden', !isMapOrSplit);
  document.getElementById('cpRightWidgets').classList.toggle('hidden', app === 'map');
  document.getElementById('cpScreenSplitAndMap').style.gridTemplateColumns = app === 'map' ? '1fr' : '';

  document.getElementById('cpScreenCam').classList.toggle('hidden', app !== 'cam');
  document.getElementById('cpScreenPhone').classList.toggle('hidden', app !== 'phone');
  document.getElementById('cpScreenApps').classList.toggle('hidden', app !== 'apps');

  ['Split', 'Map', 'Cam', 'Phone', 'Apps'].forEach((name) => {
    document.getElementById(`cpBtn${name}`).classList.toggle('active', app === name.toLowerCase());
  });

  if (isMapOrSplit) {
    requestAnimationFrame(() => {
      if (carplayMap) carplayMap.invalidateSize();
      recenterCarPlayMap();
    });
  }
}

function recenterCarPlayMap() {
  const tr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
  const pos = interpLatLng(tr.waypoints, tr.t);
  if (state.usingNativeGoogle && gCarplayMap) {
    gCarplayMap.setCenter({ lat: pos[0], lng: pos[1] });
    gCarplayMap.setZoom(11);
    return;
  }
  if (carplayMap) carplayMap.setView(pos, 10);
}

function toggleCarPlaySatellite() {
  state.carplaySat = !state.carplaySat;
  if (state.usingNativeGoogle && gCarplayMap) {
    gCarplayMap.setMapTypeId(state.carplaySat ? 'hybrid' : 'roadmap');
    return;
  }
  if (carplayMap && carplayTileLayer) {
    carplayMap.removeLayer(carplayTileLayer);
    carplayTileLayer = L.tileLayer(state.carplaySat ? TILE_URLS.satellite : TILE_URLS.road, { maxZoom: 19 }).addTo(carplayMap);
  }
}

function changeRadioStation(dir) {
  state.radioIdx = (state.radioIdx + dir + radioStations.length) % radioStations.length;
  document.getElementById('cpMediaTitle').textContent = radioStations[state.radioIdx];
  showToast(`Sintonizado: ${radioStations[state.radioIdx]}`);
}

function toggleRadioPlay() {
  state.radioPlaying = !state.radioPlaying;
  document.getElementById('btnPlayPauseRadio').textContent = state.radioPlaying ? 'Tocando' : 'Pausado';
}

function triggerCarPlayCall(title, spokenMsg) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spokenMsg);
    u.lang = 'pt-BR';
    window.speechSynthesis.speak(u);
  }
  showToast(`${title}: ${spokenMsg}`);
}

// ==================== SIMULAÇÕES GLOBAIS (RISCO, FRETE DE RETORNO, BALDEAÇÃO) ====================
async function simulateRiskEvent() {
  state.riskActive = !state.riskActive;
  if (state.riskActive) {
    const score = calcRiskScore({ crimeIdx: 0.92, weatherIdx: 0.88, cargoValIdx: 0.85, fatigueIdx: 0.15, shadowIdx: 0.25 });
    document.getElementById('latencyReadout').textContent = '168 ms';
    document.getElementById('kpiRisk').textContent = `${score} → 19 / 100`;
    document.getElementById('kpiRiskSub').textContent = 'BR-X bloqueada (22h) · Desvio IA ativo';
    document.getElementById('simRiskLabel').textContent = 'Restaurar Rota Original';
    document.getElementById('driverAlertBadge').classList.remove('hidden');

    document.getElementById('signDistText').textContent = '350 m';
    document.getElementById('signRoadCode').textContent = 'Desvio Seguro IA · Via Patrulhada';
    document.getElementById('signRoadName').textContent = 'Pegue a Saída Segura à Direita ↗';
    document.getElementById('gpsEta').textContent = '21:52 (+12 min)';

    if (towerMap && riskCircleLayer) {
      state.showRisk = true;
      document.getElementById('btnLayerRisk').classList.add('active');
      riskCircleLayer.addTo(towerMap);
    }

    // Calcula rota real alternativa passando por rota segura no interior (ex: via Petrópolis/Teresópolis BR-040)
    const detour = await fetchRoadRouteGeometry([-23.5505, -46.6333], [-22.9068, -43.1729], [-22.505, -43.178]);
    if (towerMap && window.L) {
      if (detourRoutePolyline) towerMap.removeLayer(detourRoutePolyline);
      detourRoutePolyline = L.polyline(detour.coords, { color: '#10b981', weight: 5, dashArray: '8 6' }).addTo(towerMap);
      towerMap.fitBounds(detourRoutePolyline.getBounds(), { padding: [30, 30] });
    }

    showToast(`Risco ${score}/100 na Serra às 22h! Rota real desviada pela IA em 168 ms.`);
  } else {
    document.getElementById('latencyReadout').textContent = '142 ms';
    document.getElementById('kpiRisk').textContent = '18 / 100';
    document.getElementById('kpiRiskSub').textContent = '0 trechos bloqueados no momento';
    document.getElementById('simRiskLabel').textContent = 'Simular Risco / Recálculo IA';

    document.getElementById('signDistText').textContent = '4,8 km';
    document.getElementById('signRoadCode').textContent = 'BR-116 · Pres. Dutra';
    document.getElementById('signRoadName').textContent = 'Mantenha a Faixa da Direita ↑ ↑';
    document.getElementById('gpsEta').textContent = '21:40 (38 min)';

    if (towerMap) {
      if (detourRoutePolyline) towerMap.removeLayer(detourRoutePolyline);
      if (riskCircleLayer) towerMap.removeLayer(riskCircleLayer);
      state.showRisk = false;
      document.getElementById('btnLayerRisk').classList.remove('active');
    }
    showToast('Risco encerrado. Rota principal na BR-116 restaurada.');
  }
}

function allocateReturnFreight() {
  if (state.backhaulDone) return;
  state.backhaulDone = true;
  const cam04 = fleet.find((t) => t.id === 'CAM-04');
  cam04.status = 'optimal';
  cam04.model = 'Graneleiro · Carregado IA';
  cam04.loadTons = 18.0;
  cam04.costKm = 3.92;
  cam04.health = 'Retorno Alocado';
  cam04.aiNote = 'Carga de 18t alocada em Uberlândia (+R$ 6.400 líquidos)';

  state.savingsTotal += 6400;
  updateFleetKpis();
  populateTruckSelector();

  document.getElementById('kpiBackhaul').textContent = '96,8%';
  document.getElementById('kpiBackhaulSub').textContent = 'Zero carretas vazias no corredor';
  document.getElementById('backhaulTag').textContent = 'Alocado';
  document.getElementById('backhaulTag').className = 'status-pill pill-emerald';
  const btn = document.getElementById('btnMatchBackhaul');
  btn.textContent = 'Carga Alocada no CAM-04 (Rota Atualizada)';
  btn.disabled = true;

  selectTruck('CAM-04');
  focusSelectedTruckOnMap();
  showToast('Match de Retorno concluído em 134 ms: +R$ 6.400 líquidos no CAM-04!');
}

function authorizeVucTransshipment() {
  if (state.vucDone) return;
  state.vucDone = true;
  const cam12 = fleet.find((t) => t.id === 'CAM-12');
  cam12.status = 'optimal';
  cam12.costKm = 3.84;
  cam12.health = '3 VUCs Alocados';
  cam12.aiNote = 'Baldeação confirmada no Hub Guarulhos (-22% R$/km)';

  state.savingsTotal += 2950;
  updateFleetKpis();
  const btn = document.getElementById('btnAuthorizeVuc');
  btn.textContent = '3 VUCs Reservados na Doca 02 (Guarulhos)';
  btn.disabled = true;

  selectTruck('CAM-12');
  showToast('Baldeação confirmada: carga do CAM-12 dividida p/ 3 VUCs elétricos na entrada de SP.');
}

function toggleDayNightTheme() {
  const isDay = document.body.classList.toggle('theme-day');
  document.getElementById('themeBtnLabel').textContent = isDay ? 'Modo Noite' : 'Modo Sol';
}

function toggleSimulationSpeed() {
  state.simSpeed = state.simSpeed === 1 ? 3 : state.simSpeed === 3 ? 0 : 1;
  document.getElementById('simSpeedText').textContent =
    state.simSpeed === 0 ? 'Frota Pausada' : `Velocidade Frota: ${state.simSpeed}x`;
}

function ackDriverCard(btnId, text) {
  const btn = document.getElementById(btnId);
  btn.textContent = text;
  btn.disabled = true;
  document.getElementById('driverSpeedVal').textContent = '70 km/h';
  showToast('Velocidade de economia confirmada na cabine.');
}

function speakDriverGuidance() {
  const tr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
  const msg = `Olá ${tr.driver}. ${tr.driverTip} Rota segura ativa evitando trecho de risco às vinte e duas horas. ${tr.hubNotice}`;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = 'pt-BR';
    window.speechSynthesis.speak(u);
  }
  showToast('Assistente CarPlay: reproduzindo orientações por voz.');
}

function toggleCameraExpand(camEl) {
  camEl.classList.toggle('expanded');
}

function updateClocks() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('cpClock');
  if (el) el.textContent = `${hh}:${mm}`;
}

let toastTimer;
function showToast(message) {
  const el = document.getElementById('sysToast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4300);
}

// Loop de Movimentação Real nas Estradas do Brasil
function animateRealFleet() {
  if (state.simSpeed > 0) {
    fleet.forEach((tr) => {
      tr.t = (tr.t + tr.step * state.simSpeed) % 1;
      const pos = interpLatLng(tr.waypoints, tr.t);

      if (leafletTruckMarkers[tr.id]) {
        leafletTruckMarkers[tr.id].setLatLng(pos);
      }
      if (gTruckMarkers[tr.id] && window.google) {
        gTruckMarkers[tr.id].setPosition({ lat: pos[0], lng: pos[1] });
      }
      if (tr.id === state.selectedTruckId) {
        if (carplayTruckMarker) carplayTruckMarker.setLatLng(pos);
        if (gCarplayMarker && window.google) gCarplayMarker.setPosition({ lat: pos[0], lng: pos[1] });
      }
    });

    updateFallbackMapFrame();
    state.dashOffset = (state.dashOffset - 0.6 * state.simSpeed) % 18;
    document.querySelectorAll('.road-dash-line').forEach((line) => {
      line.setAttribute('stroke-dashoffset', state.dashOffset.toFixed(1));
    });
  }
  requestAnimationFrame(animateRealFleet);
}

function initSystem() {
  mountIcons();
  populateTruckSelector();
  renderPartsList();
  selectPart('engine');
  updateFleetKpis();
  initRealMaps();
  selectTruck('CAM-01');
  updateClocks();
  setInterval(updateClocks, 10000);

  try {
    const savedKey = localStorage.getItem('RP_GMAPS_KEY');
    if (savedKey) {
      document.getElementById('gmapsKeyInput').value = savedKey;
      applyGoogleMapsKey();
    }
  } catch (_) {}

  requestAnimationFrame(animateRealFleet);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSystem);
} else {
  initSystem();
}
