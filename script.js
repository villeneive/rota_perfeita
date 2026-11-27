// Rota Perfeita — Engine Fiel Google Maps em Tempo Real (Live Traffic + Satélite + Rotas), Inspeção IA e CarPlay

function calcRouteCost({ km, dieselPrice, baseKmL, loadTons, maxTons, slopeIdx = 0.15, toll = 0, driverCost = 0, transshipment = 0, backhaulRevenue = 0 }) {
  const loadFactor = 1 + 0.28 * (loadTons / maxTons) + 0.12 * slopeIdx;
  const fuelPerKm = (dieselPrice / baseKmL) * loadFactor;
  const total = km * (fuelPerKm + 0.92) + toll + driverCost + transshipment - backhaulRevenue;
  return { total, perKm: total / km };
}

function calcRiskScore({ crimeIdx, weatherIdx, cargoValIdx, fatigueIdx, shadowIdx }) {
  return Math.min(100, Math.round(100 * (0.35 * crimeIdx + 0.25 * weatherIdx + 0.20 * cargoValIdx + 0.10 * fatigueIdx + 0.10 * shadowIdx)));
}

function decodeGooglePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Geometria GPS Real da Malha Rodoviária Federal Brasileira (BR-116, BR-040, BR-050, BR-101, BR-364, BR-153)
const REAL_HIGHWAYS = {
  BR116_SP_RJ: [
    [-23.5501, -46.6329], [-23.5226, -46.6303], [-23.5052, -46.5689], [-23.4534, -46.4699], [-23.4187, -46.3803],
    [-23.3784, -46.2555], [-23.3488, -46.1707], [-23.3078, -46.0542], [-23.2449, -45.9272], [-23.1931, -45.8854],
    [-23.1253, -45.7323], [-23.0746, -45.6505], [-23.0413, -45.5696], [-22.9832, -45.4662], [-22.9235, -45.3473],
    [-22.8475, -45.2272], [-22.7841, -45.1515], [-22.7324, -45.0794], [-22.6693, -44.9898], [-22.621, -44.9091],
    [-22.5718, -44.8648], [-22.5369, -44.7729], [-22.5097, -44.6876], [-22.4968, -44.5743], [-22.4597, -44.459],
    [-22.4537, -44.3709], [-22.4537, -44.2959], [-22.4984, -44.2336], [-22.544, -44.1898], [-22.5618, -44.1474],
    [-22.5884, -44.0948], [-22.5811, -44.0225], [-22.5866, -43.958], [-22.6159, -43.932], [-22.6493, -43.894],
    [-22.6664, -43.8624], [-22.6725, -43.8349], [-22.6814, -43.824], [-22.7001, -43.752], [-22.7199, -43.6915],
    [-22.7316, -43.6011], [-22.7406, -43.4988], [-22.7513, -43.4392], [-22.8127, -43.3311], [-22.8491, -43.2473],
    [-22.889, -43.222], [-22.902, -43.1846], [-22.9068, -43.173]
  ],
  DETOUR_PETROPOLIS: [
    [-23.5501, -46.6329], [-23.4534, -46.4699], [-23.3488, -46.1707], [-23.1931, -45.8854], [-23.0413, -45.5696],
    [-22.8475, -45.2272], [-22.6693, -44.9898], [-22.5369, -44.7729], [-22.4597, -44.459], [-22.345, -44.12],
    [-22.158, -43.785], [-22.095, -43.412], [-22.315, -43.225], [-22.5093, -43.1958], [-22.6515, -43.2838],
    [-22.7888, -43.2856], [-22.8659, -43.2479], [-22.9068, -43.173]
  ],
  BR050_GYN_SP: [
    [-16.687, -49.2648], [-17.7272, -49.1545], [-18.1811, -49.291], [-18.8444, -49.0931], [-18.919, -48.2775],
    [-19.7767, -47.9715], [-20.8787, -47.8979], [-21.1706, -47.8099], [-21.8171, -47.497], [-22.6069, -47.3615], [-23.5501, -46.6329]
  ],
  BR116_CWB_SP: [
    [-25.4284, -49.2732], [-25.311, -49.0143], [-25.0878, -48.6049], [-24.9238, -48.2623], [-24.7223, -48.0439],
    [-24.4979, -47.8452], [-24.2627, -47.3793], [-24.0276, -47.1742], [-23.9292, -46.9959], [-23.608, -46.8145], [-23.4543, -46.5337]
  ],
  BR101_SSA_REC: [
    [-12.9715, -38.5014], [-12.3065, -37.9036], [-11.5379, -37.5674], [-10.9472, -37.0731], [-10.1267, -36.7943],
    [-9.6659, -35.7349], [-8.9254, -35.6372], [-8.4144, -35.3104], [-8.0476, -34.877]
  ],
  BR364_CGB_GYN: [
    [-15.6014, -56.0979], [-15.8406, -55.1556], [-16.4671, -54.6372], [-16.8674, -53.8951], [-17.3797, -53.1376],
    [-17.6705, -52.3323], [-17.9216, -51.7459], [-17.5396, -50.5806], [-17.0688, -49.806], [-16.687, -49.2648]
  ],
  BR101_POA_CWB: [
    [-30.0347, -51.2177], [-29.8796, -50.2611], [-29.3415, -49.7862], [-28.6662, -49.1149], [-28.1496, -48.6919],
    [-27.5954, -48.548], [-26.8691, -48.7299], [-26.2331, -48.9165], [-25.5893, -49.1715], [-25.4284, -49.2732]
  ],
  BR153_BEL_GYN: [
    [-1.4556, -48.4899], [-2.0524, -47.5525], [-5.5264, -47.4798], [-7.784, -48.4652], [-10.1844, -48.3341],
    [-11.9687, -49.2029], [-13.7069, -49.021], [-15.4629, -48.6135], [-16.687, -49.2648]
  ]
};

const BRAZIL_BORDER_COORDS = [
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

const BRAZIL_CITIES = [
  [-23.5505, -46.6333, 'São Paulo'], [-22.9068, -43.1729, 'Rio de Janeiro'], [-19.9167, -43.9345, 'Belo Horizonte'],
  [-25.4284, -49.2733, 'Curitiba'], [-30.0346, -51.2177, 'Porto Alegre'], [-15.7975, -47.8919, 'Brasília'],
  [-16.6869, -49.2648, 'Goiânia'], [-15.6014, -56.0979, 'Cuiabá'], [-12.9714, -38.5014, 'Salvador'],
  [-8.0476, -34.877, 'Recife'], [-3.7319, -38.5267, 'Fortaleza'], [-1.4558, -48.4902, 'Belém'],
  [-3.119, -60.0217, 'Manaus'], [-23.1896, -45.8841, 'São José dos Campos'], [-22.4705, -44.4509, 'Resende'],
  [-18.9186, -48.2772, 'Uberlândia'], [-21.1704, -47.8103, 'Ribeirão Preto']
];

const fleet = [
  { id: 'CAM-01', driver: 'Seu Carlos Silva', model: 'Carreta 6 Eixos', route: 'São Paulo, SP → Rio de Janeiro, RJ (BR-116)', status: 'optimal', loadTons: 28.4, kmL: 2.42, costKm: 4.88, tankDesc: 'Meio tanque (+410 km)', restMin: 38, speedKmh: 78, idealKmh: 70, link: 'Starlink LEO + 5G', health: 'Saúde 98%', aiNote: 'IA GOAT: Reduzir p/ 70 km/h na subida (+4% diesel)', driverTip: 'Reduza para 70 km/h nos próximos 5 km para economizar 4% de diesel na subida.', hubNotice: 'Parada no Hub Km 120 (Resende-RJ) p/ troca de carreta c/ Caminhão B · Vaga 04 pronta.', waypoints: REAL_HIGHWAYS.BR116_SP_RJ.slice(), t: 0.36, step: 0.00038 },
  { id: 'CAM-04', driver: 'Marcos Lima', model: 'Graneleiro · Vazio', route: 'Goiânia, GO → São Paulo, SP (BR-050)', status: 'empty', loadTons: 0.0, kmL: 3.15, costKm: 5.64, tankDesc: '3/4 tanque (+620 km)', restMin: 95, speedKmh: 80, idealKmh: 80, link: '5G + Satélite Standby', health: 'Vazio · Match IA', aiNote: 'Coletar 18t em Uberlândia (+R$ 6.400 líquidos)', driverTip: 'Mantenha 80 km/h constantes na BR-050.', hubNotice: 'Coleta sugerida em Uberlândia (9 km da pista).', waypoints: REAL_HIGHWAYS.BR050_GYN_SP, t: 0.31, step: 0.00045 },
  { id: 'CAM-08', driver: 'João Pedro', model: 'Cavalo + Baú (Revezamento)', route: 'Rio de Janeiro, RJ → Hub Resende (BR-116)', status: 'hub', loadTons: 26.0, kmL: 2.48, costKm: 4.76, tankDesc: 'Tanque cheio (+780 km)', restMin: 38, speedKmh: 74, idealKmh: 75, link: '5G + Starlink', health: 'Encontro em 38m', aiNote: 'Troca de semirreboque agendada c/ CAM-01 em Resende', driverTip: 'Ritmo excelente até o Hub Resende.', hubNotice: 'Estacione na Vaga 04 do Hub Resende.', waypoints: REAL_HIGHWAYS.BR116_SP_RJ.slice(24).reverse(), t: 0.48, step: 0.00042 },
  { id: 'CAM-12', driver: 'André Souza', model: 'Carreta 30t (Baldeação VUC)', route: 'Curitiba, PR → Hub Guarulhos, SP (BR-116)', status: 'hub', loadTons: 29.8, kmL: 2.36, costKm: 4.91, tankDesc: 'Meio tanque (+390 km)', restMin: 52, speedKmh: 72, idealKmh: 70, link: 'Starlink LEO Ativo', health: 'Baldeação ZMRC', aiNote: 'Transferir carga p/ 3 VUCs elétricos no Hub Guarulhos', driverTip: 'Use freio-motor na Serra do Cafezal.', hubNotice: 'Pare na Doca 02 em Guarulhos p/ baldeação aos VUCs.', waypoints: REAL_HIGHWAYS.BR116_CWB_SP, t: 0.58, step: 0.00046 },
  { id: 'CAM-15', driver: 'Raimundo Neto', model: 'Carreta Sider', route: 'Belém, PA → Goiânia, GO (BR-153)', status: 'optimal', loadTons: 25.2, kmL: 2.51, costKm: 4.72, tankDesc: '2/3 tanque (+530 km)', restMin: 110, speedKmh: 76, idealKmh: 75, link: 'Starlink LEO Exclusivo', health: 'Saúde 99%', aiNote: 'Área remota · 100% conectado via satélite LEO', driverTip: 'Pista livre na BR-153.', hubNotice: 'Parada segura programada em Palmas.', waypoints: REAL_HIGHWAYS.BR153_BEL_GYN, t: 0.44, step: 0.00035 },
  { id: 'CAM-19', driver: 'Roberto Alves', model: 'Bitrem 37t', route: 'Cuiabá, MT → Goiânia, GO (BR-364)', status: 'optimal', loadTons: 36.5, kmL: 2.28, costKm: 4.79, tankDesc: 'Tanque cheio (+710 km)', restMin: 84, speedKmh: 75, idealKmh: 75, link: 'Starlink LEO Ativo', health: 'Saúde 97%', aiNote: 'Pressão dos 22 pneus e temperatura estáveis', driverTip: 'Economia de 5% acima da meta hoje.', hubNotice: 'Descanso reservado em Rondonópolis.', waypoints: REAL_HIGHWAYS.BR364_CGB_GYN, t: 0.42, step: 0.0004 },
  { id: 'CAM-23', driver: 'Paulo Nunes', model: 'Baú Refrigerado (-18 °C)', route: 'Salvador, BA → Recife, PE (BR-101)', status: 'optimal', loadTons: 22.1, kmL: 2.59, costKm: 4.61, tankDesc: 'Meio tanque (+440 km)', restMin: 65, speedKmh: 78, idealKmh: 78, link: '5G + Starlink', health: 'Frio -18 °C OK', aiNote: 'Termometria da câmara fria estável em -18,2 °C', driverTip: 'Baú refrigerado operando 100%.', hubNotice: 'Descarga direta no CD Recife Sul.', waypoints: REAL_HIGHWAYS.BR101_SSA_REC, t: 0.36, step: 0.00048 },
  { id: 'CAM-27', driver: 'Sérgio Moraes', model: 'Carreta Prancha', route: 'Porto Alegre, RS → Curitiba, PR (BR-101)', status: 'optimal', loadTons: 24.0, kmL: 2.46, costKm: 4.81, tankDesc: '3/4 tanque (+590 km)', restMin: 72, speedKmh: 73, idealKmh: 75, link: '5G Multi-Operadora', health: 'Saúde 98%', aiNote: 'Fluxo normal no litoral sul', driverTip: 'Mantenha 70 km/h na ponte de Laguna.', hubNotice: 'Parada em Joinville em 1h 12m.', waypoints: REAL_HIGHWAYS.BR101_POA_CWB, t: 0.51, step: 0.00045 }
];

const truckParts = [
  { key: 'engine', num: 1, name: 'Motor Turbo-Diesel & Injeção', code: 'SAE J1939 · Amostragem 100 ms', health: 98, m1: '91 °C (Óleo normal)', m2: '2,1 bar (Turbo OK)', m3: '0,14 g (Vibração limpa)', m4: '14.200 km p/ revisão', verdict: 'Queima equilibrada nos 6 cilindros e bicos injetores calibrados. Sem risco de falha mecânica.' },
  { key: 'gearbox', num: 2, name: 'Transmissão Automatizada & Embreagem', code: 'Sensor TCU · Caixa 12 Velocidades', health: 96, m1: '78 °C (Fluido OK)', m2: 'Desgaste disco: 12%', m3: 'Trocas suaves IA', m4: '38.000 km restantes', verdict: 'Trocas de marcha sincronizadas com a topografia pela IA GOAT, reduzindo desgaste.' },
  { key: 'tanks', num: 3, name: 'Tanques de Diesel Duplos & Arla 32', code: 'Sensor Ultrassônico/Capacitivo (±0,2%)', health: 99, m1: '412 L / 700 L (59%)', m2: 'Vazão: 2,42 km/L', m3: 'Arla 32: 74% nível', m4: 'Zero vazamento/furto', verdict: 'Curva de consumo compatível com carga de 28,4t. Nenhuma queda abrupta detectada.' },
  { key: 'starlink', num: 4, name: 'Antena Starlink LEO + Câmeras RotaCAM', code: 'SD-WAN Híbrido 5G + Satélite LEO', health: 100, m1: 'Latência: 142 ms', m2: 'Uptime: 99,98%', m3: '4 Câmeras PoE IR OK', m4: 'Lentes limpas / REC', verdict: 'Visibilidade 360° ativa sem pontos cegos e telemetria contínua mesmo em serras.' },
  { key: 'coupling', num: 5, name: 'Quinta Roda, Pino-Rei & Suspensão Ar', code: 'Células de Carga por Eixo + Trava', health: 97, m1: 'Carga: 28,4 t (PBTC)', m2: 'Trava: Engatada OK', m3: 'Bolsas ar: 6,8 bar', m4: '22.500 km p/ lubrif.', verdict: 'Peso distribuído uniformemente entre cavalo e semirreboque. Trava antifurto selada.' },
  { key: 'battery', num: 6, name: 'Sistema 24V, Alternador & Edge AI TPM', code: 'NVIDIA Jetson Orin + Chip TPM 2.0', health: 98, m1: 'Tensão: 28,1 V', m2: 'GPU Borda: 54 °C', m3: 'Cripto AES-256 OK', m4: 'Baterias 95% SoH', verdict: 'Alimentação elétrica estável e telemetria criptografada ponta a ponta.' },
  { key: 'brakes', num: 7, name: 'Freios Pneumáticos ABS/EBS (6 Eixos)', code: 'Sensores Térmicos e Espessura de Lonas', health: 94, m1: 'Temp. máx: 138 °C', m2: 'Linha ar: 8,4 bar', m3: 'Lonas: 82% vida', m4: '18.600 km restantes', verdict: 'Temperatura simétrica em todos os tambores/discos.' },
  { key: 'tires', num: 8, name: 'Conjunto de 22 Pneus (Sensores TPMS)', code: 'Monitoramento Sem Fio de Pressão e Banda', health: 95, m1: 'Pressão: 115 PSI', m2: 'Temp. banda: 52 °C', m3: 'Sulco médio: 11,4 mm', m4: '26.000 km estimados', verdict: 'Calibragem ideal nos 22 pneus, economizando até 3% de diesel.' }
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
  carplay3D: true,
  followTower: false,
  followCarPlay: true,
  showHubs: true,
  showRisk: false,
  gmapsKey: '',
  activePrimaryRoute: REAL_HIGHWAYS.BR116_SP_RJ.slice(),
  activeAltRoute: REAL_HIGHWAYS.DETOUR_PETROPOLIS.slice(),
  dashOffset: 0
};

const statusColors = { optimal: '#188038', empty: '#f29900', hub: '#1967d2', danger: '#d93025' };

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

// ==================== PROJEÇÃO WEB MERCATOR & GOOGLE MAPS LIVE SLIPPY ENGINE ====================
function latLngToWorld(lat, lng, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * scale;
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldToLatLng(wx, wy, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (wx / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * wy) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat: Math.max(-85, Math.min(85, lat)), lng: ((((lng + 180) % 360) + 360) % 360) - 180 };
}

function interpRouteWithHeading(pts, t) {
  if (!pts || pts.length < 2) return { lat: -23.5505, lng: -46.6333, heading: 65 };
  const segs = pts.length - 1;
  const scaled = Math.min(0.9999, Math.max(0, t)) * segs;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const [lat1, lng1] = pts[idx];
  const [lat2, lng2] = pts[idx + 1];
  const lat = lat1 + (lat2 - lat1) * frac;
  const lng = lng1 + (lng2 - lng1) * frac;
  const dy = lat2 - lat1;
  const dx = (lng2 - lng1) * Math.cos((lat * Math.PI) / 180);
  const heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  return { lat, lng, heading };
}

class GoogleRealtimeSlippyMap {
  constructor({ stageId, canvasId, tilesId, svgId, centerLat, centerLng, zoom, isCarPlay = false }) {
    this.stage = document.getElementById(stageId);
    this.canvas = document.getElementById(canvasId);
    this.tilesEl = document.getElementById(tilesId);
    this.svgEl = document.getElementById(svgId);
    this.centerLat = centerLat;
    this.centerLng = centerLng;
    this.zoom = zoom;
    this.mode = 'road'; // 'road' | 'satellite' | 'terrain'
    this.traffic = true;
    this.isCarPlay = isCarPlay;
    this.tileCache = new Map();
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.bindEvents();
  }

  bindEvents() {
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-truck-click]')) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.stage.setPointerCapture(e.pointerId);
      if (this.isCarPlay) state.followCarPlay = false;
      else {
        state.followTower = false;
        const chip = document.getElementById('chipFollowTower');
        if (chip) chip.classList.remove('active');
      }
    });

    this.stage.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      const c = latLngToWorld(this.centerLat, this.centerLng, this.zoom);
      const next = worldToLatLng(c.x - dx, c.y - dy, this.zoom);
      this.centerLat = next.lat;
      this.centerLng = next.lng;
      this.render();
    });

    const stopDrag = () => { this.dragging = false; };
    this.stage.addEventListener('pointerup', stopDrag);
    this.stage.addEventListener('pointercancel', stopDrag);

    this.stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      this.setZoom(this.zoom + dir);
    }, { passive: false });
  }

  setZoom(nextZoom) {
    const clamped = Math.max(4, Math.min(16, Math.round(nextZoom)));
    if (clamped === this.zoom) return;
    this.zoom = clamped;
    this.clearTilesDom();
    this.render();
  }

  setCenter(lat, lng, zoom = null) {
    this.centerLat = lat;
    this.centerLng = lng;
    if (zoom !== null && zoom !== this.zoom) {
      this.zoom = Math.max(4, Math.min(16, Math.round(zoom)));
      this.clearTilesDom();
    }
    this.render();
  }

  clearTilesDom() {
    this.tileCache.clear();
    this.tilesEl.innerHTML = '';
  }

  getLyrsCode() {
    if (this.mode === 'satellite') return this.traffic ? 'y,traffic' : 'y';
    if (this.mode === 'terrain') return this.traffic ? 'p,traffic' : 'p';
    return this.traffic ? 'm,traffic' : 'm';
  }

  render() {
    const W = this.stage.clientWidth || 760;
    const H = this.stage.clientHeight || 500;
    const z = this.zoom;
    const maxTile = Math.pow(2, z);
    const centerW = latLngToWorld(this.centerLat, this.centerLng, z);
    const topLeftX = centerW.x - W / 2;
    const topLeftY = centerW.y - H / 2;

    this.renderVectorBase(W, H, z, topLeftX, topLeftY);
    this.renderGoogleTiles(W, H, z, maxTile, topLeftX, topLeftY);
    this.renderOverlaySvg(W, H, z, topLeftX, topLeftY);
  }

  // Base Cartográfica Estilo Google Maps (Garante visual fiel mesmo durante carregamento ou offline)
  renderVectorBase(W, H, z, topLeftX, topLeftY) {
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W;
      this.canvas.height = H;
    }
    const ctx = this.canvas.getContext('2d');
    const isSat = this.mode === 'satellite';
    ctx.fillStyle = isSat ? '#082032' : '#aadaff';
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    BRAZIL_BORDER_COORDS.forEach(([lat, lng], idx) => {
      const p = latLngToWorld(lat, lng, z);
      const px = p.x - topLeftX;
      const py = p.y - topLeftY;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = isSat ? '#183626' : '#f5f3f0';
    ctx.fill();
    ctx.strokeStyle = isSat ? '#4f7c63' : '#bdc1c6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Malha Rodoviária Federal em Amarelo/Laranja Padrão Google Maps (#fde293 / #fbbc04)
    Object.values(REAL_HIGHWAYS).forEach((road) => {
      ctx.beginPath();
      road.forEach(([lat, lng], idx) => {
        const p = latLngToWorld(lat, lng, z);
        if (idx === 0) ctx.moveTo(p.x - topLeftX, p.y - topLeftY);
        else ctx.lineTo(p.x - topLeftX, p.y - topLeftY);
      });
      ctx.strokeStyle = isSat ? 'rgba(251, 188, 4, 0.7)' : '#fbbc04';
      ctx.lineWidth = z >= 8 ? 3.5 : 2;
      ctx.stroke();
    });

    // Nomes das Cidades no Padrão Google Maps
    ctx.font = '600 12px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = isSat ? '#ffffff' : '#3c4043';
    BRAZIL_CITIES.forEach(([lat, lng, name]) => {
      const p = latLngToWorld(lat, lng, z);
      const px = p.x - topLeftX;
      const py = p.y - topLeftY;
      if (px > -60 && px < W + 60 && py > -20 && py < H + 20) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(name, px + 6, py + 4);
      }
    });
  }

  // Tiles Reais em Tempo Real do Servidor Oficial Google Maps (mt0-mt3.google.com/vt)
  renderGoogleTiles(W, H, z, maxTile, topLeftX, topLeftY) {
    const minTx = Math.floor(topLeftX / 256) - 1;
    const maxTx = Math.floor((topLeftX + W) / 256) + 1;
    const minTy = Math.max(0, Math.floor(topLeftY / 256) - 1);
    const maxTy = Math.min(maxTile - 1, Math.floor((topLeftY + H) / 256) + 1);
    const lyrs = this.getLyrsCode();
    const trafficMinute = Math.floor(Date.now() / 60000);
    const neededKeys = new Set();

    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        const wrappedTx = ((tx % maxTile) + maxTile) % maxTile;
        const key = `${lyrs}:${z}:${tx}:${ty}:${trafficMinute}`;
        neededKeys.add(key);

        let img = this.tileCache.get(key);
        if (!img) {
          img = document.createElement('img');
          const sub = Math.abs(wrappedTx + ty) % 4;
          img.src = `https://mt${sub}.google.com/vt/lyrs=${lyrs}&hl=pt-BR&gl=BR&x=${wrappedTx}&y=${ty}&z=${z}&_tb=${trafficMinute}`;
          img.alt = '';
          img.decoding = 'async';
          img.style.position = 'absolute';
          img.style.width = '256px';
          img.style.height = '256px';
          img.style.pointerEvents = 'none';
          img.onerror = () => { img.style.display = 'none'; };
          this.tilesEl.appendChild(img);
          this.tileCache.set(key, img);
        }
        img.style.left = `${Math.round(tx * 256 - topLeftX)}px`;
        img.style.top = `${Math.round(ty * 256 - topLeftY)}px`;
      }
    }

    for (const [key, img] of this.tileCache.entries()) {
      if (!neededKeys.has(key)) {
        img.remove();
        this.tileCache.delete(key);
      }
    }
  }

  // Sobreposição Fiel Google Maps: Rota Azul #4285F4 com Borda #185ABC, Rota Alternativa, Pinos e Caminhões Ao Vivo
  renderOverlaySvg(W, H, z, topLeftX, topLeftY) {
    this.svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const toPx = ([lat, lng]) => {
      const w = latLngToWorld(lat, lng, z);
      return [w.x - topLeftX, w.y - topLeftY];
    };

    const polyD = (pts) =>
      pts.map((pt, i) => {
        const [x, y] = toPx(pt);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

    const primaryPts = state.riskActive ? state.activeAltRoute : state.activePrimaryRoute;
    const altPts = state.riskActive ? state.activePrimaryRoute : state.activeAltRoute;
    const primaryD = polyD(primaryPts);
    const altD = polyD(altPts);

    let svgParts = [];

    // 1. Rota Alternativa (Cinza Azulado Padrão Google Maps ou Vermelho Bloqueado se Risco Ativo)
    if (altPts.length > 1) {
      const altColor = state.riskActive ? '#ea4335' : '#9aa0a6';
      const altBorder = state.riskActive ? '#a50e0e' : '#5f6368';
      svgParts.push(`<path d="${altD}" fill="none" stroke="${altBorder}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`);
      svgParts.push(`<path d="${altD}" fill="none" stroke="${altColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" ${state.riskActive ? 'stroke-dasharray="8 6"' : ''}/>`);
    }

    // 2. Rota Ativa Oficial Google Maps (Borda Azul Escuro #185ABC + Miolo Royal Blue #4285F4)
    if (primaryPts.length > 1) {
      svgParts.push(`<path d="${primaryD}" fill="none" stroke="#185abc" stroke-width="${this.isCarPlay ? 12 : 9}" stroke-linecap="round" stroke-linejoin="round"/>`);
      svgParts.push(`<path d="${primaryD}" fill="none" stroke="#4285f4" stroke-width="${this.isCarPlay ? 8 : 5.5}" stroke-linecap="round" stroke-linejoin="round"/>`);

      // Pinos de Origem (Bola Branca Google) e Destino (Pino Vermelho Clássico Google #EA4335)
      const [ox, oy] = toPx(primaryPts[0]);
      const [dx, dy] = toPx(primaryPts[primaryPts.length - 1]);
      svgParts.push(`<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="6" fill="#ffffff" stroke="#202124" stroke-width="2.5"/>`);
      svgParts.push(`
        <g transform="translate(${dx.toFixed(1)}, ${dy.toFixed(1)})">
          <path d="M0,0 C-7,-10 -11,-15 -11,-21 A11,11 0 1,1 11,-21 C11,-15 7,-10 0,0 Z" fill="#ea4335" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="0" cy="-21" r="4" fill="#800000"/>
        </g>`);
    }

    // 3. Zona de Risco / Interdição Noturna na BR-116 Serra
    if (state.showRisk || state.riskActive) {
      const [rx, ry] = toPx([-22.665, -43.862]);
      svgParts.push(`
        <g transform="translate(${rx.toFixed(1)}, ${ry.toFixed(1)})">
          <circle cx="0" cy="0" r="24" fill="#ea4335" fill-opacity="0.25" stroke="#d93025" stroke-width="2"/>
          <circle cx="0" cy="0" r="9" fill="#d93025" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="-4.5" y1="0" x2="4.5" y2="0" stroke="#ffffff" stroke-width="2.5"/>
        </g>`);
    }

    // 4. Hubs de Revezamento e Baldeação (Marcadores Azuis Estilo POI Google)
    if (state.showHubs && !this.isCarPlay) {
      const hubs = [
        [-22.4705, -44.4509, 'Hub Km 120'],
        [-23.4543, -46.5337, 'Hub VUC SP'],
        [-18.9186, -48.2772, 'Carga 18t']
      ];
      hubs.forEach(([lat, lng, label]) => {
        const [hx, hy] = toPx([lat, lng]);
        if (hx > -50 && hx < W + 50 && hy > -30 && hy < H + 30) {
          svgParts.push(`
            <g transform="translate(${hx.toFixed(1)}, ${hy.toFixed(1)})">
              <rect x="-36" y="-24" width="72" height="19" rx="5" fill="#1967d2" stroke="#ffffff" stroke-width="1.4"/>
              <text x="0" y="-11" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">${label}</text>
            </g>`);
        }
      });
    }

    // 5. Caminhões em Tempo Real (Puck de Navegação Azul Google no CarPlay / Frotas Clicáveis na Torre)
    if (this.isCarPlay) {
      const selTr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
      const pos = interpRouteWithHeading(selTr.waypoints, selTr.t);
      const [px, py] = toPx([pos.lat, pos.lng]);
      svgParts.push(`
        <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})">
          <circle cx="0" cy="0" r="28" fill="#4285f4" fill-opacity="0.22"/>
          <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#dadce0" stroke-width="1.5"/>
          <g transform="rotate(${pos.heading.toFixed(1)})">
            <polygon points="0,-10 8,8 0,4 -8,8" fill="#1a73e8"/>
          </g>
        </g>`);
    } else {
      fleet.forEach((tr) => {
        const pos = interpRouteWithHeading(tr.waypoints, tr.t);
        const [px, py] = toPx([pos.lat, pos.lng]);
        if (px < -60 || px > W + 60 || py < -40 || py > H + 40) return;
        const color = statusColors[tr.status] || '#188038';
        const isSel = tr.id === state.selectedTruckId;
        const halo = isSel ? `<circle cx="0" cy="0" r="18" fill="#4285f4" fill-opacity="0.28" stroke="#1a73e8" stroke-width="2"/>` : '';
        svgParts.push(`
          <g data-truck-click="${tr.id}" transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})" style="cursor:pointer" onclick="selectTruck('${tr.id}')">
            ${halo}
            <circle cx="0" cy="0" r="11" fill="#ffffff" stroke="${color}" stroke-width="2.5"/>
            <g transform="rotate(${pos.heading.toFixed(1)})">
              <polygon points="0,-7 5.5,5.5 0,2.8 -5.5,5.5" fill="${color}"/>
            </g>
            <rect x="13" y="-11" width="54" height="20" rx="5" fill="#ffffff" stroke="#dadce0" stroke-width="1.2"/>
            <text x="40" y="3" text-anchor="middle" fill="#202124" font-size="12" font-weight="700">${tr.id}</text>
          </g>`);
      });
    }

    this.svgEl.innerHTML = svgParts.join('');
  }
}

let towerGmap = null;
let carplayGmap = null;

function initGoogleRealtimeMaps() {
  towerGmap = new GoogleRealtimeSlippyMap({
    stageId: 'towerGmapStage',
    canvasId: 'towerVectorCanvas',
    tilesId: 'towerTilesContainer',
    svgId: 'towerOverlaySvg',
    centerLat: -20.8,
    centerLng: -46.8,
    zoom: 6,
    isCarPlay: false
  });

  const startPos = interpRouteWithHeading(fleet[0].waypoints, fleet[0].t);
  carplayGmap = new GoogleRealtimeSlippyMap({
    stageId: 'carplayGmapStage',
    canvasId: 'carplayVectorCanvas',
    tilesId: 'carplayTilesContainer',
    svgId: 'carplayOverlaySvg',
    centerLat: startPos.lat,
    centerLng: startPos.lng,
    zoom: 12,
    isCarPlay: true
  });

  towerGmap.render();
  carplayGmap.render();

  window.addEventListener('resize', () => {
    if (towerGmap) towerGmap.render();
    if (carplayGmap) carplayGmap.render();
  });
}

// ==================== ROTEAMENTO GOOGLE ROUTES API v2 + OSRM REAL ====================
async function fetchRoadRouteGeometry(originLatLng, destLatLng) {
  if (state.gmapsKey) {
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': state.gmapsKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: originLatLng[0], longitude: originLatLng[1] } } },
          destination: { location: { latLng: { latitude: destLatLng[0], longitude: destLatLng[1] } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const r = data.routes[0];
          return {
            coords: decodeGooglePolyline(r.polyline.encodedPolyline),
            km: Math.round(r.distanceMeters / 1000),
            mins: Math.round(parseInt(r.duration, 10) / 60),
            provider: 'Google Routes API v2'
          };
        }
      }
    } catch (_) {}
  }

  try {
    const q = `${originLatLng[1]},${originLatLng[0]};${destLatLng[1]},${destLatLng[0]}`;
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${q}?overview=full&geometries=geojson`);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const r = data.routes[0];
        const raw = r.geometry.coordinates;
        const stride = Math.max(1, Math.floor(raw.length / 130));
        const coords = raw.filter((_, i) => i % stride === 0 || i === raw.length - 1).map(([lng, lat]) => [lat, lng]);
        return { coords, km: Math.round(r.distance / 1000), mins: Math.round(r.duration / 60), provider: 'Google Maps / Malha BR' };
      }
    }
  } catch (_) {}

  return { coords: REAL_HIGHWAYS.BR116_SP_RJ.slice(), km: 439, mins: 318, provider: 'Google Maps Cache' };
}

async function calculateCustomRealRoute() {
  const [origCoord, origLabel] = document.getElementById('routeOriginSelect').value.split('|');
  const [destCoord, destLabel] = document.getElementById('routeDestSelect').value.split('|');
  const o = origCoord.split(',').map(Number);
  const d = destCoord.split(',').map(Number);

  showToast(`Calculando rota com trânsito em tempo real: ${origLabel} → ${destLabel}...`);
  const result = await fetchRoadRouteGeometry(o, d);
  const cost = calcRouteCost({
    km: result.km,
    dieselPrice: 6.1,
    baseKmL: 2.45,
    loadTons: 28.4,
    maxTons: 30,
    toll: Math.round(result.km * 0.88),
    driverCost: Math.round((result.mins / 60) * 68)
  });

  state.activePrimaryRoute = result.coords;
  fleet[0].waypoints = result.coords;
  fleet[0].t = 0.08;

  const h = Math.floor(result.mins / 60);
  const m = result.mins % 60;
  document.getElementById('gmapCardEta').textContent = `${h} h ${m} min (${result.km} km)`;
  document.getElementById('gmapCardVia').textContent = `${origLabel} → ${destLabel} · R$ ${formatBRL(cost.perKm)}/km`;

  const midLat = (o[0] + d[0]) / 2;
  const midLng = (o[1] + d[1]) / 2;
  const distDeg = Math.hypot(o[0] - d[0], o[1] - d[1]);
  const idealZoom = distDeg > 12 ? 5 : distDeg > 5 ? 6 : 7;
  towerGmap.setCenter(midLat, midLng, idealZoom);
  carplayGmap.render();
}

// Controles Fiéis do Google Maps
function toggleGoogleTrafficLayer() {
  towerGmap.traffic = !towerGmap.traffic;
  carplayGmap.traffic = towerGmap.traffic;
  document.getElementById('chipTraffic').classList.toggle('active', towerGmap.traffic);
  towerGmap.clearTilesDom();
  carplayGmap.clearTilesDom();
  towerGmap.render();
  carplayGmap.render();
}

function toggleTowerSatellite() {
  const next = towerGmap.mode === 'satellite' ? 'road' : 'satellite';
  towerGmap.mode = next;
  document.getElementById('satSquareLabel').textContent = next === 'satellite' ? 'Mapa' : 'Satélite';
  document.getElementById('chipTerrain').classList.remove('active');
  towerGmap.clearTilesDom();
  towerGmap.render();
}

function setTowerMapMode(mode) {
  towerGmap.mode = towerGmap.mode === mode ? 'road' : mode;
  document.getElementById('chipTerrain').classList.toggle('active', towerGmap.mode === 'terrain');
  document.getElementById('satSquareLabel').textContent = 'Satélite';
  towerGmap.clearTilesDom();
  towerGmap.render();
}

function fitBrazilView() {
  state.followTower = false;
  document.getElementById('chipFollowTower').classList.remove('active');
  towerGmap.setCenter(-14.8, -51.5, 4);
}

function toggleFollowOnTower() {
  state.followTower = !state.followTower;
  document.getElementById('chipFollowTower').classList.toggle('active', state.followTower);
  if (state.followTower) focusSelectedTruckOnMap();
}

function focusSelectedTruckOnMap() {
  const tr = fleet.find((i) => i.id === state.selectedTruckId) || fleet[0];
  const pos = interpRouteWithHeading(tr.waypoints, tr.t);
  towerGmap.setCenter(pos.lat, pos.lng, Math.max(towerGmap.zoom, 10));
}

function zoomTowerMap(delta) {
  towerGmap.setZoom(towerGmap.zoom + delta);
}

function zoomCarPlayMap(delta) {
  carplayGmap.setZoom(carplayGmap.zoom + delta);
}

function toggleCarPlay3D() {
  state.carplay3D = !state.carplay3D;
  document.getElementById('carplayGmapStage').classList.toggle('tilt-3d', state.carplay3D);
  document.getElementById('btnCp3d').textContent = state.carplay3D ? '3D' : '2D';
}

function toggleCarPlaySatellite() {
  carplayGmap.mode = carplayGmap.mode === 'satellite' ? 'road' : 'satellite';
  carplayGmap.clearTilesDom();
  carplayGmap.render();
}

function recenterCarPlayMap() {
  state.followCarPlay = true;
  const tr = fleet.find((i) => i.id === state.selectedTruckId) || fleet[0];
  const pos = interpRouteWithHeading(tr.waypoints, tr.t);
  carplayGmap.setCenter(pos.lat, pos.lng, Math.max(carplayGmap.zoom, 12));
}

function toggleTowerLayer(type) {
  if (type === 'hubs') {
    state.showHubs = !state.showHubs;
    document.getElementById('btnLayerHubs').classList.toggle('active', state.showHubs);
  } else if (type === 'risk') {
    state.showRisk = !state.showRisk;
    document.getElementById('btnLayerRisk').classList.toggle('active', state.showRisk);
  }
  towerGmap.render();
}

function toggleGoogleApiDrawer() {
  document.getElementById('googleApiDrawer').classList.toggle('hidden');
}

function applyGoogleMapsKey() {
  const key = document.getElementById('gmapsKeyInput').value.trim();
  state.gmapsKey = key;
  try {
    if (key) localStorage.setItem('RP_GMAPS_KEY', key);
  } catch (_) {}
  document.getElementById('apiEngineStatus').textContent = key ? 'Routes API Ativa' : 'Routes API Key';
  document.getElementById('googleApiDrawer').classList.add('hidden');
  if (key) calculateCustomRealRoute();
}

// ==================== MÓDULOS, FROTA E INSPEÇÃO IA DE PEÇAS ====================
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
      state.followCarPlay = true;
      recenterCarPlayMap();
    });
  }
  if (view === 'tower') {
    requestAnimationFrame(() => towerGmap && towerGmap.render());
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
  const tr = fleet.find((i) => i.id === id) || fleet[0];

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
  document.getElementById('chipFollowTower').textContent = `Seguir ${tr.id}`;

  document.getElementById('driverGreeting').textContent = `${tr.driver} · ${tr.id}`;
  document.getElementById('driverTipText').textContent = tr.driverTip;
  document.getElementById('driverHubText').textContent = tr.hubNotice;
  document.getElementById('driverSpeedVal').textContent = String(tr.speedKmh);
  document.getElementById('idealSpeedSign').textContent = String(tr.idealKmh);
  document.getElementById('driverRestVal').textContent = `Faltam ${tr.restMin} min`;
  document.getElementById('driverTankVal').textContent = tr.tankDesc;

  if (towerGmap) towerGmap.render();
  if (carplayGmap) {
    state.followCarPlay = true;
    const pos = interpRouteWithHeading(tr.waypoints, tr.t);
    carplayGmap.setCenter(pos.lat, pos.lng);
  }
}

function updateFleetKpis() {
  const avg = fleet.reduce((acc, item) => acc + item.costKm, 0) / fleet.length;
  document.getElementById('kpiCostKm').textContent = `R$ ${formatBRL(avg)}/km`;
  document.getElementById('kpiSavings').textContent = `R$ ${state.savingsTotal.toLocaleString('pt-BR')}`;
}

function renderPartsList() {
  document.getElementById('partsListContainer').innerHTML = truckParts
    .map((p) => {
      const pillCls = p.health >= 90 ? 'pill-emerald' : p.health >= 75 ? 'pill-amber' : 'pill-danger';
      return `
        <button type="button" class="${p.key === state.selectedPartKey ? 'part-btn selected' : 'part-btn'}" onclick="selectPart('${p.key}')">
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
  const p = truckParts.find((i) => i.key === partKey) || truckParts[0];

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
    brakes.verdict = 'ALERTA PREDITIVO IA: Aquecimento assimétrico no tambor do 2º eixo direito da carreta. Ordem preventiva já reservada no Hub Km 120.';
    wheelRect.setAttribute('stroke', '#ef4444');
    wheelRect.setAttribute('fill', '#7f1d1d');
    circle.setAttribute('fill', '#ef4444');
    document.getElementById('simPartLabel').textContent = 'Restaurar Saúde das Peças';
    document.getElementById('partAlertBadge').classList.remove('hidden');
    selectPart('brakes');
    showToast('IA Preditiva detectou aquecimento no Freio Eixo 2 (214 °C) antes de quebra na estrada!');
  } else {
    brakes.health = 94;
    brakes.m1 = 'Temp. máx: 138 °C';
    brakes.m3 = 'Lonas: 82% vida';
    brakes.m4 = '18.600 km restantes';
    brakes.verdict = 'Temperatura simétrica em todos os tambores/discos.';
    wheelRect.setAttribute('stroke', '#38bdf8');
    wheelRect.setAttribute('fill', '#0f2942');
    circle.setAttribute('fill', '#10b981');
    document.getElementById('simPartLabel').textContent = 'Simular Desgaste Preditivo em Peça';
    selectPart('brakes');
    showToast('Manutenção concluída: todos os componentes 100% operacionais.');
  }
}

function schedulePreventiveOrder() {
  const p = truckParts.find((i) => i.key === state.selectedPartKey);
  showToast(`Check-up preventivo agendado no Box 02 do Hub Km 120 para: ${p.name}.`);
}

// ==================== CARPLAY APPS ====================
function switchCarPlayApp(app) {
  state.carplayApp = app;
  const isMapOrSplit = app === 'split' || app === 'map';

  document.getElementById('cpScreenSplitAndMap').classList.toggle('hidden', !isMapOrSplit);
  document.getElementById('cpRightWidgets').classList.toggle('hidden', app === 'map');
  document.getElementById('cpScreenSplitAndMap').style.gridTemplateColumns = app === 'map' ? '1fr' : '';
  document.getElementById('btnExpandCpMapText').textContent = app === 'map' ? 'Painel Dividido' : 'Tela Cheia';

  document.getElementById('cpScreenCam').classList.toggle('hidden', app !== 'cam');
  document.getElementById('cpScreenPhone').classList.toggle('hidden', app !== 'phone');
  document.getElementById('cpScreenApps').classList.toggle('hidden', app !== 'apps');

  ['Split', 'Map', 'Cam', 'Phone', 'Apps'].forEach((n) => {
    document.getElementById(`cpBtn${n}`).classList.toggle('active', app === n.toLowerCase());
  });

  if (isMapOrSplit) {
    requestAnimationFrame(() => carplayGmap && carplayGmap.render());
  }
}

function changeRadioStation(dir) {
  state.radioIdx = (state.radioIdx + dir + radioStations.length) % radioStations.length;
  document.getElementById('cpMediaTitle').textContent = radioStations[state.radioIdx];
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

// ==================== SIMULAÇÕES EM TEMPO REAL ====================
function simulateRiskEvent() {
  state.riskActive = !state.riskActive;
  const cam01 = fleet[0];

  if (state.riskActive) {
    const score = calcRiskScore({ crimeIdx: 0.92, weatherIdx: 0.88, cargoValIdx: 0.85, fatigueIdx: 0.15, shadowIdx: 0.25 });
    cam01.waypoints = state.activeAltRoute;
    document.getElementById('latencyReadout').textContent = '168 ms';
    document.getElementById('kpiRisk').textContent = `${score} → 19 / 100`;
    document.getElementById('kpiRiskSub').textContent = 'BR-116 Serra interditada (22h) · Desvio Google ativo';
    document.getElementById('simRiskLabel').textContent = 'Restaurar Rota Original';
    document.getElementById('driverAlertBadge').classList.remove('hidden');

    document.getElementById('gmapCardEta').textContent = '6 h 02 min (522 km)';
    document.getElementById('gmapCardEta').className = 'gmap-eta-alert mono-num';
    document.getElementById('gmapCardVia').textContent = 'Desvio Seguro via BR-040 · Evitando risco 22h na Serra';

    document.getElementById('signDistText').textContent = '350 m';
    document.getElementById('signRoadCode').textContent = 'Saída Segura · BR-040';
    document.getElementById('signRoadName').textContent = 'Pegue o acesso seguro à direita';
    document.getElementById('gpsEta').textContent = '50 min · 49 km · Chegada 21:52';

    state.showRisk = true;
    document.getElementById('btnLayerRisk').classList.add('active');
    towerGmap.setCenter(-22.65, -44.2, 8);
    carplayGmap.render();
    showToast(`Risco ${score}/100 na Serra às 22h! Google Maps recalculou desvio seguro em 168 ms.`);
  } else {
    cam01.waypoints = state.activePrimaryRoute;
    document.getElementById('latencyReadout').textContent = '142 ms';
    document.getElementById('kpiRisk').textContent = '18 / 100';
    document.getElementById('kpiRiskSub').textContent = 'Trânsito Google ao vivo sincronizado';
    document.getElementById('simRiskLabel').textContent = 'Simular Risco / Recálculo IA';

    document.getElementById('gmapCardEta').textContent = '5 h 18 min (439 km)';
    document.getElementById('gmapCardEta').className = 'gmap-eta-green mono-num';
    document.getElementById('gmapCardVia').textContent = 'Via BR-116 (Rod. Pres. Dutra) · R$ 4,88/km';

    document.getElementById('signDistText').textContent = '4,8 km';
    document.getElementById('signRoadCode').textContent = 'Rod. Pres. Dutra (BR-116)';
    document.getElementById('signRoadName').textContent = 'Mantenha as faixas da direita';
    document.getElementById('gpsEta').textContent = '38 min · 38 km · Chegada 21:40';

    state.showRisk = false;
    document.getElementById('btnLayerRisk').classList.remove('active');
    towerGmap.render();
    carplayGmap.render();
    showToast('Trecho liberado. Rota principal BR-116 restaurada no Google Maps.');
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
  showToast('Baldeação confirmada: carga do CAM-12 transferida p/ 3 VUCs na entrada de SP.');
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
  document.getElementById('driverSpeedVal').textContent = '70';
  showToast('Velocidade ideal de 70 km/h confirmada na cabine.');
}

function speakDriverGuidance() {
  const tr = fleet.find((i) => i.id === state.selectedTruckId) || fleet[0];
  const msg = `Olá ${tr.driver}. ${tr.driverTip} Navegação Google Maps em tempo real ativa. ${tr.hubNotice}`;
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
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4200);
}

// Loop de 60fps: Move os caminhões ao longo das curvas reais das BRs e atualiza o Google Maps ao vivo
function animateRealtimeMaps() {
  if (state.simSpeed > 0) {
    fleet.forEach((tr) => {
      tr.t = (tr.t + tr.step * state.simSpeed) % 1;
    });

    const selTr = fleet.find((i) => i.id === state.selectedTruckId) || fleet[0];
    const selPos = interpRouteWithHeading(selTr.waypoints, selTr.t);

    if (towerGmap && state.mainView === 'tower') {
      if (state.followTower) {
        towerGmap.centerLat = selPos.lat;
        towerGmap.centerLng = selPos.lng;
      }
      towerGmap.render();
    }

    if (carplayGmap && state.mainView === 'driver' && (state.carplayApp === 'split' || state.carplayApp === 'map')) {
      if (state.followCarPlay) {
        carplayGmap.centerLat = selPos.lat;
        carplayGmap.centerLng = selPos.lng;
      }
      carplayGmap.render();
    }

    state.dashOffset = (state.dashOffset - 0.6 * state.simSpeed) % 18;
    document.querySelectorAll('.road-dash-line').forEach((line) => {
      line.setAttribute('stroke-dashoffset', state.dashOffset.toFixed(1));
    });
  }
  requestAnimationFrame(animateRealtimeMaps);
}

function initSystem() {
  mountIcons();
  populateTruckSelector();
  renderPartsList();
  selectPart('engine');
  updateFleetKpis();
  initGoogleRealtimeMaps();
  selectTruck('CAM-01');
  updateClocks();
  setInterval(updateClocks, 10000);
  requestAnimationFrame(animateRealtimeMaps);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSystem);
} else {
  initSystem();
}
