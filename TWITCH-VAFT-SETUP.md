# TwitchAdSolutions (vaft) — Chrome / Edge 2026

## TL;DR

**Tampermonkey ใช้ได้จริง** และผมทดสอบ end-to-end แล้ว: ติดตั้ง → เปิด Allow User Scripts → เปิด twitch.tv → vaft ทำงาน

แต่มี **กับดักเงียบ (silent failure)** ที่ต้องรู้: ถ้าไม่เปิดสวิตช์ "Allow User Scripts" ตัว extension จะ**โหลดปกติ เปิด dashboard ได้ เห็น script อยู่** แต่ `chrome.userScripts` เป็น `undefined` → **ไม่มีอะไรรัน และไม่ขึ้น error ให้เห็น**

---

## ไฟล์ที่ได้

| ไฟล์ | คืออะไร |
|---|---|
| `vaft.pinned.user.js` | userscript เวอร์ชัน **pin** ที่ commit `f8f8670` (อัปเดตไม่ลอย ไม่พังเมื่อ repo ปิด) — โค้ด upstream ไม่แก้แม้แต่บรรทัดเดียว |
| `uBOLite_vaft_chromium.zip` | ทางเลือกอีกแบบ: uBOL + vaft เป็น scriptlet (ไม่ต้องติดตั้ง userscript manager) |
| `ubo-mv3.zip` | full uBO บน MV3 — ถ้าอยากใช้สูตรเดิม `userResourcesLocation` |

---

## วิธีติดตั้ง (Chrome / Edge 138+)

### 1. ติดตั้ง Tampermonkey
- Chrome Web Store: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (v5.5.1, MV3, มี permission `userScripts`)
- หรือ [Violentmonkey](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalddemonaeonnheblbohcnkeg) (v2.49.0) — รองรับ `@inject-into page` ดีกว่าในบางกรณี

### 2. เปิด "Allow User Scripts" ← *ขั้นตอนที่คนลืม*

```
chrome://extensions/?id=dhdgffkkebhmkfjojejmpbldmpobfkfo
```
(หรือคลิกขวาที่ไอคอน Tampermonkey → Manage Extension)

เปิดสวิตช์ **"Allow User Scripts"**

> ⚠️ Chrome ก่อน 138 ใช้สวิตช์ **Developer Mode** แทน (ที่ `chrome://extensions` มุมขวาบน)
> ⚠️ เปิดแล้วต้อง **reload extension** หนึ่งครั้ง

### 3. ติดตั้ง script
- วิธีที่แนะนำ: เปิดไฟล์ `vaft.pinned.user.js` ในเบราว์เซอร์ → Tampermonkey จะเด้งหน้าติดตั้ง → กด **Install**
- หรือวางไฟล์ไว้ที่ URL ที่ทีมเข้าถึงแล้วใช้ URL นั้นเป็น `@downloadURL`

### 4. ตรวจว่าทำงาน
เปิด `https://www.twitch.tv/` แล้วพิมพ์ใน console:

```js
window.twitchAdSolutionsVersion   // ต้องได้ 24
typeof window.allSegmentsAreAdSegments  // ต้องได้ 'function'
```

ถ้าได้ `undefined` → ยังไม่ได้เปิด "Allow User Scripts" (ดูข้อ 2)

---

## ⚠️ ข้อควรรู้

**1. โครงการ upstream ถูก archive เมื่อ 2026-03-05**
`pixeltris/TwitchAdSolutions` ไม่มีการอัปเดตอีกแล้ว ไฟล์ที่ผมแพ็กจึง pin ที่ commit `f8f86706daf90daa534b26bce5b2f01238667d5f` — ยืนยันแล้วว่า URL นี้ยังใช้ได้ (HTTP 200, body เหมือน master เป๊ะ) และไม่มีวันพังกลางคัน

**2. วิธี uBO มีปัญหาที่ upstream เตือนเอง**
README upstream เขียนว่าวิธี `userResourcesLocation` *"may randomly stop being applied by uBlock Origin for unknown reasons (#200)"* และแนะนำให้ใช้ userscript แทน — นี่คือเหตุผลที่ผมเสนอ userscript เป็นทางหลัก

**3. อย่าใช้ทั้ง 2 ทางพร้อมกัน**
vaft มี guard ตัวเอง (`ourTwitchAdSolutionsVersion`) ถ้าทั้ง uBOL scriptlet และ Tampermonkey รันพร้อมกัน ตัวหนึ่งจะข้าม ซึ่งไม่อันตรายแต่จะสับสนตอน debug — เลือกทางเดียว

**4. สำหรับการแจกจ่ายในโรงพยาบาล**
"Allow User Scripts" เป็นการอนุญาตให้ extension รัน JS แบบอิสระในทุกเว็บ — ถ้าให้ผู้ใช้ทั้งแผนก ควร:
- จำกัด `@match` ให้เฉพาะ `*://*.twitch.tv/*` (ไฟล์ที่ผมแพ็กทำแล้ว)
- อธิบายผู้ใช้เรื่องสวิตช์นี้
- พิจารณาใช้ `ExtensionSettings` / `ExtensionSettings` ผ่าน GPO คุมการติดตั้ง extension

---

## ผลการทดสอบ (Chrome for Testing 156, profile แยก)

```
1. ติดตั้ง Tampermonkey 5.5.1 (MV3)         -> โหลดผ่าน, เห็นใน chrome://extensions
2. เปิด "Allow User Scripts"                 -> chrome.userScripts.getScripts() สำเร็จ
3. ติดตั้ง vaft.user.js จาก master          -> ask.html เปิด, กด Install, enabled=true
4. เปิด https://www.twitch.tv/               -> twitchAdSolutionsVersion = 24
                                                allSegmentsAreAdSegments = function
5. ติดตั้ง vaft.pinned.user.js (ไฟล์ pin)    -> enabled=true, downloadURL = permalink
6. เปิด https://www.twitch.tv/ อีกครั้ง      -> twitchAdSolutionsVersion = 24  ✅
```

---

## ทางเลือกอื่นในโฟลเดอร์นี้

| ต้องการ | ใช้อันไหน |
|---|---|
| ไม่อยากติดตั้ง userscript manager | `uBOLite_vaft_chromium.zip` — vaft เป็น scriptlet ใน uBOL (เปิด Allow User Scripts ของ uBOL แทน) |
| อยากได้ dynamic filtering + uBO เต็ม | `ubo-mv3.zip` — ใช้สูตร `userResourcesLocation` เดิม แต่ต้อง policy install บนเครื่อง managed |
| แค่อยากบล็อกโฆษณา | uBOL รุ่นทางการ + เปิด Allow User Scripts ไม่ต้องมี script เพิ่ม |
