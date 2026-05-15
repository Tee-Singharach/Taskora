# GEMINI.md

## Project Overview
Taskora เป็นโปรเจกต์เว็บแอปพลิเคชันที่พัฒนาด้วย Next.js (React 19) และ TypeScript โดยเน้นการจัดการงาน (Task Management) มีโครงสร้างโฟลเดอร์แบบ App Router และใช้ Tailwind CSS ในการจัดการสไตล์

## Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS
- **Code Quality:** ESLint

## Getting Started

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Development Conventions
- **Routing:** ใช้โครงสร้าง App Router ภายใต้โฟลเดอร์ `app/`
- **Components:** ไฟล์ UI component อยู่ใน `components/ui/` และ layout component อยู่ใน `components/layout/`
- **Data/Logic:** ข้อมูลจำลองและตัวแปรประเภท (Types) อยู่ในโฟลเดอร์ `lib/`
- **Style:** ใช้ Tailwind CSS (กำหนดค่าใน `postcss.config.mjs`)
- **Language:** ใช้ภาษาไทยในการตอบกลับสำหรับคำสั่งที่ส่งถึง AI Agent ตามการตั้งค่าส่วนบุคคล
