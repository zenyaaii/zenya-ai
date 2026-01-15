import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>Zenya AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your personal information when you use our Shopify application.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p>When you install Zenya AI, we are automatically able to access certain types of information from your Shopify account:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Shop information (domain, email, shop owner name)</li>
            <li>Product data (to help generate themes relevant to your products)</li>
            <li>Theme data (to read and write themes as requested by you)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide and improve the Zenya AI service</li>
            <li>Generate custom themes based on your store&apos;s data</li>
            <li>Communicate with you about updates and support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Data Sharing</h2>
          <p>We do not sell your personal data. We may share your information with third-party service providers (like database hosting) solely for the purpose of operating our app.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at support@zenyaai.co.</p>
        </section>
      </div>
    </div>
  );
}
