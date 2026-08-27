import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SvgSecurityShield } from './icons/ColorfulIcons';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does the hardware-locked license key work?',
      answer:
        'Each employee receives a unique activation key. When entered, the app locks to that specific computer. This stops employees from sharing keys or running the app on unapproved devices. If an employee switches laptops, the admin can reset the device binding with one click.',
    },
    {
      question: 'Can employees turn off or bypass the monitoring app?',
      answer:
        'No. The desktop app runs silently in the background as a system service. It starts automatically when the computer turns on and cannot be easily closed. If an employee goes offline, admins see their status immediately on the dashboard.',
    },
    {
      question: 'What happens when there is no internet connection?',
      answer:
        'The app keeps taking screenshots normally and stores them safely on the local computer. As soon as the internet reconnects, all pending screenshots upload automatically to your admin portal with zero data loss.',
    },
    {
      question: 'What is the difference between SuperAdmin and Company Admin portals?',
      answer:
        'SuperAdmin is for master platform control (creating company accounts, setting employee seat quotas, and managing subscriptions). Company Admin is for daily operations (adding employees, generating keys, viewing screenshots, and setting capture timers).',
    },
    {
      question: 'How are screenshots organized and viewed?',
      answer:
        'All captures are automatically sorted into folders by Date and Employee Username. Admins can browse day-by-day timelines, search by employee name, zoom in to full-resolution images, and download captures anytime.',
    },
    {
      question: 'Can I change screenshot frequency or pause captures?',
      answer:
        'Yes. In the Company Admin portal, you can set the capture interval to 1 minute, 5 minutes, 10 minutes, or 15 minutes. You can also pause monitoring company-wide with a single toggle button.',
    },
    {
      question: 'How fast is the setup for a new company or team?',
      answer:
        'Setup takes less than 10 minutes. The admin creates employee profiles in the portal, generates activation keys, and shares the desktop installer. Employees install the app once, paste their key, and monitoring begins right away.',
    },
    {
      question: 'Which operating systems and devices are supported?',
      answer:
        'The desktop agent supports Windows 10, Windows 11, and Windows Server. The web portals (SuperAdmin and Company Admin) work smoothly on any device using Chrome, Edge, Safari, or Firefox.',
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <SvgSecurityShield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-500 max-w-2xl mx-auto">
            Clear answers to common questions about deployment, security, licensing, and compliance.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 hover:border-green-200 shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <ChevronDown
                      className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-green-700' : 'text-gray-400'
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
