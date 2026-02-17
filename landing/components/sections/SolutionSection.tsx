"use client";

import { motion } from "framer-motion";
import { 
  Smartphone, 
  Monitor, 
  Wifi, 
  Globe 
} from "lucide-react";

const solutions = [
  {
    icon: Monitor,
    title: "One Platform for Everyone",
    description: "Admin, teachers, parents, and students—all connected in one system",
  },
  {
    icon: Smartphone,
    title: "Mobile-First for Parents & Students",
    description: "Access everything on the go, no desktop needed",
  },
  {
    icon: Monitor,
    title: "Desktop-First for Management",
    description: "Powerful tools for administrators and teachers",
  },
  {
    icon: Wifi,
    title: "Works on Slow Internet",
    description: "Optimized to perform even with limited connectivity",
  },
  {
    icon: Globe,
    title: "No Play Store Dependency",
    description: "Works directly in the browser, no app installation required",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One System That Actually Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Built for real schools, with real challenges in mind
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-start rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="rounded-lg bg-primary-100 p-3">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {solution.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {solution.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

