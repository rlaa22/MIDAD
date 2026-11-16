# مِداد | MIDAD — منصة الابتكار الجامعي

مشروع Full-stack يتكون من واجهة Next.js وواجهة API باستخدام FastAPI وقاعدة PostgreSQL.

## النشر على الإنترنت (نسخة تجريبية)

### 1) قاعدة البيانات — Supabase
1. أنشئي مشروعًا جديدًا في Supabase.
2. من إعدادات قاعدة البيانات انسخي **Connection string** بصيغة URI.
3. استخدمي عنوان الاتصال المباشر أو pooled connection المناسب لتطبيق Python، وتأكدي من تضمين كلمة المرور. لا تضعيه في GitHub.

### 2) نشر الـ Backend على Render
1. ارفعي مجلد المشروع إلى مستودع GitHub خاص أو عام.
2. في Render اختاري **New → Blueprint** ثم اربطي المستودع.
3. سيقرأ Render ملف `render.yaml` ويُنشئ خدمة API.
4. في إعدادات الخدمة أضيفي `DATABASE_URL` بقيمة اتصال Supabase.
5. بعد النشر انسخي رابط الخدمة، مثل `https://midad-api.onrender.com`.
6. اختبري `https://YOUR-API.onrender.com/health` ويجب أن يظهر `{"ok":true}`.

### 3) نشر الواجهة على Vercel
1. في Vercel اختاري **Add New → Project** ثم Import لمستودع GitHub.
2. اختاري مجلد المشروع الرئيسي `.` كـ Root Directory، وسيكتشف Next.js تلقائيًا.
3. أضيفي Environment Variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: رابط Render الذي نسختِه، دون `/` في النهاية.
4. اضغطي Deploy وانتظري اكتمال البناء لتحصلي على رابط `*.vercel.app`.

### 4) السماح للواجهة بالاتصال بالـ API
1. ارجعي إلى Render → خدمة `midad-api` → Environment.
2. اجعلي `CORS_ORIGINS` يساوي رابط Vercel النهائي، مثل `https://midad.vercel.app`.
3. احفظي التغيير وانتظري إعادة النشر.
4. جرّبي التسجيل والدخول وإضافة مشكلة والتصويت.

## تشغيل محليًا

### قاعدة البيانات
من جذر المشروع:
```bash
docker compose up -d
```

### Backend — Windows PowerShell
```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```
توثيق API: http://127.0.0.1:8000/docs

### Frontend — Terminal آخر من جذر المشروع
```powershell
npm install
copy .env.example .env.local
npm run dev
```
الموقع: http://localhost:3000

## نقاط API المتصلة
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /students/me/skills`
- `PUT /students/me/skills`
- `GET /problems`
- `POST /problems`
- `POST /problems/{id}/vote`
- `GET /problems/{id}/matches`

## تنبيهات مهمة
- هذه نسخة MVP تجريبية وليست جاهزة بعد للاستخدام الإنتاجي واسع النطاق.
- لا ترفعي ملفات `.env` أو كلمات المرور أو مفاتيح الاتصال إلى GitHub.
- Render Free يوقف خدمة الويب بعد فترة خمول وقد يتأخر أول طلب عند إعادة التشغيل. وقاعدة Render Postgres المجانية تنتهي بعد 30 يومًا؛ لذلك توصي هذه الحزمة باستخدام قاعدة خارجية مستقلة مثل Supabase بدل الاعتماد على قاعدة Render المجانية. راجعي قيود الخطط قبل استقبال بيانات حقيقية.
- استخدمي كلمة مرور قوية واحتفظي بنسخة احتياطية من قاعدة البيانات.
- لا تزال إدارة الفرق وطلبات الانضمام والإشعارات والمطابقة الذكية الكاملة خارج نطاق النسخة الحالية.
