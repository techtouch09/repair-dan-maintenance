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

// Ambil waktu akurat WIB (Jakarta/Serang/Banten = UTC+7)
function formatDateTime() {
    const now = new Date();
    // Langsung buat tanggal di zona WIB tanpa perhitungan manual
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    // Format: YYYY-MM-DDTHH:mm (sesuai input datetime-local)
    const tahun = wib.getFullYear();
    const bulan = String(wib.getMonth() + 1).padStart(2, '0');
    const tanggal = String(wib.getDate()).padStart(2, '0');
    const jam = String(wib.getHours()).padStart(2, '0');
    const menit = String(wib.getMinutes()).padStart(2, '0');
    
    return `${tahun}-${bulan}-${tanggal}T${jam}:${menit}`;
}

// Format tanggal tampilan Indonesia: DD/MM/YYYY HH:mm
function formatDateTimeIndo(dateStr) {
    if (!dateStr) return "-";
    const [tanggal, waktu] = dateStr.split('T');
    const [tahun, bulan, hari] = tanggal.split('-');
    return `${hari}/${bulan}/${tahun} ${waktu.substring(0,5)} WIB`;
}

// Format tanggal saja untuk file/laporan
function formatDateIndo(dateStr) {
    if (!dateStr) return "-";
    const [tanggal] = dateStr.split('T');
    const [tahun, bulan, hari] = tanggal.split('-');
    return `${hari}/${bulan}/${tahun}`;
}

// Format nama file
function formatDateFile(dateStr) {
    if (!dateStr) return "";
    const [tanggal] = dateStr.split('T');
    const [tahun, bulan, hari] = tanggal.split('-');
    return `${hari}-${bulan}-${tahun}`;
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

// Tutup pencarian saat klik di luar area
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-input-group')) {
        document.querySelectorAll('.hasil-pencarian').forEach(el => el.classList.remove('active'));
    }
});

// ==============================================
// SISTEM LOGIN
// ==============================================
window.onload = function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === "true") {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        tampilkanDataBarang();
    }
};

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === LOGIN_USER && password === LOGIN_PASS) {
        localStorage.setItem('isLoggedIn', "true");
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        tampilkanDataBarang();
    } else {
        alert("Username atau Password salah!");
    }
}

function logout() {
    if (confirm("Yakin ingin keluar dari aplikasi?")) {
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
    if (id === 'laporanSection') tampilkanLaporan();
}

function toggleForm(id) {
    const form = document.getElementById(id);
    form.classList.toggle('hidden');
    
    if (!form.classList.contains('hidden')) {
        resetForm(id);
        const waktuSekarang = formatDateTime(); // Ambil waktu WIB
        if (id === 'formBarang') document.getElementById('tglBarang').value = waktuSekarang;
        if (id === 'formRusak') document.getElementById('tglRusak').value = waktuSekarang;
        if (id === 'formPerbaikan') document.getElementById('tglPerbaikan').value = waktuSekarang;
    }
}

function toggleTglInput(inputId, checkId) {
    const input = document.getElementById(inputId);
    const isChecked = document.getElementById(checkId).checked;
    input.readOnly = !isChecked;
    input.style.background = isChecked ? 'white' : '#f1f5f9';
}

function resetForm(id) {
    const form = document.getElementById(id);
    form.reset();
    form.dataset.editId = "";
    const btnSimpan = form.querySelector('button[onclick*="simpan"]');
    btnSimpan.textContent = "Simpan";
    btnSimpan.classList.remove('btn-warning');
    btnSimpan.classList.add('btn-success');

    // Reset elemen pencarian
    if (id === 'formRusak') {
        document.getElementById('hasilCariBarangRusak').innerHTML = "";
        document.getElementById('hasilCariBarangRusak').classList.remove('active');
        document.getElementById('barangTerpilihIdRusak').value = "";
    }
    if (id === 'formPerbaikan') {
        document.getElementById('hasilCariBarangRusakPerbaikan').innerHTML = "";
        document.getElementById('hasilCariBarangRusakPerbaikan').classList.remove('active');
        document.getElementById('rusakTerpilihIdPerbaikan').value = "";
        document.getElementById('maksPerbaiki').textContent = "0";
        document.getElementById('qtyPerbaikan').max = 1;
    }
}

// ==============================================
// DATA BARANG (Sinkron Penuh)
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
        // Cek apakah jumlah baru cukup untuk menutupi barang yang sudah rusak
        const totalRusak = db.rusak.filter(r => r.kodeBarang === data.kode).reduce((s,r) => s + r.jumlah, 0);
        if (data.jumlah < totalRusak) {
            alert(`Tidak bisa mengurangi stok! Barang ini sudah tercatat rusak sebanyak ${totalRusak} unit. Stok minimal harus ${totalRusak}`);
            return;
        }
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
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();
    toggleForm('formBarang');
    alert("Data barang berhasil disimpan!");
}

function tampilkanDataBarang(filter = "") {
    const tbody = document.querySelector('#tabelBarang tbody');
    let dataTampil = db.barang;

    if (filter) {
        dataTampil = db.barang.filter(item =>
            item.kode.toLowerCase().includes(filter.toLowerCase()) ||
            item.nama.toLowerCase().includes(filter.toLowerCase()) ||
            item.pekerja.toLowerCase().includes(filter.toLowerCase()) ||
            item.shift.toLowerCase().includes(filter.toLowerCase()) ||
            item.lokasi.toLowerCase().includes(filter.toLowerCase())
        );
    }

    tbody.innerHTML = "";
    if (dataTampil.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:15px;">Belum ada data barang</td></tr>`;
        return;
    }

    dataTampil.forEach((item, idx) => {
        // ✅ Perhitungan sinkron:
        // Tersedia = Jumlah Awal - Total Rusak + Total Diperbaiki
        const totalRusak = db.rusak
            .filter(r => r.kodeBarang === item.kode)
            .reduce((sum, r) => sum + r.jumlah, 0);

        const totalDiperbaiki = db.perbaikan
            .filter(p => {
                const rusakData = db.rusak.find(r => r.id === p.rusakId);
                return rusakData && rusakData.kodeBarang === item.kode;
            })
            .reduce((sum, p) => sum + p.jumlah, 0);

        const tersedia = item.jumlah - totalRusak + totalDiperbaiki;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateTimeIndo(item.tanggal)}</td>
            <td><strong>${item.kode}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.jumlah}</td>
            <td>${totalRusak}</td>
            <td><span class="badge ${tersedia > 0 ? 'badge-success' : 'badge-danger'}">${tersedia}</span></td>
            <td>${item.shift}</td>
            <td>${item.lokasi || '-'}</td>
            <td>
                <button class="aksi-btn btn-edit" onclick="editBarang('${item.id}')">Edit</button>
                <button class="aksi-btn btn-hapus" onclick="hapusBarang('${item.id}')">Hapus</button>
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
    if (!confirm("Yakin ingin menghapus? Semua data rusak dan perbaikan terkait akan ikut terhapus!")) return;
    
    const barang = db.barang.find(b => b.id === id);
    db.barang = db.barang.filter(b => b.id !== id);
    db.rusak = db.rusak.filter(r => r.kodeBarang !== barang.kode);
    db.perbaikan = db.perbaikan.filter(p => {
        const rusak = db.rusak.find(r => r.id === p.rusakId);
        return rusak && rusak.kodeBarang !== barang.kode;
    });
    
    saveData();
    tampilkanDataBarang();
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();
    alert("Data berhasil dihapus!");
}

// ==============================================
// DATA BARANG RUSAK
// ==============================================
function cariBarangRusakOtomatis() {
    const kata = document.getElementById('cariBarangRusak').value.trim().toLowerCase();
    const hasilContainer = document.getElementById('hasilCariBarangRusak');
    
    hasilContainer.innerHTML = "";
    hasilContainer.classList.remove('active');
    if (kata.length < 3) return;

    const hasil = db.barang.filter(item => {
        const totalRusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r) => s + r.jumlah, 0);
        const totalDiperbaiki = db.perbaikan.filter(p => {
            const r = db.rusak.find(r => r.id === p.rusakId);
            return r && r.kodeBarang === item.kode;
        }).reduce((s,p) => s + p.jumlah, 0);
        const tersedia = item.jumlah - totalRusak + totalDiperbaiki;
        return tersedia > 0 && (
            item.kode.toLowerCase().includes(kata) ||
            item.nama.toLowerCase().includes(kata) ||
            item.pekerja.toLowerCase().includes(kata)
        );
    });

    if (hasil.length === 0) {
        hasilContainer.innerHTML = `<div class="item-pencarian">Tidak ada barang tersedia</div>`;
        hasilContainer.classList.add('active');
        return;
    }

    hasil.forEach(item => {
        const totalRusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r) => s + r.jumlah, 0);
        const totalDiperbaiki = db.perbaikan.filter(p => {
            const r = db.rusak.find(r => r.id === p.rusakId);
            return r && r.kodeBarang === item.kode;
        }).reduce((s,p) => s + p.jumlah, 0);
        const tersedia = item.jumlah - totalRusak + totalDiperbaiki;

        const elemen = document.createElement("div");
        elemen.className = "item-pencarian";
        elemen.innerHTML = `<strong>${item.kode}</strong> - ${item.nama} | Pekerja: ${item.pekerja} | Tersedia: ${tersedia}`;
        elemen.dataset.id = item.id;
        elemen.dataset.kode = item.kode;
        elemen.dataset.nama = item.nama;
        elemen.dataset.pekerja = item.pekerja;
        elemen.dataset.shift = item.shift;
        elemen.dataset.tersedia = tersedia;

        elemen.addEventListener("click", function() {
            document.getElementById('cariBarangRusak').value = `${this.dataset.kode} - ${this.dataset.nama}`;
            document.getElementById('barangTerpilihIdRusak').value = this.dataset.id;
            document.getElementById('kodeRusak').value = this.dataset.kode;
            document.getElementById('namaRusak').value = this.dataset.nama;
            document.getElementById('pekerjaRusak').value = this.dataset.pekerja;
            document.getElementById('shiftRusak').value = this.dataset.shift;
            document.getElementById('maksRusak').textContent = this.dataset.tersedia;
            document.getElementById('qtyRusak').max = parseInt(this.dataset.tersedia);
            document.getElementById('qtyRusak').value = "";
            hasilContainer.classList.remove('active');
        });
        hasilContainer.appendChild(elemen);
    });
    hasilContainer.classList.add('active');
}

function simpanRusak() {
    const id = document.getElementById('formRusak').dataset.editId || generateId();
    const barangId = document.getElementById('barangTerpilihIdRusak').value;
    const jumlah = parseInt(document.getElementById('qtyRusak').value) || 0;

    if (!barangId || jumlah <= 0) {
        alert("Pilih barang dan isi jumlah rusak dengan benar!");
        return;
    }

    const barang = db.barang.find(b => b.id === barangId);
    if (!barang) {
        alert("Data barang tidak ditemukan!");
        return;
    }

    // Hitung sisa yang bisa diinput
    const totalRusakLain = db.rusak.filter(r => r.barangId === barangId && r.id !== id).reduce((s,r) => s + r.jumlah, 0);
    const totalDiperbaiki = db.perbaikan.filter(p => {
        const r = db.rusak.find(r => r.id === p.rusakId);
        return r && r.barangId === barangId;
    }).reduce((s,p) => s + p.jumlah, 0);
    const tersedia = barang.jumlah - totalRusakLain + totalDiperbaiki;

    if (jumlah > tersedia) {
        alert(`Jumlah rusak melebihi batas! Maksimal: ${tersedia}`);
        return;
    }

    const data = {
        id: id,
        tanggal: document.getElementById('tglRusak').value,
        barangId: barangId,
        kodeBarang: barang.kode,
        pekerja: barang.pekerja,
        namaBarang: barang.nama,
        jumlah: jumlah,
        shift: barang.shift,
        keterangan: document.getElementById('keteranganRusak').value.trim()
    };

    const index = db.rusak.findIndex(r => r.id === id);
    if (index !== -1) db.rusak[index] = data;
    else db.rusak.push(data);

    saveData();
    tampilkanDataBarang();
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();
    toggleForm('formRusak');
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
    if (dataTampil.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:15px;">Belum ada data barang rusak</td></tr>`;
        return;
    }

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
            <td>${formatDateTimeIndo(item.tanggal)}</td>
            <td><strong>${item.kodeBarang}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.namaBarang}</td>
            <td>${item.jumlah}</td>
            <td>${sudahDiperbaiki}</td>
            <td>${sisa}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>
                <button class="aksi-btn btn-edit" onclick="editRusak('${item.id}')">Edit</button>
                <button class="aksi-btn btn-hapus" onclick="hapusRusak('${item.id}')">Hapus</button>
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
    document.getElementById('cariBarangRusak').value = `${data.kodeBarang} - ${data.namaBarang}`;
    document.getElementById('barangTerpilihIdRusak').value = data.barangId;
    document.getElementById('kodeRusak').value = data.kodeBarang;
    document.getElementById('namaRusak').value = data.namaBarang;
    document.getElementById('pekerjaRusak').value = data.pekerja;
    document.getElementById('shiftRusak').value = data.shift;

    const barang = db.barang.find(b => b.id === data.barangId);
    const rusakLain = db.rusak.filter(r => r.barangId === data.barangId && r.id !== id).reduce((s,r) => s + r.jumlah, 0);
    const perbaikan = db.perbaikan.filter(p => {
        const r = db.rusak.find(r => r.id === p.rusakId);
        return r && r.barangId === data.barangId;
    }).reduce((s,p) => s + p.jumlah, 0);
    const maks = barang.jumlah - rusakLain + perbaikan;

    document.getElementById('maksRusak').textContent = maks;
    document.getElementById('qtyRusak').max = maks;
    document.getElementById('qtyRusak').value = data.jumlah;
    document.getElementById('keteranganRusak').value = data.keterangan;

    const btnSimpan = form.querySelector('button[onclick="simpanRusak()"]');
    btnSimpan.textContent = "Update Data";
    btnSimpan.classList.remove('btn-success');
    btnSimpan.classList.add('btn-warning');

    form.classList.remove('hidden');
}

function hapusRusak(id) {
    if (!confirm("Yakin ingin menghapus? Semua data perbaikan terkait akan ikut terhapus!")) return;
    db.perbaikan = db.perbaikan.filter(p => p.rusakId !== id);
    db.rusak = db.rusak.filter(r => r.id !== id);
    
    saveData();
    tampilkanDataBarang();
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();
    alert("Data berhasil dihapus!");
}

// ==============================================
// DATA BARANG PERBAIKAN
// ==============================================
function cariBarangRusakPerbaikanOtomatis() {
    const kata = document.getElementById('cariBarangRusakPerbaikan').value.trim().toLowerCase();
    const hasilContainer = document.getElementById('hasilCariBarangRusakPerbaikan');
    
    hasilContainer.innerHTML = "";
    hasilContainer.classList.remove('active');
    if (kata.length < 3) return;

    const hasil = db.rusak.filter(item => {
        const sudahDiperbaiki = db.perbaikan
            .filter(p => p.rusakId === item.id)
            .reduce((s, p) => s + p.jumlah, 0);
        const sisa = item.jumlah - sudahDiperbaiki;
        return sisa > 0 && (
            item.kodeBarang.toLowerCase().includes(kata) ||
            item.namaBarang.toLowerCase().includes(kata) ||
            item.pekerja.toLowerCase().includes(kata)
        );
    });

    if (hasil.length === 0) {
        hasilContainer.innerHTML = `<div class="item-pencarian">Tidak ada barang rusak tersedia</div>`;
        hasilContainer.classList.add('active');
        return;
    }

    hasil.forEach(item => {
        const sudahDiperbaiki = db.perbaikan
            .filter(p => p.rusakId === item.id)
            .reduce((s, p) => s + p.jumlah, 0);
        const sisa = item.jumlah - sudahDiperbaiki;

        const elemen = document.createElement("div");
        elemen.className = "item-pencarian";
        elemen.innerHTML = `<strong>${item.kodeBarang}</strong> - ${item.namaBarang} | Pekerja: ${item.pekerja} | Sisa: ${sisa}`;
        
        elemen.dataset.id = item.id;
        elemen.dataset.kode = item.kodeBarang;
        elemen.dataset.nama = item.namaBarang;
        elemen.dataset.pekerja = item.pekerja;
        elemen.dataset.shift = item.shift;
        elemen.dataset.sisa = sisa;

        elemen.addEventListener("click", function() {
            document.getElementById('cariBarangRusakPerbaikan').value = `${this.dataset.kode} - ${this.dataset.nama}`;
            document.getElementById('rusakTerpilihIdPerbaikan').value = this.dataset.id;
            document.getElementById('kodePerbaikan').value = this.dataset.kode;
            document.getElementById('namaPerbaikan').value = this.dataset.nama;
            document.getElementById('pekerjaPerbaikan').value = this.dataset.pekerja;
            document.getElementById('shiftPerbaikan').value = this.dataset.shift;
            document.getElementById('maksPerbaiki').textContent = this.dataset.sisa;
            document.getElementById('qtyPerbaikan').max = parseInt(this.dataset.sisa);
            document.getElementById('qtyPerbaikan').value = "";
            document.getElementById('hasilPerbaikan').value = "";
            hasilContainer.classList.remove('active');
        });
        hasilContainer.appendChild(elemen);
    });
    hasilContainer.classList.add('active');
}

function simpanPerbaikan() {
    const id = document.getElementById('formPerbaikan').dataset.editId || generateId();
    const rusakId = document.getElementById('rusakTerpilihIdPerbaikan').value;
    const jumlahInput = document.getElementById('qtyPerbaikan').value.trim();
    const hasil = document.getElementById('hasilPerbaikan').value;
    const tanggalPerbaikan = document.getElementById('tglPerbaikan').value || formatDateTime();

    if (!rusakId) {
        alert("Pilih barang rusak terlebih dahulu!");
        return;
    }

    const jumlah = parseInt(jumlahInput);
    if (isNaN(jumlah) || jumlah <= 0) {
        alert("Isi jumlah dengan angka minimal 1!");
        return;
    }

    if (!hasil) {
        alert("Pilih hasil perbaikan!");
        return;
    }

    const rusak = db.rusak.find(r => r.id === rusakId);
    if (!rusak) {
        alert("Data barang rusak tidak ditemukan!");
        return;
    }

    // Hitung sisa yang tersedia
    const sudahDiperbaikiLain = db.perbaikan
        .filter(p => p.rusakId === rusakId && p.id !== id)
        .reduce((sum, p) => sum + p.jumlah, 0);
    const sisaTersedia = rusak.jumlah - sudahDiperbaikiLain;

    if (jumlah > sisaTersedia) {
        alert(`Jumlah melebihi batas! Maksimal: ${sisaTersedia}`);
        return;
    }

    const dataPerbaikan = {
        id: id,
        rusakId: rusakId,
        tanggalRusak: rusak.tanggal,
        tanggalPerbaikan: tanggalPerbaikan,
        kodeBarang: rusak.kodeBarang,
        pekerja: rusak.pekerja,
        namaBarang: rusak.namaBarang,
        jumlah: jumlah,
        shift: rusak.shift,
        hasil: hasil
    };

    const index = db.perbaikan.findIndex(p => p.id === id);
    if (index !== -1) {
        db.perbaikan[index] = dataPerbaikan;
        alert("Data berhasil diperbarui!");
    } else {
        db.perbaikan.push(dataPerbaikan);
        alert("Data berhasil disimpan & tercatat di laporan!");
    }

    saveData();
    tampilkanDataBarang();
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();

    toggleForm('formPerbaikan');
    resetForm('formPerbaikan');
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
    if (dataTampil.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:15px;">Belum ada data perbaikan</td></tr>`;
        return;
    }

    dataTampil.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateTimeIndo(item.tanggalRusak)}</td>
            <td>${formatDateTimeIndo(item.tanggalPerbaikan)}</td>
            <td><strong>${item.kodeBarang}</strong></td>
            <td>${item.pekerja}</td>
            <td>${item.namaBarang}</td>
            <td>${item.jumlah}</td>
            <td>${item.shift}</td>
            <td><span class="badge ${item.hasil.includes('Bisa') ? 'badge-success' : 'badge-danger'}">${item.hasil}</span></td>
            <td>
                <button class="aksi-btn btn-edit" onclick="editPerbaikan('${item.id}')">Edit</button>
                <button class="aksi-btn btn-hapus" onclick="hapusPerbaikan('${item.id}')">Hapus</button>
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

    document.getElementById('tglPerbaikan').value = data.tanggalPerbaikan.substring(0, 16);
    document.getElementById('cariBarangRusakPerbaikan').value = `${data.kodeBarang} - ${data.namaBarang}`;
    document.getElementById('rusakTerpilihIdPerbaikan').value = data.rusakId;
    document.getElementById('kodePerbaikan').value = data.kodeBarang;
    document.getElementById('namaPerbaikan').value = data.namaBarang;
    document.getElementById('pekerjaPerbaikan').value = data.pekerja;
    document.getElementById('shiftPerbaikan').value = data.shift;

    const rusak = db.rusak.find(r => r.id === data.rusakId);
    const sudahDiperbaikiLain = db.perbaikan
        .filter(p => p.rusakId === data.rusakId && p.id !== id)
        .reduce((sum, p) => sum + p.jumlah, 0);
    const sisaTersedia = rusak.jumlah - sudahDiperbaikiLain;

    document.getElementById('maksPerbaiki').textContent = sisaTersedia;
    document.getElementById('qtyPerbaikan').max = sisaTersedia;
    document.getElementById('qtyPerbaikan').value = data.jumlah;
    document.getElementById('hasilPerbaikan').value = data.hasil;

    const btnSimpan = document.querySelector('#formPerbaikan .btn-success');
    btnSimpan.textContent = "Update Data";
    btnSimpan.classList.add('btn-warning');
    btnSimpan.classList.remove('btn-success');

    toggleForm('formPerbaikan');
}

function hapusPerbaikan(id) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    
    db.perbaikan = db.perbaikan.filter(p => p.id !== id);
    saveData();
    tampilkanDataBarang();
    tampilkanDataRusak();
    tampilkanDataPerbaikan();
    tampilkanLaporan();
    alert("Data berhasil dihapus!");
}

// ==============================================
// LAPORAN & CETAK KESELURUHAN
// ==============================================
function tampilkanLaporan() {
    const tbody = document.querySelector('#tabelLaporan tbody');
    if (!tbody) return;

    const semuaData = [
        ...db.barang.map(b => ({
            tanggal: b.tanggal,
            kode: b.kode,
            nama: b.nama,
            pekerja: b.pekerja,
            jumlah: b.jumlah,
            tipe: "Barang Masuk",
            keterangan: "Stok Awal"
        })),
        ...db.rusak.map(r => ({
            tanggal: r.tanggal,
            kode: r.kodeBarang,
            nama: r.namaBarang,
            pekerja: r.pekerja,
            jumlah: `-${r.jumlah}`,
            tipe: "Barang Rusak",
            keterangan: r.keterangan || "-"
        })),
        ...db.perbaikan.map(p => ({
            tanggal: p.tanggalPerbaikan,
            kode: p.kodeBarang,
            nama: p.namaBarang,
            pekerja: p.pekerja,
            jumlah: p.hasil.includes("Bisa") ? `+${p.jumlah}` : "0",
            tipe: "Barang Diperbaiki",
            keterangan: p.hasil
        }))
    ];

    semuaData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    tbody.innerHTML = "";
    if (semuaData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:15px;">Belum ada data laporan</td></tr>`;
        return;
    }

    semuaData.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${formatDateTimeIndo(item.tanggal)}</td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${item.pekerja}</td>
            <td>${item.jumlah}</td>
            <td>${item.tipe}</td>
            <td>${item.keterangan}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterDataPeriode(data, tglMulai, tglSelesai) {
    if (!tglMulai || !tglSelesai) return data;
    
    const mulai = new Date(tglMulai + "T00:00:00+07:00"); // Paksa zona WIB
    const selesai = new Date(tglSelesai + "T23:59:59+07:00");
    
    return data.filter(item => {
        const tglItem = new Date((item.tanggal || item.tanggalPerbaikan) + "+07:00");
        return tglItem >= mulai && tglItem <= selesai;
    });
}

// --- CETAK PDF PER MENU ---
function cetakPerItem(jenis) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    let judul, kolom, dataTabel;

    if (jenis === 'barang') {
        judul = "LOG DATA BARANG";
        kolom = [["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"]];
        dataTabel = db.barang.map((item, idx) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === item.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => {
                const r = db.rusak.find(r => r.id === p.rusakId);
                return r && r.kodeBarang === item.kode;
            }).reduce((s,p)=>s+p.jumlah,0);
            const sisa = item.jumlah - rusak + perbaikan;
            return [
                idx+1, formatDateIndo(item.tanggal), item.kode, item.pekerja,
                item.nama, item.jumlah, rusak, sisa, item.shift, item.lokasi || "-"
            ];
        });
    } 
    else if (jenis === 'rusak') {
        judul = "LOG BARANG RUSAK";
        kolom = [["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "SISA", "STATUS", "SHIFT"]];
        dataTabel = db.rusak.map((item, idx) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === item.id).reduce((s,p)=>s+p.jumlah,0);
            const sisa = item.jumlah - selesai;
            const status = sisa > 0 ? "BELUM SELESAI" : "SUDAH DIPERBAIKI";
            return [
                idx+1, formatDateIndo(item.tanggal), item.kodeBarang, item.pekerja,
                item.namaBarang, item.jumlah, selesai, sisa, status, item.shift
            ];
        });
    }
    else if (jenis === 'perbaikan') {
        judul = "LOG BARANG PERBAIKAN";
        kolom = [["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH", "SHIFT", "HASIL"]];
        dataTabel = db.perbaikan.map((item, idx) => {
            return [
                idx+1, formatDateIndo(item.tanggalRusak), formatDateIndo(item.tanggalPerbaikan),
                item.kodeBarang, item.pekerja, item.namaBarang, item.jumlah, item.shift, item.hasil
            ];
        });
    }
    else return;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("APLIKASI REPAIR & MAINTENANCE", 148.5, 18, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("PT. AKMAL JAYA SENTOSA", 148.5, 26, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(judul, 148.5, 36, { align: "center" });
    doc.line(30, 42, 267, 42);

    doc.autoTable({
        startY: 50,
        head: kolom,
        body: dataTabel,
        theme: 'grid',
        margin: { left: 20, right: 20 },
        headStyles: { fillColor: [26, 188, 156], textColor: 255, fontStyle: 'bold' }
    });

    const namaFile = `${judul.replace(/\s/g, '_')}_${formatDateFile(new Date().toISOString())}.pdf`;
    doc.save(namaFile);
}

// --- CETAK PDF KESELURUHAN ---
function cetakPeriode() {
    const tglMulai = document.getElementById('tglMulai').value;
    const tglSelesai = document.getElementById('tglSelesai').value;

    if (!tglMulai || !tglSelesai) {
        alert("Isi tanggal mulai dan selesai terlebih dahulu!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("APLIKASI REPAIR & MAINTENANCE", 148.5, 18, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("PT. AKMAL JAYA SENTOSA", 148.5, 26, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KESELURUHAN", 148.5, 36, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${formatDateIndo(tglMulai)} s/d ${formatDateIndo(tglSelesai)}`, 148.5, 44, { align: "center" });
    doc.line(20, 50, 277, 50);

    let posY = 60;

    // Bagian Barang
    const barangFilter = filterDataPeriode(db.barang, tglMulai, tglSelesai);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("1. DATA BARANG", 20, posY); posY += 8;
    doc.autoTable({
        startY: posY,
        head: [["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH", "RUSAK", "TERSEDIA", "SHIFT"]],
        body: barangFilter.map((b,i) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === b.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => {
                const r = db.rusak.find(r => r.id === p.rusakId);
                return r && r.kodeBarang === b.kode;
            }).reduce((s,p)=>s+p.jumlah,0);
            const sisa = b.jumlah - rusak + perbaikan;
            return [i+1, formatDateIndo(b.tanggal), b.kode, b.pekerja, b.nama, b.jumlah, rusak, sisa, b.shift];
        }),
        theme: 'grid', margin: {left:20, right:20}, headStyles: { fillColor: [26, 188, 156], textColor: 255 }
    });
    posY = doc.lastAutoTable.finalY + 15;

    // Bagian Rusak
    const rusakFilter = filterDataPeriode(db.rusak, tglMulai, tglSelesai);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("2. DATA BARANG RUSAK", 20, posY); posY += 8;
    doc.autoTable({
        startY: posY,
        head: [["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "SISA"]],
        body: rusakFilter.map((r,i) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === r.id).reduce((s,p)=>s+p.jumlah,0);
            return [i+1, formatDateIndo(r.tanggal), r.kodeBarang, r.pekerja, r.namaBarang, r.jumlah, selesai, r.jumlah - selesai];
        }),
        theme: 'grid', margin: {left:20, right:20}, headStyles: { fillColor: [26, 188, 156], textColor: 255 }
    });
    posY = doc.lastAutoTable.finalY + 15;

    // Bagian Perbaikan
    const perbaikanFilter = filterDataPeriode(db.perbaikan, tglMulai, tglSelesai);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("3. DATA BARANG PERBAIKAN", 20, posY); posY += 8;
    doc.autoTable({
        startY: posY,
        head: [["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "NAMA PEKERJA", "JUMLAH", "HASIL"]],
        body: perbaikanFilter.map((p,i) => {
            return [i+1, formatDateIndo(p.tanggalRusak), formatDateIndo(p.tanggalPerbaikan), p.kodeBarang, p.pekerja, p.jumlah, p.hasil];
        }),
        theme: 'grid', margin: {left:20, right:20}, headStyles: { fillColor: [26, 188, 156], textColor: 255 }
    });

    doc.save(`LAPORAN_KESELURUHAN_${formatDateFile(tglMulai)}_sd_${formatDateFile(tglSelesai)}.pdf`);
}

// --- EXCEL EXPORT ---
function exportExcelPerItem(jenis) {
    if (!window.XLSX) { alert("Library Excel belum dimuat!"); return; }

    let judul, header, data = [];

    if (jenis === 'barang') {
        judul = "DATA BARANG";
        header = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA", "JUMLAH", "RUSAK", "TERSEDIA", "SHIFT", "LOKASI"];
        data = db.barang.map((b,i) => {
            const rusak = db.rusak.filter(r => r.kodeBarang === b.kode).reduce((s,r)=>s+r.jumlah,0);
            const perbaikan = db.perbaikan.filter(p => {
                const r = db.rusak.find(r => r.id === p.rusakId);
                return r && r.kodeBarang === b.kode;
            }).reduce((s,p)=>s+p.jumlah,0);
            const sisa = b.jumlah - rusak + perbaikan;
            return [i+1, formatDateIndo(b.tanggal), b.kode, b.pekerja, b.nama, b.jumlah, rusak, sisa, b.shift, b.lokasi || "-"];
        });
    } else if (jenis === 'rusak') {
        judul = "DATA BARANG RUSAK";
        header = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA", "JUMLAH RUSAK", "SUDAH DIPERBAIKI", "SISA", "STATUS"];
        data = db.rusak.map((r,i) => {
            const selesai = db.perbaikan.filter(p => p.rusakId === r.id).reduce((s,p)=>s+p.jumlah,0);
            const sisa = r.jumlah - selesai;
            const status = sisa > 0 ? "Belum Selesai" : "Sudah Diperbaiki";
            return [i+1, formatDateIndo(r.tanggal), r.kodeBarang, r.pekerja, r.namaBarang, r.jumlah, selesai, sisa, status];
        });
    }
    else if (jenis === 'perbaikan') {
        judul = "LOG BARANG PERBAIKAN";
        header = ["NO", "TANGGAL RUSAK", "TANGGAL PERBAIKAN", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH DIPERBAIKI", "SHIFT", "HASIL"];
        data = db.perbaikan.map((item, idx) => {
            const rusak = db.rusak.find(r => r.id === item.rusakId);
            return [idx+1, formatDateIndo(rusak?.tanggal || "-"), formatDateIndo(item.tanggal), item.kodeBarang, item.pekerja, item.namaBarang, item.jumlah, item.shift, item.hasil || "-"];
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