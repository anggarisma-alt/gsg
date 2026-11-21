const $ = s => document.querySelector(s), pad = n => String(n).padStart(2, '0'), rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const D = new Date(), TODAY = D.getFullYear() + '-' + pad(D.getMonth() + 1) + '-' + pad(D.getDate());
const S = { tok: null, u: null, page: 'kal', ym: TODAY.slice(0, 7), boot: null, bk: [] };
const IC = { kal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', bk: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>', kas: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>', dash: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>', akun: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', lunas: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>', tema: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>' };
const ic = k => '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>';

/* ---- Transport REST: fetch + timeout + retry + idempotensi (reqId) ---- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
const bar = v => $('#bar').classList.toggle('on', v);
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'show' + (err ? ' err' : ''); clearTimeout(t._h); t._h = setTimeout(() => t.className = '', 3200); }
async function net(url, opt, ms, tries) {
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
    try { const r = await fetch(url, Object.assign({ signal: ac.signal }, opt)); if (r.status >= 500 || r.status === 429) throw new Error('HTTP ' + r.status); return await r.json(); }
    catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, 700 * (i + 1))); } finally { clearTimeout(t); }
  }
}
const POST = body => ({ method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
const WRITE = ['buat', 'setujui', 'batal', 'bayar', 'kasTambah', 'katSimpan', 'userSimpan', 'cfgSimpan', 'gantiPin'], PM = {};
async function call(a, p) {
  const w = WRITE.includes(a); bar(true);
  try {
    const r = await net(GAS_URL, POST({ action: a, token: S.tok, data: p || {}, reqId: uid() }), w ? 90000 : 25000, w ? 2 : 3);
    if (r.expired) { keluar(); toast('Sesi berakhir, silakan masuk lagi.', 1); return null; }
    if (!r.success) { toast(r.message || 'Gagal.', 1); return null; }
    if (w) Object.keys(PM).forEach(k => delete PM[k]);
    return r.data;
  } catch (e) { toast(navigator.onLine ? 'Server lambat/gagal, coba lagi.' : 'Tidak ada koneksi internet.', 1); return null; } finally { bar(false); }
}
async function pub(a, p) {
  const k = a + '|' + p, h = PM[k]; if (h && Date.now() - h.t < 60000) return h.d;
  bar(true);
  try { const r = await net(GAS_URL + '?action=pub&a=' + a + '&p=' + encodeURIComponent(p || ''), {}, 25000, 3); if (!r.success) { toast(r.message, 1); return null; } PM[k] = { t: Date.now(), d: r.data }; return r.data; }
  catch (e) { toast('Koneksi gagal. Periksa internet.', 1); return null; } finally { bar(false); }
}

/* ---- Tema, sheet, navigasi ---- */
function tema(set) {
  const t = set || (document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  document.documentElement.dataset.theme = t; $('#btnTema').innerHTML = ic('tema');
  try { localStorage.setItem('gsg_tema', t); } catch (e) {}
}
function sheet(h) { const s = $('#sheet'); s.innerHTML = '<div class="bd" onclick="tutup()"></div><div class="pn" role="dialog" aria-modal="true">' + '<button class="ib x" onclick="tutup()" aria-label="Tutup">&times;</button>' + h + '</div>'; s.hidden = false; }
const tutup = () => { $('#sheet').hidden = true; };
function shell() {
  const r = S.u && S.u.role, m = [['kal', 'Kalender']];
  if (S.u) { m.push(['bk', 'Booking']); if (['kades', 'sekdes', 'keuangan'].includes(r)) m.push(['lunas', 'Pelunasan'], ['kas', 'Kas'], ['dash', 'Ringkasan']); m.push(['akun', 'Pengaturan']); }
  const act = S.page === 'master' ? 'akun' : S.page;
  $('#nav').hidden = !S.u; $('#nav').className = 'bnav' + (m.length > 5 ? ' n6' : '');
  $('#nav').innerHTML = m.map(x => '<button class="' + (act === x[0] ? 'on' : '') + '" onclick="go(\'' + x[0] + '\')">' + ic(x[0]) + '<span>' + x[1] + '</span></button>').join('');
  $('#btnMasuk').textContent = S.u ? 'Keluar' : 'Masuk';
  $('#who').textContent = S.u ? S.u.nama + ' (' + S.u.role + ')' : (S.pc ? S.pc.nama_desa : 'Gedung Serba Guna Desa');
}
// Navigasi dengan riwayat browser: tombol Back pindah halaman, TIDAK logout
function go(p, noPush) {
  S.page = p; shell(); if (!noPush) history.pushState({ p: p }, '', '#' + p);
  ({ kal: pageKal, bk: pageBk, kas: pageKas, dash: pageDash, akun: pageAkun, master: pageMaster, lunas: pageLunas })[p](); window.scrollTo(0, 0);
}
addEventListener('popstate', e => {
  const st = e.state || {};
  if (!$('#sheet').hidden) { $('#sheet').hidden = true; history.pushState({ p: S.page }, '', '#' + S.page); return; } // Back menutup pop-up
  if (st.p === 'base') { if (S.u) { history.pushState({ p: S.page }, '', '#' + S.page); toast('Untuk keluar akun, buka menu Pengaturan > Keluar.'); } else history.back(); return; }
  if (st.p && st.p !== S.page) go(!S.u && st.p !== 'kal' ? 'kal' : st.p, 1);
});
function simpanSesi() { try { sessionStorage.setItem('gsg_s', JSON.stringify({ tok: S.tok, u: S.u, boot: S.boot })); } catch (e) {} }
function masuk() {
  if (S.u) return keluar();
  sheet('<h2>Masuk Petugas</h2><label class="field"><span>Username</span><input id="lu" autocomplete="username" autocapitalize="none"></label><label class="field"><span>PIN</span><input id="lp" type="password" inputmode="numeric" autocomplete="current-password"></label><div id="le" class="err-in"></div><button class="btn w" id="lb" onclick="doLogin()">Masuk</button>');
}
async function doLogin() {
  const b = $('#lb'); b.disabled = true; bar(true);
  try {
    const r = await net(GAS_URL, POST({ action: 'login', data: { username: $('#lu').value, pin: $('#lp').value } }), 30000, 1);
    if (!r.success) { $('#le').textContent = r.message; return; }
    S.tok = r.data.token; S.u = { nama: r.data.nama, role: r.data.role }; S.boot = r.data.boot; S.bk = r.data.list || []; simpanSesi();
    tutup(); toast('Selamat datang, ' + r.data.nama); go('bk');
  } catch (e) { $('#le').textContent = 'Koneksi gagal, coba lagi.'; } finally { b.disabled = false; bar(false); }
}
function keluar() { S.tok = null; S.u = null; try { sessionStorage.removeItem('gsg_s'); } catch (e) {} go('kal'); }

/* ---- Kalender publik ---- */
async function pageKal() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>';
  const m = await pub('bulan', S.ym) || {}, [y, mo] = S.ym.split('-').map(Number), first = new Date(y, mo - 1, 1).getDay(), n = new Date(y, mo, 0).getDate();
  let g = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(x => '<div class="h">' + x + '</div>').join('') + '<span></span>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = S.ym + '-' + pad(d), st = m[k];
    g += '<button class="' + (st === 'penuh' ? 'p' : st === 'sebagian' ? 's' : '') + (k === TODAY ? ' t' : '') + '" onclick="hari(\'' + k + '\')" aria-label="' + d + ' ' + (st === 'penuh' ? 'terisi penuh' : st === 'sebagian' ? 'sebagian terisi' : 'kosong') + '">' + d + '</button>';
  }
  const nm = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  c.innerHTML = '<h2>Jadwal Gedung</h2><div class="card"><div class="row" style="grid-template-columns:44px 1fr 44px;align-items:center;margin-bottom:12px"><button class="ib" onclick="bln(-1)" aria-label="Bulan sebelumnya">&lsaquo;</button><b style="text-align:center">' + nm + '</b><button class="ib" onclick="bln(1)" aria-label="Bulan berikutnya">&rsaquo;</button></div><div class="cal">' + g + '</div>' +
    '<div class="lg"><span><i style="background:var(--sf);border:1px solid var(--bd)"></i>Kosong</span><span><i style="background:#FDE68A"></i>Sebagian jam terisi</span><span><i style="background:#FCA5A5"></i>Terisi penuh</span></div></div><p class="mu">Ketuk tanggal untuk melihat jam yang tersedia. Untuk menyewa, hubungi perangkat desa.</p>';
}
function bln(d) { const [y, m] = S.ym.split('-').map(Number), x = new Date(y, m - 1 + d, 1); S.ym = x.getFullYear() + '-' + pad(x.getMonth() + 1); pageKal(); }
async function hari(k) {
  const r = await pub('hari', k); if (!r) return;
  let h = ''; for (let i = 0; i < 24; i++) { const o = i < r.open || i >= r.close, c = o ? 'o' : r.jam[i] ? 'x' : 'f'; h += '<div class="' + c + '">' + pad(i) + ':00<br><small>' + (o ? 'Tutup' : r.jam[i] ? 'Terisi' : 'Kosong') + '</small></div>'; }
  sheet('<h2>' + new Date(k + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</h2><div class="tl">' + h + '</div><div class="lg"><span><i style="background:var(--ok)"></i>Tersedia</span><span><i style="background:var(--bad)"></i>Terisi</span><span><i style="background:var(--off)"></i>Di luar jam operasional</span></div>');
}

/* ---- Booking ---- */
const CH = { 'Diajukan': 'wr', 'Disetujui': 'ok', 'Berjalan': 'ok', 'Selesai': '', 'Dibatalkan': 'no', 'Dibatalkan Sistem': 'no' };
const wkt = b => b.jenis === 'harian' ? b.mulai.slice(0, 10) + ' s/d ' + b.selesai.slice(0, 10) : b.mulai.slice(0, 10) + ' ' + b.mulai.slice(11) + '-' + b.selesai.slice(11);
async function pageBk() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>';
  S.bk = await call('list') || [];
  c.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Booking</h2><button class="btn sm" onclick="formBk()">+ Booking</button></div>' +
    (S.bk.map((b, i) => '<div class="card" onclick="detail(' + i + ')" style="cursor:pointer"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(b.nama) + '</b><span class="chip ' + (CH[b.status] || '') + '">' + b.status + '</span></div><div class="mu">' + esc(b.no) + ' &middot; ' + (b.jenis === 'harian' ? 'Harian' : 'Per jam') + '<br>' + wkt(b) + '</div><div style="margin-top:6px"><b>' + rp(b.total) + '</b> <span class="mu">&middot; ' + b.bayar + ' (sisa ' + rp(b.total - b.paid) + ')</span></div></div>').join('') || '<p class="mu">Belum ada booking.</p>');
}
function formBk() {
  const jam = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => '<option>' + (a + i) + '</option>').join('');
  sheet('<h2>Booking Baru</h2><label class="field"><span>Nama penyewa</span><input id="fn"></label><label class="field"><span>No. HP/WA</span><input id="fh" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx"></label>' +
    '<label class="field"><span>Kategori pelanggan</span><select id="fk" onchange="est()">' + S.boot.kategori.map(k => '<option value="' + k.id + '">' + esc(k.nama) + '</option>').join('') + '</select></label>' +
    '<div class="seg"><button id="sj" class="on" onclick="jenis(\'harian\')">Harian</button><button id="sp" onclick="jenis(\'perjam\')">Per Jam</button></div>' +
    '<div class="row"><label class="field"><span id="lt">Tanggal mulai</span><input id="ft" type="date" min="' + TODAY + '" value="' + TODAY + '" onchange="est()"></label><label class="field" id="ws"><span>Tanggal selesai</span><input id="fs" type="date" min="' + TODAY + '" value="' + TODAY + '" onchange="est()"></label></div>' +
    '<div class="row" id="wj" hidden><label class="field"><span>Jam mulai</span><select id="fa" onchange="est()">' + jam(S.boot.open, S.boot.close - 1) + '</select></label><label class="field"><span>Jam selesai</span><select id="fb" onchange="est()">' + jam(S.boot.open + 1, S.boot.close) + '</select></label></div>' +
    '<label class="field"><span>Keperluan acara</span><input id="fe"></label><div class="card" style="background:var(--sf2)"><span class="mu">Estimasi biaya</span><br><b id="fx" style="font-size:20px"></b></div><button class="btn w" id="fb2" onclick="kirimBk()">Ajukan Booking</button>');
  window._j = 'harian'; est();
}
function jenis(j) { window._j = j; $('#sj').className = j === 'harian' ? 'on' : ''; $('#sp').className = j === 'perjam' ? 'on' : ''; $('#ws').hidden = j !== 'harian'; $('#wj').hidden = j === 'harian'; $('#lt').textContent = j === 'harian' ? 'Tanggal mulai' : 'Tanggal'; est(); }
const fdata = () => ({ nama: $('#fn').value.trim(), hp: $('#fh').value.trim(), kategori_id: $('#fk').value, jenis: window._j, tgl: $('#ft').value, tglSelesai: $('#fs').value, jamMulai: $('#fa').value, jamSelesai: $('#fb').value, keperluan: $('#fe').value.trim() });
function est() {
  const p = fdata(), t = S.boot.kategori.find(x => x.id === p.kategori_id) || {};
  const v = p.jenis === 'harian' ? ((new Date(p.tglSelesai) - new Date(p.tgl)) / 864e5 + 1) * t.per_hari : (p.jamSelesai - p.jamMulai) * t.per_jam;
  $('#fx').textContent = v > 0 ? rp(v) : 'Periksa tanggal/jam'; $('#fb2').disabled = !(v > 0);
}
async function kirimBk() {
  const p = fdata(); if (!p.nama) return toast('Nama wajib diisi.', 1); if (!/^0\d{8,13}$/.test(p.hp)) return toast('No. HP tidak valid (contoh 08123456789).', 1);
  const r = await call('buat', p); if (r) { tutup(); toast('Booking ' + r.no + ' diajukan.'); pageBk(); }
}
function detail(i) {
  const b = S.bk[i], r = S.u.role, aktif = !b.status.startsWith('Dibatalkan') && b.status !== 'Selesai', sisa = b.total - b.paid;
  sheet('<h2>' + esc(b.nama) + '</h2><p class="mu">' + esc(b.no) + ' &middot; ' + esc(b.hp) + '<br>' + wkt(b) + '<br>' + esc(b.keperluan) + '</p><p><span class="chip ' + (CH[b.status] || '') + '">' + b.status + '</span> <span class="chip">' + b.bayar + '</span>' + (b.perlu_refund === true ? ' <span class="chip no">Perlu refund</span>' : '') + '</p>' +
    '<p>Total <b>' + rp(b.total) + '</b><br>Dibayar ' + rp(b.paid) + ' &middot; Sisa <b>' + rp(sisa) + '</b></p>' + '<div id="rw"></div>' + (b.alasan ? '<p class="mu">' + esc(b.alasan) + '</p>' : '') +
    (b.status === 'Diajukan' && r === 'sekdes' ? '<button class="btn w" onclick="setuju(\'' + b.id + '\')">Setujui</button><br><br>' : '') +
    (aktif && sisa > 0 && ['keuangan', 'sekdes'].includes(r) ? '<div class="seg"><button id="mp" class="on" onclick="mode(\'persen\')">Persen</button><button id="mn" onclick="mode(\'nominal\')">Nominal</button></div><div class="row"><label class="field"><span id="ml">Persen DP (%)</span><input id="bn" type="number" inputmode="numeric" value="' + S.boot.cfg.dp_persen + '"></label><label class="field"><span>Metode</span><select id="bm"><option>Tunai</option><option>Transfer</option></select></label></div><label class="field"><span>Bukti pembayaran (foto, opsional)</span><input id="bf" type="file" accept="image/*"></label><button class="btn w" onclick="bayar(\'' + b.id + '\')">Catat Pembayaran</button><br><br>' : '') +
    (aktif && ['sekdes', 'kades'].includes(r) ? '<button class="btn bad w" onclick="batal(\'' + b.id + '\')">Batalkan Booking</button>' : ''));
  window._m = 'persen'; riwayat(b.id);
}
function mode(m) { window._m = m; $('#mp').className = m === 'persen' ? 'on' : ''; $('#mn').className = m === 'nominal' ? 'on' : ''; $('#ml').textContent = m === 'persen' ? 'Persen DP (%)' : 'Nominal (Rp)'; $('#bn').value = m === 'persen' ? S.boot.cfg.dp_persen : ''; }
async function batal(id) { if (!confirm('Batalkan booking ini?')) return; if (await call('batal', { id })) { tutup(); toast('Booking dibatalkan.'); pageBk(); } }
async function setuju(id, ok) {
  const r = await call('setujui', { id, ok }); if (!r) return;
  if (r.konfirmasi) return sheet('<h2>Konfirmasi</h2><p>Sewa harian diutamakan. Booking per jam berikut akan <b>dibatalkan otomatis</b> dan penyewanya diberi tahu lewat WhatsApp:</p>' + r.konfirmasi.map(x => '<div class="card"><b>' + esc(x.nama) + '</b><br><span class="mu">' + esc(x.no) + ' &middot; ' + x.mulai.replace('T', ' ') + '-' + x.selesai.slice(11) + (x.paid > 0 ? '<br>DP ' + rp(x.paid) + ' &rarr; refund penuh' : '') + '</span></div>').join('') + '<button class="btn w" onclick="setuju(\'' + id + '\',1)">Lanjutkan</button>');
  tutup(); toast('Booking disetujui' + (r.dibatalkan ? ', ' + r.dibatalkan + ' booking per jam dibatalkan.' : '.')); pageBk();
}

/* ---- Kas & Ringkasan ---- */
async function pageKas() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>'; const k = await call('kas') || [], bisa = ['keuangan', 'sekdes'].includes(S.u.role);
  c.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Pengeluaran</h2>' + (bisa ? '<button class="btn sm" onclick="formKas()">+ Catat</button>' : '') + '</div>' +
    (k.map(x => '<div class="card"><div style="display:flex;justify-content:space-between"><b>' + esc(x.keterangan) + '</b><b>' + rp(x.nominal) + '</b></div><div class="mu">' + String(x.tanggal).slice(0, 10) + ' &middot; ' + esc(x.kategori) + ' &middot; ' + esc(x.metode) + '</div></div>').join('') || '<p class="mu">Belum ada pengeluaran.</p>');
}
function formKas() {
  sheet('<h2>Catat Pengeluaran</h2><label class="field"><span>Kategori</span><select id="kk">' + ['Kebersihan', 'Listrik & Air', 'Perawatan/Perbaikan', 'Honor Petugas', 'Perlengkapan', 'Lain-lain'].map(x => '<option>' + x + '</option>').join('') + '</select></label><label class="field"><span>Keterangan</span><input id="kt"></label><div class="row"><label class="field"><span>Nominal (Rp)</span><input id="kn" type="number" inputmode="numeric"></label><label class="field"><span>Metode</span><select id="km"><option>Tunai</option><option>Transfer</option></select></label></div><button class="btn w" onclick="simpanKas()">Simpan</button>');
}
async function simpanKas() { if (await call('kasTambah', { kategori: $('#kk').value, keterangan: $('#kt').value.trim(), nominal: $('#kn').value, metode: $('#km').value })) { tutup(); toast('Pengeluaran tersimpan.'); pageKas(); } }
async function pageDash() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>'; const d = await call('dash'); if (!d) return;
  const ins = [d.belumDP ? d.belumDP + ' booking disetujui tapi belum ada DP.' : '', d.perluRefund ? d.perluRefund + ' booking perlu refund DP.' : '', d.laba >= 0 ? 'Bulan ini surplus ' + rp(d.laba) + '.' : 'Bulan ini defisit ' + rp(-d.laba) + ', pengeluaran melebihi pemasukan.', d.piutang ? 'Piutang sewa belum lunas ' + rp(d.piutang) + '.' : ''].filter(Boolean);
  c.innerHTML = '<h2>Ringkasan Bulan Ini</h2><div class="kpi">' + [['Booking', d.bulanIni], ['Acara hari ini', d.hariIni], ['Pemasukan', rp(d.masuk)], ['Pengeluaran', rp(d.keluar)], ['Laba bersih', rp(d.laba)], ['Piutang', rp(d.piutang)]].map(x => '<div class="card"><span class="mu">' + x[0] + '</span><b>' + x[1] + '</b></div>').join('') + '</div><div class="card" style="margin-top:12px"><h3>Insight</h3>' + ins.map(x => '<p style="margin:4px 0">&bull; ' + x + '</p>').join('') + '</div>';
}

/* ---- Mulai ---- */
function terapkanCfg(c) { if (!c) return; S.pc = c; document.title = c.nama_gedung; $('.brand b').textContent = c.nama_gedung.toUpperCase(); shell(); }
async function boot() {
  let t = 'light'; try { t = localStorage.getItem('gsg_tema') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); } catch (e) {}
  tema(t);
  try { const x = JSON.parse(sessionStorage.getItem('gsg_s') || 'null'); if (x && x.tok) { S.tok = x.tok; S.u = x.u; S.boot = x.boot; } } catch (e) {} // sesi bertahan saat refresh/Back
  const h = location.hash.slice(1), ok = ['kal', 'bk', 'lunas', 'kas', 'dash', 'akun', 'master'];
  const p = S.u ? (ok.includes(h) ? h : landing()) : 'kal';
  history.replaceState({ p: 'base' }, '', '#base'); S.page = p; history.pushState({ p: p }, '', '#' + p); go(p, 1);
  pub('cfg', '').then(terapkanCfg);
}
