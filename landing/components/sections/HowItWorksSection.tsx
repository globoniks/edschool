"use client";

import { motion } from "framer-motion";
import { Settings, Users, Rocket } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Settings,
    title: "Setup School",
    description: "Configure your school profile, academic year, and basic settings",
  },
  {
    number: "2",
    icon: Users,
    title: "Onboard Teachers & Students",
    description: "Import or add your staff and student data quickly",
  },
  {
    number: "3",
    icon: Rocket,
    title: "Go Live in Days, Not Months",
    description: "Start using the platform immediately with our guided onboarding",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="mt-16">
          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white">
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute top-8 left-[60%] hidden h-0.5 w-[80%] bg-gray-200 md:block" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

