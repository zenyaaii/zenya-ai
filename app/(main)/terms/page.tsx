import React from 'react';

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>By installing and using Zenya AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
          <p>Zenya AI provides AI-powered theme generation and customization tools for Shopify merchants. We reserve the right to modify or discontinue the service at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the security of your Shopify account. You agree not to use Zenya AI for any illegal or unauthorized purpose.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Intellectual Property</h2>
          <p>The generated themes are licensed to you for use on your Shopify store. Zenya AI retains ownership of the underlying AI generation technology and application code.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Limitation of Liability</h2>
          <p>Zenya AI is provided &quot;as is&quot; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the app.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Contact Information</h2>
          <p>For any questions regarding these Terms, please contact us at support@zenyaai.co.</p>
        </section>
      </div>
    </div>
  );
}
