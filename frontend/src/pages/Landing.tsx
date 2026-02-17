import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Calendar,
  DollarSign,
  FileText,
  BookOpen,
  Bell,
  Shield,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Comprehensive student profiles, admission tracking, and class assignments.',
    },
    {
      icon: GraduationCap,
      title: 'Teacher Management',
      description: 'Staff profiles, qualifications, and subject assignments.',
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Daily attendance marking with detailed reports and analytics.',
    },
    {
      icon: DollarSign,
      title: 'Fee Management',
      description: 'Flexible fee structures, payment tracking, and receipt generation.',
    },
    {
      icon: FileText,
      title: 'Exams & Marks',
      description: 'Exam scheduling, marks entry, and automated report card generation.',
    },
    {
      icon: BookOpen,
      title: 'Homework & Assignments',
      description: 'Create assignments, track submissions, and evaluate student work.',
    },
    {
      icon: Calendar,
      title: 'Timetable Management',
      description: 'Class-wise timetables with subject scheduling and room allocation.',
    },
    {
      icon: Bell,
      title: 'Communication',
      description: 'School-wide announcements and direct messaging between parents and teachers.',
    },
  ];

  const benefits = [
    'Multi-tenant SaaS architecture for multiple schools',
    'Role-based access control (Admin, Teacher, Parent, Student)',
    'Real-time data synchronization',
    'Secure and scalable infrastructure',
    'Mobile-responsive design',
    'Comprehensive reporting and analytics',
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">EdSchool</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="text-sm sm:text-base text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="btn btn-primary text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Modern School Management
              <span className="text-primary-600"> Made Simple</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              A comprehensive, cloud-based school management system designed to streamline
              operations, enhance communication, and improve educational outcomes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Link to="/login" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                Get Started
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
              </Link>
              <button className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Powerful Features</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to manage your school efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Why Choose EdSchool?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                Built with modern technology and best practices to provide a seamless experience
                for administrators, teachers, parents, and students.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-primary-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Secure & Reliable</h3>
                    <p className="text-gray-600">Enterprise-grade security with regular backups</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-primary-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Multi-Role Support</h3>
                    <p className="text-gray-600">Designed for all stakeholders in education</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-primary-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Always Available</h3>
                    <p className="text-gray-600">Access your data anytime, anywhere</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join schools already using EdSchool to streamline their operations and improve
            communication.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            Get Started Today
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <GraduationCap className="w-6 h-6 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-white">EdSchool</span>
              </div>
              <p className="text-sm">
                Modern school management system for the digital age.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} EdSchool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

