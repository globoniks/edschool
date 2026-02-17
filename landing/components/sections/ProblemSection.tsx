"use client";

import { motion } from "framer-motion";
import { 
  Puzzle, 
  ClipboardList, 
  MessageSquareOff, 
  BarChart3, 
  DollarSign 
} from "lucide-react";

const problems = [
  {
    icon: Puzzle,
    title: "Multiple Disconnected Apps",
    description: "Juggling different tools for attendance, fees, and communication",
  },
  {
    icon: ClipboardList,
    title: "Manual Work for Teachers",
    description: "Spending hours on paperwork instead of teaching",
  },
  {
    icon: MessageSquareOff,
    title: "Poor Parent Communication",
    description: "Parents stay in the dark about their child's progress",
  },
  {
    icon: BarChart3,
    title: "No Academic Insights",
    description: "Making decisions without real data or analytics",
  },
  {
    icon: DollarSign,
    title: "Expensive & Rigid Software",
    description: "Paying for features you don't need, locked into contracts",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Running a School Shouldn't Be This Hard
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            If you're managing multiple systems, you know the struggle
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-start rounded-lg border border-gray-200 bg-gray-50 p-6"
              >
                <div className="rounded-lg bg-red-100 p-3">
                  <Icon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

