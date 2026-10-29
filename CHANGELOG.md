# Changelog

Semua perubahan penting dicatat di sini. Format mengikuti [Conventional Commits](https://www.conventionalcommits.org/).


## [0.3.0](https://github.com/sendyputra/capstone_project_frontend/compare/v0.2.0...v0.3.0) (2026-10-29)

### Fitur

* **api:** add urlAset function for media path handling ([4d3015d](https://github.com/sendyputra/capstone_project_frontend/commit/4d3015d1368ff5821a851ecd087b84596339aeeb))
* **auth:** login tabs with demo accounts ([e191b3f](https://github.com/sendyputra/capstone_project_frontend/commit/e191b3f3b9a32396d76d2a12c909db9b4483f76e))
* form tambah unit mengirim fasilitas dan foto unit ([dd60a4d](https://github.com/sendyputra/capstone_project_frontend/commit/dd60a4d6f5a4d2a7ad82b800c5266d4842edc0a1))
* mutasi unit mengirim FormData berisi fasilitas dan foto ([2078296](https://github.com/sendyputra/capstone_project_frontend/commit/207829668b4fecd6195b24640c0b3f2b79dcc622))
* unit tanpa foto menampilkan placeholder ([ef9139a](https://github.com/sendyputra/capstone_project_frontend/commit/ef9139a7d959393369bb0e7b3605184b5302da36))

### Perbaikan

* **api:** follow Laravel pagination and tell 403 apart from 401 ([0b55026](https://github.com/sendyputra/capstone_project_frontend/commit/0b55026373584e6e84831b54d35ca6590f4f9809))
* **billing:** do not record a payment before the invoices load ([d263c90](https://github.com/sendyputra/capstone_project_frontend/commit/d263c90c19c2952b14873f2ba0932d4364867af7))
* **katalog:** request 50 units so the public catalog is not capped at ten ([ea5b2c0](https://github.com/sendyputra/capstone_project_frontend/commit/ea5b2c0197567420f2d0de31d274323433d65f38))
* muatanUnitDto tipe properti disempitkan ke enum backend ([7bddd4f](https://github.com/sendyputra/capstone_project_frontend/commit/7bddd4f8b659c628dafba0dcee20877fe896c40c))
* PUT sebagian tidak menimpa harga lama dan image string tidak terkirim ([99be204](https://github.com/sendyputra/capstone_project_frontend/commit/99be20438c12fb6a923af4f471c0b28a900a26ac))
* simpan ditahan saat foto ditolak dan fasilitas ganda utuh sampai mock ([39a5255](https://github.com/sendyputra/capstone_project_frontend/commit/39a52557059a2402692c9aa726a0daa00517b695))
* **ui:** semantic status colours, aligned action column, invoice order ([f4c0081](https://github.com/sendyputra/capstone_project_frontend/commit/f4c008173a7dac31c30b591ce06853481b49eba7))
* **units:** refuse a lease that runs into a booked day ([b6ecd71](https://github.com/sendyputra/capstone_project_frontend/commit/b6ecd719ea5aec915996ecbee66a9f1087de2da9))
* **units:** require the property type when adding a unit ([6445674](https://github.com/sendyputra/capstone_project_frontend/commit/64456740a82274b75ccb68896386a74c34823986))

### Pemeliharaan

* **hosting:** add security headers to Firebase Hosting ([32ffca6](https://github.com/sendyputra/capstone_project_frontend/commit/32ffca6e47b5e54b325ce0aafb13fffc403ffeb3))

### Pengujian

* **auth:** add tests for role selection in registration ([dcd7156](https://github.com/sendyputra/capstone_project_frontend/commit/dcd715623e471a9cb973bb399a5c64aef886eb26))
* multipart POST/PUT /units di mock menerima fasilitas dan foto ([59ba26b](https://github.com/sendyputra/capstone_project_frontend/commit/59ba26b872c4a48a160ebc2e37406b970a30f0b9))

## [0.2.0](https://github.com/sendyputra/capstone_project_frontend/compare/v0.1.0...v0.2.0) (2026-10-29)

### Fitur

* **contracts:** owner creates contracts for managed tenants ([73086f6](https://github.com/sendyputra/capstone_project_frontend/commit/73086f64fead285c213fe53dd62a3d77dd44bb26))
* **export:** apiDownload membaca nama berkas dari Content-Disposition ([bc6a4dd](https://github.com/sendyputra/capstone_project_frontend/commit/bc6a4dd17e514d81f725b477c4098f1a09df3236))
* **export:** handler MSW laporan tagihan dan kontrak ([185b09f](https://github.com/sendyputra/capstone_project_frontend/commit/185b09f11254abc5bffb8f2afb09e29db6bd68d4))
* **export:** layar kontrak pemilik memakai laporan server ([7b18202](https://github.com/sendyputra/capstone_project_frontend/commit/7b18202682d167541652a1a2a8a6cf13e8bf0450))
* **export:** layar pembayaran pemilik mengunduh laporan server ([859fa40](https://github.com/sendyputra/capstone_project_frontend/commit/859fa4060a94c40f3f12c7b42156a07a4d20a5b7))
* **export:** tombol unduh laporan tagihan penyewa ([cfcb7d4](https://github.com/sendyputra/capstone_project_frontend/commit/cfcb7d411d104c62fa43797b72b89c45d992f283))
* **notifications:** in-app reminder bell ([f4fd6ae](https://github.com/sendyputra/capstone_project_frontend/commit/f4fd6ae190d9188a4a26c2b228bdbab308531d69))
* **payments:** owner records manual payments ([0ae0002](https://github.com/sendyputra/capstone_project_frontend/commit/0ae0002b920cb15833d6ffd4ed90f709cc68e4b0))
* **tenants:** owner tenant management screen ([37efc48](https://github.com/sendyputra/capstone_project_frontend/commit/37efc480dd164a1a32823e31a2bc48a650db9e37))
* **units:** real month calendar and date blocking ([9970a06](https://github.com/sendyputra/capstone_project_frontend/commit/9970a068cb7a24eb4ad53ef27e3bf2892231c113))

### Perbaikan

* **api:** iso dates, nested rows, and mutation envelopes ([e1728f3](https://github.com/sendyputra/capstone_project_frontend/commit/e1728f340f94f9d31393d224b43caa54c1d308e1))
* **contracts:** keep calendar dates from shifting a month ([b5649cc](https://github.com/sendyputra/capstone_project_frontend/commit/b5649cc1e559de79f8f74c614daf8f55352f000f))
* **msw:** samakan laporan export dengan jawaban server ([58f651f](https://github.com/sendyputra/capstone_project_frontend/commit/58f651f14e34905084d4f3dc000b830e6b3596e0))
* **units:** include every status in the owner unit list ([27a7a41](https://github.com/sendyputra/capstone_project_frontend/commit/27a7a41d17a5d4b73f2616af0e247382651899a9))

### CI

* **deploy:** hanya deploy pada tag rilis ([2927dcd](https://github.com/sendyputra/capstone_project_frontend/commit/2927dcdb2af6f18f47b48ee095b27cfec029165f))
* **deploy:** pakai API asli di live dan preview ([208107e](https://github.com/sendyputra/capstone_project_frontend/commit/208107ea8f090f02f5822df56381f0eaa72094f5))
* hapus mode mock dari runtime ([30a0b79](https://github.com/sendyputra/capstone_project_frontend/commit/30a0b79b2d64f26b5798b332136057eedb127bc8))

## 0.1.0 (2026-10-23)

### Fitur

* **admin:** panel lintas pemilik untuk unit, kontrak, pembayaran, dan pengguna ([9b5a696](https://github.com/sendyputra/capstone_project_frontend/commit/9b5a6961562e82228d2007d5113a93252874bf35))
* **api:** adaptor auth dan unit, pisahkan katalog publik ([7f2c768](https://github.com/sendyputra/capstone_project_frontend/commit/7f2c7686e19294c6b1f809ce9c8d1bbbe23d3a8f))
* **api:** adaptor kontrak dan pembayaran ([d3ade59](https://github.com/sendyputra/capstone_project_frontend/commit/d3ade59cf302f9e38d07174d576cff16198a0388))
* **api:** dukung multipart, amplop respons, dan galat 422 ([917593c](https://github.com/sendyputra/capstone_project_frontend/commit/917593c6a6e5ef810e68b6b7c2fb92d534719a26))
* **api:** penyimpanan sesi, klien HTTP, kontrak tipe, dan batas mock MSW ([9d378c6](https://github.com/sendyputra/capstone_project_frontend/commit/9d378c6473bf654212b0fafda1c8048fdb15c346))
* **app:** beranda publik di / dan katalog penyewa bergerbang di /katalog ([49fca60](https://github.com/sendyputra/capstone_project_frontend/commit/49fca60714e3c0b763b4d25b98f7ffb988193c49))
* **app:** nav per peran, bilah pratinjau, dan aksi tamu ([cca3347](https://github.com/sendyputra/capstone_project_frontend/commit/cca3347547a6d9a030a95df19f79e8645b13dd98))
* **app:** router per peran, tata letak, tema, dan penjaga sesi ([9d15d49](https://github.com/sendyputra/capstone_project_frontend/commit/9d15d49beed375c60c060689ce717d76064b2ff0))
* **auth:** halaman daftar dengan OCR KTP dan layar bantuan ([a7cbc2a](https://github.com/sendyputra/capstone_project_frontend/commit/a7cbc2a71d1f07f9e91e35563cbbcd6aa05f4daa))
* **auth:** pemetaan peran, hook sesi, dan halaman masuk ([1b4fdb8](https://github.com/sendyputra/capstone_project_frontend/commit/1b4fdb801a5fc04edc12cb2fb6cf1fdddd5b9be0))
* **auth:** peran aplikasi menjadi penyewa dan pemilik ([cec5f5c](https://github.com/sendyputra/capstone_project_frontend/commit/cec5f5c3d0531c6570caad3ddca1834b5d74f9ca))
* **beranda:** buka hero dan katalog untuk pengunjung, ajukan sewa tetap perlu masuk ([e27061e](https://github.com/sendyputra/capstone_project_frontend/commit/e27061eefa13e98348475823de8dc6b1f953e8b5))
* **dashboard:** empat kartu angka pemilik dari daftar unit ([9eec337](https://github.com/sendyputra/capstone_project_frontend/commit/9eec33764dc3e4a85c2bade4ea4dda55e101902a))
* **dashboard:** tampilkan tunggakan dan kontrak akan habis ([7249ee8](https://github.com/sendyputra/capstone_project_frontend/commit/7249ee83eab22403a70ba6e2e76127cc5de64cb2))
* **data:** port data contoh purwarupa dan endpoint tiga peran ([0227eb7](https://github.com/sendyputra/capstone_project_frontend/commit/0227eb79405ddd747d756194c35ccdc690b56337))
* **gaya:** petakan token layar purwarupa dan salin gambar data contoh ([dbc6093](https://github.com/sendyputra/capstone_project_frontend/commit/dbc60936c4e95206aa5492f20e33a11b0f85fe47))
* **ktp:** OCR Tesseract.js di peramban dengan isian manual ([285ad14](https://github.com/sendyputra/capstone_project_frontend/commit/285ad14e331d646920ad966f0d8c439be73735c4))
* **ktp:** pendaftaran multipart dan kolom verifikasi pemilik ([d97e385](https://github.com/sendyputra/capstone_project_frontend/commit/d97e3857064682a8d65a22888128ee3d8c256d5f))
* **laporan:** unduh kontrak dan pembayaran sebagai CSV ([4c9f44f](https://github.com/sendyputra/capstone_project_frontend/commit/4c9f44f60fcdc742a9085502b32a71fab4242325))
* **ocr:** koreksi NIK dari provinsi dan tanggal lahir ([196285f](https://github.com/sendyputra/capstone_project_frontend/commit/196285f0a455f4574b8b2a7d5d3497af0a0b4b9a))
* **paritas:** kartu cari di dalam hero, kolom Verifikasi KTP, dan token selaras purwarupa ([0c9df55](https://github.com/sendyputra/capstone_project_frontend/commit/0c9df55e4652a327c9eed8e528320e1394791df0))
* **pemilik:** dashboard ber-KPI, kelola unit, dan pengajuan sewa ([fcbc59c](https://github.com/sendyputra/capstone_project_frontend/commit/fcbc59c03becf0c5515ae8f492984a7d7b76160f))
* **pemilik:** layar kontrak dan verifikasi pembayaran ([a7d9411](https://github.com/sendyputra/capstone_project_frontend/commit/a7d941132c8e13e7946c14f08e7e8298b7f49c08))
* **penyewa:** katalog dengan saringan, detail unit berkalender, dan tagihan ([a616654](https://github.com/sendyputra/capstone_project_frontend/commit/a616654aaf0cd3b4d2ee673bfc82629a70d54242))
* **sewa:** pengajuan memakai tanggal mulai dan durasi ([52bf957](https://github.com/sendyputra/capstone_project_frontend/commit/52bf95752cf99baa8a6cee3e7923fd2e090750ae))
* **tagihan:** turunkan bulan dari kontrak dan unggah multipart ([830ac87](https://github.com/sendyputra/capstone_project_frontend/commit/830ac876516dae90d2381d8ba723b95a4bd5d2fb))
* **ui:** keadaan memuat, kosong, galat, dan toast ([e418b58](https://github.com/sendyputra/capstone_project_frontend/commit/e418b5848264d7e411dd0498e625f6f39923a1e8))
* **ui:** status perawatan unit dan kontrak menunggu ([b0f23ae](https://github.com/sendyputra/capstone_project_frontend/commit/b0f23ae0315ccc08038163af296555dbb91b2ec2))
* **ui:** tambah dialog konfirmasi, tone peringatan, chip status, dan kartu KPI ([9cc74c1](https://github.com/sendyputra/capstone_project_frontend/commit/9cc74c15e4b14f361da0c59c347a4aed44c8185a))
* **units:** daftar unit dengan ubah status dan hapus berkonfirmasi ([b9b27af](https://github.com/sendyputra/capstone_project_frontend/commit/b9b27af33fd1f88c07689025cd8b5bcbaba0e306))
* **units:** halaman tambah unit dengan validasi dan jalur gagal ([c4aa7bb](https://github.com/sendyputra/capstone_project_frontend/commit/c4aa7bba04e66426d576aa3a5b3be0413350d49b))
* **units:** hook data unit di atas kontrak yang sama ([9bcede9](https://github.com/sendyputra/capstone_project_frontend/commit/9bcede954c8e0a8e2f09517e5a8b338720e8c849))

### Perbaikan

* **api:** /me juga menerima amplop user, PUT unit di mock, komentar peran jujur ([e50fed2](https://github.com/sendyputra/capstone_project_frontend/commit/e50fed201953046d63d9ff27bc7418657848ebdc))
* **api:** arahkan katalog ke route publik backend ([cbff135](https://github.com/sendyputra/capstone_project_frontend/commit/cbff135c0b6b2704f9aafd67c9a3040118c8dac7))
* **api:** cocokkan auth dengan backend asli ([1a112ac](https://github.com/sendyputra/capstone_project_frontend/commit/1a112ac8066b2cc8a70e5b3c5808cfdcbb3a0dd7))
* **app:** tangani sesi kedaluwarsa, isolasi data pemilik, dan umpan balik aksi ([399ce18](https://github.com/sendyputra/capstone_project_frontend/commit/399ce18b6182b1c033b9c8223535a169f2969396))
* **auth:** bersihkan acuan sesi saat keluar supaya pembacaan berikutnya null ([2b53b73](https://github.com/sendyputra/capstone_project_frontend/commit/2b53b73141007847e12ef9336e29436347f6bac2))
* **beranda:** hero mengikuti tangga display purwarupa, bukan skala heading ([7feec07](https://github.com/sendyputra/capstone_project_frontend/commit/7feec0743e66e51fe438913dd90ab99487a85d24))
* **beranda:** kartu cari memakai kendali dan ikon purwarupa ([7acdf34](https://github.com/sendyputra/capstone_project_frontend/commit/7acdf3411316e7605d3a13730edbb80cc692317f))
* **dashboard:** pisahkan unit perawatan dari unit terisi ([1658154](https://github.com/sendyputra/capstone_project_frontend/commit/165815462e5bf6650d38cbe82ff75d9173058f5c))
* **index:** judul tab memakai nama produk, bukan nama paket ([0e19be5](https://github.com/sendyputra/capstone_project_frontend/commit/0e19be57fd61fe2e27904c9812605c3f2b94eed8))
* **ktp:** baris penyewa saat daftar, ktp_status pada kontrak, isian multipart diuji ([bb15f6b](https://github.com/sendyputra/capstone_project_frontend/commit/bb15f6bce6f8fefa790193e1312a63bc927e11c6))
* **ktp:** fallback NIK digit-saja, isian manual awet, unggah ulang berkas ([33dc9ec](https://github.com/sendyputra/capstone_project_frontend/commit/33dc9ec0442a8176b5f300cffa478aa5031c1a91))
* **pemilik:** id unggahan, label bulan, urutan menunggu, jalur publik ([24a78c1](https://github.com/sendyputra/capstone_project_frontend/commit/24a78c11da06ef863b5f5021fdc3a9e4f88f7e90))
* **pengajuan:** tombol "Ajukan Sewa" tanpa ikon WhatsApp, toast sesuai purwarupa ([284479d](https://github.com/sendyputra/capstone_project_frontend/commit/284479da7338a6f70500e5beb11be399bcf5da60))
* **rute:** tangkap galat render dengan halaman ramah ([cdad81d](https://github.com/sendyputra/capstone_project_frontend/commit/cdad81dd9cb04f87e42adfd3530e32f1cab4f8ec))
* **rute:** tangkap jalur tak dikenal dan tampilkan galat unit yang tidak ada ([b776861](https://github.com/sendyputra/capstone_project_frontend/commit/b776861ee4373cbdc5f7819eaf84fde074068fec))
* **sewa:** tanggal mulai kosong ditolak dengan pesan ([d7a08aa](https://github.com/sendyputra/capstone_project_frontend/commit/d7a08aab5dcbc9656e046dc410f040d1f53a24e7))
* **tagihan:** baris pembayaran terbaru, tanggal WIB, dan bulan sewa konsisten ([4a3b3a6](https://github.com/sendyputra/capstone_project_frontend/commit/4a3b3a6e2578861d908e70b563f7035a46e5d12b))

### Refaktor

* **auth:** hapus bilah pratinjau peran ([d87e43a](https://github.com/sendyputra/capstone_project_frontend/commit/d87e43a2f374c13071fcbbe131a8bf5e223cb323))
* **peran:** hapus admin dan alur bookings, tambah rute pemilik ([4c3b36b](https://github.com/sendyputra/capstone_project_frontend/commit/4c3b36bc06707a33bee740a4fe509a0fb7b7685b))

### Dokumentasi

* peta layar penuh, kontrak API, dan gerbang check:tokens ([419ef6c](https://github.com/sendyputra/capstone_project_frontend/commit/419ef6c2978b24d9ab54cb2976923432b537e6bb))
* **plan:** rencana implementasi kerangka frontend dan potongan pertama ([81ae3ed](https://github.com/sendyputra/capstone_project_frontend/commit/81ae3ed6eda8b89db3323c58b959d7dc3a166e5a))
* **readme:** cara menjalankan mode mock, akun demo, dan asal token ([de6cd8c](https://github.com/sendyputra/capstone_project_frontend/commit/de6cd8c1944ecf6ead8adc0307c648a3cf370926))
* **spec:** desain kerangka frontend dan potongan pertama ([af05d40](https://github.com/sendyputra/capstone_project_frontend/commit/af05d409ab9dee21eeee7a562ff6dc4a104c99db))

### Pemeliharaan

* **.gitignore:** add .firebase to ignore list ([c93e6fe](https://github.com/sendyputra/capstone_project_frontend/commit/c93e6fecb7225c66868188d1322ad3b6217ca498))
* **git:** abaikan kunci layanan dan berkas rahasia ([c2cbeec](https://github.com/sendyputra/capstone_project_frontend/commit/c2cbeec6b6831dd68ee7728c6b99108ca34c3501))
* init ([8624487](https://github.com/sendyputra/capstone_project_frontend/commit/8624487abc5ba7f4b41588b86614919c889d2beb))

### Pengujian

* **api:** kunci metode PUT pada mutasi kontrak dan pembayaran ([bd8a602](https://github.com/sendyputra/capstone_project_frontend/commit/bd8a602d8810e5672bbf281fcac6c0471a300e0e))
* **api:** kunci pesan dan kind pada galat 422 ([88410ee](https://github.com/sendyputra/capstone_project_frontend/commit/88410ee1292f05443329f416bf9da697edb17a57))
* **app:** tutup celah TDD pada kerangka, perutean, dan notifikasi ([f7fe865](https://github.com/sendyputra/capstone_project_frontend/commit/f7fe86595b0ebe0fa080c6e9ffeebd2ce78cf715))
* **mock:** handler meniru DTO backend asli ([c1a167d](https://github.com/sendyputra/capstone_project_frontend/commit/c1a167dd5d166d2636601efd069caea88c8022d3))
* **mock:** lengkapi data contoh lima entitas ([869a3ee](https://github.com/sendyputra/capstone_project_frontend/commit/869a3ee361dd1a8cfeb748e9e049a49fb4ba2f2c))
* naikkan batas waktu suite dan batasi pekerja jsdom ([165a22b](https://github.com/sendyputra/capstone_project_frontend/commit/165a22b43539a2b2c7dca89d9df485fc90bdaf1a))
* **setup:** Vitest + RTL dan komponen dasar berbasis token ([95fb2be](https://github.com/sendyputra/capstone_project_frontend/commit/95fb2be5f48fdc3993a98b7fe8a8e015a877411c))

### CI

* deploy ke Firebase Hosting pada push ke main ([bc7d662](https://github.com/sendyputra/capstone_project_frontend/commit/bc7d6621439d71aff449351b81d242285562ef1e))
* deploy preview Firebase Hosting per pull request ([4989101](https://github.com/sendyputra/capstone_project_frontend/commit/49891018e4776b36796c885acb8df0d9d15d1c4d))
* **release:** tambah release-it dan workflow semantic release ([2ea5c79](https://github.com/sendyputra/capstone_project_frontend/commit/2ea5c79fbe787d792a0517b962da379b0b138b4c))
* remove push trigger for release workflow ([6436766](https://github.com/sendyputra/capstone_project_frontend/commit/643676657ffdfd80ada309f1fe415db8d87dfce6))
* update actions/checkout to v7 ([94ef5ff](https://github.com/sendyputra/capstone_project_frontend/commit/94ef5ffeb8ad53fd1a93268c7d503534157e02e0))

# Changelog

Semua perubahan penting dicatat di sini. Format mengikuti [Conventional Commits](https://www.conventionalcommits.org/).
