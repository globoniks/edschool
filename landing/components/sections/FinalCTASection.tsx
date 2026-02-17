"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            See How Your School Can Run Smarter
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-100">
            Join schools that have transformed their operations with School OS. 
            Request a demo today and see the difference.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-100"
            >
              Request Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-primary-700"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>

          <p className="mt-8 text-sm text-primary-200">
            Email us at{" "}
            <a 
              href="mailto:contact@schoolos.com" 
              className="font-semibold text-white hover:underline"
            >
              contact@schoolos.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

