// Rota Perfeita — Motor da Torre de Controle, Gêmeo Digital e Guia Multimídia

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
    Math.round(
      100 * (0.35 * crimeIdx + 0.25 * weatherIdx + 0.20 * cargoValIdx + 0.10 * fatigueIdx + 0.10 * shadowIdx)
    )
  );
}

// Auto-verificação das regras matemáticas de negócio (SRS Seção 2.3)
(function verifyFormulas() {
  const baseline = calcRouteCost({ km: 430, dieselPrice: 6.1, baseKmL: 2.55, loadTons: 28.4, maxTons: 30, toll: 380, driverCost: 420 });
  const withBackhaul = calcRouteCost({ km: 430, dieselPrice: 6.1, baseKmL: 2.55, loadTons: 28.4, maxTons: 30, toll: 380, driverCost: 420, backhaulRevenue: 640 });
  console.assert(baseline.perKm > withBackhaul.perKm, 'Frete de retorno deve reduzir o custo líquido por km');
  console.assert(calcRiskScore({ crimeIdx: 0.92, weatherIdx: 0.88, cargoValIdx: 0.85, fatigueIdx: 0.15, shadowIdx: 0.25 }) >= 70, 'Risco >= 70 deve acionar bloqueio');
})();

const fleet = [
  {
    id: 'CAM-01',
    driver: 'Seu Carlos Silva',
    model: 'Carreta 6 Eixos',
    route: 'São Paulo → Rio de Janeiro (BR-116)',
    status: 'optimal',
    loadTons: 28.4,
    maxTons: 30,
    kmL: 2.42,
    costKm: 4.88,
    rpm: 1340,
    brakesC: 138,
    tankDesc: 'Meio tanque (roda +410 km)',
    restMin: 38,
    speedKmh: 78,
    idealKmh: 70,
    link: 'Starlink LEO + 5G',
    health: 'Saúde 98%',
    aiNote: 'Reduzir p/ 70 km/h na subida (+4% diesel)',
    driverTip: 'Reduza para 70 km/h nos próximos 5 km para economizar 4% de diesel na subida.',
    hubNotice: 'Parada no Hub Km 120 (Posto Resende) para troca de carreta com o Caminhão B (CAM-08).',
    pts: [[475, 388], [505, 368], [528, 362]],
    t: 0.18,
    step: 0.00085
  },
  {
    id: 'CAM-04',
    driver: 'Marcos Lima',
    model: 'Graneleiro · Vazio',
    route: 'Goiânia → São Paulo (BR-050)',
    status: 'empty',
    loadTons: 0.0,
    maxTons: 30,
    kmL: 3.15,
    costKm: 5.64,
    rpm: 1290,
    brakesC: 112,
    tankDesc: '3/4 de tanque (roda +620 km)',
    restMin: 95,
    speedKmh: 80,
    idealKmh: 80,
    link: '5G + Satélite Standby',
    health: 'Vazio · Match IA',
    aiNote: 'Coletar 18t em Uberlândia (+R$ 6.400 líquidos)',
    driverTip: 'Mantenha 80 km/h na descida leve para aproveitar o embalo com segurança.',
    hubNotice: 'Coleta de retorno sugerida em Uberlândia (9 km da pista) — aguardando liberação.',
    pts: [[432, 292], [452, 335], [475, 388]],
    t: 0.30,
    step: 0.00105
  },
  {
    id: 'CAM-08',
    driver: 'João Pedro',
    model: 'Cavalo + Baú (Revezamento)',
    route: 'Rio de Janeiro → Hub Km 120 Resende',
    status: 'hub',
    loadTons: 26.0,
    maxTons: 30,
    kmL: 2.48,
    costKm: 4.76,
    rpm: 1310,
    brakesC: 131,
    tankDesc: 'Tanque cheio (roda +780 km)',
    restMin: 38,
    speedKmh: 74,
    idealKmh: 75,
    link: '5G + Starlink Ativo',
    health: 'Encontro em 38m',
    aiNote: 'Troca de semirreboque agendada c/ CAM-01',
    driverTip: 'Ritmo excelente! Você chegará junto com o Caminhão 01 sem fila no pátio.',
    hubNotice: 'Vá para a Vaga 04 no Hub Km 120 para trocar de carreta com Seu Carlos (CAM-01).',
    pts: [[528, 362], [505, 368]],
    t: 0.52,
    step: 0.0007
  },
  {
    id: 'CAM-12',
    driver: 'André Souza',
    model: 'Carreta 30t (Baldeação VUC)',
    route: 'Curitiba → Hub Guarulhos SP (BR-116)',
    status: 'hub',
    loadTons: 29.8,
    maxTons: 30,
    kmL: 2.36,
    costKm: 4.91,
    rpm: 1390,
    brakesC: 149,
    tankDesc: 'Meio tanque (roda +390 km)',
    restMin: 52,
    speedKmh: 72,
    idealKmh: 70,
    link: 'Starlink LEO Ativo',
    health: 'Baldeação ZMRC',
    aiNote: 'Transferir carga p/ 3 VUCs na entrada de SP',
    driverTip: 'Use o freio-motor na serra para poupar as lonas de freio.',
    hubNotice: 'Não entre na Marginal: pare no Hub Guarulhos (Doca 02) para passar a carga aos VUCs.',
    pts: [[442, 428], [475, 388]],
    t: 0.62,
    step: 0.0009
  },
  {
    id: 'CAM-15',
    driver: 'Raimundo Neto',
    model: ' Carreta Sider',
    route: 'Belém → Goiânia (BR-153)',
    status: 'optimal',
    loadTons: 25.2,
    maxTons: 30,
    kmL: 2.51,
    costKm: 4.72,
    rpm: 1320,
    brakesC: 129,
    tankDesc: '2/3 de tanque (roda +530 km)',
    restMin: 110,
    speedKmh: 76,
    idealKmh: 75,
    link: 'Starlink LEO Exclusivo',
    health: 'Saúde 99%',
    aiNote: 'Trecho sem torre celular · 100% via satélite LEO',
    driverTip: 'Pista livre à frente nos próximos 40 km. Velocidade ideal em 75 km/h.',
    hubNotice: 'Parada de descanso programada no Posto Alvorada em 1h 50m.',
    pts: [[445, 125], [438, 215], [432, 292]],
    t: 0.41,
    step: 0.0008
  },
  {
    id: 'CAM-19',
    driver: 'Roberto Alves',
    model: 'Bitrem 37t',
    route: 'Cuiabá → Goiânia (BR-364)',
    status: 'optimal',
    loadTons: 36.5,
    maxTons: 38,
    kmL: 2.28,
    costKm: 4.79,
    rpm: 1350,
    brakesC: 141,
    tankDesc: 'Tanque cheio (roda +710 km)',
    restMin: 84,
    speedKmh: 75,
    idealKmh: 75,
    link: 'Starlink LEO Ativo',
    health: 'Saúde 97%',
    aiNote: 'Pressão dos pneus e temperatura dos eixos normais',
    driverTip: 'Condução nota 10! Consumo de diesel 5% melhor que a meta.',
    hubNotice: 'Descanso programado no Hub Rondonópolis às 22:15.',
    pts: [[338, 272], [432, 292]],
    t: 0.46,
    step: 0.00085
  },
  {
    id: 'CAM-23',
    driver: 'Paulo Nunes',
    model: 'Baú Refrigerado (-18 °C)',
    route: 'Salvador → Recife (BR-101)',
    status: 'optimal',
    loadTons: 22.1,
    maxTons: 28,
    kmL: 2.59,
    costKm: 4.61,
    rpm: 1280,
    brakesC: 124,
    tankDesc: 'Meio tanque (roda +440 km)',
    restMin: 65,
    speedKmh: 78,
    idealKmh: 78,
    link: '5G + Starlink',
    health: 'Frio -18 °C OK',
    aiNote: 'Refrigeração estável · Sem paradas não previstas',
    driverTip: 'Temperatura do baú perfeita (-18 °C). Siga na faixa da direita.',
    hubNotice: 'Descarga direta no CD Recife Sul com senha já liberada.',
    pts: [[575, 292], [628, 212]],
    t: 0.29,
    step: 0.00095
  },
  {
    id: 'CAM-27',
    driver: 'Sérgio Moraes',
    model: 'Carreta Prancha',
    route: 'Porto Alegre → Curitiba (BR-116)',
    status: 'optimal',
    loadTons: 24.0,
    maxTons: 30,
    kmL: 2.46,
    costKm: 4.81,
    rpm: 1330,
    brakesC: 135,
    tankDesc: '3/4 de tanque (roda +590 km)',
    restMin: 72,
    speedKmh: 73,
    idealKmh: 75,
    link: '5G Multi-Operadora',
    health: 'Saúde 98%',
    aiNote: 'Clima limpo na Serra Gaúcha · Rota normal',
    driverTip: 'Neblina leve adiante em Lages: mantenha farol baixo aceso.',
    hubNotice: 'Ponto de apoio em Lages disponível em 1h 12m.',
    pts: [[405, 482], [442, 428]],
    t: 0.37,
    step: 0.0009
  }
];

const state = {
  selectedTruckId: 'CAM-01',
  simSpeed: 1,
  zoom: 1,
  onlyEmpty: false,
  riskActive: false,
  backhaulDone: false,
  vucDone: false,
  savingsTotal: 418400,
  dashOffset: 0
};

const statusColors = {
  optimal: '#10b981',
  empty: '#f59e0b',
  hub: '#38bdf8',
  danger: '#ef4444'
};

const svgIcons = {
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="12" x2="18.5" y2="5.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  navigation: '<polygon points="3 11 21 3 13 21 11 13 3 11"/>',
  'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.8"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  fuel: '<rect x="4" y="4" width="10" height="16" rx="1"/><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  repeat: '<polyline points="17 2 21 6 17 10"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 22 3 18 7 14"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  'git-fork': '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9M12 13v2"/>',
  'cloud-lightning': '<path d="M19 16.9A5 5 0 0 0 18 7h-1.3a8 8 0 1 0-11.6 9"/><polyline points="13 11 9 17 15 17 11 23"/>',
  'package-plus': '<path d="M21 10V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l2-1.1"/><path d="M16 19h6M19 16v6"/>',
  'fast-forward': '<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  'arrow-up-right': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>'
};

function mountIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const key = el.getAttribute('data-icon');
    const size = el.getAttribute('data-size') || '18';
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcons[key] || '<circle cx="12" cy="12" r="8"/>'}</svg>`;
  });
}

function interpPolyline(pts, t) {
  const segs = pts.length - 1;
  const scaled = Math.min(0.9999, Math.max(0, t)) * segs;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const [x1, y1] = pts[idx];
  const [x2, y2] = pts[idx + 1];
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  return { x: x1 + (x2 - x1) * frac, y: y1 + (y2 - y1) * frac, angle };
}

function formatBRL(num) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateFleetKpis() {
  const avgCost = fleet.reduce((acc, item) => acc + item.costKm, 0) / fleet.length;
  document.getElementById('kpiCostKm').textContent = `R$ ${formatBRL(avgCost)}/km`;
  document.getElementById('kpiSavings').textContent = `R$ ${state.savingsTotal.toLocaleString('pt-BR')}`;
}

function renderMapTrucks() {
  const layer = document.getElementById('trucksLayer');
  const visibleFleet = state.onlyEmpty ? fleet.filter((tr) => tr.status === 'empty') : fleet;

  layer.innerHTML = visibleFleet
    .map((tr) => {
      const pos = interpPolyline(tr.pts, tr.t);
      const color = statusColors[tr.status] || '#10b981';
      const isSel = tr.id === state.selectedTruckId;
      const ring = isSel ? `<circle cx="0" cy="0" r="14" fill="none" stroke="#f8fafc" stroke-width="2" />` : '';
      return `
        <g transform="translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})" style="cursor:pointer" onclick="selectTruck('${tr.id}')">
          ${ring}
          <g transform="rotate(${pos.angle.toFixed(1)})">
            <polygon points="10,0 -6,-6.5 -3,0 -6,6.5" fill="${color}" stroke="#091017" stroke-width="1.3" />
          </g>
          <text x="12" y="-8" fill="#f8fafc" font-size="12" font-weight="700">${tr.id}</text>
        </g>`;
    })
    .join('');
}

function populateTruckSelector() {
  const sel = document.getElementById('truckSelect');
  sel.innerHTML = fleet
    .map((tr) => `<option value="${tr.id}" ${tr.id === state.selectedTruckId ? 'selected' : ''}>${tr.id} · ${tr.model}</option>`)
    .join('');
}

function selectTruck(id) {
  state.selectedTruckId = id;
  const tr = fleet.find((item) => item.id === id);
  if (!tr) return;

  const sel = document.getElementById('truckSelect');
  if (sel && sel.value !== id) sel.value = id;

  document.getElementById('twinRoute').textContent = `${tr.route} · Mot. ${tr.driver}`;
  document.getElementById('twinBadge').textContent = tr.health;
  document.getElementById('twinBadge').className =
    tr.status === 'empty' ? 'status-pill pill-amber' : tr.status === 'danger' ? 'status-pill pill-danger' : 'status-pill pill-emerald';
  document.getElementById('svgWeightText').textContent = `${tr.loadTons.toFixed(1).replace('.', ',')}t`;
  document.getElementById('twinCostKm').textContent = `R$ ${formatBRL(tr.costKm)}/km`;
  document.getElementById('twinKmL').textContent = `${tr.kmL.toFixed(2).replace('.', ',')} km/L`;
  document.getElementById('twinRpm').textContent = `${tr.rpm.toLocaleString('pt-BR')} RPM`;
  document.getElementById('twinBrakes').textContent = `${tr.brakesC} °C · OK`;
  document.getElementById('twinLink').textContent = tr.link;
  document.getElementById('twinAiNote').textContent = tr.aiNote;

  // Sincroniza também o cabeçalho e orientações da Visão do Motorista
  document.getElementById('driverGreeting').textContent = `Olá, ${tr.driver} · ${tr.id}`;
  document.getElementById('driverTipText').textContent = tr.driverTip;
  document.getElementById('driverHubText').textContent = tr.hubNotice;
  document.getElementById('driverSpeedVal').textContent = `${tr.speedKmh} km/h`;
  document.getElementById('driverTankVal').textContent = tr.tankDesc;
  document.getElementById('driverRestVal').textContent = `Em ${tr.restMin} min`;
  document.getElementById('idealSpeedSign').textContent = String(tr.idealKmh);

  renderMapTrucks();
}

function switchMainView(view) {
  const isTower = view === 'tower';
  document.getElementById('viewTower').classList.toggle('hidden', !isTower);
  document.getElementById('viewDriver').classList.toggle('hidden', isTower);
  document.getElementById('tabTowerBtn').classList.toggle('active', isTower);
  document.getElementById('tabDriverBtn').classList.toggle('active', !isTower);
  if (!isTower) document.getElementById('driverAlertBadge').classList.add('hidden');
}

function switchDriverScreen(mode) {
  const isGps = mode === 'gps';
  document.getElementById('driverGpsScreen').classList.toggle('hidden', !isGps);
  document.getElementById('driverCamScreen').classList.toggle('hidden', isGps);
  document.getElementById('btnModeGps').className = isGps ? 'btn btn-cabin btn-primary' : 'btn btn-cabin';
  document.getElementById('btnModeCam').className = !isGps ? 'btn btn-cabin btn-primary' : 'btn btn-cabin';
}

function toggleDayNightTheme() {
  const isDay = document.body.classList.toggle('theme-day');
  document.getElementById('themeBtnLabel').textContent = isDay ? 'Modo Noite' : 'Modo Sol';
  showToast(isDay ? 'Modo Diurno Alto Contraste ativado para sol forte na cabine.' : 'Modo Noturno ativado para conforto visual.');
}

function zoomMap(delta) {
  if (delta === 0) {
    state.zoom = 1;
  } else {
    state.zoom = Math.min(1.6, Math.max(1, +(state.zoom + delta).toFixed(2)));
  }
  const svg = document.getElementById('brazilMapSvg');
  const w = 760 / state.zoom;
  const h = 520 / state.zoom;
  const x = (760 - w) * 0.58;
  const y = (520 - h) * 0.55;
  svg.setAttribute('viewBox', `${x.toFixed(0)} ${y.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`);
}

function toggleMapLayer(layer) {
  if (layer === 'hubs') {
    const el = document.getElementById('layerHubs');
    const hidden = el.classList.toggle('hidden');
    document.getElementById('btnLayerHubs').classList.toggle('active', !hidden);
  } else if (layer === 'risk') {
    const el = document.getElementById('layerRiskZone');
    const hidden = el.classList.toggle('hidden');
    document.getElementById('btnLayerRisk').classList.toggle('active', !hidden);
  } else if (layer === 'empty') {
    state.onlyEmpty = !state.onlyEmpty;
    document.getElementById('btnLayerEmpty').classList.toggle('active', state.onlyEmpty);
    renderMapTrucks();
  }
}

function toggleSimulationSpeed() {
  state.simSpeed = state.simSpeed === 1 ? 3 : state.simSpeed === 3 ? 0 : 1;
  document.getElementById('simSpeedText').textContent =
    state.simSpeed === 0 ? 'Mapa Pausado' : `Velocidade: ${state.simSpeed}x`;
}

function allocateReturnFreight() {
  if (state.backhaulDone) return;
  state.backhaulDone = true;

  const cam04 = fleet.find((t) => t.id === 'CAM-04');
  cam04.status = 'optimal';
  cam04.model = 'Graneleiro · Retorno IA';
  cam04.loadTons = 18.0;
  cam04.costKm = 3.92;
  cam04.health = 'Frete Retorno Ativo';
  cam04.aiNote = '18t alocadas em Uberlândia (+R$ 6.400 líquidos)';
  cam04.hubNotice = 'Coleta confirmada em Uberlândia (Doca B) · Sem fila de espera.';

  state.savingsTotal += 6400;
  updateFleetKpis();
  populateTruckSelector();

  document.getElementById('kpiBackhaul').textContent = '96,8%';
  document.getElementById('kpiBackhaulSub').textContent = 'Zero carretas vazias no corredor';
  document.getElementById('backhaulTag').textContent = 'Alocado';
  document.getElementById('backhaulTag').className = 'status-pill pill-emerald';

  const btn = document.getElementById('btnMatchBackhaul');
  btn.textContent = 'Carga Alocada no CAM-04 (Enviado à Cabine)';
  btn.disabled = true;

  selectTruck('CAM-04');
  showToast('Match concluído em 134 ms: CAM-04 alocado com 18t em Uberlândia (+R$ 6.400).');
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
  showToast('Baldeação autorizada: 3 VUCs elétricos aguardando o CAM-12 fora da ZMRC.');
}

function simulateRiskEvent() {
  state.riskActive = !state.riskActive;
  const cam01 = fleet.find((t) => t.id === 'CAM-01');

  if (state.riskActive) {
    const score = calcRiskScore({ crimeIdx: 0.92, weatherIdx: 0.88, cargoValIdx: 0.85, fatigueIdx: 0.15, shadowIdx: 0.25 });
    document.getElementById('latencyReadout').textContent = '168 ms';
    document.getElementById('layerRiskZone').classList.remove('hidden');
    document.getElementById('btnLayerRisk').classList.add('active');
    document.getElementById('br116DangerSeg').setAttribute('stroke', '#ef4444');
    document.getElementById('safeDetourPath').classList.remove('hidden');
    document.getElementById('detourRampSvg').classList.remove('hidden');

    cam01.pts = [[475, 388], [496, 354], [528, 362]];
    cam01.aiNote = 'Desvio ativo: evitando BR-X (22h + chuva intensa)';

    document.getElementById('kpiRisk').textContent = `${score} → 19 / 100`;
    document.getElementById('kpiRiskSub').textContent = 'BR-X bloqueada · Desvio seguro ativo';
    document.getElementById('simRiskLabel').textContent = 'Restaurar Rota Original';

    document.getElementById('signDistText').textContent = '350 m';
    document.getElementById('signRoadCode').textContent = 'Desvio Seguro IA · SP-070';
    document.getElementById('signRoadName').textContent = 'Pegue a Saída à Direita';
    document.getElementById('gpsTimeRem').textContent = '0h 50m';
    document.getElementById('gpsEta').textContent = '21:52';
    document.getElementById('driverStatusLine').textContent = 'Rota desviada p/ sua segurança · Estrada iluminada e patrulhada';
    document.getElementById('driverSecurityText').innerHTML =
      'Rota alterada automaticamente: <strong>evitando a BR-X devido ao horário de risco (22h) e chuva forte</strong>.';
    document.getElementById('driverAlertBadge').classList.remove('hidden');

    selectTruck('CAM-01');
    showToast(`Risco crítico (${score}/100) na BR-X às 22h. Desvio seguro ativado em 168 ms.`);
  } else {
    document.getElementById('latencyReadout').textContent = '142 ms';
    document.getElementById('layerRiskZone').classList.add('hidden');
    document.getElementById('btnLayerRisk').classList.remove('active');
    document.getElementById('br116DangerSeg').setAttribute('stroke', '#2b445c');
    document.getElementById('safeDetourPath').classList.add('hidden');
    document.getElementById('detourRampSvg').classList.add('hidden');

    cam01.pts = [[475, 388], [505, 368], [528, 362]];
    cam01.aiNote = 'Reduzir p/ 70 km/h na subida (+4% diesel)';

    document.getElementById('kpiRisk').textContent = '18 / 100';
    document.getElementById('kpiRiskSub').textContent = '0 trechos bloqueados no momento';
    document.getElementById('simRiskLabel').textContent = 'Simular Alerta de Risco / Recálculo IA';

    document.getElementById('signDistText').textContent = '4,8 km';
    document.getElementById('signRoadCode').textContent = 'BR-116 · Pres. Dutra';
    document.getElementById('signRoadName').textContent = 'Mantenha a Direita';
    document.getElementById('gpsTimeRem').textContent = '0h 38m';
    document.getElementById('gpsEta').textContent = '21:40';
    document.getElementById('driverStatusLine').textContent = 'Sinal via Satélite Ativo · Viagem tranquila e protegida';
    selectTruck('CAM-01');
    showToast('Trecho normalizado. Rota principal restaurada.');
  }
}

function ackDriverCard(btnId, doneText) {
  const btn = document.getElementById(btnId);
  btn.textContent = doneText;
  btn.disabled = true;
  if (btnId === 'btnAckEco') {
    const tr = fleet.find((item) => item.id === state.selectedTruckId);
    if (tr) tr.speedKmh = tr.idealKmh;
    document.getElementById('driverSpeedVal').textContent = `${tr ? tr.idealKmh : 70} km/h (Ideal)`;
    showToast('Velocidade ajustada. Economia de 4% de diesel ativa na subida.');
  } else {
    showToast('Confirmação enviada para a Torre de Controle.');
  }
}

function callControlTower() {
  showToast('Canal de voz via Satélite aberto com o operador da Torre de Controle.');
}

function speakDriverGuidance() {
  const tr = fleet.find((item) => item.id === state.selectedTruckId) || fleet[0];
  const msg = `Atenção ${tr.driver}. ${tr.driverTip} Rota protegida evitando a B R X pelo horário de risco. ${tr.hubNotice}`;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(msg);
    utter.lang = 'pt-BR';
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  }
  showToast('Multimídia: lendo orientações claras em voz alta para o motorista.');
}

function toggleCameraExpand(camEl) {
  camEl.classList.toggle('expanded');
}

function updateCabinClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const clockEl = document.getElementById('camClock');
  if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
}

let toastTimer;
function showToast(message) {
  const el = document.getElementById('sysToast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4200);
}

function tickAnimation() {
  if (state.simSpeed > 0) {
    fleet.forEach((tr) => {
      tr.t = (tr.t + tr.step * state.simSpeed) % 1;
    });
    renderMapTrucks();

    // Movimento suave das faixas no Guia 3D da cabine
    state.dashOffset = (state.dashOffset - 0.6 * state.simSpeed) % 18;
    document.querySelectorAll('.road-dash-line').forEach((line) => {
      line.setAttribute('stroke-dashoffset', state.dashOffset.toFixed(1));
    });
  }
  requestAnimationFrame(tickAnimation);
}

function initRotaPerfeita() {
  mountIcons();
  populateTruckSelector();
  updateFleetKpis();
  selectTruck('CAM-01');
  updateCabinClock();
  setInterval(updateCabinClock, 1000);
  requestAnimationFrame(tickAnimation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRotaPerfeita);
} else {
  initRotaPerfeita();
}
