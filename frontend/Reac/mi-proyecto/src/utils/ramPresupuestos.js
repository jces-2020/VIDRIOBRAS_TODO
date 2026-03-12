// simple in-memory store for budgets (presupuestos)
let ramList = [];

function _ensureId(item) {
  if (!item.__ram_id) {
    item.__ram_id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }
  return item;
}

export function addPresupuesto(p) {
  // clone to avoid external mutations
  const item = _ensureId({ ...p });
  ramList.push(item);
  return item;
}

export function updatePresupuesto(id, newData) {
  ramList = ramList.map(x =>
    x.__ram_id === id ? _ensureId({ ...x, ...newData }) : x
  );
}

export function removePresupuesto(id) {
  ramList = ramList.filter(x => x.__ram_id !== id);
}

export function getPresupuestos() {
  return [...ramList];
}

export function clearPresupuestos() {
  ramList = [];
}
