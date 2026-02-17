"use client";

import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">School OS</h3>
            <p className="text-sm text-gray-400">
              Your school, finally running on one smart system. 
              One platform for admin, teachers, parents, and students.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <a 
                href="mailto:contact@schoolos.com" 
                className="hover:text-white transition-colors"
              >
                contact@schoolos.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2 text-sm">
              <a 
                href="#" 
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} School OS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

