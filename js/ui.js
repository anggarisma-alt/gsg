/* ui.js — tampilan baru: login layar-terbagi, sidebar desktop, dashboard (menimpa fungsi di app.js/modul.js) */
Object.assign(IC, {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  inst: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  rec: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  his: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  warn: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', plus: '<path d="M12 5v14M5 12h14"/>'
});
const LAPR = ['kades', 'sekdes', 'keuangan'], ROLE = { sekdes: 'Sekdes', kades: 'Kepala Desa', keuangan: 'Kaur Keuangan', perangkat: 'Perangkat Desa' };
const TITLES = { kal: 'Jadwal Gedung', bk: 'Booking', lunas: 'Pelunasan', kas: 'Pengeluaran', dash: 'Dashboard', akun: 'Pengaturan', master: 'Master Data' };
const landing = () => S.u && LAPR.includes(S.u.role) ? 'dash' : 'bk';

/* ---- Kerangka: menu bawah (HP) + sidebar (desktop) ---- */
function shell() {
  const L = !!S.u, lap = L && LAPR.includes(S.u.role), m = [];
  if (L) { if (lap) m.push(['dash', 'Dashboard']); m.push(['kal', 'Kalender'], ['bk', 'Booking']); if (lap) m.push(['lunas', 'Pelunasan'], ['kas', 'Pengeluaran']); m.push(['akun', 'Pengaturan']); }
  const act = S.page === 'master' ? 'akun' : S.page, h = m.map(x => '<button class="' + (act === x[0] ? 'on' : '') + '" onclick="go(\'' + x[0] + '\')">' + ic(x[0]) + '<span>' + x[1] + '</span></button>').join('');
  document.body.classList.toggle('in', L);
  $('#nav').hidden = !L; $('#nav').innerHTML = h; $('#nav').className = 'bnav' + (m.length > 5 ? ' n6' : ''); $('#sidenav').innerHTML = h;
  $('#sideuser').innerHTML = L ? '<span class="av">' + esc(S.u.nama.charAt(0).toUpperCase()) + '</span><div><b>' + esc(S.u.nama) + '</b><small>' + (ROLE[S.u.role] || S.u.role) + '</small></div><button class="ib" onclick="keluar()" aria-label="Keluar">' + ic('out') + '</button>' : '';
  $('#ptitle').textContent = TITLES[S.page] || '';
  $('#btnMasuk').innerHTML = L ? ic('key') + '<span>Akun saya</span>' : 'Masuk';
  $('#who').textContent = L ? S.u.nama + ' (' + (ROLE[S.u.role] || S.u.role) + ')' : (S.pc ? S.pc.nama_desa : 'Gedung Serba Guna Desa');
  document.querySelectorAll('.logo').forEach(e => e.innerHTML = ic('inst')); document.querySelectorAll('[data-i]').forEach(e => e.innerHTML = ic(e.dataset.i)); $('#eye').innerHTML = ic('eye');
}
function terapkanCfg(c) {
  if (!c) return; S.pc = c; document.title = c.nama_gedung;
  $('.brand b').textContent = c.nama_gedung; $('#sb1').textContent = c.nama_gedung; $('#sb2').textContent = c.nama_desa; $('#lgT').textContent = c.nama_gedung; $('#lgF').textContent = c.nama_desa + (c.alamat ? ' \u00b7 ' + c.alamat : ''); shell();
}

/* ---- Login ---- */
function showLogin() { history.pushState({ p: S.page }, '', '#login'); $('#login').hidden = false; document.body.classList.add('lgo'); setTimeout(() => $('#lu').focus(), 50); }
function tutupLogin() { $('#login').hidden = true; document.body.classList.remove('lgo'); }
addEventListener('popstate', () => { if (!$('#login').hidden) tutupLogin(); });
function masuk() { if (S.u) return go('akun'); showLogin(); }
function eye() { const p = $('#lp'); p.type = p.type === 'password' ? 'text' : 'password'; }
async function doLogin() {
  const b = $('#lb'); b.disabled = true; b.textContent = 'Memproses...'; $('#le').textContent = ''; bar(true);
  try {
    const r = await net(GAS_URL, POST({ action: 'login', data: { username: $('#lu').value, pin: $('#lp').value } }), 30000, 1);
    if (!r.success) { $('#le').textContent = r.message; return; }
    S.tok = r.data.token; S.u = { nama: r.data.nama, role: r.data.role }; S.boot = r.data.boot; S.bk = r.data.list || []; simpanSesi();
    tutupLogin(); $('#lp').value = ''; toast('Selamat datang, ' + r.data.nama); go(landing());
  } catch (e) { $('#le').textContent = 'Koneksi gagal, coba lagi.'; } finally { b.disabled = false; b.textContent = 'Masuk'; bar(false); }
}

/* ---- Dashboard ---- */
const sapa = () => { const h = new Date().getHours(); return h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam'; };
const bars = (rows, f) => { const mx = Math.max(1, ...rows.map(r => r[1])); return rows.map(r => '<div class="bl"><span title="' + esc(r[0]) + '">' + esc(r[0]) + '</span><div class="tr"><i style="width:' + (r[1] > 0 ? Math.max(3, Math.round(r[1] * 100 / mx)) : 0) + '%"></i></div><b>' + f(r[1]) + '</b></div>').join('') || '<p class="mu">Belum ada data.</p>'; };
const kc = (t, ic_, v, l) => '<div class="kc"><span class="kt t-' + t + '">' + ic(ic_) + '</span><div><b>' + v + '</b><span class="mu">' + l + '</span></div></div>';
async function pageDash() {
  const c = $('#app-container'); if (!S.bk.length) c.innerHTML = '<div class="skel"></div>';
  const r = await Promise.all([call('dash'), call('list')]), d = r[0]; if (!d) return; if (r[1]) S.bk = r[1]; if (S.page !== 'dash') return;
  const ak = S.bk.filter(b => !b.status.startsWith('Dibatalkan')), hr = ak.filter(b => b.jenis === 'harian').length, pc = ak.length ? Math.round(hr * 100 / ak.length) : 0;
  const kat = S.boot.kategori.map(k => [k.nama, ak.filter(b => b.kategori_id === k.id).length]).sort((a, z) => z[1] - a[1]);
  const nx = S.bk.filter(b => ['Disetujui', 'Berjalan'].includes(b.status) && b.selesai.slice(0, 10) >= TODAY).sort((a, z) => a.mulai < z.mulai ? -1 : 1).slice(0, 5);
  c.innerHTML = '<div class="hero"><h2>Selamat ' + sapa() + ', ' + esc(S.u.nama) + '</h2><p>' + d.bulanIni + ' booking bulan ini &middot; ' + (d.belumDP ? d.belumDP + ' belum DP &middot; ' : '') + rp(d.piutang) + ' belum dilunasi.</p><button class="btn-w" onclick="formBk()">' + ic('plus') + 'Buat booking baru</button></div>' +
    '<div class="k4">' + kc('b', 'bk', d.bulanIni, 'Booking bulan ini') + kc('g', 'home', d.hariIni, 'Acara hari ini') + kc('p', 'kas', rp(d.masuk), 'Pemasukan bulan ini') + kc('a', 'warn', rp(d.piutang), 'Belum dilunasi') + '</div>' +
    '<div class="dg"><div class="card"><h3>Keuangan bulan ini</h3>' + bars([['Pemasukan', d.masuk], ['Pengeluaran', d.keluar], ['Laba bersih', Math.max(0, d.laba)]], rp) + (d.laba < 0 ? '<p class="mu">Defisit ' + rp(-d.laba) + '</p>' : '') + '</div>' +
    '<div class="card"><h3>Jenis sewa</h3><div class="dnw"><div class="dn" style="background:' + (ak.length ? 'conic-gradient(#2563C8 0 ' + pc + '%,#7DB8FF ' + pc + '% 100%)' : 'var(--sf2)') + '"><div><b style="font-size:22px">' + ak.length + '</b><small class="mu">booking</small></div></div><div class="lgd"><span><i style="background:#2563C8"></i>Harian <b>' + hr + '</b></span><span><i style="background:#7DB8FF"></i>Per jam <b>' + (ak.length - hr) + '</b></span></div></div></div>' +
    '<div class="card"><h3>Booking per kategori</h3>' + bars(kat, x => x) + '</div>' +
    '<div class="card"><h3>Acara terdekat</h3>' + (nx.map(b => '<div class="rw"><span><b>' + esc(b.nama) + '</b><br><span class="mu">' + wkt(b) + '</span></span><span class="chip ' + (b.bayar === 'Lunas' ? 'ok' : 'wr') + '">' + b.bayar + '</span></div>').join('') || '<p class="mu">Belum ada acara mendatang.</p>') + '</div></div>';
}
