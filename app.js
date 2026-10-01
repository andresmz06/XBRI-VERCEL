const $ = s => document.querySelector(s);
const filas = $('#filas'), vacio = $('#vacio'), modal = $('#modal'), form = $('#form'), errorEl = $('#error');
const gs = n => new Intl.NumberFormat('es-PY').format(n) + ' Gs.';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

/* ---------- Almacenamiento en localStorage ---------- */
const KEY = 'xbri_neumaticos';
const EJEMPLOS = [
  { ancho: 205, altura: 55, aro: 16, tipo: 'Auto', precio: 520000, stock: 12 },
  { ancho: 185, altura: 65, aro: 15, tipo: 'Auto', precio: 430000, stock: 8 },
  { ancho: 265, altura: 65, aro: 17, tipo: 'Camioneta', precio: 890000, stock: 5 },
  { ancho: 90, altura: 90, aro: 18, tipo: 'Moto', precio: 210000, stock: 2 },
  { ancho: 295, altura: 80, aro: 22.5, tipo: 'Camión', precio: 1850000, stock: 6 },
].map(n => ({ id: nuevoId(), ...n }));

function leer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) { guardar(EJEMPLOS); return EJEMPLOS; }
    return JSON.parse(raw);
  } catch { return []; }
}
function guardar(lista) {
  try { localStorage.setItem(KEY, JSON.stringify(lista)); }
  catch { throw new Error('No se pudo guardar. Revisá que el navegador permita almacenamiento local.'); }
}
function validar(b) {
  const d = { ancho: Number(b.ancho), altura: Number(b.altura), aro: Number(b.aro),
    tipo: String(b.tipo || '').trim(), precio: Number(b.precio), stock: Number(b.stock) };
  if (!Number.isInteger(d.ancho) || d.ancho <= 0) throw new Error('El ancho debe ser un número entero mayor a 0 (ej: 205).');
  if (!Number.isInteger(d.altura) || d.altura <= 0) throw new Error('La altura debe ser un número entero mayor a 0 (ej: 55).');
  if (!(d.aro > 0)) throw new Error('El aro debe ser un número mayor a 0 (ej: 16).');
  if (!d.tipo) throw new Error('Elegí el tipo de neumático.');
  if (!(d.precio >= 0)) throw new Error('El precio debe ser un número mayor o igual a 0.');
  if (!Number.isInteger(d.stock) || d.stock < 0) throw new Error('El stock debe ser un entero mayor o igual a 0.');
  return d;
}

/* ---------- Pantalla ---------- */
function cargar() {
  const t = $('#q').value.trim().toLowerCase(), tipo = $('#filtro').value;
  const lista = leer().filter(n =>
    (!tipo || n.tipo === tipo) &&
    (!t || `${n.ancho}/${n.altura} r${n.aro} ${n.ancho} ${n.altura} ${n.aro}`.includes(t)));
  vacio.hidden = lista.length > 0;
  filas.innerHTML = lista.map(n => `
    <tr>
      <td class="num"><strong>${esc(n.ancho)}</strong></td><td class="num">${esc(n.altura)}</td><td class="num">R${esc(n.aro)}</td><td>${esc(n.tipo)}</td>
      <td class="num">${gs(n.precio)}</td>
      <td class="num ${n.stock <= 3 ? 'pocos' : ''}">${n.stock}</td>
      <td>
        <button class="btn chico" data-editar="${n.id}">Editar</button>
        <button class="btn chico peligro" data-borrar="${n.id}">Eliminar</button>
      </td>
    </tr>`).join('');
}

function abrir(n) {
  form.reset(); errorEl.hidden = true;
  $('#titulo').textContent = n ? 'Editar neumático' : 'Agregar neumático';
  if (n) for (const k of ['id','ancho','altura','aro','tipo','precio','stock']) form.elements[k].value = n[k];
  modal.showModal();
}

$('#nuevo').onclick = () => abrir(null);
$('#cancelar').onclick = () => modal.close();
$('#q').oninput = cargar;
$('#filtro').onchange = cargar;

filas.onclick = e => {
  const ed = e.target.dataset.editar, bo = e.target.dataset.borrar;
  if (ed) abrir(leer().find(n => n.id === ed));
  if (bo && confirm('¿Eliminar este neumático? Esta acción no se puede deshacer.')) {
    guardar(leer().filter(n => n.id !== bo));
    cargar();
  }
};

form.onsubmit = e => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  try {
    const d = validar(datos), lista = leer();
    if (datos.id) { const i = lista.findIndex(n => n.id === datos.id); lista[i] = { id: datos.id, ...d }; }
    else lista.push({ id: nuevoId(), ...d });
    guardar(lista);
    modal.close(); cargar();
  } catch (err) { errorEl.textContent = err.message; errorEl.hidden = false; }
};

cargar();
