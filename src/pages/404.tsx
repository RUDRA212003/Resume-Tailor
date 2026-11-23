import React from 'react';
import Link from 'next/link';

export default function Custom404Page() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F5F5F7', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', padding: '32px', background: '#ffffff', borderRadius: '16px', textAlign: 'center', border: '1px solid #E5E5E7', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#F0F7FF', color: '#0066CC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '20px' }}>
          🔍
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1D1D1F', margin: '0 0 8px 0' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '13px', color: '#555555', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          The requested page could not be found or has been moved.
        </p>
        <Link
          href="/tailor"
          style={{ display: 'inline-block', padding: '9px 20px', backgroundColor: '#0066CC', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
        >
          Return to Tailor Studio
        </Link>
      </div>
    </div>
  );
}
