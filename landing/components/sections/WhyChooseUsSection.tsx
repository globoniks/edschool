"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  Languages, 
  WifiOff, 
  Smartphone, 
  DollarSign, 
  Shield 
} from "lucide-react";

const benefits = [
  {
    icon: MapPin,
    title: "Designed for Indian Schools",
    description: "Built with local requirements, languages, and workflows in mind",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description: "Works in multiple Indian languages for better accessibility",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description: "Core features available even without internet connection",
  },
  {
    icon: Smartphone,
    title: "No Forced App Updates",
    description: "Browser-based solution that always stays current",
  },
  {
    icon: DollarSign,
    title: "Affordable & Scalable",
    description: "Pay per student, scale as you grow, no hidden costs",
  },
  {
    icon: Shield,
    title: "Data Ownership for Schools",
    description: "Your data stays yours, with full control and privacy",
  },
];

export default function WhyChooseUsSection() {
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
            Why Schools Choose Us
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Built specifically for the needs of Indian schools
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
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
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

