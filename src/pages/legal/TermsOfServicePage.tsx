import React from 'react'

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Last updated: January 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CleanLoop Platform ("the Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p>
              CleanLoop Platform is a waste management platform that connects residents, waste collectors, and administrators. The Platform facilitates:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scheduling and managing waste collection pickups</li>
              <li>Processing payments for waste management services</li>
              <li>Managing subscriptions and service plans</li>
              <li>Handling complaints and service issues</li>
              <li>Tracking service performance and metrics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Registration</h3>
            <p>To use certain features of the Platform, you must register for an account and provide accurate, current, and complete information.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Account Security</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 User Roles</h3>
            <p>The Platform supports three user roles:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Residents:</strong> Individuals who use waste collection services</li>
              <li><strong>Collectors:</strong> Service providers who perform waste collection</li>
              <li><strong>Administrators:</strong> Platform administrators who manage the system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processing is handled by third-party payment processors</li>
              <li>All fees are non-refundable unless otherwise stated</li>
              <li>You agree to pay all charges associated with your use of the Platform</li>
              <li>We reserve the right to change our pricing with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Service Availability</h2>
            <p>
              We strive to maintain Platform availability but do not guarantee uninterrupted access. The Platform may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Platform or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Upload malicious code or viruses</li>
              <li>Harvest or collect information about users without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p>
              The Platform and its original content, features, and functionality are owned by CleanLoop Platform and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLEANLOOP PLATFORM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless CleanLoop Platform, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Platform immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-4">
              <li><strong>Email:</strong> support@cleanloop.ng</li>
              <li><strong>Address:</strong> [Your Company Address]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

