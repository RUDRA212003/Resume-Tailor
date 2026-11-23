import React from 'react';
import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  message?: string;
}

function ErrorPage({ statusCode, message }: ErrorProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F5F5F7', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', padding: '32px', background: '#ffffff', borderRadius: '16px', textAlign: 'center', border: '1px solid #E5E5E7', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '20px' }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1D1D1F', margin: '0 0 8px 0' }}>
          {statusCode ? `Error ${statusCode}` : 'Application Error'}
        </h2>
        <p style={{ fontSize: '13px', color: '#555555', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          {message || 'The application encountered an unexpected state. Reloading will restore your session.'}
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          style={{ padding: '9px 20px', backgroundColor: '#0066CC', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          Reload Studio
        </button>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, message: err?.message };
};

export default ErrorPage;
