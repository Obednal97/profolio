import Link from "next/link";
import { ShieldCheck, FileText, Cookie, EyeOff, BookOpen, AlertCircle } from "lucide-react";

export default function PolicyHubPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">Fanvue Policies</h1>
        <p className="text-muted-foreground">Important information about how we operate</p>
        <p>Welcome to Fanvue’s Policy Hub. Here you’ll find all our policies and guidelines that help ensure a safe, transparent, and compliant platform for our community.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Most viewed policies:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <PolicyCard icon={<FileText />} title="General Terms Of Service" href="/policy-hub/terms" />
          <PolicyCard icon={<EyeOff />} title="Acceptable Use Policy" href="/policy-hub/aup" />
          <PolicyCard icon={<BookOpen />} title="Community Guidelines" href="/policy-hub/community-guidelines" />
          <PolicyCard icon={<ShieldCheck />} title="Privacy Policy" href="/policy-hub/privacy" />
          <PolicyCard icon={<Cookie />} title="Cookie Policy" href="/policy-hub/cookies" />
          <PolicyCard icon={<AlertCircle />} title="Complaints Policy" href="/policy-hub/complaints" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Need Help?</h3>
        <p className="text-muted-foreground">You can always reach out to our support team for clarification or assistance.</p>
      </section>
    </div>
  );
}

function PolicyCard({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <Link href={href} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors flex items-center space-x-4">
      <div className="text-green-500">{icon}</div>
      <span className="text-foreground font-medium">{title}</span>
    </Link>
  );
}
