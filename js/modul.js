/* modul.js — melengkapi app.js: bukti, kwitansi PDF, akun, master data, pengaturan */

/* ---- Utilitas file ---- */
// Foto dikecilkan di HP (maks 1200px, JPEG) sebelum diunggah agar cepat & hemat kuota
function fileData(inp) {
  return new Promise(ok => {
    const f = inp && inp.files && inp.files[0]; if (!f) return ok(null);
    if (!/^image\//.test(f.type)) { toast('Bukti harus berupa gambar.', 1); return ok(null); }
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      ok({ b64: c.toDataURL('image/jpeg', .75).split(',')[1], mime: 'image/jpeg' }); URL.revokeObjectURL(img.src);
    }; img.onerror = () => ok(null); img.src = URL.createObjectURL(f);
  });
}
function unduh(b64, nama, mime) {
  const b = atob(b64), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([u], { type: mime })); a.download = nama; document.body.appendChild(a); a.click(); a.remove();
}

/* ---- Pembayaran: riwayat, kwitansi PDF, bukti ---- */
async function bayar(id) {
  const f = await fileData($('#bf')), r = await call('bayar', { id, mode: window._m, nilai: $('#bn').value, metode: $('#bm').value, file: f });
  if (!r) return; tutup(); pageBk();
  sheet('<h2>Pembayaran Tercatat</h2><p>' + rp(r.nominal) + ' &middot; ' + esc(r.no) + '</p><button class="btn w" onclick="kwitansi(\'' + r.id + '\')">Unduh Kwitansi (PDF)</button>');
}
async function riwayat(id) {
  const el = $('#rw'); if (!el || !['keuangan', 'sekdes', 'kades'].includes(S.u.role)) return;
  const r = await call('riwayat', { id }); if (!r || !$('#rw')) return;
  $('#rw').innerHTML = r.length ? '<h3>Riwayat Pembayaran</h3>' + r.map(x => '<div class="rw"><span><b>' + rp(x.nominal) + '</b> ' + esc(x.jenis) + '<br><span class="mu">' + esc(x.no) + ' &middot; ' + x.tanggal + ' &middot; ' + esc(x.metode) + '</span></span><span style="display:flex;gap:6px"><button class="btn ghost" onclick="kwitansi(\'' + x.id + '\')" aria-label="Unduh kwitansi">PDF</button>' + (x.bukti ? '<button class="btn ghost" onclick="bukti(\'' + x.id + '\')" aria-label="Lihat bukti">Bukti</button>' : '') + '</span></div>').join('') : '';
}
async function kwitansi(id) { const r = await call('kwitansi', { id }); if (r) { unduh(r.b64, r.nama, 'application/pdf'); toast('Kwitansi diunduh. Buka file PDF untuk mencetak.'); } }
async function bukti(id) { const r = await call('bukti', { id }); if (r) sheet('<h2>Bukti</h2><img class="prev" alt="Bukti pembayaran" src="data:' + r.mime + ';base64,' + r.b64 + '">'); }

/* ---- Booking (SWR: tampil dari data login, segarkan di latar belakang) ---- */
function renderBk() {
  $('#app-container').innerHTML = '<div class="mrow"><h2>Booking</h2><button class="btn sm" onclick="formBk()">+ Booking</button></div>' +
    (S.bk.map((b, i) => '<div class="card" onclick="detail(' + i + ')" style="cursor:pointer"><div class="mrow"><b>' + esc(b.nama) + '</b><span class="chip ' + (CH[b.status] || '') + '">' + b.status + '</span></div><div class="mu">' + esc(b.no) + ' &middot; ' + (b.jenis === 'harian' ? 'Harian' : 'Per jam') + '<br>' + wkt(b) + '</div><div style="margin-top:6px"><b>' + rp(b.total) + '</b> <span class="mu">&middot; ' + b.bayar + ' (sisa ' + rp(b.total - b.paid) + ')</span></div></div>').join('') || '<p class="mu">Belum ada booking.</p>');
}
async function pageBk() {
  if (S.bk.length) renderBk(); else $('#app-container').innerHTML = '<div class="skel"></div>';
  const l = await call('list'); if (l) S.bk = l; if (S.page === 'bk') renderBk();
}

/* ---- Kas (pengeluaran + foto nota) ---- */
async function pageKas() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>'; const k = await call('kas') || [], bisa = ['keuangan', 'sekdes'].includes(S.u.role);
  c.innerHTML = '<div class="mrow"><h2>Pengeluaran</h2>' + (bisa ? '<button class="btn sm" onclick="formKas()">+ Catat</button>' : '') + '</div>' +
    (k.map(x => '<div class="card"><div class="mrow"><b>' + esc(x.keterangan) + '</b><b>' + rp(x.nominal) + '</b></div><div class="mu">' + x.tanggal + ' &middot; ' + esc(x.kategori) + ' &middot; ' + esc(x.metode) + (x.bukti ? ' &middot; <a href="javascript:void(0)" onclick="bukti(\'' + x.id + '\')">Lihat nota</a>' : '') + '</div></div>').join('') || '<p class="mu">Belum ada pengeluaran.</p>');
}
function formKas() {
  sheet('<h2>Catat Pengeluaran</h2><label class="field"><span>Kategori</span><select id="kk">' + ['Kebersihan', 'Listrik & Air', 'Perawatan/Perbaikan', 'Honor Petugas', 'Perlengkapan', 'Lain-lain'].map(x => '<option>' + x + '</option>').join('') + '</select></label><label class="field"><span>Keterangan</span><input id="kt"></label><div class="row"><label class="field"><span>Nominal (Rp)</span><input id="kn" type="number" inputmode="numeric"></label><label class="field"><span>Metode</span><select id="km"><option>Tunai</option><option>Transfer</option></select></label></div><label class="field"><span>Foto nota (opsional)</span><input id="kf" type="file" accept="image/*"></label><button class="btn w" onclick="simpanKas()">Simpan</button>');
}
async function simpanKas() { const f = await fileData($('#kf')); if (await call('kasTambah', { kategori: $('#kk').value, keterangan: $('#kt').value.trim(), nominal: $('#kn').value, metode: $('#km').value, file: f })) { tutup(); toast('Pengeluaran tersimpan.'); pageKas(); } }

/* ---- Pengaturan (akun, ganti PIN) ---- */
function pageAkun() {
  const adm = S.u.role === 'sekdes';
  $('#app-container').innerHTML = '<h2>Pengaturan</h2><div class="card"><b>' + esc(S.u.nama) + '</b><div class="mu">Peran: ' + esc(S.u.role) + '</div></div><div class="menu">' +
    '<button class="btn ghost" onclick="pinForm()">Ganti PIN</button>' + (adm ? '<button class="btn ghost" onclick="go(\'master\')">Master Data (Kategori, Tarif, Pengguna)</button><button class="btn ghost" onclick="cfgForm()">Identitas Gedung &amp; Desa</button>' : '') + '<button class="btn bad" onclick="keluar()">Keluar</button></div>';
}
function pinForm() {
  sheet('<h2>Ganti PIN</h2><label class="field"><span>PIN lama</span><input id="p0" type="password" inputmode="numeric" autocomplete="current-password"></label><label class="field"><span>PIN baru (6-12 angka)</span><input id="p1" type="password" inputmode="numeric" autocomplete="new-password"></label><label class="field"><span>Ulangi PIN baru</span><input id="p2" type="password" inputmode="numeric" autocomplete="new-password"></label><button class="btn w" onclick="pinSimpan()">Simpan PIN</button>');
}
async function pinSimpan() {
  const a = $('#p0').value, b = $('#p1').value; if (b !== $('#p2').value) return toast('Ulangi PIN tidak sama.', 1);
  if (await call('gantiPin', { lama: a, baru: b })) { tutup(); toast('PIN berhasil diganti.'); }
}

/* ---- Master data (Sekdes) ---- */
async function pageMaster() {
  const c = $('#app-container'); c.innerHTML = '<div class="skel"></div>'; const k = await call('katList'), u = await call('userList'); if (!k) return pageAkun();
  S.kat = k; S.usr = u || [];
  c.innerHTML = '<button class="btn ghost sm" onclick="history.back()">&lsaquo; Pengaturan</button><h2>Master Data</h2><div class="mrow"><h3>Kategori &amp; Tarif</h3><button class="btn sm" onclick="katForm()">+ Tambah</button></div>' +
    k.map((x, i) => '<div class="card" onclick="katForm(' + i + ')" style="cursor:pointer"><b>' + esc(x.nama) + '</b> ' + (x.aktif === false ? '<span class="chip no">Nonaktif</span>' : '') + '<div class="mu">' + rp(x.per_jam) + '/jam &middot; ' + rp(x.per_hari) + '/hari</div></div>').join('') +
    '<div class="mrow"><h3>Pengguna</h3><button class="btn sm" onclick="userForm()">+ Tambah</button></div>' +
    S.usr.map((x, i) => '<div class="card" onclick="userForm(' + i + ')" style="cursor:pointer"><b>' + esc(x.nama) + '</b> ' + (x.aktif ? '' : '<span class="chip no">Nonaktif</span>') + '<div class="mu">' + esc(x.role) + '</div></div>').join('');
}
function katForm(i) {
  const x = i == null ? { nama: '', per_jam: '', per_hari: '', aktif: true } : S.kat[i];
  sheet('<h2>' + (i == null ? 'Kategori Baru' : 'Ubah Kategori') + '</h2><label class="field"><span>Nama kategori</span><input id="kn1" value="' + esc(x.nama) + '"></label><div class="row"><label class="field"><span>Tarif per jam</span><input id="kj" type="number" inputmode="numeric" value="' + x.per_jam + '"></label><label class="field"><span>Tarif per hari</span><input id="kh" type="number" inputmode="numeric" value="' + x.per_hari + '"></label></div><label class="field"><span>Status</span><select id="ka"><option value="1"' + (x.aktif !== false ? ' selected' : '') + '>Aktif</option><option value="0"' + (x.aktif === false ? ' selected' : '') + '>Nonaktif</option></select></label><p class="mu">Perubahan tarif hanya berlaku untuk booking baru.</p><button class="btn w" onclick="katSimpan(' + (i == null ? '' : "'" + x.id + "'") + ')">Simpan</button>');
}
async function katSimpan(id) { if (await call('katSimpan', { id: id || '', nama: $('#kn1').value, per_jam: $('#kj').value, per_hari: $('#kh').value, aktif: $('#ka').value === '1' })) { tutup(); toast('Kategori tersimpan.'); S.boot = await call('boot') || S.boot; pageMaster(); } }
function userForm(i) {
  const x = i == null ? { nama: '', role: 'perangkat', aktif: true } : S.usr[i], R = [['sekdes', 'Sekdes'], ['kades', 'Kades'], ['keuangan', 'Kaur Keuangan'], ['perangkat', 'Kadus/Perangkat Lain']];
  sheet('<h2>' + (i == null ? 'Pengguna Baru' : 'Ubah Pengguna') + '</h2><label class="field"><span>Nama</span><input id="un" value="' + esc(x.nama) + '"></label>' + (i == null ? '<label class="field"><span>Username</span><input id="uu" autocapitalize="none"></label>' : '') + '<label class="field"><span>Peran</span><select id="ur">' + R.map(r => '<option value="' + r[0] + '"' + (x.role === r[0] ? ' selected' : '') + '>' + r[1] + '</option>').join('') + '</select></label><label class="field"><span>' + (i == null ? 'PIN awal (6-12 angka)' : 'Reset PIN (kosongkan jika tidak diubah)') + '</span><input id="up" type="password" inputmode="numeric"></label>' + (i == null ? '' : '<label class="field"><span>Status</span><select id="ua"><option value="1"' + (x.aktif ? ' selected' : '') + '>Aktif</option><option value="0"' + (!x.aktif ? ' selected' : '') + '>Nonaktif</option></select></label>') + '<button class="btn w" onclick="userSimpan(' + (i == null ? '' : "'" + x.id + "'") + ')">Simpan</button>');
}
async function userSimpan(id) { if (await call('userSimpan', { id: id || '', nama: $('#un').value, username: $('#uu') ? $('#uu').value : '', role: $('#ur').value, pin: $('#up').value, aktif: $('#ua') ? $('#ua').value === '1' : true })) { tutup(); toast('Pengguna tersimpan.'); pageMaster(); } }

/* ---- Pengaturan aplikasi (Sekdes) ---- */
async function cfgForm() {
  const c = await call('cfgGet'); if (!c) return;
  const F = [['nama_gedung', 'Nama gedung'], ['nama_desa', 'Nama desa'], ['alamat', 'Alamat'], ['kontak', 'Kontak WA/telepon'], ['kades_nama', 'Nama Kepala Desa'], ['kades_jabatan', 'Jabatan penandatangan'], ['dp_persen', 'Persentase DP bawaan (%)'], ['open', 'Jam buka (0-23)'], ['close', 'Jam tutup (1-24)']];
  sheet('<h2>Pengaturan</h2>' + F.map(f => '<label class="field"><span>' + f[1] + '</span><input id="c_' + f[0] + '" value="' + esc(c[f[0]]) + '"></label>').join('') + '<label class="field"><span>Token Fonnte (WA otomatis)</span><input id="c_fonnte_token" type="password" placeholder="Kosongkan jika tidak diubah" autocomplete="off"></label><button class="btn w" onclick="cfgSimpan()">Simpan Pengaturan</button>');
}
async function cfgSimpan() {
  const d = {}; ['nama_gedung', 'nama_desa', 'alamat', 'kontak', 'kades_nama', 'kades_jabatan', 'dp_persen', 'open', 'close', 'fonnte_token'].forEach(k => d[k] = $('#c_' + k).value.trim());
  if (await call('cfgSimpan', d)) { tutup(); toast('Pengaturan tersimpan.'); S.boot = await call('boot') || S.boot; simpanSesi(); terapkanCfg(await pub('cfg', '')); }
}
