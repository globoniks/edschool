"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, TrendingUp } from "lucide-react";

const pricingPoints = [
  {
    icon: Users,
    title: "Per-Student Pricing",
    description: "Fair, transparent pricing based on your school size",
  },
  {
    icon: CreditCard,
    title: "Free Trial Available",
    description: "Try before you commit—no credit card required",
  },
  {
    icon: TrendingUp,
    title: "Pay Only for What You Use",
    description: "No hidden fees, no unnecessary features, just what you need",
  },
];

export default function PricingSection() {
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
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Pricing that grows with your school
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {pricingPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center text-center rounded-lg border border-gray-200 bg-white p-6"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button size="lg">
            Get Pricing
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

