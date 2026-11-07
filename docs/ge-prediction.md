# ผลคาดการณ์ GE2026

หน้า `/ge-2026/prediction` อ่านข้อมูลล่าสุดจากฐานข้อมูลทุกครั้งที่เปิดหน้า (ไม่มี page cache) และแสดงอันดับ 1–36 โดยแต่ละส่วนมี 2 คอลัมน์ × 6 แถว แต่ละช่องแสดงอันดับ ชื่อเมมเบอร์ วง และคะแนนโหวต แบ่งเป็น Senbutsu 1–12, Under Girls 13–24 และ Next Girls 25–36 โดยไม่จัดอันดับยอดยังไม่ระบุ

## ตั้งค่าครั้งแรกบนเว็บ

รองรับฐานข้อมูลตามลำดับนี้:

1. PostgreSQL / Neon: ตั้ง `DATABASE_URL` หรือ `POSTGRES_URL` ใน environment ของเว็บ (ใช้ฐานเดียวกับ Song Match ได้) ระบบสร้างตาราง `ge2026_predictions` อัตโนมัติ บัญชีเชื่อมต่อต้องสร้างตารางได้ในครั้งแรก
2. Redis / Vercel KV: ถ้าไม่มี PostgreSQL จะใช้ `KV_REST_API_URL` และ `KV_REST_API_TOKEN` ที่มีอยู่แล้ว เก็บที่ key `ge2026:prediction:v1`
3. สำหรับพัฒนาในเครื่องที่ไม่มีฐานข้อมูล: เก็บใน `data/ge-prediction.json` (ไม่ commit) บน Vercel ต้องตั้งฐานข้อมูล

การติดตั้งโค้ดฟีเจอร์และตั้ง environment ต้อง deploy ครั้งแรก หลังจากนั้นอัปโหลดผลใหม่ผ่าน tools ได้โดยไม่ push/deploy อีก ข้อมูลจะไม่ย้ายข้ามฐานข้อมูลอัตโนมัติหากเปลี่ยน environment ให้ upload อีกครั้ง

ใช้ `TOOLS_TOKENS` เดิมสำหรับสิทธิ์อัปโหลด API อ่านข้อมูลสาธารณะได้ แต่ API เขียนต้องมี `x-tools-token` ที่ถูกต้อง

## Export จาก bnk48-ge4-repo

รันจาก bnk48-ge4-repo (Node.js 24+ และ Python dependencies):

```bash
npm run export:prediction
```

ได้ไฟล์ `.local/ge-prediction.json` ใน repo ต้นทาง นำไฟล์นี้ไปอัปโหลดใน `/tools` ได้โดยตรง
ใช้ผล GA seed 11 รวมโหวตล่าสุด แล้วแบ่งยอดยังไม่ระบุแบบ exponential decay
ไฟล์ CSV และ JSON สำหรับวิเคราะห์เพิ่มเติมอยู่ที่ `outputs/ge2026/prediction/`

ยังสามารถรันจาก easy-mickey ได้:

```bash
npm run export:ge-prediction -- --repo ../bnk48-ge4-repo
# หรืออ่านจากเว็บต้นทาง
npm run export:ge-prediction -- --url http://localhost:8000 --output .local/ge-prediction.json
```

กรณีรันจาก easy-mickey ไฟล์จะอยู่ที่ `.local/ge-prediction.json` ของ easy-mickey
ใช้ `SQLITE_DB` และ `PYTHON` เพื่อเปลี่ยนฐานข้อมูลหรือ interpreter ได้

ทั้งสองวิธีใช้ `prediction` จาก GA seed 11 + exponential decay เช่นเดียวกับผลทำนายใหม่บนหน้าแรก
เวลาอ้างอิงมาจาก `latest_timestamp` ของโหวต ไม่ใช่เวลากด export
คงคะแนน GA ของทุกเมมแล้วเพิ่มเฉพาะส่วนแบ่งโหวตที่ยังไม่ระบุ ไม่ใช้ manual weights ที่แก้ภายหลัง
ถ้าผลทำนายไม่พร้อมหรือยอดรวมไม่ตรงจะไม่สร้างไฟล์ใหม่
ไฟล์มีเฉพาะยอดรวมรายเมม ไม่มี wallet/ธุรกรรม ตัวอ่านยังรองรับไฟล์ `genetic_latest` เดิม

## อัปโหลดเพื่อเผยแพร่

1. เข้า `/tools` ด้วย token เดิม
2. ในส่วน “คาดการณ์คะแนนโหวต GE2026” เลือกไฟล์ JSON ที่ export
3. ตรวจตัวอย่างเวลา ยอดรวม และรายชื่อ แล้วกด “เผยแพร่ผลคาดการณ์”
4. เปิด `/ge-2026/prediction` หรือ refresh หน้าที่เปิดอยู่ เพื่อดูผลใหม่

ไฟล์ต้องมีขนาดไม่เกิน 256 KB ระบบตรวจวง ชื่อซ้ำ จำนวนสมาชิก เวลาพร้อมเขตเวลา และผลรวมของทุกเมม + ยังไม่ระบุให้เท่ากับยอดโหวตรวมก่อนบันทึก ใช้จำนวนทศนิยม 18 ตำแหน่งในการเรียงอันดับและตรวจยอด ยอดรวมแสดงทศนิยมสองตำแหน่ง ส่วนคะแนนรายเมมปิดหลักสิบ หลักหน่วย และทศนิยมเป็น `XX.XX` เช่น `12,345.67` แสดงเป็น `12,3XX.XX` เรียงรายชื่อลงคอลัมน์ซ้ายก่อนแล้วต่อคอลัมน์ขวา กรณีคะแนนเท่ากันเรียง slug ให้คงที่

## ตรวจสอบ

```bash
npm run test:ge-prediction
npx eslint app/page.tsx app/tools/page.tsx app/ge-2026/prediction app/api/ge-prediction components/PredictionResults.tsx components/PredictionUpload.tsx lib/ge-prediction*.ts scripts/export-ge-prediction.mjs tests/ge-prediction.test.mjs
npx tsc --noEmit
```
