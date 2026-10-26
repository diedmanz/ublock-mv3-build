# เบราว์เซอร์กันโฆษณาแยก (uBlock Origin Lite Enhanced)

โปรไฟล์หลักของคุณ **ไม่ถูกแตะ** — ทุกอย่างนี้อยู่ในโปรไฟล์แยกที่ `E:\ublock-mv3-build\profile-lite\`

## เปิดใช้งาน

ดับเบิลค์บน Desktop: **"Chrome - Ad Block (uBOLite Enhanced)"**

เมื่อเปิด:
- โหลด extension ที่ enhance แล้วอัตโนมัติทุกครั้ง (ผ่าน `--load-extension`)
- เปิดโหมดกรองระดับ **complete** ให้อัตโนมัติ
- บล็อกโฆษณาทั้ง 2 เว็บไทย + scriptlet ของ Twitch ให้อัตโนมัติ

## สิ่งที่ตั้งไว้

| รายการ | ค่า |
|---|---|
| Filtering mode | `complete` → `all-urls` |
| Rulesets | ublock-filters, easylist, easyprivacy, pgl, ublock-badware, urlhaus-full, tha-0 |
| Custom filter `animegojos.com` | `#bt-ads #bt-ads-mini #bt-ads-mini2 #ads-rot img.banner .bannerrow #adst` |
| Custom filter `hubserieshds.com` | ชุดเดียวกัน |
| Sandbox filter | `twitch.tv##+js(twitch-videoad)` (TwitchAdSolutions v24) |

## ผลทดสอบ (cold start จริง)

```
animegojos.com    โฆษณา 10 ตัว → visible 0   | เนื้อหา 160 ลิงก์ ปกติ
hubserieshds.com  โฆษณา 25 ตัว → visible 0   | เนื้อหา 108 ลิงก์ ปกติ
twitch.tv         twitchAdSolutionsVersion = 24  (scriptlet ทำงาน)
```

## โครงสร้างไฟล์

```
E:\ublock-mv3-build\
├─ cft-chrome\              Chrome for Testing 156.0.8078.47 (รองรับ --load-extension)
├─ uBOLite_vaft\            extension ที่ enhance แล้ว (v2026.1021.638)
│  └─ js\resources\twitch-videoad.js   scriptlet TwitchAdSolutions ที่เพิ่มเข้าไป
├─ profile-lite\            โปรไฟล์แยก (Default) — ทุกค่าถูกเก็บที่นี่
├─ profile-backup-2026-10-21\   backup profile หลัก (Preferences/Secure Prefs/Local State)
├─ thai-streaming-filters.txt    filter ทั้ง 2 เว็บ (สำหรับกรณีต้อง import เอง)
└─ vaft.pinned.user.js           userscript ทางเลือก (ถ้าอยากใช้ Tampermonkey แทน)
```

## ถ้าอยากปิดเบราว์เซอร์นี้

ปิดหน้าต่าง Chrome ทั้งหมด (ไม่ต้อง kill process — กด X ปิด)

## ข้อควรระวัง

1. **ห้ามย้าย/ลบ `E:\ublock-mv3-build\uBOLite_vaft`** — extension โหลดจาก path นี้
2. **ห้ามย้าย/ลบ `E:\ublock-mv3-build\cft-chrome`** — เป็นตัว Chrome ที่ shortcut ชี้ไป
3. โปรไฟล์นี้แยกจาก Chrome ปกติ → **ไม่มี bookmark/password/sync ของคุณ** ใช้สำหรับดูเว็บที่ต้องกันโฆษณาเท่านั้น
4. Chrome for Testing ไม่อัปเดตเอง — เวลาจะอัปเดตให้โหลด zip ใหม่จาก
   `https://storage.googleapis.com/chrome-for-testing-public/` แล้วแทนที่โฟลเดอร์ `cft-chrome`
