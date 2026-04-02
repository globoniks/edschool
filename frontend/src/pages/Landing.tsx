import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Calendar,
  DollarSign,
  FileText,
  BookOpen,
  Bell,
  ArrowRight,
  School,
  UserSquare,
  CheckCircle,
  Shield,
} from 'lucide-react';

const quickAccess = [
  {
    icon: 'school',
    title: 'Admissions',
    desc: 'Enrollment & criteria',
    accent: 'border-blue-900',
  },
  {
    icon: 'person_book',
    title: 'Student Portal',
    desc: 'Results & Schedule',
    accent: 'border-slate-300',
  },
  {
    icon: 'family_restroom',
    title: 'Parent Portal',
    desc: 'Fee payment & updates',
    accent: 'border-green-400',
  },
  {
    icon: 'campaign',
    title: 'Notices',
    desc: 'Recent announcements',
    accent: 'border-red-300',
  },
];

const newsCards = [
  {
    tag: 'Academics',
    tagColor: 'bg-blue-900/80',
    date: 'March 14, 2025',
    title: 'New STEAM Lab Inaugurated for Junior High',
    desc: 'The state-of-the-art laboratory features 3D printers and robotics kits to foster innovation among students.',
    imgSrc: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  },
  {
    tag: 'Campus Life',
    tagColor: 'bg-slate-700/80',
    date: 'March 10, 2025',
    title: 'Highlights from the Annual Cultural Fest 2025',
    desc: 'Relive the magic of our three-day celebration featuring music, dance, and international cuisine.',
    imgSrc: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  },
  {
    tag: 'Sports',
    tagColor: 'bg-red-700/80',
    date: 'March 5, 2025',
    title: 'EdSchool Warriors Win Regional Basketball Finals',
    desc: 'Our boys\' team displayed incredible grit to secure the championship trophy in a nail-biting finish.',
    imgSrc: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
  },
];

const features = [
  { icon: Users, title: 'Student Management', description: 'Comprehensive student profiles, admission tracking, and class assignments.' },
  { icon: GraduationCap, title: 'Teacher Management', description: 'Staff profiles, qualifications, and subject assignments.' },
  { icon: Calendar, title: 'Attendance Tracking', description: 'Daily attendance marking with detailed reports and analytics.' },
  { icon: DollarSign, title: 'Fee Management', description: 'Flexible fee structures, payment tracking, and receipt generation.' },
  { icon: FileText, title: 'Exams & Marks', description: 'Exam scheduling, marks entry, and automated report card generation.' },
  { icon: BookOpen, title: 'Homework & Assignments', description: 'Create assignments, track submissions, and evaluate student work.' },
  { icon: Bell, title: 'Communication', description: 'School-wide announcements and direct messaging between parents and teachers.' },
  { icon: Shield, title: 'Role-Based Access', description: 'Secure access control for Admin, Teacher, Parent, and Student roles.' },
];

const benefits = [
  'Multi-tenant SaaS architecture for multiple schools',
  'Role-based access control (Admin, Teacher, Parent, Student)',
  'Real-time data synchronization',
  'Secure and scalable infrastructure',
  'Mobile-responsive PWA design',
  'Comprehensive reporting and analytics',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-body">

      {/* ── Sticky Nav ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl shadow-sm shadow-blue-900/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-blue-900 font-headline tracking-tight">EdSchool</span>
          </div>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {['Home', 'Admissions', 'Campus', 'About'].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`font-semibold text-sm tracking-tight transition-colors ${i === 0 ? 'text-blue-900 border-b-2 border-blue-900 pb-0.5' : 'text-slate-500 hover:text-blue-700'}`}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Announcements Ticker ─────────────────────────────────── */}
      <div className="bg-blue-900 text-blue-100 py-2 overflow-hidden whitespace-nowrap">
        <span className="animate-marquee text-sm font-semibold italic px-4">
          Admissions for Academic Year 2025-2026 are now open! &nbsp;•&nbsp; Annual Sports Meet scheduled for next Friday &nbsp;•&nbsp; New Digital Library access for all students &nbsp;•&nbsp; Parent-Teacher conference links sent via email &nbsp;•&nbsp;
        </span>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="px-4 md:px-8 pt-8 pb-14">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden min-h-[420px] md:min-h-[480px] flex items-center" style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}>
            {/* Background image */}
            <div className="absolute inset-0 opacity-30">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80"
                alt="School campus"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/80 to-transparent" />
            {/* Content */}
            <div className="relative z-10 px-8 md:px-16 max-w-2xl">
              <h1 className="text-white font-headline text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Welcome to <span className="text-green-300">EdSchool</span> Management
              </h1>
              <p className="text-blue-200 text-lg mb-8 max-w-lg">
                Empowering schools through excellence in academics, administration, and innovative digital management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-green-300 text-blue-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-center"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-center backdrop-blur-sm"
                >
                  Student / Parent Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Access Bento Grid ──────────────────────────────── */}
      <section className="px-4 md:px-8 mb-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold mb-8 text-blue-900">Quick Access</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {quickAccess.map((card) => (
              <Link
                key={card.title}
                to="/login"
                className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer border-b-4 ${card.accent} block`}
              >
                <span className="material-symbols-outlined text-blue-900 text-4xl mb-4 block group-hover:scale-110 transition-transform">
                  {card.icon}
                </span>
                <h4 className="font-bold text-blue-900 mb-1">{card.title}</h4>
                <p className="text-xs text-slate-500">{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── News & Events ────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline text-2xl font-bold text-blue-900">Latest News</h2>
            <p className="text-slate-500 text-sm">Stay updated with life at EdSchool</p>
          </div>
          <button className="text-blue-900 font-bold text-sm flex items-center gap-1 hover:underline">
            See All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex overflow-x-auto gap-6 px-4 md:px-8 pb-6 no-scrollbar scroll-smooth">
          {newsCards.map((card) => (
            <div
              key={card.title}
              className="flex-none w-72 md:w-96 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
            >
              <div className="h-48 relative">
                <img src={card.imgSrc} alt={card.title} className="w-full h-full object-cover" />
                <div className={`absolute top-4 left-4 ${card.tagColor} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md`}>
                  {card.tag}
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-400 text-xs font-semibold mb-2">{card.date}</p>
                <h3 className="font-headline font-bold text-lg mb-3 leading-snug text-blue-900">{card.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl font-bold text-blue-900 mb-3">Powerful Features</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Everything you need to manage your school efficiently</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-headline font-bold text-blue-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Benefits Section ─────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl font-bold text-blue-900 mb-4">Why Choose EdSchool?</h2>
              <p className="text-slate-500 text-lg mb-8">
                Built with modern technology to provide a seamless experience for administrators, teachers, parents, and students.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              {[
                { Icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with regular backups' },
                { Icon: Users, title: 'Multi-Role Support', desc: 'Designed for all stakeholders in education' },
                { Icon: School, title: 'Always Available', desc: 'Access your data anytime, anywhere as a PWA' },
                { Icon: UserSquare, title: 'Parent-Friendly', desc: 'Real-time updates and communication tools' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">{title}</h3>
                    <p className="text-slate-500 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-headline text-3xl font-bold text-white mb-4">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Join schools already using EdSchool to streamline their operations and improve communication.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-green-300 text-blue-900 font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-transform shadow-xl"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)' }}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-white font-bold text-lg font-headline">EdSchool</span>
              </div>
              <p className="text-sm">Modern school management system for the digital age.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
              { title: 'Company', links: ['About', 'Contact', 'Support'] },
              { title: 'Legal', links: ['Privacy', 'Terms'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-semibold mb-4">{title}</h4>
                <ul className="space-y-2 text-sm">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} EdSchool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
