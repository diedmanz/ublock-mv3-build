# เบราว์เซอร์กันโฆษณา (uBlock Origin Lite Enhanced + auto ad-hider)

เปิดด้วย: **Start-Blocked-Browser.cmd** (หรือดับเบิลค์ "Chrome - Ad Block (uBOLite Enhanced)" บน Desktop)

## ทำอะไรให้อัตโนมัติ

| รายการ | ค่า |
|---|---|
| Filtering mode | `complete` → ทุกเว็บ |
| Rulesets | ublock-filters, easylist, easyprivacy, pgl, ublock-badware, urlhaus-full |
| Filter เฉพาะเว็บ | animegojos.com + hubserieshds.com (7 selector แต่ละเว็บ) |
| Scriptlet (Twitch) | `twitch.tv##+js(twitch-videoad)` → TwitchAdSolutions v24 |
| Scriptlet (ทั่วไป) | `*##+js(ad-hider)` → ซ่อนโฆษณาอัตโนมัติทุกเว็บ |

## ad-hider ทำงานยังไง

ใช้ 3 สัญญาณ เรียงตามความมั่นใจ
1. `rel="sponsored"` (มาตรฐาน Google/FTC ของลิงก์โฆษณา) + `data-s="banner|adspool|mini"`
2. ชื่อ container ที่ชัดเจน: `bt-ads`, `ads-rot`, `bannerrow`, `ad-container`, `header-ads`, `widget-banner`, `adsbygoogle`, `dfp-ad` ...
3. ชื่อกว้าง ๆ (`ad`, `ads`, `advert`) → ซ่อนเฉพาะเมื่อ element ว่างจริง

เซฟตี้: ถ้า element มี h1-h6 / article / main / p / ul ยาวเกิน 3 / video / form → ไม่ซ่อน

ผลวัดจริง:
- animegojos.com → ซ่อน 13 ชิ้น, โฆษณาที่เหลือ 0/10
- hubserieshds.com → ซ่อน 32 ชิ้น, โฆษณาที่เหลือ 0/25
- ข่าวไทย / stackoverflow / วิกิพีเดีย / BBC ไทย → ซ่อน 0 ชิ้น (เนื้อหาไม่หาย)

## เพิ่ม filter lists (ครอบคลุมเว็บนับพัน)

Dashboard → แท็บ **Filter lists** → **Import filter lists** → วาง URL จากไฟล์ `filter-lists.txt` (ตรวจ HTTP 200 ครบ 16 ลิสต์แล้ว)

## ไฟล์ในโฟลเดอร์นี้

```
cft-chrome\            Chrome for Testing (รองรับ --load-extension; Chrome ปกติ 137+ ปิด flag นี้)
uBOLite_adhider\       extension build v2026.1021.837 (มี ad-hider.js + twitch-videoad.js)
uBOLite_vaft\          build รุ่นก่อน (v2026.1021.638) - ใช้กับ profile หลัก
profile-lite\          โปรไฟล์แยก (ค่าทั้งหมดอยู่ที่นี่)
uBOL-config.json       ไฟล์ config สำหรับ import เข้า profile อื่น
filter-lists.txt       URL ของ filter lists 16 ลิสต์
Start-Blocked-Browser.cmd  ตัวเปิดเบราว์เซอร์ (+ kick ให้ scriptlet register)
kick-userscripts.py    สคริปต์บังคับ register scriptlet (ทำงานอัตโนมัติจาก .cmd)
```

## ข้อควรระวัง

1. ห้ามย้าย/ลบ `uBOLite_adhider\` และ `cft-chrome\` (shortcut ชี้ไป)
2. ห้ามย้าย `profile-lite\` (เก็บค่า filter ไว้ข้างใน)
3. เบราว์เซอร์นี้เปิด debug port ที่ `127.0.0.1:9338` (เฉพาะเครื่องตัวเอง) เพื่อให้สคริปต์บังคับ register scriptlet ได้
4. Chrome for Testing ไม่อัปเดตเอง — ถ้าจะอัปเดตให้โหลด zip ใหม่จาก
   https://storage.googleapis.com/chrome-for-testing-public/ แล้วแทนที่โฟลเดอร์ `cft-chrome`
5. โปรไฟล์นี้แยกจาก Chrome ปกติ → ไม่มี bookmark/password/sync ของคุณ
