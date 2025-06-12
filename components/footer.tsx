"use client";

import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#twitter" },
    { name: "LinkedIn", icon: Linkedin, href: "#linkedin" },
    { name: "GitHub", icon: Github, href: "#github" },
    { name: "Email", icon: Mail, href: "mailto:hi@aplycat.com" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* App Name */}
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-2xl">🐱</span>
            <span className="ml-2 text-xl font-bold">Aplycat</span>
          </div>

          {/* Copyright and Social Links */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-gray-400 text-sm">{t("copyright")}</div>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
