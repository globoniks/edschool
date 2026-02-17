"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Users, Headphones } from "lucide-react";

const trustPoints = [
  {
    icon: Shield,
    title: "Data Security",
    description: "Enterprise-grade security to protect your school's data",
  },
  {
    icon: Lock,
    title: "Privacy-First Approach",
    description: "Your data is encrypted and never shared with third parties",
  },
  {
    icon: Users,
    title: "Designed with Educators",
    description: "Built in collaboration with school administrators and teachers",
  },
  {
    icon: Headphones,
    title: "Support & Onboarding Included",
    description: "Dedicated support team to help you get started and succeed",
  },
];

export default function TrustSection() {
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
            Trust & Credibility
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Your school's data and privacy are our top priorities
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="rounded-lg bg-primary-100 p-3 mb-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {point.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

