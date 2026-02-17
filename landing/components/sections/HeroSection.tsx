"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your School, Finally Running on{" "}
            <span className="text-primary-600">One Smart System</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl"
          >
            One platform that connects administrators, teachers, parents, and students. 
            Manage everything from attendance to academics, all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => scrollToSection("contact")}
            >
              Request Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => scrollToSection("features")}
            >
              <Play className="mr-2 h-5 w-5" />
              View Features
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      Dashboard Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

