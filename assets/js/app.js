const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORE = 'sikoba_demo_v1';
// Gunakan tanggal lokal agar tidak bergeser sehari akibat konversi UTC.
const dateToYMD = d => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => dateToYMD(new Date());
const plusDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateToYMD(d);
};
const initialData = () => ({
  user:{name:'Petugas Farmasi',username:'petugas',email:'petugas@sikoba.local',phone:'081234567890'},
  medicines:[
    {id:1,name:'Paracetamol 500 mg',type:'Tablet',dose:'500 mg',stock:120,min:20,expiry:plusDays(420),category:'Analgesik'},
    {id:2,name:'Amoxicillin 500 mg',type:'Kapsul',dose:'500 mg',stock:65,min:20,expiry:plusDays(300),category:'Antibiotik'},
    {id:3,name:'Ibuprofen 400 mg',type:'Tablet',dose:'400 mg',stock:35,min:40,expiry:plusDays(120),category:'Analgesik'},
    {id:4,name:'CTM 4 mg',type:'Tablet',dose:'4 mg',stock:30,min:10,expiry:plusDays(25),category:'Antihistamin'},
    {id:5,name:'Oralit',type:'Sachet',dose:'200 ml',stock:125,min:20,expiry:plusDays(350),category:'Obat Bebas'}
  ],
  transactions:[
    {id:1,medicineId:1,type:'Masuk',qty:50,date:today(),note:'Penerimaan dari distributor'},
    {id:2,medicineId:2,type:'Keluar',qty:15,date:today(),note:'Pemakaian pasien'},
    {id:3,medicineId:3,type:'Masuk',qty:20,date:today(),note:'Pengadaan obat'},
    {id:4,medicineId:4,type:'Keluar',qty:10,date:today(),note:'Pemakaian pasien'},
    {id:5,medicineId:5,type:'Masuk',qty:50,date:today(),note:'Penerimaan stok'}
  ],
  notifications:[], opnames:[], loggedIn:false, registeredUsers:[]
});
let db;
try{db=JSON.parse(localStorage.getItem(STORE))||initialData()}catch{db=initialData()}
let page='dashboard', stockFilter='Semua', medicineSearch='', txFilter='Semua', expiryFilter='Semua', reportDate=today(), reportPeriod='harian', editingId=null;
async function save(){
  try{
    const response=await fetch('api.php?action=save',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(db)});
    const result=await response.json();
    if(!response.ok||!result.success)throw new Error(result.message||'Gagal menyimpan ke database');
    localStorage.setItem(STORE,JSON.stringify(db));
    return true;
  }catch(error){toast(error.message||'Database tidak terhubung. Jalankan melalui XAMPP.');return false}
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtDate(s){if(!s)return '-';return new Date(s+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}
function daysLeft(s){return Math.ceil((new Date(s+'T00:00:00')-new Date(today()+'T00:00:00'))/86400000)}
function medStatus(m){if(daysLeft(m.expiry)<0)return ['Kedaluwarsa','danger'];if(daysLeft(m.expiry)<=30)return ['Hampir Expired','danger'];if(m.stock<=m.min)return ['Menipis','warning'];return ['Aman','']}
function medById(id){return db.medicines.find(m=>m.id===Number(id))}
function toast(msg){let old=$('.toast');if(old)old.remove();let el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),2600)}
function brand(){return `<div class="top-brand"><div class="brand-symbol">💊</div><div><strong>SIKOBA</strong><small>Sistem Informasi Kontrol Obat</small></div></div>`}
function statusPill(m){let [t,c]=medStatus(m);return `<span class="pill ${c}">${t}</span>`}
function loginScreen(register=false){return `<div class="login-page"><div class="login-art"><div class="brand-big"><div class="brand-symbol">💊</div><h1>SIKOBA</h1><p>Sistem Informasi Kontrol Obat<br>Puskesmas</p><br><p>Kelola Stok Obat<br>Lebih Mudah, Lebih Akurat</p><small>Versi 1.0 • Terhubung Database</small></div></div><div class="login-panel"><form class="login-box" id="authForm"><div class="brand-inline"><div class="brand-symbol">💊</div><div><strong>SIKOBA</strong><div class="muted" style="font-size:11px">Sistem Informasi Kontrol Obat</div></div></div><h2>${register?'Daftar Akun':'Selamat Datang'}</h2><p class="muted">${register?'Buat akun baru untuk menggunakan SIKOBA':'Silakan login untuk melanjutkan'}</p>${register?`<div class="field"><label>Nama Lengkap</label><input name="name" required placeholder="Masukkan nama lengkap"></div>`:''}<div class="field"><label>${register?'Username':'Username / Email'}</label><input name="username" required placeholder="${register?'Buat username':'Masukkan username atau email'}"></div>${register?`<div class="field"><label>Email</label><input name="email" type="email" required placeholder="nama@email.com"></div><div class="field"><label>No. HP</label><input name="phone" placeholder="08xxxxxxxxxx"></div>`:''}<div class="field"><label>Password</label><input name="password" type="password" required placeholder="Masukkan password" minlength="4"></div>${register?`<div class="field"><label>Konfirmasi Password</label><input name="confirm" type="password" required placeholder="Ulangi password" minlength="4"></div>`:''}<button class="btn btn-primary btn-full">${register?'Daftar':'Login'}</button><p class="muted" style="text-align:center;margin-top:20px;font-size:12px">${register?'Sudah punya akun?':'Belum punya akun?'} <button class="link-btn" type="button" id="switchAuth">${register?'Login':'Daftar'}</button></p><p class="muted" style="font-size:11px;text-align:center">Data aplikasi disimpan melalui server SIKOBA.</p></form></div></div>`}
const navItems=[['dashboard','⌂','Beranda'],['medicines','▤','Obat'],['transactions','⇄','Transaksi'],['stockopname','▣','Stok Opname'],['expiry','◷','Kontrol Expired'],['reports','▥','Laporan'],['profile','♙','Profil']];
function shell(){return `<div class="app-shell"><header class="topbar">${brand()}<div class="top-actions"><button class="btn btn-light" id="notificationsBtn">♧ <span class="desktop-label">Notifikasi</span> <b>${alertCount()}</b></button><div class="avatar">${esc((db.user.name||'P').slice(0,1).toUpperCase())}</div></div></header><div class="layout"><aside class="sidebar"><div class="side-label">MENU UTAMA</div>${navItems.map(([id,icon,label])=>`<button class="nav-btn ${page===id?'active':''}" data-page="${id}"><span>${icon}</span>${label}</button>`).join('')}<div class="side-label" style="margin-top:25px">AKUN</div><button class="nav-btn" id="logoutBtn"><span>↪</span>Keluar</button></aside><main class="main" id="main">${renderPage()}</main></div><nav class="bottom-nav">${navItems.filter((_,i)=>i!==3).map(([id,icon,label])=>`<button class="${page===id?'active':''}" data-page="${id}"><span>${icon}</span>${label}</button>`).join('')}<button id="mobileMore"><span>☰</span>Lainnya</button></nav><div id="modalRoot"></div></div>`}
function alertCount(){return db.medicines.filter(m=>medStatus(m)[0]!=='Aman').length}
function pageHead(title,desc,action=''){return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`}
function stat(label,value,icon,detail,color=''){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon" style="${color}">${icon}</span></div><strong>${value}</strong><small>${detail}</small></div>`}
function activityRow(icon,title,sub,kind=''){return `<div class="activity-row"><div class="activity-icon ${kind}">${icon}</div><div class="activity-info"><strong>${title}</strong><small>${sub}</small></div></div>`}
function dashboard(){let total=db.medicines.length,low=db.medicines.filter(m=>m.stock<=m.min).length,exp=db.medicines.filter(m=>daysLeft(m.expiry)<=30).length,ins=db.transactions.filter(t=>t.type==='Masuk'&&t.date===today()).reduce((a,t)=>a+t.qty,0),outs=db.transactions.filter(t=>t.type==='Keluar'&&t.date===today()).reduce((a,t)=>a+t.qty,0);return `${pageHead('Dashboard','Ringkasan persediaan obat hari ini')}<div class="welcome"><div class="avatar">♙</div><div><strong>Halo, ${esc(db.user.name||'Petugas')}!</strong><small>Puskesmas Sehat Bersama · Semoga aktivitasmu lancar</small></div></div><div class="stats">${stat('Total Jenis Obat',total,'▤','Obat terdaftar')}${stat('Stok Menipis',low,'⚠','Perlu segera diperiksa','color:#fff4dc')}${stat('Kedaluwarsa ≤ 30 hari',exp,'◷','Perlu tindakan','color:#ffeded')}${stat('Transaksi Hari Ini',db.transactions.filter(t=>t.date===today()).length,'⇄',`Masuk ${ins} · Keluar ${outs}`)}</div><div class="section-grid"><section class="card"><div class="card-head"><h3>Persediaan Hari Ini</h3><button class="link-btn" data-page="transactions">Lihat transaksi →</button></div>${activityRow('↑','Stok Masuk',`${ins} item tercatat hari ini`)}${activityRow('↓','Stok Keluar',`${outs} item tercatat hari ini`,'red')}<div style="padding-top:13px"><button class="btn btn-primary" data-page="stockin">＋ Catat Stok Masuk</button> <button class="btn btn-light" data-page="stockout">− Stok Keluar</button></div></section><section class="card"><div class="card-head"><h3>Pengingat</h3><button class="link-btn" data-page="expiry">Lihat semua →</button></div>${db.medicines.filter(m=>medStatus(m)[0]!=='Aman').slice(0,4).map(m=>activityRow('!',m.name,`${medStatus(m)[0]} · stok ${m.stock}`,medStatus(m)[1]==='danger'?'red':'yellow')).join('')||'<div class="empty">Tidak ada pengingat. Semua stok aman.</div>'}</section></div><section class="card"><div class="card-head"><h3>Obat Terbaru</h3><button class="link-btn" data-page="medicines">Lihat data obat →</button></div>${medicineTable(db.medicines.slice(0,5),false)}</section>`}
function medicineTable(items,actions=true){if(!items.length)return '<div class="empty">Belum ada data obat.</div>';return `<div class="table-wrap"><table><thead><tr><th>Nama Obat</th><th>Jenis</th><th>Stok</th><th>Min.</th><th>Kedaluwarsa</th><th>Status</th>${actions?'<th>Aksi</th>':''}</tr></thead><tbody>${items.map(m=>`<tr><td><strong>${esc(m.name)}</strong><br><span class="muted">${esc(m.category||'-')}</span></td><td>${esc(m.type)}</td><td><strong>${m.stock}</strong></td><td>${m.min}</td><td>${fmtDate(m.expiry)}</td><td>${statusPill(m)}</td>${actions?`<td><div class="table-actions"><button class="mini-btn" data-edit="${m.id}">Edit</button><button class="mini-btn delete" data-delete="${m.id}">Hapus</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`}
function medicinesPage(){let items=db.medicines.filter(m=>m.name.toLowerCase().includes(medicineSearch.toLowerCase()));if(stockFilter!=='Semua')items=items.filter(m=>stockFilter==='Aman'?medStatus(m)[0]==='Aman':stockFilter==='Menipis'?medStatus(m)[0]==='Menipis':stockFilter==='Hampir Expired'?daysLeft(m.expiry)<=30:medStatus(m)[0]==='Kedaluwarsa');return `${pageHead('Data Obat','Kelola data persediaan obat','<button class="btn btn-primary" id="addMedicine">＋ Tambah Obat</button>')}<div class="card"><div class="toolbar"><input class="search-input" id="medicineSearch" value="${esc(medicineSearch)}" placeholder="⌕ Cari nama obat..."></div><div class="chip-row">${['Semua','Aman','Menipis','Hampir Expired','Kedaluwarsa'].map(x=>`<button class="chip ${stockFilter===x?'active':''}" data-stockfilter="${x}">${x}</button>`).join('')}</div>${medicineTable(items,true)}</div>`}
function transactionForm(type){let isIn=type==='Masuk';return `${pageHead(`Stok ${type}`,'Catat transaksi persediaan obat')}<div class="card"><form id="transactionForm"><div class="form-grid"><div class="field wide"><label>Pilih Obat</label><select name="medicineId" required><option value="">Pilih obat...</option>${db.medicines.map(m=>`<option value="${m.id}">${esc(m.name)} — stok ${m.stock}</option>`).join('')}</select></div><div class="field"><label>Jumlah ${type}</label><input type="number" name="qty" min="1" required placeholder="Masukkan jumlah"></div><div class="field"><label>Tanggal ${type}</label><input type="date" name="date" value="${today()}" required></div><div class="field wide"><label>Keterangan (opsional)</label><textarea name="note" rows="3" placeholder="${isIn?'Contoh: Pengadaan dari distributor':'Contoh: Pemakaian pasien'}"></textarea></div></div><div class="notice ${isIn?'green':'red'}">${isIn?'Stok akan bertambah setelah transaksi disimpan.':'Stok akan berkurang. Jumlah keluar tidak boleh melebihi stok tersedia.'}</div><button class="btn btn-primary">Simpan Transaksi</button> <button class="btn btn-light" type="reset">Reset</button></form></div>`}
function transactionsPage(){let items=db.transactions.filter(t=>txFilter==='Semua'||t.type===txFilter).sort((a,b)=>(b.date+a.id).localeCompare(a.date+b.id));return `${pageHead('Riwayat Transaksi','Riwayat stok masuk dan stok keluar')}<div class="card"><div class="chip-row">${['Semua','Masuk','Keluar'].map(x=>`<button class="chip ${txFilter===x?'active':''}" data-txfilter="${x}">${x}</button>`).join('')}<button class="chip" data-page="stockin">＋ Stok Masuk</button><button class="chip" data-page="stockout">− Stok Keluar</button></div><div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Nama Obat</th><th>Jenis</th><th>Jumlah</th><th>Keterangan</th></tr></thead><tbody>${items.map(t=>`<tr><td>${fmtDate(t.date)}</td><td><strong>${esc(medById(t.medicineId)?.name||'Obat dihapus')}</strong></td><td><span class="pill ${t.type==='Keluar'?'danger':''}">${t.type}</span></td><td>${t.type==='Masuk'?'+':'−'} ${t.qty}</td><td>${esc(t.note||'-')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>'}</tbody></table></div></div>`}

function stockOpnamePage(){
  const records=db.opnames||[];
  const rows=records.map(o=>`<tr><td><strong>${esc(o.nomor)}</strong></td><td>${fmtDate(o.tanggal)}</td><td>${Number(o.jumlah_item||0)} obat</td><td>${Number(o.total_selisih||0)>0?'+':''}${Number(o.total_selisih||0)}</td><td><span class="pill">${esc(o.status||'Selesai')}</span></td><td><button class="mini-btn" data-opname-detail="${o.id}">Detail</button></td></tr>`).join('');
  return `${pageHead('Stok Opname','Bandingkan stok sistem dengan hasil perhitungan fisik','<button class="btn btn-primary" id="newOpname">＋ Buat Stok Opname</button>')}
    <div class="stats">
      ${stat('Total Opname',records.length,'▣','Riwayat pencatatan')}
      ${stat('Obat Terdaftar',db.medicines.length,'▤','Data yang dapat dihitung')}
      ${stat('Opname Terakhir',records.length?fmtDate(records[0].tanggal):'-','◷','Tanggal pencatatan')}
    </div>
    <section class="card"><div class="card-head"><h3>Riwayat Stok Opname</h3></div>
      <div class="table-wrap"><table><thead><tr><th>No. Opname</th><th>Tanggal</th><th>Jumlah Obat</th><th>Total Selisih</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="6" class="empty">Belum ada riwayat stok opname.</td></tr>'}</tbody></table></div>
    </section>`;
}
function opnameForm(){
  const items=db.medicines.map(m=>`<tr data-opname-row="${m.id}">
    <td><strong>${esc(m.name)}</strong><br><span class="muted">${esc(m.category||m.type||'-')}</span></td>
    <td class="system-stock">${m.stock}</td>
    <td><input class="opname-count" type="number" min="0" step="1" value="${m.stock}" data-medicine="${m.id}" required style="max-width:120px"></td>
    <td class="opname-diff">0</td>
  </tr>`).join('');
  $('#modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal" style="max-width:900px;width:95%">
    <div class="modal-head"><h2>Buat Stok Opname</h2><button class="close-btn" id="closeModal">×</button></div>
    <form id="opnameForm">
      <div class="form-grid"><div class="field"><label>Tanggal Opname</label><input type="date" name="tanggal" value="${today()}" required></div>
      <div class="field"><label>Keterangan</label><input name="keterangan" maxlength="255" placeholder="Contoh: Opname rutin bulanan"></div></div>
      <div class="notice green">Masukkan jumlah stok fisik berdasarkan hasil penghitungan. Selisih dihitung otomatis. Setelah disimpan, stok sistem akan disesuaikan dengan stok fisik.</div>
      <div class="table-wrap"><table><thead><tr><th>Nama Obat</th><th>Stok Sistem</th><th>Stok Fisik</th><th>Selisih</th></tr></thead><tbody>${items||'<tr><td colspan="4" class="empty">Belum ada data obat.</td></tr>'}</tbody></table></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px"><button class="btn btn-light" type="button" id="cancelOpname">Batal</button><button class="btn btn-primary" type="submit" ${db.medicines.length?'':'disabled'}>Simpan & Sesuaikan Stok</button></div>
    </form></div></div>`;
  $('#closeModal').onclick=closeModal;$('#cancelOpname').onclick=closeModal;
  $('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};
  const updateDiff=input=>{const row=input.closest('tr'),system=Number(row.querySelector('.system-stock').textContent),physical=Number(input.value||0),diff=physical-system;const cell=row.querySelector('.opname-diff');cell.textContent=(diff>0?'+':'')+diff;cell.style.fontWeight='700';cell.style.color=diff===0?'#16834a':diff<0?'#c0392b':'#1672bd'};
  $$('.opname-count').forEach(input=>{input.addEventListener('input',()=>updateDiff(input));updateDiff(input)});
  $('#opnameForm').onsubmit=saveOpname;
}
async function saveOpname(e){
  e.preventDefault();
  const form=e.currentTarget,fd=new FormData(form);
  const items=$$('.opname-count',form).map(input=>({medicine_id:Number(input.dataset.medicine),stok_fisik:Number(input.value)}));
  if(items.some(x=>!Number.isInteger(x.stok_fisik)||x.stok_fisik<0)){toast('Stok fisik harus berupa bilangan bulat minimal 0');return}
  const btn=form.querySelector('[type="submit"]');btn.disabled=true;btn.textContent='Menyimpan...';
  try{
    const response=await fetch('api.php?action=opname',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({tanggal:fd.get('tanggal'),keterangan:fd.get('keterangan'),items})});
    const result=await response.json();if(!response.ok||!result.success)throw new Error(result.message||'Gagal menyimpan stok opname');
    db.medicines.forEach(m=>{const detail=result.details.find(x=>Number(x.medicine_id)===Number(m.id));if(detail)m.stock=Number(detail.stok_fisik)});
    db.opnames=db.opnames||[];db.opnames.unshift(result.opname);
    closeModal();page='stockopname';render();toast('Stok opname berhasil disimpan dan stok telah disesuaikan');
  }catch(err){toast(err.message||'Tidak dapat menyimpan stok opname');btn.disabled=false;btn.textContent='Simpan & Sesuaikan Stok'}
}
function showOpnameDetail(id){
  const o=(db.opnames||[]).find(x=>Number(x.id)===Number(id));if(!o)return;
  const rows=(o.details||[]).map(d=>`<tr><td>${esc(d.nama_obat)}</td><td>${d.stok_sistem}</td><td>${d.stok_fisik}</td><td style="font-weight:700;color:${Number(d.selisih)<0?'#c0392b':Number(d.selisih)>0?'#1672bd':'#16834a'}">${Number(d.selisih)>0?'+':''}${d.selisih}</td></tr>`).join('');
  $('#modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal" style="max-width:850px;width:95%"><div class="modal-head"><h2>Detail ${esc(o.nomor)}</h2><button class="close-btn" id="closeModal">×</button></div>
  <p class="muted">Tanggal: ${fmtDate(o.tanggal)} · ${esc(o.keterangan||'Tanpa keterangan')}</p>
  <div class="table-wrap"><table><thead><tr><th>Nama Obat</th><th>Stok Sistem Sebelum</th><th>Stok Fisik</th><th>Selisih</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div style="display:flex;justify-content:flex-end;margin-top:18px"><button class="btn btn-light" id="closeDetail">Tutup</button></div></div></div>`;
  $('#closeModal').onclick=closeModal;$('#closeDetail').onclick=closeModal;$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};
}

function expiryPage(){let items=db.medicines.filter(m=>expiryFilter==='Semua'?medStatus(m)[0]!=='Aman':expiryFilter==='Mendekati Expired'?daysLeft(m.expiry)>=0&&daysLeft(m.expiry)<=30:daysLeft(m.expiry)<0);return `${pageHead('Kontrol Kedaluwarsa','Pantau obat yang mendekati atau sudah kedaluwarsa')}<div class="card"><div class="chip-row">${['Semua','Mendekati Expired','Expired'].map(x=>`<button class="chip ${expiryFilter===x?'active':''}" data-expiryfilter="${x}">${x}</button>`).join('')}</div>${items.map(m=>`<div class="activity-row"><div class="activity-icon ${daysLeft(m.expiry)<=30?'red':'yellow'}">◷</div><div class="activity-info"><strong>${esc(m.name)}</strong><small>Stok ${m.stock} · Kedaluwarsa ${fmtDate(m.expiry)} · ${daysLeft(m.expiry)<0?`Lewat ${Math.abs(daysLeft(m.expiry))} hari`:daysLeft(m.expiry)+' hari lagi'}</small></div>${statusPill(m)}</div>`).join('')||'<div class="empty">Tidak ada obat pada kategori ini.</div>'}</div>`}
function getReportRange(){
  const d=new Date(`${reportDate}T00:00:00`);
  if(reportPeriod==='mingguan'){
    const day=(d.getDay()+6)%7;
    const from=new Date(d); from.setDate(d.getDate()-day);
    const to=new Date(from); to.setDate(from.getDate()+6);
    return {from,to};
  }
  if(reportPeriod==='bulanan'){
    return {from:new Date(d.getFullYear(),d.getMonth(),1),to:new Date(d.getFullYear(),d.getMonth()+1,0)};
  }
  return {from:d,to:d};
}
function reportsPage(){
  const range=getReportRange();
  const periodLabel=reportPeriod.charAt(0).toUpperCase()+reportPeriod.slice(1);
  const rangeLabel=`${fmtDate(dateToYMD(range.from))} - ${fmtDate(dateToYMD(range.to))}`;
  let total=db.medicines.reduce((a,m)=>a+m.stock,0),
      ins=db.transactions.filter(t=>t.type==='Masuk').reduce((a,t)=>a+t.qty,0),
      outs=db.transactions.filter(t=>t.type==='Keluar').reduce((a,t)=>a+t.qty,0);
  const rows=db.medicines.map((m,i)=>`<tr>
    <td>${i+1}</td><td><strong>${esc(m.name)}</strong></td>
    <td>${esc(m.category||'-')}</td><td>${esc(m.type||'-')}</td>
    <td>${esc(m.dose||'-')}</td><td><strong>${m.stock}</strong></td>
    <td>${m.min}</td><td>${fmtDate(m.expiry)}</td><td>${statusPill(m)}</td>
  </tr>`).join('');
  return `${pageHead('Laporan Persediaan','Rekapitulasi persediaan obat', '<button class="btn btn-primary" id="printInventory">Cetak Laporan</button>')}
    <div class="card">
      <div class="toolbar">
        <label class="muted" for="reportPeriod">Periode laporan</label>
        <select id="reportPeriod" class="search-input">
          <option value="harian" ${reportPeriod==='harian'?'selected':''}>Harian</option>
          <option value="mingguan" ${reportPeriod==='mingguan'?'selected':''}>Mingguan</option>
          <option value="bulanan" ${reportPeriod==='bulanan'?'selected':''}>Bulanan</option>
        </select>
        <label class="muted" for="reportDate">Tanggal acuan</label>
        <input type="date" class="search-input" id="reportDate" value="${reportDate}">
        <span class="muted">Rentang: ${rangeLabel}</span>
      </div>
      <div class="report-grid">${statTile('Total Jenis Obat',db.medicines.length,'▤')}${statTile('Total Stok Tersedia',total,'▣')}${statTile('Total Stok Masuk',ins,'↑')}${statTile('Total Stok Keluar',outs,'↓')}</div>
    </div>
    <div class="card" id="inventoryReport">
      <div class="card-head"><h3>Laporan Persediaan Obat</h3><span class="muted">${periodLabel} · ${rangeLabel}</span></div>
      <div class="table-wrap"><table class="inventory-report-table">
        <thead><tr><th>No</th><th>Nama Obat</th><th>Kategori</th><th>Bentuk</th><th>Dosis</th><th>Stok Tersedia</th><th>Stok Minimum</th><th>Kedaluwarsa</th><th>Status</th></tr></thead>
        <tbody>${rows||'<tr><td colspan="9" class="empty">Belum ada data obat.</td></tr>'}</tbody>
      </table></div>
    </div>`;
}
function printInventoryReport(){
  const report=document.querySelector('#inventoryReport');
  if(!report){toast('Tabel laporan tidak ditemukan');return}
  const title='Laporan Persediaan Obat';
  const range=getReportRange();
  const period=reportPeriod.charAt(0).toUpperCase()+reportPeriod.slice(1);
  const rangeText=`${fmtDate(dateToYMD(range.from))} - ${fmtDate(dateToYMD(range.to))}`;
  const table=report.querySelector('table').outerHTML;
  const w=window.open('','_blank','width=1100,height=750');
  if(!w){toast('Izinkan pop-up untuk mencetak laporan');return}
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
  body{font-family:Arial,sans-serif;color:#172b4d;padding:24px}h2{text-align:center;margin:0 0 8px}
  p{text-align:center;margin:0 0 22px;color:#52657d;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:9px 7px;text-align:left}
  th{background:#eaf1f8;font-weight:700;text-transform:uppercase}tr{page-break-inside:avoid}
  @page{size:landscape;margin:12mm}@media print{body{padding:0}}
  </style></head><body><h2>${title}</h2><p>Periode ${period}: ${rangeText}</p>${table}</body></html>`);
  w.document.close();w.focus();w.print();
}
function statTile(label,val,icon){return `<div class="report-tile"><small>${label}</small><strong>${icon} ${val}</strong></div>`}
function transactionsForDate(){let a=db.transactions.filter(t=>t.date===reportDate);return a.length?`<div class="table-wrap"><table><thead><tr><th>Obat</th><th>Jenis</th><th>Jumlah</th><th>Keterangan</th></tr></thead><tbody>${a.map(t=>`<tr><td>${esc(medById(t.medicineId)?.name||'-')}</td><td>${t.type}</td><td>${t.qty}</td><td>${esc(t.note||'-')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Tidak ada transaksi pada tanggal ini.</div>'}
function profilePage(){return `${pageHead('Profil Petugas','Informasi akun dan pengaturan aplikasi')}<div class="card"><div class="profile-row"><div class="avatar" style="width:60px;height:60px;font-size:24px">${esc((db.user.name||'P').slice(0,1).toUpperCase())}</div><div><strong style="font-size:17px">${esc(db.user.name)}</strong><div class="muted" style="margin-top:5px">Petugas Farmasi · Puskesmas Sehat Bersama</div></div></div><form id="profileForm" style="padding-top:20px"><div class="form-grid"><div class="field"><label>Nama Lengkap</label><input name="name" value="${esc(db.user.name)}" required></div><div class="field"><label>Username</label><input value="${esc(db.user.username)}" disabled></div><div class="field"><label>Email</label><input type="email" name="email" value="${esc(db.user.email||'')}"></div><div class="field"><label>No. HP</label><input name="phone" value="${esc(db.user.phone||'')}"></div></div><button class="btn btn-primary">Simpan Profil</button></form></div><div class="card"><div class="card-head"><h3>Pengaturan Aplikasi</h3></div><p class="muted" style="line-height:1.7">Data obat, transaksi, dan profil disimpan melalui database MySQL pada server SIKOBA.</p><button class="btn btn-light" id="exportData">Ekspor Data JSON</button> <button class="btn btn-danger" id="resetData">Reset Data Aplikasi</button></div>`}
function renderPage(){return ({dashboard,medicines:medicinesPage,stockin:()=>transactionForm('Masuk'),stockout:()=>transactionForm('Keluar'),transactions:transactionsPage,stockopname:stockOpnamePage,expiry:expiryPage,reports:reportsPage,profile:profilePage}[page]||dashboard)()}
function render(){if(!db.loggedIn){$('#app').innerHTML=loginScreen(false);bindAuth();return}$('#app').innerHTML=shell();bindApp()}
function bindAuth(){
  let f=$('#authForm');
  $('#switchAuth').onclick=()=>{let reg=$('#switchAuth').textContent==='Daftar';$('#app').innerHTML=loginScreen(reg);bindAuth()};
  f.onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(f), isRegister=!!f.querySelector('[name="name"]');
    const payload={username:String(fd.get('username')||''),password:String(fd.get('password')||'')};
    if(isRegister){
      if(payload.password!==String(fd.get('confirm')||'')){toast('Konfirmasi password belum sama');return}
      Object.assign(payload,{name:String(fd.get('name')||''),email:String(fd.get('email')||''),phone:String(fd.get('phone')||'')});
    }
    const button=f.querySelector('button[type="submit"],button.btn-primary'); if(button)button.disabled=true;
    try{
      const response=await fetch(`api.php?action=${isRegister?'register':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok||!result.success)throw new Error(result.message||'Autentikasi gagal');
      db.user=result.user;db.loggedIn=true;
      await save();render();toast(isRegister?'Registrasi berhasil':'Login berhasil');
    }catch(err){toast(err.message||'Tidak dapat menghubungi server')}
    finally{if(button)button.disabled=false}
  };
}
function bindApp(){ $$('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});$('#logoutBtn').onclick=async()=>{try{await fetch('api.php?action=logout',{method:'POST',credentials:'same-origin'})}catch(e){}db.loggedIn=false;render()};$('#notificationsBtn').onclick=showNotifications;$('#mobileMore').onclick=()=>{page='expiry';render()};$('#addMedicine')?.addEventListener('click',()=>medicineModal());$('#medicineSearch')?.addEventListener('input',e=>{medicineSearch=e.target.value;let pos=e.target.selectionStart;render();let input=$('#medicineSearch');input.focus();input.setSelectionRange(pos,pos)});$$('[data-stockfilter]').forEach(b=>b.onclick=()=>{stockFilter=b.dataset.stockfilter;render()});$$('[data-txfilter]').forEach(b=>b.onclick=()=>{txFilter=b.dataset.txfilter;render()});$$('[data-expiryfilter]').forEach(b=>b.onclick=()=>{expiryFilter=b.dataset.expiryfilter;render()});$$('[data-edit]').forEach(b=>b.onclick=()=>medicineModal(Number(b.dataset.edit)));$$('[data-delete]').forEach(b=>b.onclick=()=>deleteMedicine(Number(b.dataset.delete)));$('#transactionForm')?.addEventListener('submit',saveTransaction);$('#newOpname')?.addEventListener('click',opnameForm);$$('[data-opname-detail]').forEach(b=>b.onclick=()=>showOpnameDetail(Number(b.dataset.opnameDetail)));$('#profileForm')?.addEventListener('submit',saveProfile);$('#reportDate')?.addEventListener('change',e=>{reportDate=e.target.value;render()});$('#reportPeriod')?.addEventListener('change',e=>{reportPeriod=e.target.value;render()});$('#printInventory')?.addEventListener('click',printInventoryReport);$('#exportData')?.addEventListener('click',exportData);$('#resetData')?.addEventListener('click',()=>{if(confirm('Reset semua data aplikasi ke data awal?')){db=initialData();db.loggedIn=true;save();render();toast('Data aplikasi direset')}})}
function medicineModal(id=null){editingId=id;let m=id?medById(id):{name:'',type:'Tablet',dose:'',stock:0,min:10,expiry:'',category:'Obat Bebas'};$('#modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal"><div class="modal-head"><h2>${id?'Edit Data Obat':'Tambah Data Obat'}</h2><button class="close-btn" id="closeModal">×</button></div><form id="medicineForm"><div class="form-grid"><div class="field wide"><label>Nama Obat</label><input name="name" value="${esc(m.name)}" required placeholder="Masukkan nama obat"></div><div class="field"><label>Jenis Obat</label><select name="type"><option ${m.type==='Tablet'?'selected':''}>Tablet</option><option ${m.type==='Kapsul'?'selected':''}>Kapsul</option><option ${m.type==='Sirup'?'selected':''}>Sirup</option><option ${m.type==='Sachet'?'selected':''}>Sachet</option><option ${m.type==='Salep'?'selected':''}>Salep</option><option ${m.type==='Tetes'?'selected':''}>Tetes</option></select></div><div class="field"><label>Dosis</label><input name="dose" value="${esc(m.dose)}" placeholder="Contoh: 500 mg"></div><div class="field"><label>Jumlah Stok</label><input type="number" name="stock" min="0" value="${m.stock}" required></div><div class="field"><label>Stok Minimum</label><input type="number" name="min" min="0" value="${m.min}" required></div><div class="field"><label>Tanggal Kedaluwarsa</label><input type="date" name="expiry" value="${m.expiry}" required></div><div class="field"><label>Kategori</label><select name="category">${['Analgesik','Antibiotik','Antihistamin','Obat Bebas','Vitamin','Lainnya'].map(c=>`<option ${m.category===c?'selected':''}>${c}</option>`).join('')}</select></div></div><button class="btn btn-primary">Simpan Obat</button></form></div></div>`;$('#closeModal').onclick=closeModal;$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};$('#medicineForm').onsubmit=e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target));d.stock=Number(d.stock);d.min=Number(d.min);if(id)Object.assign(medById(id),d);else db.medicines.push({id:Date.now(),...d});save();closeModal();render();toast(id?'Data obat diperbarui':'Obat berhasil ditambahkan')}}
function closeModal(){$('#modalRoot').innerHTML=''}
function deleteMedicine(id){let m=medById(id);if(!m)return;if(confirm(`Hapus data ${m.name}? Riwayat transaksi lama tetap disimpan.`)){db.medicines=db.medicines.filter(x=>x.id!==id);save();render();toast('Data obat dihapus')}}
function saveTransaction(e){e.preventDefault();let d=Object.fromEntries(new FormData(e.target));let m=medById(d.medicineId),qty=Number(d.qty);if(!m||qty<1)return toast('Pilih obat dan jumlah yang benar');let type=page==='stockin'?'Masuk':'Keluar';if(type==='Keluar'&&qty>m.stock)return toast(`Stok tidak cukup. Stok tersedia ${m.stock}`);m.stock+=type==='Masuk'?qty:-qty;db.transactions.push({id:Date.now(),medicineId:m.id,type,qty,date:d.date,note:d.note});save();page='transactions';render();toast(`Stok ${type.toLowerCase()} berhasil disimpan`)}
function saveProfile(e){e.preventDefault();let d=Object.fromEntries(new FormData(e.target));db.user={...db.user,...d};save();render();toast('Profil berhasil diperbarui')}
function showNotifications(){let alerts=db.medicines.filter(m=>medStatus(m)[0]!=='Aman');$('#modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal"><div class="modal-head"><h2>Notifikasi</h2><button class="close-btn" id="closeModal">×</button></div>${alerts.map(m=>`<div class="notice ${medStatus(m)[1]==='danger'?'red':''}"><strong>${medStatus(m)[0]}: ${esc(m.name)}</strong><br>Stok ${m.stock} · Kedaluwarsa ${fmtDate(m.expiry)} (${daysLeft(m.expiry)<0?'sudah lewat':daysLeft(m.expiry)+' hari lagi'}).</div>`).join('')||'<div class="empty">Tidak ada notifikasi. Semua persediaan aman.</div>'}</div></div>`;$('#closeModal').onclick=closeModal;$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()}}
function exportData(){let blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sikoba-data-demo.json';a.click();URL.revokeObjectURL(a.href);toast('Data diekspor')}
async function startApp(){
  try{
    const [sessionResponse,dataResponse]=await Promise.all([
      fetch('api.php?action=session',{credentials:'same-origin'}),
      fetch('api.php?action=load',{credentials:'same-origin'})
    ]);
    const session=await sessionResponse.json(), result=await dataResponse.json();
    if(!result.success)throw new Error(result.message||'Gagal memuat database');
    db={...initialData(),...(result.data||{})};
    db.loggedIn=!!session.loggedIn;
    if(session.loggedIn&&session.user)db.user=session.user;
  }catch(error){
    console.error(error);
    try{db=JSON.parse(localStorage.getItem(STORE))||initialData()}catch{db=initialData()}
    db.loggedIn=false;
    toast('Database belum dapat dimuat. Pastikan Apache dan MySQL aktif.');
  }
  render();
}
startApp();
