# uBlock Origin Lite Enhanced — ติดตั้งง่ายๆ (Portable)

> **สำหรับคนที่ไม่อยากงอ:** ดาวน์โหลด → รันไฟล์เดียว → ใช้ได้เลย

---

## 📥 วิธีติดตั้ง (3 ขั้นตอน)

### 1. ดาวน์โหลด
- ไปที่ **Releases** ของ repository นี้ → ดาวน์โหลด `INSTALL.bat` (ไฟล์เดียว ~1 KB)
- หรือ clone repo แล้วหาไฟล์ `INSTALL.bat` ในโฟลเดอร์

### 2. รัน
- **ดับเบิลคลิก `INSTALL.bat`** → รอ 2-5 นาที (ดาวน์โหลด Chrome + build extension)
- ถ้าต้องการ build เอง: ติดตั้งก่อน **Node.js (LTS)** + **Python 3.11+** + **jq** (`choco install jq`)

### 3. ใช้
- บน Desktop จะมี shortcut **"uBlock Origin Lite Enhanced"**
- คลิกเปิด → ใช้เว็บได้เลย (โฆษณาหายอัตโนมัติ)

---

## 🎯 ทำอะไรได้บ้าง

| เว็บ | ผลลัพธ์ |
|---|---|
| **037-hdd.com** (หน้าแรก + หน้าดูหนัง) | โฆษณาบนเนอร์ + โฆษณา roll-in หาย |
| **123-hdc.com** (หน้าดูหนัง) | แบนเนอร์ 12 อันหาย |
| **animegojos.com / hubserieshds.com** | โฆษณาหาย 100% |
| **Twitch** | โฆษณาวิดีโอหาย (TwitchAdSolutions v24) |
| **เว็บข่าว / วิกิพีเดีย / Stack Overflow** | **ไม่มีอะไรหาย** (ปลอดภัย) |

---

## ⚙️ ตัวเลือกการใช้งาน

### ทางที่ 1: Portable Browser (แนะนำ) — **แยกจาก Chrome หลัก**
- ใช้โปรไฟล์แยก (`%LOCALAPPDATA%\uBOLite-Enhanced\profile`)
- ไม่ปน bookmark/password/sync ของ Chrome หลัก
- shortcut ที่สร้าง: **"uBlock Origin Lite Enhanced"**

### ทางที่ 2: ติดตั้งใน Chrome/Edge ปกติ
1. `chrome://extensions` → เปิด **โหมดนักพัฒนา** (Developer mode)
2. **โหลดส่วนขยายที่ยกเลิกแพ็ก** (Load unpacked) → ชี้ไปที่:
   `%LOCALAPPDATA%\uBOLite-Enhanced\runtime\uBOLite_adhider`
3. ตัว extension → **Dashboard → Settings → Backup → Restore** → เลือก `uBOL-config.json`
4. **Details → เปิด "Allow User Scripts"** (ครั้งแรกเท่านั้น)

---

## 🔧 ถ้าอยาก build เอง (optional)

```bash
# ติดตั้งเครื่องมือ (Windows + Chocolatey)
choco install nodejs-lts python jq git -y

# clone + build
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
bash tools/make-mv3.sh chromium
# ผลลัพธ์อยู่ที่ dist/build/uBOLite.chromium/
```

> **หมายเหตุ:** Build ต้องใช้ Linux shell (Git Bash / WSL) — PowerShell/CMD ไม่ได้

---

## 📁 โครงสร้างหลังติดตั้ง

```
%LOCALAPPDATA%\uBOLite-Enhanced\
├── Start-uBOLite-Enhanced.cmd    # ไฟล์เปิดเบราว์เซอร์
├── Compute-ExtensionId.ps1       # คำนวณ extension ID
├── uBOL-config.json              # การตั้งค่า (filter + scriptlet)
├── filter-lists.txt              # 16 filter lists สำหรับ import
├── README-PORTABLE.md            # ไฟล์นี้
├── cft-chrome\                   # Chrome for Testing (portable)
├── runtime\uBOLite_adhider\      # Extension ที่ build แล้ว
└── profile\                      # โปรไฟล์แยก (สร้างอัตโนมัติ)
```

---

## ❓ FAQ

**Q: ทำไมต้อง "Allow User Scripts"?**
A: Chrome MV3 บังคับ — scriptlet (ad-hider, twitch-videoad, ad-gate-skip) ต้องการสิทธิ์ `userScripts` ซึ่ง extension ต้องขออนุญาตผู้ใช้ 1 ครั้ง

**Q: Extension ID เปลี่ยนไหม?**
A: ID คำนวณจาก **path แบบ absolute** (SHA-256 UTF-16LE) — ย้ายโฟลเดอร์ ID จะเปลี่ยน → launcher คำนวณใหม่ให้อัตโนมัติทุกครั้งที่เปิด

**Q: อัปเดตยังไง?**
A: รัน `INSTALL.bat` ใหม่ (จะอัปเดต extension + Chrome ให้อัตโนมัติ) หรือลบโฟลเดอร์ `%LOCALAPPDATA%\uBOLite-Enhanced` แล้วรันใหม่

**Q: ใช้ใน Edge ได้ไหม?**
A: ได้ — ทางที่ 2 (Load unpacked) ใช้ใน Edge เหมือน Chrome

**Q: โฆษณา roll-in บน 037-hdd ยังมีอยู่?**
A: ระบบ adgate ของ player ต้องการให้โฆษณา "จบ" ก่อนถึงเล่นหนัง perth scriptlet `ad-gate-skip.js` พยายาม auto-skip — ถ้ายังค้าง ให้กดปุ่ม **"ข้ามโฆษณา"** 1 ครั้ง (อยู่มุมวิดีโอ)

---

## 📞 ติดต่อ / รายงานบั๊ก
- เปิด **Issue** บน GitHub repository นี้
- หรือแจ้งผ่านช่องทางที่คุ้นเคย

---

*Built with uBlock Origin Lite (MV3) + custom scriptlets for Thai streaming sites*