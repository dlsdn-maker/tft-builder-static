/**
 * TFT Builder static site main script.
 *
 * This script handles loading champion, trait and item data from JSON
 * files, managing the board state, rendering the board and champion list,
 * calculating active synergies, and responding to user interactions.
 */

// ---------------------
// 1. 전연 상태
// ---------------------
const state = {
  board: [],            // 체스판 캬 정보
  selectedUnitId: null, // 현재 선택한 체험험
  champions: [],        // 체험·데이터 (JSON)
  traits: [],           // 시장심 데이터 (JSON)
  items: [],            // 아이템 데이터 (JSON)
};

// DOM 캐시용 엑이틑
const dom = {
  boardRoot: null,
  championList: null,
  traitPanel: null,
};

// 초기화: DOMContentLoaded 이벤트 발생 시 실행
document.addEventListener("DOMContentLoaded", init);

/**
 * 앱 초기화 함수. 데이터 로드, DOM 캐시, 이벤트 바인딩, 초기 본 설정과
 * 처  본 안뿅을 방면한 속è.
 */
async function init() {
  try {
    await loadData();
  } catch (err) {
    console.warn("데이터를 보려온 데 실패했습니다:", err);
  }
  cacheDom();
  bindEvents();
  state.board = createEmptyBoard(4, 7);
  render();
}

/**
 * 체험·튱아이템 ·아이템 데이터를 JSON 파일에서 로드한다.
 */
async function loadData() {
  const [championsRes, traitsRes, itemsRes] = await Promise.all([
    fetch("./data/champions.json"),
    fetch("./data/traits.json"),
    fetch("./data/items.json"),
  ]);
  state.champions = await championsRes.json();
  state.traits = await traitsRes.json();
  state.items = await itemsRes.json();
}

/**
 * 주요 DOM 요용을 캐시한다.
 */
function cacheDom() {
  dom.boardRoot = document.querySelector("#board");
  dom.championList = document.querySelector("#champion-list");
  dom.traitPanel = document.querySelector("#trait-panel");
  if (!dom.boardRoot || !dom.championList || !dom.traitPanel) {
    console.warn("필수 DOM 요용을 찾을 수 없습니다.");
  }
}

/**
 * UI 상의 이벤트를 바인딩한다.
 */
function bindEvents() {
  if (dom.championList) {
    dom.championList.addEventListener("click", onChampionClick);
  }
  if (dom.boardRoot) {
    dom.boardRoot.addEventListener("click", onBoardCellClick);
  }
}

/**
 * 현재 상태를 화면에 렌더링한다.
 */
function render() {
  renderChampionList();
  renderBoard();
  renderTraits();
}

/**
 * 체험 리스트를 렌더링한다.
 */
function renderChampionList() {
  if (!dom.championList) return;
  dom.championList.innerHTML = "";
  state.champions.forEach((champ) => {
    const btn = document.createElement("button");
    btn.className = "champ-btn";
    btn.dataset.unitId = champ.id;
    btn.textContent = champ.name;
    if (state.selectedUnitId === champ.id) {
      btn.classList.add("is-selected");
    }
    dom.championList.appendChild(btn);
  });
}

/**
 * 본뎘를 렌더링한다.
 */
function renderBoard() {
  if (!dom.boardRoot) return;
  dom.boardRoot.innerHTML = "";
  state.board.forEach((cell, idx) => {
    const div = document.createElement("div");
    div.className = "board-cell";
    div.dataset.index = idx;
    if (cell.unitId) {
      const champ = state.champions.find((c) => c.id === cell.unitId);
      div.textContent = champ ? champ.name : "?";
      div.classList.add("has-unit");
    }
    dom.boardRoot.appendChild(div);
  });
}

/**
 * 활성화된 시장동률 목록을 렌더링한다.
 */
function renderTraits() {
  if (!dom.traitPanel) return;
  const active = calcTraitsFromBoard();
  dom.traitPanel.innerHTML = "";
  active.forEach((t) => {
    const traitDiv = document.createElement("div");
    traitDiv.className = "trait-row";
    traitDiv.textContent = `${t.name} - ${t.count} / LV${t.level}`;
    dom.traitPanel.appendChild(traitDiv);
  });
}

/**
 * 주어진 크기의 빈 본뎘를 생성한다.
 * @param {number} rows 행 수
 * @param {number} cols 엨 수
 * @returns {Array} 새로 생성된 본뎘 배열
 */
function createEmptyBoard(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, unitId: null, items: [] });
    }
  }
  return cells;
}

/**
 * 본뎘에서 활성화된 시장동률 목록을 계산한다.
 * @returns {Array} 활성화된 시장동률 정보 배열
 */
function calcTraitsFromBoard() {
  const counts = {};
  for (const cell of state.board) {
    if (!cell.unitId) continue;
    const champ = state.champions.find((c) => c.id === cell.unitId);
    if (!champ) continue;
    champ.traits.forEach((traitId) => {
      counts[traitId] = (counts[traitId] || 0) + 1;
    });
  }
  const result = [];
  for (const [traitId, count] of Object.entries(counts)) {
    const trait = state.traits.find((t) => t.id === traitId);
    if (!trait) continue;
    const level = trait.breakpoints.filter((bp) => count >= bp).length;
    result.push({ id: traitId, name: trait.name, count, level });
  }
  // 많이 나온 순으로 정렬
  result.sort((a, b) => b.count - a.count);
  return result;
}

/**
 * 체험 버튼 클립 시 호출되는 해달러.
 */
function onChampionClick(e) {
  const btn = e.target.closest(".champ-btn");
  if (!btn) return;
  const unitId = btn.dataset.unitId;
  if (state.selectedUnitId === unitId) {
    state.selectedUnitId = null;
  }else {
    state.selectedUnitId = unitId;
  }
  renderChampionList();
}

/**
 * 본뎘 칸 클립 시 호출되는 해달러.
 */
function onBoardCellClick(e) {
  const cellDiv = e.target.closest(".board-cell");
  if (!cellDiv) return;
  const index = Number(cellDiv.dataset.index);
  const cell = state.board[index];
  if (state.selectedUnitId) {
    cell.unitId = state.selectedUnitId;
  } else {
    cell.unitId = null;
  }
  renderBoard();
  renderTraits();
}
