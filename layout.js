import "./globals.css";

export const metadata = {
  title: "مِداد | MIDAD",
  description: "منصة الابتكار الجامعي - من المشكلات إلى الحلول"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
