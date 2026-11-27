# แบบทดสอบ IQ ออนไลน์

เว็บแบบทดสอบเชาวน์ปัญญา 32 ข้อ (~30 นาที) เป็นไฟล์ static ล้วน ไม่ต้องมี server และไม่เก็บข้อมูลผู้ทำ

## โครงสร้างแบบทดสอบ

| หมวด | รูปแบบ (ตาม ICAR) | ข้อ | เวลา |
|---|---|---|---|
| เหตุผลเชิงภาพ | Matrix Reasoning — สร้างด้วยกฎแบบ Sandia Matrices | 12 | 12 นาที |
| อนุกรมตัวเลขและตัวอักษร | Letter–Number Series | 8 | 6 นาที |
| เหตุผลเชิงภาษา | Verbal Reasoning (ภาษาไทย) | 6 | 5 นาที |
| มิติสัมพันธ์ 3 มิติ | 3D Rotation (รูปคลี่ → ลูกบาศก์) | 6 | 7 นาที |

ข้อสอบทุกข้อเป็นข้อที่ออกใหม่ตามรูปแบบของ ICAR ไม่ได้คัดลอกข้อสอบต้นฉบับ

## วิธีคิดคะแนน

- IRT แบบ 3PL: `P = c + (1−c) / (1 + e^(−1.7·a·(θ−b)))` โดย `c = 1/จำนวนตัวเลือก`
- ประมาณ θ ด้วย EAP (prior N(0,1)) → `IQ = 100 + 15θ` พร้อมช่วงความเชื่อมั่น 90% (±1.645·SE)
- ค่า `b` (ความยาก) ของข้อ matrix ตั้งตามจำนวนกฎ (Matzen et al., 2010) ส่วนหมวดอื่นตั้งตามการออกแบบ

**ข้อจำกัด:** พารามิเตอร์ยังไม่ได้ปรับเทียบ (calibrate) กับกลุ่มตัวอย่างจริง ผลจึงเป็น "IQ โดยประมาณ" และไม่ใช่การวินิจฉัยทางคลินิก
ถ้าจะทำให้แม่นขึ้น ให้เก็บคำตอบจากผู้ทำจริงหลายร้อยคน แล้วประมาณค่า a, b ใหม่ด้วย IRT (เช่น R package `mirt`) จากนั้นแก้ค่าใน `js/items.js`

## การรันและตรวจสอบ

```bash
cd iq-test
python3 -m http.server 8000         # เปิด http://localhost:8000
node tools/validate.mjs             # ตรวจว่าทุกข้อมีคำตอบถูกเพียงข้อเดียว
```

`validate.mjs` ตรวจข้อ matrix ว่ามีตัวเลือกที่ตรงตามกฎเพียงตัวเดียว และตรวจข้อลูกบาศก์ด้วยการไล่การหมุนทั้ง 24 แบบ ว่ามีตัวเลือกที่พับได้จริงเพียงตัวเดียว

## เผยแพร่

เปิด GitHub Pages ของ repo (Settings → Pages → Deploy from branch) แล้วเข้าที่ `/iq-test/`

## เอกสารอ้างอิง

1. Condon, D. M., & Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. *Intelligence, 43*, 52–64.
2. Condon, D. M., & Revelle, W. (2016). Selected ICAR data from the SAPA-Project. *Journal of Open Psychology Data, 4*(1).
3. Matzen, L. E., et al. (2010). Recreating Raven's: Software for systematically generating large numbers of Raven-like matrix problems with normed properties. *Behavior Research Methods, 42*(2), 525–541.
4. Embretson, S. E., & Reise, S. P. (2000). *Item Response Theory for Psychologists*. Lawrence Erlbaum.
