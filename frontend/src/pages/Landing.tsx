import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo, { LogoMark } from '../components/Logo';
import {
  ArrowRight,
  BookOpen,
  Bus,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  IndianRupee,
  Menu,
  MessageSquare,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

/**
 * Public marketing page for Globoniks Schools.
 *
 * Positioned as a product page for the people who buy and run the software
 * (school leaders and administrators), with a prominent sign-in path for the
 * parents, teachers and drivers of schools already using it. The previous
 * version mixed the two — a school's own website (Admissions, Campus, sports
 * news) grafted onto a SaaS page (Pricing, Security) — so a visitor could not
 * tell whether Globoniks was a school or a product, and every button led to
 * /login regardless.
 *
 * Copy rule: every claim below describes something the application actually
 * does. There are deliberately no customer counts, logos or testimonials —
 * inventing them would be the most persuasive and least honest thing on the
 * page. See NEEDS_YOUR_DECISION.md for supplying the real ones.
 */

/**
 * Outcome-first, because a school leader buys the result, not the module.
 *
 * These eight are the daily work; the complete feature list lives in
 * `included` below, for buyers comparing us against another system. Every entry
 * in both maps to a working, database-backed feature — the Downloads, Videos
 * and Event Gallery screens are deliberately absent because they are not built
 * yet, and advertising them would be a lie a prospect discovers on day one.
 */
const capabilities = [
  {
    icon: Users,
    title: 'Student records that stay current',
    body: 'Admission numbers, classes, parents and contact details in one roll. Import an existing list from CSV and assign classes in bulk.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance in a minute',
    body: 'Teachers mark a class from a phone. Parents see an absence the same morning, not in a monthly report.',
  },
  {
    icon: IndianRupee,
    title: 'Know who owes what',
    body: 'Fee structures, receipts, discounts and dues per student — the pending figure is on the dashboard, not in a spreadsheet.',
  },
  {
    icon: ClipboardList,
    title: 'Marks once, report cards after',
    body: 'Teachers enter marks against an exam; grades and report cards come from those records, not a re-typed sheet.',
  },
  {
    icon: BookOpen,
    title: 'Homework that does not get lost',
    body: 'Set an assignment for a class, see who has submitted, mark it and return remarks — parents see the due date before it passes.',
  },
  {
    icon: Clock,
    title: 'One timetable, everyone looking at it',
    body: 'Period-by-period schedules per class and teacher, visible to staff and parents so nobody works from a photo of a noticeboard.',
  },
  {
    icon: Bus,
    title: 'Stop the "where is the bus" calls',
    body: 'Live GPS tracking on a map for the parents of children on that route, updated as the driver moves.',
  },
  {
    icon: MessageSquare,
    title: 'Reach a whole class at once',
    body: 'Announcements and direct messages, delivered as push notifications to the phones parents already carry.',
  },
];

/**
 * The complete list, grouped the way a school procurement checklist is.
 * Buyers compare feature-by-feature, and a page that only shows eight
 * highlights reads as a thinner product than it is.
 */
const included = [
  {
    group: 'Academics',
    items: [
      'Classes, sections and subjects',
      'Timetables per class and teacher',
      'Exams, marks and report cards',
      'Homework and submissions',
      'Curriculum and chapter planning',
      'Syllabus progress tracking',
    ],
  },
  {
    group: 'People',
    items: [
      'Student records and admissions',
      'Bulk CSV import and class assignment',
      'Teacher and staff profiles',
      'Student attendance',
      'Staff attendance',
      'Leave requests and approvals',
    ],
  },
  {
    group: 'Money and transport',
    items: [
      'Fee structures and billing cycles',
      'Payments, receipts and dues',
      'Discounts and scholarships',
      'Buses, routes and stops',
      'Driver accounts and trips',
      'Live bus tracking for parents',
    ],
  },
  {
    group: 'Communication and admin',
    items: [
      'Announcements and notices',
      'Direct and whole-class messaging',
      'Push notifications',
      'Holiday calendar',
      'Class photo sharing',
      'CSV export of students, staff, exams and fees',
    ],
  },
];

/** Doubles as a wayfinder — an existing user recognises their role and signs in. */
const roles = [
  {
    title: 'School leadership',
    body: 'Enrolment, staff, fee collection and attendance across the school on one dashboard.',
  },
  {
    title: 'Teachers',
    body: 'Registers, homework, marks and messages to a class or a single parent.',
  },
  {
    title: 'Parents',
    body: "Their child's attendance, homework, results, fees and school bus — nothing about anyone else's child.",
  },
  {
    title: 'Drivers',
    body: 'Start a trip, share location for the route, and see the students expected on board.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Your school is set up',
    body: 'Classes, subjects and staff are created, and students imported from the roll you already keep.',
  },
  {
    n: '02',
    title: 'Staff get the right access',
    body: 'Each person is given a role and permissions, so they see their work and nothing else.',
  },
  {
    n: '03',
    title: 'Parents are invited',
    body: 'Parents sign in on their phones and start seeing attendance, fees and notices the same day.',
  },
];

const faqs = [
  {
    q: 'Does each school have its own separate data?',
    a: 'Yes. Every record belongs to one school, and requests are scoped to the signed-in user\'s school at the database query itself, so one school cannot read or change another\'s data.',
  },
  {
    q: 'What can a parent see?',
    a: 'Only their own children. A parent account with no linked child cannot sign in at all, and every parent-facing screen is filtered to the children linked to that account.',
  },
  {
    q: 'Do parents need to install anything?',
    a: 'No. It runs in a mobile browser and can be added to the home screen, where it behaves like an installed app and continues to work on a poor connection.',
  },
  {
    q: 'Can we control who sees fees, staff records or marks?',
    a: 'Yes. Permissions are assigned per person through tags, so a finance clerk, an HR sub-admin and a head of department each get their own slice rather than a shared administrator login.',
  },
  {
    q: 'How do we get our existing student records in?',
    a: 'Students can be imported in bulk from a CSV, and assigned to classes in a batch afterwards.',
  },
  {
    q: 'Is there a record of who changed something?',
    a: 'Yes. Changes to marks, fee payments, student records and permissions are written to an audit trail that administrators can read and filter, and that nobody can edit or delete.',
  },
];

const navLinks = [
  { href: '#capabilities', label: 'What it does' },
  { href: '#included', label: "What's included" },
  { href: '#roles', label: 'Who it is for' },
  { href: '#how-it-works', label: 'Getting started' },
  { href: '#faq', label: 'FAQ' },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile menu and returns focus to the control that opened
  // it, so keyboard users are not stranded inside a dismissed panel.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white font-body text-slate-700">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-xl focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            aria-label="Globoniks Schools, home"
          >
            <Logo variant="stacked" size="md" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded text-sm font-semibold tracking-tight text-slate-600 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
            <a
              href="#contact"
              className="hidden items-center gap-1.5 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-900/20 transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:inline-flex"
            >
              Book a walkthrough
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="-mr-1 flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* The previous page had no mobile navigation whatsoever — the links
            were hidden below `lg` with nothing to replace them. */}
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Primary"
            className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-2 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2 border-t border-slate-100 pt-3">
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl bg-brand-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Book a walkthrough
                </a>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="main">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-100/50 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
              <div>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
                  School management software
                </p>
                {/* Short and benefit-led. The old headline read "Welcome to
                    Globoniks Schools School Management" — six words that said
                    nothing, with "Schools School" in the middle of it. */}
                <h1 className="font-headline text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-900 sm:text-5xl md:text-6xl">
                  Run the whole school from one place
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                  Attendance, fees, exams, homework, messaging and school transport — for
                  administrators, teachers and parents, on the phones they already own.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-900 px-7 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/25 transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Book a walkthrough
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-7 py-4 text-base font-bold text-brand-900 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Sign in to your school
                  </Link>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Already using Globoniks at your school? Parents, teachers and drivers sign
                  in above with the details your school issued.
                </p>
              </div>

              {/* An honest impression of the product rather than a stock photo
                  of a campus that is not ours. */}
              <div className="relative" aria-hidden="true">
                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-brand-900/10">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <LogoMark className="h-7 w-7" />
                      <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                      <div className="ml-auto h-7 w-7 rounded-full bg-brand-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Attendance today', value: '94.2%' },
                        { label: 'Fees collected', value: '₹8.4L' },
                        { label: 'Students', value: '1,248' },
                        { label: 'Buses running', value: '6' },
                      ].map((tile) => (
                        <div
                          key={tile.label}
                          className="rounded-xl border border-slate-100 bg-white p-3"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {tile.label}
                          </p>
                          <p className="mt-1 font-headline text-xl font-bold text-brand-900">
                            {tile.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                      <div className="mb-3 h-2 w-20 rounded-full bg-slate-200" />
                      <div className="flex h-20 items-end gap-1.5">
                        {[45, 62, 55, 78, 70, 88, 82].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-brand-400/70"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Illustration of the admin dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Capability strip ──────────────────────────────────── */}
        <section className="border-y border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { k: 'One login', v: 'Six roles, one account each' },
              { k: 'Per-person access', v: 'Permissions, not shared passwords' },
              { k: 'Works offline', v: 'Installable progressive web app' },
              { k: 'Audit trail', v: 'Every change attributed' },
            ].map((item) => (
              <div key={item.k}>
                <p className="font-headline text-lg font-bold text-brand-900">{item.k}</p>
                <p className="mt-1 text-sm leading-snug text-slate-500">{item.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Capabilities ──────────────────────────────────────── */}
        <section id="capabilities" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                The work a school actually does
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Not a list of modules — the jobs that take up a school office's week.
              </p>
            </div>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
                  </span>
                  <h3 className="font-headline text-base font-bold text-brand-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Everything included ───────────────────────────────── */}
        <section id="included" className="scroll-mt-20 border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                Everything included
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                One price, one system. No modules to buy separately, and nothing on this list
                that isn't already built.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {included.map((column) => (
                <div key={column.group}>
                  <h3 className="font-headline text-sm font-extrabold uppercase tracking-widest text-brand-700">
                    {column.group}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {column.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Roles ─────────────────────────────────────────────── */}
        <section id="roles" className="scroll-mt-20 bg-brand-950 py-20 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                One system, four kinds of people
              </h2>
              <p className="mt-4 text-lg text-brand-100/80">
                Everyone signs in to the same place and sees only their own work.
              </p>
            </div>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <li key={role.title} className="bg-brand-950 p-6">
                  <h3 className="font-headline text-lg font-bold text-white">{role.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-100/75">{role.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-brand-100/80">
                Each school's records are separate. Every request is scoped to the signed-in
                user's school, so one school's staff cannot reach another's data — and a parent
                only ever sees their own children.
              </p>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                Getting started
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Three steps, using the records you already keep.
              </p>
            </div>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.n} className="relative border-t-2 border-brand-100 pt-6">
                  <span className="font-headline text-sm font-extrabold tracking-widest text-brand-400">
                    {step.n}
                  </span>
                  <h3 className="mt-2 font-headline text-xl font-bold text-brand-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Questions schools ask
            </h2>

            {/* Native <details> — keyboard accessible and announced correctly
                by screen readers with no JavaScript or ARIA of our own. */}
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-headline text-base font-bold text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50">
                    {faq.q}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-brand-400 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 pr-9 leading-relaxed text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────── */}
        <section id="contact" className="scroll-mt-20 bg-brand-900 py-20 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
              See it with your own school's data
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100/85">
              We'll walk your team through attendance, fees and transport, and answer the
              questions your office will ask.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@globoniks.com?subject=Globoniks%20Schools%20walkthrough"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-bold text-brand-900 shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 sm:w-auto"
              >
                Email us
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white/30 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-brand-950 py-14 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-start gap-2.5">
                <LogoMark className="h-9 w-9" />
                <div>
                  <span className="block font-headline text-lg font-extrabold text-white">
                    G Schools
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                    Globoniks Schools
                  </span>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                School management for administrators, teachers and parents. A Globoniks
                product.
              </p>
            </div>

            <div>
              <h2 className="mb-4 font-semibold text-white">Product</h2>
              <ul className="space-y-2.5 text-sm">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 font-semibold text-white">Get in touch</h2>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:hello@globoniks.com"
                    className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    hello@globoniks.com
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Globoniks Schools. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
