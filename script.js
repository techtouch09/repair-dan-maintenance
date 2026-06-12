// ==============================================
// KONFIGURASI DASAR
// ==============================================
const LOGIN_USER = "admin";
const LOGIN_PASS = "admin123";

// Database penyimpanan lokal
let db = {
    barang: JSON.parse(localStorage.getItem('db_barang')) || [],
    rusak: JSON.parse(localStorage.getItem('db_rusak')) || [],
    perbaikan: JSON.parse(localStorage.getItem('db_perbaikan')) || []
};

// ==============================================
// FUNGSI UTILITAS
// ==============================================
function saveData() {
    localStorage.setItem('db_barang', JSON.stringify(db.barang));
    localStorage.setItem('db_rusak', JSON.stringify(db.rusak));
    localStorage.setItem('db_perbaikan', JSON.stringify(db.perbaikan));
}

function generateId() {
    return Date.now().toString();
}

function formatDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset() + 420; // WIB = UTC+7
    const wibTime = new Date(now.getTime() + offset * 60000);
    return wibTime.toISOString().slice(0, 16);
}

function formatDateIndo(dateStr) {
    if (!dateStr) return "-";
    const [date] = dateStr.split('T');
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
}

function formatDateFile(dateStr) {
    if (!dateStr) return "";
    const [date] = dateStr.split('T');
    const [y, m, d] = date.split('-');
    return `${d}-${m}-${y}`;
}

function formatDateTimeIndo(dateStr) {
    if (!dateStr) return "-";
    const [date, time] = dateStr.split('T');
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y} ${time.substring(0,5)}`;
}

// ==============================================
// SISTEM LOGIN DENGAN STATUS TETAP SETELAH REFRESH
// ==============================================
// Cek status login saat halaman dimuat / di-refresh
window.onload = function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === "true") {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        tampilkanDataBarang();
        updateDropdownRusak();
        updateDropdownPerbaikan();
    }
};

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === LOGIN_USER && password === LOGIN_PASS) {
        // Simpan status login
        localStorage.setItem('isLoggedIn', "true");
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        tampilkanDataBarang();
        updateDropdownRusak();
        updateDropdownPerbaikan();
    } else {
        alert("Username atau Password salah!");
    }
}

function logout() {
    if (confirm("Yakin ingin keluar dari aplikasi?")) {
        // Hapus status login saat keluar
        localStorage.removeItem('isLoggedIn');
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainPage').classList.add('hidden');
        document.getElementById('username').value = "";
        document.getElementById('password').value = "";
    }
}

// ==============================================
// NAVIGASI & TAMPILAN
// ==============================================
function toggleMenu() {
    document.querySelector('.nav-menu').classList.toggle('active');
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelector('.nav-menu').classList.remove('active');

    if (id === 'barangSection') tampilkanDataBarang();
    if (id === 'rusakSection') tampilkanDataRusak();
    if (id === 'perbaikanSection') tampilkanDataPerbaikan();
    if (id === 'laporanSection') renderLaporan();
}

function toggleForm(id) {
    const form = document.getElementById(id);
    form.classList.toggle('hidden');
    
    if (!form.classList.contains('hidden')) {
        resetForm(id);
        if (id === 'formBarang') document.getElementById('tglBarang').value = formatDateTime();
        if (id === 'formRusak') document.getElementById('tglRusak').value = formatDateTime();
        if (id === 'formPerbaikan') document.getElementById('tglPerbaikan').value = formatDateTime();
    }
}

function toggleTglInput(inputId, checkId) {
    const input = document.getElementById(inputId);
    const isChecked = document.getElementById(checkId).checked;
    input.readOnly = !isChecked;
    input.style.background = isChecked ? 'white' : 'var(--gray-100)';
}

function resetForm(id) {
    const form = document.getElementById(id);
    form.reset();
    form.dataset.editId = "";
    const btnSimpan = form.querySelector('button[onclick*="simpan"]');
    btnSimpan.textContent = "Simpan";
    btnSimpan.classList.remove('btn-warning');
    btnSimpan.classList.add('btn-success');
}

// ==============================================
// DATA BARANG
// ==============================================
function simpanBarang() {
    const id = document.getElementById('formBarang').dataset.editId || generateId();
    const data = {
        id: id,
        tanggal: document.getElementById('tglBarang').value,
        shift: document.getElementById('shiftBarang').value,
        kode: document.getElementById('kodeBarang').value.trim().toUpperCase(),
        pekerja: document.getElementById('pekerjaBarang').value.trim(),
        nama: document.getElementById('namaBarang').value.trim(),
        jumlah: parseInt(document.getElementById('qtyBarang').value) || 0,
        lokasi: document.getElementById('lokasiBarang').value.trim()
    };

    if (!data.kode || !data.nama || !data.jumlah || !data.shift || !data.pekerja) {
        alert("Semua kolom wajib diisi!");
        return;
    }

    const index = db.barang.findIndex(b => b.id === id);
    if (index !== -1) {
        db.barang[index] = data;
    } else {
        if (db.barang.some(b => b.kode === data.kode)) {
            alert("Kode barang sudah terdaftar!");
            return;
        }
        db.barang.push(data);
    }

    saveData();
    tampilkanDataBarang();
    toggleForm('formBarang');
    updateDropdownRusak();
    alert("Data barang berhasil disimpan!");
}

function tampilkanDataBarang(filter = "") {
    const tbody = document.querySelector('#tabelBarang tbody');
    let dataTampil = db.barang;

    if (filter) {
        dataTampil = db.barang.filter(b => 
            b.kode.toLowerCase().includes(filter.toLowerCase()) ||
            b.nama.toLowerCase().includes(filter.toLowerCase()) ||
            b.pekerja.toLowerCase().includes(filter.toLowerCase()) ||
            b.shift.toLowerCase().includes(filter.toLowerCase()) ||
            b.lokasi.toLowerCase().includes(filter.toLowerCase())
        );
    }

    tbody.innerHTML = "";
    dataTampil.forEach((item, idx) => {
        const jumlahRusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((sum, r) => sum + r.jumlah, 0);
        const sudahDiperbaiki = db.perbaikan.filter(p => p.kodeBarang === item.kode).reduce((sum, p) => sum + p.jumlah, 0);
        const tersedia = item.jumlah - jumlahRusak + sudahDiperbaiki;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateIndo(item.tanggal)} ${item.tanggal.split('T')[1]}</td>
            <td><strong>${item.kode}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.jumlah}</td>
            <td>${jumlahRusak}</td>
            <td><span class="badge ${tersedia > 0 ? 'badge-success' : 'badge-danger'}">${tersedia}</span></td>
            <td>${item.shift}</td>
            <td>${item.lokasi}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editBarang('${item.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="hapusBarang('${item.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function cariBarang() {
    tampilkanDataBarang(document.getElementById('searchBarang').value);
}

function editBarang(id) {
    const data = db.barang.find(b => b.id === id);
    if (!data) return;

    const form = document.getElementById('formBarang');
    form.dataset.editId = id;
    document.getElementById('tglBarang').value = data.tanggal;
    document.getElementById('shiftBarang').value = data.shift;
    document.getElementById('kodeBarang').value = data.kode;
    document.getElementById('pekerjaBarang').value = data.pekerja;
    document.getElementById('namaBarang').value = data.nama;
    document.getElementById('qtyBarang').value = data.jumlah;
    document.getElementById('lokasiBarang').value = data.lokasi;

    const btnSimpan = form.querySelector('button[onclick="simpanBarang()"]');
    btnSimpan.textContent = "Update Data";
    btnSimpan.classList.remove('btn-success');
    btnSimpan.classList.add('btn-warning');

    form.classList.remove('hidden');
}

function hapusBarang(id) {
    if (!confirm("Yakin ingin menghapus data ini? Data terkait juga akan ikut terhapus!")) return;
    
    const barang = db.barang.find(b => b.id === id);
    db.barang = db.barang.filter(b => b.id !== id);
    db.rusak = db.rusak.filter(r => r.kodeBarang !== barang.kode);
    db.perbaikan = db.perbaikan.filter(p => p.kodeBarang !== barang.kode);
    
    saveData();
    tampilkanDataBarang();
    updateDropdownRusak();
    alert("Data berhasil dihapus!");
}

// ==============================================
// DATA BARANG RUSAK
// ==============================================
function updateDropdownRusak() {
    const select = document.getElementById('pilihBarangRusak');
    select.innerHTML = `<option value="">-- Pilih Barang --</option>`;
    
    db.barang.forEach(b => {
        const jumlahRusak = db.rusak.filter(r => r.kodeBarang === b.kode).reduce((sum, r) => sum + r.jumlah, 0);
        const sudahDiperbaiki = db.perbaikan.filter(p => p.kodeBarang === b.kode).reduce((sum, p) => sum + p.jumlah, 0);
        const tersedia = b.jumlah - jumlahRusak + sudahDiperbaiki;
        
        if (tersedia > 0) {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = `${b.kode} - ${b.nama} (Tersedia: ${tersedia})`;
            select.appendChild(opt);
        }
    });
}

function isiDataBarangRusak() {
    const id = document.getElementById('pilihBarangRusak').value;
    if (!id) {
        document.getElementById('kodeRusak').value = "";
        document.getElementById('pekerjaRusak').value = "";
        document.getElementById('namaRusak').value = "";
        document.getElementById('shiftRusak').value = "";
        document.getElementById('qtyRusak').value = "";
        return;
    }

    const barang = db.barang.find(b => b.id === id);
    if (barang) {
        document.getElementById('kodeRusak').value = barang.kode;
        document.getElementById('pekerjaRusak').value = barang.pekerja;
        document.getElementById('namaRusak').value = barang.nama;
        document.getElementById('shiftRusak').value = barang.shift;
        document.getElementById('qtyRusak').value = "";
    }
}

function simpanRusak() {
    const id = document.getElementById('formRusak').dataset.editId || generateId();
    const kodeBarang = document.getElementById('kodeRusak').value;
    const jumlah = parseInt(document.getElementById('qtyRusak').value) || 0;

    if (!kodeBarang || jumlah <= 0) {
        alert("Pilih barang dan isi jumlah rusak dengan benar!");
        return;
    }

    const barang = db.barang.find(b => b.kode === kodeBarang);
    const jumlahRusakTotal = db.rusak.filter(r => r.kodeBarang === kodeBarang).reduce((sum, r) => sum + r.jumlah, 0);
    const sudahDiperbaiki = db.perbaikan.filter(p => p.kodeBarang === kodeBarang).reduce((sum, p) => sum + p.jumlah, 0);
    const tersedia = barang.jumlah - jumlahRusakTotal + sudahDiperbaiki;

    if (jumlah > tersedia) {
        alert(`Jumlah rusak melebihi stok tersedia! Maksimal: ${tersedia}`);
        return;
    }

    const data = {
        id: id,
        tanggal: document.getElementById('tglRusak').value,
        barangId: document.getElementById('pilihBarangRusak').value,
        kodeBarang: kodeBarang,
        pekerja: document.getElementById('pekerjaRusak').value,
        namaBarang: document.getElementById('namaRusak').value,
        jumlah: jumlah,
        shift: document.getElementById('shiftRusak').value,
        keterangan: document.getElementById('keteranganRusak').value.trim()
    };

    const index = db.rusak.findIndex(r => r.id === id);
    if (index !== -1) db.rusak[index] = data;
    else db.rusak.push(data);

    saveData();
    tampilkanDataRusak();
    toggleForm('formRusak');
    updateDropdownPerbaikan();
    alert("Data barang rusak berhasil disimpan!");
}

function tampilkanDataRusak(filter = "") {
    const tbody = document.querySelector('#tabelRusak tbody');
    let dataTampil = db.rusak;

    if (filter) {
        dataTampil = db.rusak.filter(r => 
            r.kodeBarang.toLowerCase().includes(filter.toLowerCase()) ||
            r.namaBarang.toLowerCase().includes(filter.toLowerCase()) ||
            r.pekerja.toLowerCase().includes(filter.toLowerCase()) ||
            r.shift.toLowerCase().includes(filter.toLowerCase())
        );
    }

    tbody.innerHTML = "";
    dataTampil.forEach((item, idx) => {
        const sudahDiperbaiki = db.perbaikan
            .filter(p => p.rusakId === item.id)
            .reduce((sum, p) => sum + p.jumlah, 0);
        const sisa = item.jumlah - sudahDiperbaiki;
        const status = sisa > 0 ? 
            '<span class="badge badge-warning">Belum Selesai</span>' : 
            '<span class="badge badge-success">Sudah Diperbaiki</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateIndo(item.tanggal)} ${item.tanggal.split('T')[1]}</td>
            <td><strong>${item.kodeBarang}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.namaBarang}</td>
            <td>${item.jumlah}</td>
            <td>${sudahDiperbaiki}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>${item.keterangan || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRusak('${item.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="hapusRusak('${item.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function cariRusak() {
    tampilkanDataRusak(document.getElementById('searchRusak').value);
}

function editRusak(id) {
    const data = db.rusak.find(r => r.id === id);
    if (!data) return;

    const form = document.getElementById('formRusak');
    form.dataset.editId = id;
    document.getElementById('tglRusak').value = data.tanggal;
    document.getElementById('pilihBarangRusak').value = data.barangId;
    isiDataBarangRusak();
    document.getElementById('qtyRusak').value = data.jumlah;
    document.getElementById('keteranganRusak').value = data.keterangan;

    const btnSimpan = form.querySelector('button[onclick="simpanRusak()"]');
    btnSimpan.textContent = "Update Data";
    btnSimpan.classList.remove('btn-success');
    btnSimpan.classList.add('btn-warning');

    form.classList.remove('hidden');
}

function hapusRusak(id) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    db.rusak = db.rusak.filter(r => r.id !== id);
    db.perbaikan = db.perbaikan.filter(p => p.rusakId !== id);
    saveData();
    tampilkanDataRusak();
    updateDropdownPerbaikan();
    alert("Data berhasil dihapus!");
}

// ==============================================
// DATA BARANG PERBAIKAN
// ==============================================
function updateDropdownPerbaikan() {
    const select = document.getElementById('pilihBarangRusakPerbaikan');
    select.innerHTML = `<option value="">-- Pilih Barang Rusak --</option>`;
    
    db.rusak.forEach(r => {
        const sudahDiperbaiki = db.perbaikan.filter(p => p.rusakId === r.id).reduce((sum, p) => sum + p.jumlah, 0);
        const sisa = r.jumlah - sudahDiperbaiki;
        
        if (sisa > 0) {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.kodeBarang} - ${r.namaBarang} (Sisa: ${sisa})`;
            select.appendChild(opt);
        }
    });
}

function isiDataRusakPerbaikan() {
    const id = document.getElementById('pilihBarangRusakPerbaikan').value;
    if (!id) {
        document.getElementById('kodePerbaikan').value = "";
        document.getElementById('pekerjaPerbaikan').value = "";
        document.getElementById('namaPerbaikan').value = "";
        document.getElementById('shiftPerbaikan').value = "";
        document.getElementById('qtyPerbaikan').value = "";
        return;
    }

    const rusak = db.rusak.find(r => r.id === id);
    if (rusak) {
        document.getElementById('kodePerbaikan').value = rusak.kodeBarang;
        document.getElementById('pekerjaPerbaikan').value = rusak.pekerja;
        document.getElementById('namaPerbaikan').value = rusak.namaBarang;
        document.getElementById('shiftPerbaikan').value = rusak.shift;
        
        const sudahDiperbaiki = db.perbaikan.filter(p => p.rusakId === id).reduce((sum, p) => sum + p.jumlah, 0);
        const sisa = rusak.jumlah - sudahDiperbaiki;
        document.getElementById('qtyPerbaikan').value = "";
        document.getElementById('qtyPerbaikan').max = sisa;
    }
}

function simpanPerbaikan() {
    const id = document.getElementById('formPerbaikan').dataset.editId || generateId();
    const rusakId = document.getElementById('pilihBarangRusakPerbaikan').value;
    const jumlah = parseInt(document.getElementById('qtyPerbaikan').value) || 0;

    if (!rusakId || jumlah <= 0) {
        alert("Pilih barang rusak dan isi jumlah perbaikan dengan benar!");
        return;
    }

    const rusak = db.rusak.find(r => r.id === rusakId);
    const sudahDiperbaiki = db.perbaikan.filter(p => p.rusakId === rusakId).reduce((sum, p) => sum + p.jumlah, 0);
    const sisa = rusak.jumlah - sudahDiperbaiki;

    if (jumlah > sisa) {
        alert(`Jumlah perbaikan melebihi sisa rusak! Maksimal: ${sisa}`);
        return;
    }

    const data = {
        id: id,
        tanggal: document.getElementById('tglPerbaikan').value,
        rusakId: rusakId,
        kodeBarang: rusak.kodeBarang,
        pekerja: document.getElementById('pekerjaPerbaikan').value,
        namaBarang: rusak.namaBarang,
        jumlah: jumlah,
        shift: document.getElementById('shiftPerbaikan').value,
        hasil: document.getElementById('hasilPerbaikan').value
    };

    const index = db.perbaikan.findIndex(p => p.id === id);
    if (index !== -1) db.perbaikan[index] = data;
    else db.perbaikan.push(data);

    saveData();
    tampilkanDataPerbaikan();
    toggleForm('formPerbaikan');
    tampilkanDataBarang();
    tampilkanDataRusak();
    updateDropdownPerbaikan();
    alert("Data perbaikan berhasil disimpan!");
}

function tampilkanDataPerbaikan(filter = "") {
    const tbody = document.querySelector('#tabelPerbaikan tbody');
    let dataTampil = db.perbaikan;

    if (filter) {
        dataTampil = db.perbaikan.filter(p => 
            p.kodeBarang.toLowerCase().includes(filter.toLowerCase()) ||
            p.namaBarang.toLowerCase().includes(filter.toLowerCase()) ||
            p.pekerja.toLowerCase().includes(filter.toLowerCase()) ||
            p.shift.toLowerCase().includes(filter.toLowerCase())
        );
    }

    tbody.innerHTML = "";
    dataTampil.forEach((item, idx) => {
        const rusak = db.rusak.find(r => r.id === item.rusakId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateIndo(rusak?.tanggal || '-')}</td>
            <td>${formatDateIndo(item.tanggal)} ${item.tanggal.split('T')[1]}</td>
            <td><strong>${item.kodeBarang}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.namaBarang}</td>
            <td>${item.jumlah}</td>
            <td>${item.shift}</td>
            <td><span class="badge ${item.hasil.includes('Bisa') ? 'badge-success' : 'badge-danger'}">${item.hasil}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editPerbaikan('${item.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="hapusPerbaikan('${item.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function cariPerbaikan() {
    tampilkanDataPerbaikan(document.getElementById('searchPerbaikan').value);
}

function editPerbaikan(id) {
    const data = db.perbaikan.find(p => p.id === id);
    if (!data) return;

    const form = document.getElementById('formPerbaikan');
    form.dataset.editId = id;
    document.getElementById('tglPerbaikan').value = data.tanggal;
    document.getElementById('pilihBarangRusakPerbaikan').value = data.rusakId;
    isiDataRusakPerbaikan();
    document.getElementById('qtyPerbaikan').value = data.jumlah;
    document.getElementById('hasilPerbaikan').value = data.hasil;

    const btnSimpan = form.querySelector('button[onclick="simpanPerbaikan()"]');
    btnSimpan.textContent = "Update Data";
    btnSimpan.classList.remove('btn-success');
    btnSimpan.classList.add('btn-warning');

    form.classList.remove('hidden');
}

function hapusPerbaikan(id) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    db.perbaikan = db.perbaikan.filter(p => p.id !== id);
    saveData();
    tampilkanDataPerbaikan();
    tampilkanDataBarang();
    tampilkanDataRusak();
    updateDropdownPerbaikan();
    alert("Data berhasil dihapus!");
}

// ==============================================
// LAPORAN & EXPORT
// ==============================================
function renderLaporan() {
    // Fungsi tambahan jika diperlukan
}

// --- Fungsi Filter Data Berdasarkan Periode ---
function filterDataPeriode(data, tglMulai, tglSelesai) {
    if (!tglMulai || !tglSelesai) return data;
    const mulai = new Date(tglMulai);
    const selesai = new Date(tglSelesai);
    selesai.setHours(23,59,59);
    return data.filter(item => {
        const tgl = new Date(item.tanggal);
        return tgl >= mulai && tgl <= selesai;
    });
}

// --- Cetak Per Item ---
function cetakPerItem(jenis) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Lanskap agar muat banyak kolom
    
    let judul, kolom, data, dataTabel;

    if (jenis === 'barang') {
        judul = "LOG BARANG MASUK";
        kolom = [["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"]];
        data = db.barang;
        dataTabel = data.map((item, idx) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => p.kodeBarang === item.kode).reduce((s,p)=>s+p.jumlah,0);
            const sisa = item.jumlah - rusak + perbaikan;
            return [
                idx+1,
                formatDateIndo(item.tanggal),
                item.kode,
                item.pekerja,
                item.nama,
                item.jumlah,
                rusak,
                sisa,
                item.shift,
                item.lokasi
            ];
        });
    } 
    else if (jenis === 'rusak') {
        judul = "LOG BARANG RUSAK";
        kolom = [["NO", "TANGGAL", "KODE", "PENCATAT", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "STATUS", "SHIFT", "KETERANGAN"]];
        data = db.rusak;
        dataTabel = data.map((item, idx) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === item.id).reduce((s,p)=>s+p.jumlah,0);
            const status = (item.jumlah - selesai) > 0 ? "BELUM SELESAI" : "SUDAH DIPERBAIKI";
            return [
                idx+1,
                formatDateIndo(item.tanggal),
                item.kodeBarang,
                item.pekerja,
                item.namaBarang,
                item.jumlah,
                selesai,
                status,
                item.shift,
                item.keterangan || "-"
            ];
        });
    }
    else if (jenis === 'perbaikan') {
        judul = "LOG BARANG PERBAIKAN";
        kolom = [["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH DIPERBAIKI", "SHIFT", "HASIL"]];
        data = db.perbaikan;
        dataTabel = data.map((item, idx) => {
            const rusak = db.rusak.find(r => r.id === item.rusakId);
            return [
                idx+1,
                formatDateIndo(rusak?.tanggal || "-"),
                formatDateIndo(item.tanggal),
                item.kodeBarang,
                item.pekerja,
                item.namaBarang,
                item.jumlah,
                item.shift,
                item.hasil || "-"
            ];
        });
    }
    else return;

    // --- Kop Aplikasi & Perusahaan ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("APLIKASI PENCATATAN BARANG", 148.5, 18, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("PT. AKMAL JAYA SENTOSA", 148.5, 26, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(judul, 148.5, 36, { align: "center" });
    
    // Garis pemisah
    doc.setLineWidth(0.3);
    doc.line(40, 42, 257, 42);

    // --- Buat Tabel dengan Warna Hijau & Posisi Tengah ---
doc.autoTable({
    startY: 50,
    head: kolom,
    body: dataTabel,
    theme: 'grid',
    margin: { left: 40, right: 33 },
    headStyles: {
        fillColor: [26, 188, 156],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 8  // Ukuran teks header diperkecil
    },
    bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
        valign: 'middle'
    },
    columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 20 },
        9: { cellWidth: 25 }
    }
});

    // Simpan File
    const tglSekarang = formatDateFile(new Date().toISOString());
    const namaFile = `${judul.replace(/\s/g, '_')}_${tglSekarang}.pdf`;
    doc.save(namaFile);
}

// --- Cetak Keseluruhan ---
function cetakPeriode(tipe) {
    const tglMulai = document.getElementById('tglMulai').value;
    const tglSelesai = document.getElementById('tglSelesai').value;

    if (!tglMulai || !tglSelesai) {
        alert("Silakan isi Tanggal Mulai dan Tanggal Selesai terlebih dahulu!");
        return;
    }

    if (tipe === 'excel') {
        exportExcelKeseluruhan(tglMulai, tglSelesai);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Judul Utama Lengkap
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("APLIKASI PENCATATAN BARANG", 148.5, 18, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("PT. AKMAL JAYA SENTOSA", 148.5, 26, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KESELURUHAN", 148.5, 36, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${formatDateIndo(tglMulai)} s/d ${formatDateIndo(tglSelesai)}`, 148.5, 44, { align: "center" });
    
    doc.setLineWidth(0.3);
    doc.line(30, 50, 267, 50);

    let posY = 60;

    // --- BAGIAN 1: DATA BARANG ---
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("LOG BARANG MASUK", 25, posY);
    posY += 6;

    const dataBarangFilter = filterDataPeriode(db.barang, tglMulai, tglSelesai);
    const kolomBarang = [["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"]];
    const dataTabelBarang = dataBarangFilter.map((item, idx) => {
        const rusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r)=>s+r.jumlah,0);
        const perbaikan = db.perbaikan.filter(p => p.kodeBarang === item.kode).reduce((s,p)=>s+p.jumlah,0);
        const sisa = item.jumlah - rusak + perbaikan;
        return [idx+1, formatDateIndo(item.tanggal), item.kode, item.pekerja, item.nama, item.jumlah, rusak, sisa, item.shift, item.lokasi];
    });

    doc.autoTable({
        startY: posY,
        head: kolomBarang,
        body: dataTabelBarang,
        theme: 'grid',
        margin: { left: 25, right: 25 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, halign: 'center', valign: 'middle' },
        columnStyles: { 0: {w:10}, 1:{w:20}, 2:{w:15}, 3:{w:22}, 4:{w:30}, 5:{w:15}, 6:{w:15}, 7:{w:18}, 8:{w:18}, 9:{w:25} }
    });
    posY = doc.lastAutoTable.finalY + 12;

    // --- BAGIAN 2: DATA BARANG RUSAK ---
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("LOG BARANG RUSAK", 25, posY);
    posY += 6;

    const dataRusakFilter = filterDataPeriode(db.rusak, tglMulai, tglSelesai);
    const kolomRusak = [["NO", "TANGGAL", "KODE", "PENCATAT", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "STATUS", "SHIFT", "KETERANGAN"]];
    const dataTabelRusak = dataRusakFilter.map((item, idx) => {
        const selesai = db.perbaikan.filter(p => p.rusakId === item.id).reduce((s,p)=>s+p.jumlah,0);
        const status = (item.jumlah - selesai) > 0 ? "BELUM SELESAI" : "SUDAH DIPERBAIKI";
        return [idx+1, formatDateIndo(item.tanggal), item.kodeBarang, item.pekerja, item.namaBarang, item.jumlah, selesai, status, item.shift, item.keterangan || "-"];
    });

    doc.autoTable({
        startY: posY,
        head: kolomRusak,
        body: dataTabelRusak,
        theme: 'grid',
        margin: { left: 25, right: 25 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, halign: 'center', valign: 'middle' },
        columnStyles: { 0: {w:10}, 1:{w:20}, 2:{w:15}, 3:{w:22}, 4:{w:30}, 5:{w:18}, 6:{w:20}, 7:{w:22}, 8:{w:18}, 9:{w:25} }
    });
    posY = doc.lastAutoTable.finalY + 12;

    // --- BAGIAN 3: DATA BARANG PERBAIKAN ---
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("LOG BARANG PERBAIKAN", 25, posY);
    posY += 6;

    const dataPerbaikanFilter = filterDataPeriode(db.perbaikan, tglMulai, tglSelesai);
    const kolomPerbaikan = [["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH DIPERBAIKI", "SHIFT", "HASIL"]];
    const dataTabelPerbaikan = dataPerbaikanFilter.map((item, idx) => {
        const rusak = db.rusak.find(r => r.id === item.rusakId);
        return [idx+1, formatDateIndo(rusak?.tanggal || "-"), formatDateIndo(item.tanggal), item.kodeBarang, item.pekerja, item.namaBarang, item.jumlah, item.shift, item.hasil || "-"];
    });

    doc.autoTable({
        startY: posY,
        head: kolomPerbaikan,
        body: dataTabelPerbaikan,
        theme: 'grid',
        margin: { left: 25, right: 25 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, halign: 'center', valign: 'middle' },
        columnStyles: { 0: {w:10}, 1:{w:22}, 2:{w:22}, 3:{w:15}, 4:{w:22}, 5:{w:30}, 6:{w:22}, 7:{w:18}, 8:{w:28} }
    });

    // Simpan File
    const namaFile = `LAPORAN_KESELURUHAN_${formatDateFile(tglMulai)}_sd_${formatDateFile(tglSelesai)}.pdf`;
    doc.save(namaFile);
}

// --- Export Excel Per Item ---
function exportExcelPerItem(jenis) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    let judul, header, data = [];

    if (jenis === 'barang') {
        judul = "LOG BARANG MASUK";
        header = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"];
        const dataBarang = db.barang;
        data = dataBarang.map((item, idx) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => p.kodeBarang === item.kode).reduce((s,p)=>s+p.jumlah,0);
            const sisa = item.jumlah - rusak + perbaikan;
            return [
                idx+1,
                formatDateIndo(item.tanggal),
                item.kode,
                item.pekerja,
                item.nama,
                item.jumlah,
                rusak,
                sisa,
                item.shift,
                item.lokasi
            ];
        });
    } 
    else if (jenis === 'rusak') {
        judul = "LOG BARANG RUSAK";
        header = ["NO", "TANGGAL", "KODE", "PENCATAT", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "STATUS", "SHIFT", "KETERANGAN"];
        const dataRusak = db.rusak;
        data = dataRusak.map((item, idx) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === item.id).reduce((s,p)=>s+p.jumlah,0);
            const status = (item.jumlah - selesai) > 0 ? "BELUM SELESAI" : "SUDAH DIPERBAIKI";
            return [
                idx+1,
                formatDateIndo(item.tanggal),
                item.kodeBarang,
                item.pekerja,
                item.namaBarang,
                item.jumlah,
                selesai,
                status,
                item.shift,
                item.keterangan || "-"
            ];
        });
    }
    else if (jenis === 'perbaikan') {
        judul = "LOG BARANG PERBAIKAN";
        header = ["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH DIPERBAIKI", "SHIFT", "HASIL"];
        const dataPerbaikan = db.perbaikan;
        data = dataPerbaikan.map((item, idx) => {
            const rusak = db.rusak.find(r => r.id === item.rusakId);
            return [
                idx+1,
                formatDateIndo(rusak?.tanggal || "-"),
                formatDateIndo(item.tanggal),
                item.kodeBarang,
                item.pekerja,
                item.namaBarang,
                item.jumlah,
                item.shift,
                item.hasil || "-"
            ];
        });
    }
    else return;

    const wsData = [
        ["APLIKASI PENCATATAN BARANG"],
        ["PT. AKMAL JAYA SENTOSA"],
        [judul],
        [],
        header,
        ...data
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
        { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, judul);
    const tglFile = formatDateFile(new Date().toISOString());
    const namaFile = `${judul.replace(/\s/g, '_')}_${tglFile}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// --- Export Excel Keseluruhan ---
function exportExcelKeseluruhan(tglMulai, tglSelesai) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    const dataBarang = filterDataPeriode(db.barang, tglMulai, tglSelesai);
    const dataRusak = filterDataPeriode(db.rusak, tglMulai, tglSelesai);
    const dataPerbaikan = filterDataPeriode(db.perbaikan, tglMulai, tglSelesai);

    const wsData = [
        ["LAPORAN KESELURUHAN"],
        ["APLIKASI PENCATATAN BARANG - PT. AKMAL JAYA SENTOSA"],
        [`Periode: ${formatDateIndo(tglMulai)} s/d ${formatDateIndo(tglSelesai)}`],
        [],
        [],
        ["LOG BARANG MASUK"],
        [],
        ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"],
        ...dataBarang.map((item, idx) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => p.kodeBarang === item.kode).reduce((s,p)=>s+p.jumlah,0);
            const sisa = item.jumlah - rusak + perbaikan;
            return [
                idx+1, formatDateIndo(item.tanggal), item.kode, item.pekerja, item.nama,
                item.jumlah, rusak, sisa, item.shift, item.lokasi
            ];
        }),
        [], [],
        ["LOG BARANG RUSAK"],
        [],
        ["NO", "TANGGAL", "KODE", "PENCATAT", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "STATUS", "SHIFT", "KETERANGAN"],
        ...dataRusak.map((item, idx) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === item.id).reduce((s,p)=>s+p.jumlah,0);
            const status = (item.jumlah - selesai) > 0 ? "BELUM SELESAI" : "SUDAH DIPERBAIKI";
            return [
                idx+1, formatDateIndo(item.tanggal), item.kodeBarang, item.pekerja,
                item.namaBarang, item.jumlah, selesai, status, item.shift, item.keterangan || "-"
            ];
        }),
        [], [],
        ["LOG BARANG PERBAIKAN"],
        [],
        ["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH DIPERBAIKI", "SHIFT", "HASIL"],
        ...dataPerbaikan.map((item, idx) => {
            const rusak = db.rusak.find(r => r.id === item.rusakId);
            return [
                idx+1,
                rusak?.tanggal ? formatDateIndo(rusak.tanggal) : "-",
                formatDateIndo(item.tanggal),
                item.kodeBarang, item.pekerja, item.namaBarang,
                item.jumlah, item.shift, item.hasil || "-"
            ];
        })
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Atur lebar kolom agar rapi
    ws['!cols'] = [
        { wch: 5 }, { wch: 14 }, { wch: 10 }, { wch: 16 },
        { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
        { wch: 12 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keseluruhan");
    const namaFile = `LAPORAN_KESELURUHAN_${formatDateFile(tglMulai)}_sd_${formatDateFile(tglSelesai)}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// --- Tombol Export Excel untuk masing-masing menu ---
function exportExcelBarang() {
    exportExcelPerItem('barang');
}

function exportExcelRusak() {
    exportExcelPerItem('rusak');
}

function exportExcelPerbaikan() {
    exportExcelPerItem('perbaikan');
}