# คู่มือการติดตั้งและใช้งาน uBlock Origin Lite Enhanced (MV3)

**บล็อกโฆษณาเว็บไทย (037-hdd, 123-hdc, animegojos, hubserieshds) + Twitch อัตโนมัติ** สร้างจาก uBlock Origin Lite (MV3) source พร้อม Custom Scriptlets

---

## 🚀 เริ่มใช้งานง่ายๆ (30 วินาที)

### ทางที่ 1: Portable Installer — **ง่ายที่สุด ไม่ต้อง Build**

1. **ดาวน์โหลด** `INSTALL.bat` จาก [Releases](https://github.com/diedmanz/ublock-mv3-build/releases)
2. **ดับเบิลคลิก** `INSTALL.bat` → รอ 2–5 นาที (ดาวน์โหลด Chrome + Extension)
3. **Desktop จะมี shortcut:** "uBlock Origin Lite Enhanced"
4. **คลิกเปิด** → ครั้งแรกจะถาม **"Allow User Scripts"** → กด **Allow** (ครั้งเดียวตลอดชีพ)
5. **เสร็จแล้ว** เปิดเว็บสตรีมมิ่งไทย โฆษณาจะหายเอง

> **ติดตั้งที่:** `%LOCALAPPDATA%\uBOLite-Enhanced\` (Chrome แบบ portable + Extension + โปรไฟล์แยก) — **Chrome หลักของคุณไม่ถูกแตะ**

---

### ทางที่ 2: โหลดใน Chrome/Edge ปกติ

1. เปิด `chrome://extensions` (หรือ `edge://extensions`)
2. เปิด **Developer mode** (มุมขวาบน)
3. **Load unpacked** → เลือก: `%LOCALAPPDATA%\uBOLite-Enhanced\runtime\uBOLite_adhider`
   *(หรือโฟลเดอร์ `uBOLite_adhider` จาก repo นี้)*
4. ไอคอน Extension → **Dashboard** → **Settings** → **Backup** → **Restore** → เลือก `uBOL-config.json`
5. **Details** → เปิด **"Allow User Scripts"** (จำเป็น, ทำครั้งเดียว)

---

## สารบัญ
1. [ข้อกำหนดเบื้องต้น (Prerequisites)](#1-ข้อกำหนดเบื้องต้น-prerequisites)
2. [วิธีที่ 1: โหลดใช้งานทันที (ไม่ต้อง Build ใหม่)](#2-วิธีที่-1-โหลดใช้งานทันที-ไม่ต้อง-build-ใหม่)
3. [วิธีที่ 2: Build จาก Source บน Windows](#3-วิธีที่-2-build-จาก-source-บน-windows)
4. [การเปิดใช้งาน Custom Scriptlets](#4-การเปิดใช้งาน-custom-scriptlets)
5. [การรันเบราว์เซอร์แยกโพรไฟล์ (Isolated Profile)](#5-การรันเบราว์เซอร์แยกโพรไฟล์-isolated-profile)
6. [โครงสร้างไฟล์สำคัญในโปรเจกต์](#6-โครงสร้างไฟล์สำคัญในโปรเจกต์)
7. [ข้อควรระวังสำคัญ (Troubleshooting & Pitfalls)](#7-ข้อควรระวังสำคัญ-troubleshooting--pitfalls)

---

## 1. ข้อกำหนดเบื้องต้น (Prerequisites)

- **ระบบปฏิบัติการ:** Windows 10/11
- **เบราว์เซอร์:** Google Chrome, Brave, MS Edge หรือ Chromium ที่รองรับ Manifest V3
- **สำหรับ Build เอง (ถ้าต้องการ compile):**
  - Git for Windows (มี Git Bash)
  - Node.js 18+ (พร้อม `npm`)
  - Python 3.10+
  - แพ็กเกจเครื่องมือ Windows: `jq`, `cygpath` (มีใน Git Bash)

---

## 2. วิธีที่ 1: โหลดใช้งานทันที (ไม่ต้อง Build ใหม่)

กรณีมีโฟลเดอร์ build สำเร็จอยู่แล้วในเครื่อง (`uBOLite.chromium` หรือแตกไฟล์ zip ที่เตรียมไว้):

1. เปิดเบราว์เซอร์ (Chrome / Edge / Brave)
2. เข้าไปที่หน้าจัดการ Extensions:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
4. กดปุ่ม **Load unpacked** (โหลดส่วนขยายที่คลายการบีบอัด)
5. เลือกโฟลเดอร์ `uBOLite.chromium` (หรือ `uBOLite_vaft`)
6. ตรวจสอบว่ามีไอคอน uBlock Origin Lite แสดงขึ้นมาในแท็บ Extension

---

## 3. วิธีที่ 2: Build จาก Source บน Windows

> **จุดสำคัญมากบน Windows:** คำสั่ง `pwd` ใน Git Bash จะได้ `/tmp/...` แต่ `node` และ `jq` บน Windows อ่านเป็น `C:\tmp\...` ซึ่งจะทำให้ build สำเร็จแต่ได้ **0 DNR rules** โปรเจกต์นี้จึงมีสคริปต์แก้ไขแล้วคือ `src/make-mv3.windows-patched.sh`

### ขั้นตอนการรัน Build

1. เปิด **Git Bash** ในโฟลเดอร์โปรเจกต์:
   ```bash
   cd /e/ublock-mv3-build
   ```

2. ตรวจสอบ dependencies:
   ```bash
   node -v
   python --version
   ```

3. รันสคริปต์ build (มันจะ clone upstream uBlock เอง แล้ว build):
   ```bash
   bash build.sh
   ```
   ต้องมี `git`, `node`, `jq`, `patch`, `python` ใน PATH (บน Windows ใช้ Git Bash)

4. ตรวจสอบผลลัพธ์:
   - โฟลเดอร์ผลลัพธ์จะอยู่ที่ `uBOLite_adhider/` (หรือ path ที่สั่งเพิ่มเติม)
   - ไฟล์ `manifest.json` ภายในโฟลเดอร์ต้องมีรายการ `rule_resources` (ไม่ใช่ `[]`)

---

## 4. การเปิดใช้งาน Custom Scriptlets

### 4.1 อนุญาต Developer Mode / User Scripts
1. ไปที่ `chrome://extensions/`
2. หาการ์ด **uBlock Origin Lite**
3. กด **Details**
4. เปิดสวิตช์ **Allow access to file URLs** และ **Allow user scripts** (หากมี)

### 4.2 ใส่ Filter สำหรับ Twitch Video Ad (VAFT)
1. เปิดหน้าตั้งค่าของ uBOLite (คลิกไอคอนส่วนขยาย -> ฟันเฟือง Settings)
2. ไปที่แท็บ **Custom filters** (กฎที่กำหนดเอง)
3. เพิ่มบรรทัดนี้:
   ```text
   twitch.tv##+js(twitch-videoad)
   ```
4. กด **Save**

### 4.3 Scriptlets เพิ่มเติมที่มาพร้อมโปรเจกต์
- `src/custom-scriptlets/ad-hider.js`: ดักซ่อนกรอบโฆษณาในเว็บสตรีมมิ่ง
- `src/custom-scriptlets/ad-gate-skip.js`: ข้ามหน้า ad-gate / redirect countdown

---

## 5. การรันเบราว์เซอร์แยกโพรไฟล์ (Isolated Profile)

โปรเจกต์มีตัวช่วยเปิด Browser แยก Environment เพื่อความปลอดภัย (ไม่มี cookie/bookmark เดิมปนเปื้อน):

- ดับเบิลคลิกไฟล์:
  ```bat
  Start-Blocked-Browser.cmd
  ```
- ตัวสคริปต์จะเปิด Chrome พร้อมโพรไฟล์เฉพาะที่แยกออกมา และโหลด Extension uBOLite ให้อัตโนมัติ

---

## 6. โครงสร้างไฟล์สำคัญในโปรเจกต์

| ไฟล์ / โฟลเดอร์ | รายละเอียด |
|---|---|
| `INSTALL.th.md` | คู่มือภาษาไทยฉบับนี้ |
| `README.md` | บันทึกเชิงลึก (Deep Technical Notes) และผลการทดสอบ Windows Trap |
| `README-ADHIDER.md` | รายละเอียดการทำงานของ `ad-hider.js` และตัวอย่างการใช้งาน |
| `README-ISOLATED-BROWSER.md` | คู่มือการรัน Isolated Profile Browser |
| `TWITCH-VAFT-SETUP.md` | คู่มือเจาะลึกเฉพาะการแก้ Twitch Video Ad ด้วย VAFT scriptlet |
| `build.sh` | สคริปต์ build หลัก — clone upstream uBlock + ใส่ overlay ของโปรเจกต์ + build + ตรวจผลลัพธ์ |
| `src/make-mv3.windows-patched.sh` | สคริปต์ build ที่แก้ปัญหา path ของ MSYS/Windows (build.sh เอาไปวางแทน `tools/make-mv3.sh`) |
| `src/custom-scriptlets/` | แหล่งรวมโค้ด Scriptlet พิเศษที่ bundle เพิ่มเข้ามา |
| `src/patches/` | patches ที่ใช้กับต้นไม้ upstream และกับผลลัพธ์หลัง build |
| `Start-Blocked-Browser.cmd` | สคริปต์เปิดรันเบราว์เซอร์แยกโพรไฟล์บน Windows |
| `patch-rulesets.py` | ตัวช่วยปรับแต่ง DNR ruleset |

---

## 7. ข้อควรระวังสำคัญ (Troubleshooting & Pitfalls)

1. **โฆษณา Twitch หลุดรอด:**
   - Scriptlet กำหนดค่า `requiresTrust: true` ทำให้จะทำงานเฉพาะเมื่อใส่ผ่านกล่อง Custom Filters ของตัวเองเท่านั้น (ป้องกัน remote filter list สอดไส้โค้ดอันตราย)
2. **อย่าเผลออัปโหลดโฟลเดอร์ Profile:**
   - โฟลเดอร์ `profile-lite/`, `profile-backup-*/` ถูกตั้งค่าใน `.gitignore` ไว้แล้ว ห้ามลบกฎนี้เด็ดขาดเพราะมีข้อมูล session/cookie ส่วนบุคคล
3. **ข้อจำกัด MV3 บน Chromium:**
   - MV3 ใช้ระบบ Declarative Net Request (DNR) ไม่สามารถเขียน logic ดักจับแบบ dynamic webRequest เหมือน uBO ตัวเก่าได้ทั้งหมด แต่ชดเชยด้วย Scriptlet ใน `MAIN` world
