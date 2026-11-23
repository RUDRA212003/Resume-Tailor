import React from 'react';
import '@/lib/export/ensureStandardFonts';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Svg,
  Path,
  renderToBuffer,
} from '@react-pdf/renderer';
import { CoverLetterData } from '@/lib/ai/coverLetterEngine';

const PhoneIcon = () => (
  <Svg width="8.5" height="8.5" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path
      fill="#000000"
      d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.24 1.02l-2.23 2.09z"
    />
  </Svg>
);

const MailIcon = () => (
  <Svg width="9.5" height="9.5" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path
      fill="#000000"
      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
    />
  </Svg>
);

const LinkedInIcon = () => (
  <Svg width="9" height="9" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path
      fill="#000000"
      d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.07a1.64 1.64 0 1 0 1.64 1.63c0-.9-.74-1.63-1.64-1.63Z"
    />
  </Svg>
);

const GlobeIcon = () => (
  <Svg width="9" height="9" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path
      fill="#000000"
      d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.07c.83 1.2 1.48 2.53 1.91 3.93h-3.82c.43-1.4 1.08-2.73 1.91-3.93zM4.26 14a8.13 8.13 0 0 1 0-4h3.38a16.63 16.63 0 0 0 0 4zm.81 2h2.95a15.65 15.65 0 0 0 1.38 3.56A8.03 8.03 0 0 1 5.07 16zm2.95-8H5.07a8.03 8.03 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.02 8zm3.98 11.93c-.83-1.2-1.48-2.53-1.91-3.93h3.82c-.43 1.4-1.08 2.73-1.91 3.93zm2.5-5.93h-5a14.66 14.66 0 0 1 0-4h5a14.66 14.66 0 0 1 0 4zm1.09 5.56c.55-1.12 1.01-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zm1.79-5.56a16.63 16.63 0 0 0 0-4h3.38a8.13 8.13 0 0 1 0 4z"
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    color: '#1D1D1F',
    lineHeight: 1.45,
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  candidateName: {
    fontSize: 22,
    fontFamily: 'Times-Bold',
    color: '#000000',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  contactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    textDecoration: 'none',
    marginHorizontal: 6,
  },
  contactText: {
    fontSize: 9.5,
    fontFamily: 'Times-Roman',
    color: '#000000',
  },
  date: {
    fontSize: 10.5,
    fontFamily: 'Times-Roman',
    color: '#333333',
    marginBottom: 14,
  },
  recipientBlock: {
    marginBottom: 16,
    lineHeight: 1.35,
  },
  recipientName: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    color: '#000000',
  },
  recipientOrg: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    color: '#222222',
  },
  salutation: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: '#000000',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 10.5,
    fontFamily: 'Times-Roman',
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'justify',
  },
  signoffBlock: {
    marginTop: 14,
    lineHeight: 1.4,
  },
  signoffText: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    color: '#000000',
  },
  signoffName: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: '#000000',
    marginTop: 16,
  },
});

export const CoverLetterPdfDocument: React.FC<{ data: CoverLetterData }> = ({ data }) => {
  return (
    <Document title={`Cover Letter - ${data.candidateName} - ${data.companyName}`} author={data.candidateName}>
      <Page size="A4" style={styles.page}>
        {/* Candidate Header */}
        <View style={styles.header}>
          <Text style={styles.candidateName}>{data.candidateName}</Text>
          <View style={styles.contactRow}>
            {data.candidatePhone && (
              <Link src={`tel:${data.candidatePhone.replace(/[^\d+]/g, '')}`} style={styles.contactLink}>
                <PhoneIcon />
                <Text style={styles.contactText}>{data.candidatePhone}</Text>
              </Link>
            )}
            {data.candidateEmail && (
              <Link src={`mailto:${data.candidateEmail}`} style={styles.contactLink}>
                <MailIcon />
                <Text style={styles.contactText}>{data.candidateEmail}</Text>
              </Link>
            )}
            {data.candidateLinkedin && (
              <Link src={data.candidateLinkedin} style={styles.contactLink}>
                <LinkedInIcon />
                <Text style={styles.contactText}>LinkedIn</Text>
              </Link>
            )}
            {data.candidatePortfolio && (
              <Link src={data.candidatePortfolio} style={styles.contactLink}>
                <GlobeIcon />
                <Text style={styles.contactText}>Portfolio</Text>
              </Link>
            )}
          </View>
        </View>

        {/* Date */}
        <Text style={styles.date}>{data.date}</Text>

        {/* Recipient Details */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{data.recipientName}</Text>
          <Text style={styles.recipientOrg}>{data.recipientRole}</Text>
          <Text style={styles.recipientOrg}>{data.companyName}</Text>
          {data.companyLocation && <Text style={styles.recipientOrg}>{data.companyLocation}</Text>}
        </View>

        {/* Salutation */}
        <Text style={styles.salutation}>{data.salutation}</Text>

        {/* Body Paragraphs */}
        <Text style={styles.paragraph}>{data.openingParagraph}</Text>
        <Text style={styles.paragraph}>{data.technicalBodyParagraph}</Text>
        {data.alignmentBodyParagraph && (
          <Text style={styles.paragraph}>{data.alignmentBodyParagraph}</Text>
        )}
        <Text style={styles.paragraph}>{data.closingParagraph}</Text>

        {/* Signoff */}
        <View style={styles.signoffBlock}>
          <Text style={styles.signoffText}>{data.signoff}</Text>
          <Text style={styles.signoffName}>{data.candidateName}</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateCoverLetterPdfBuffer(data: CoverLetterData): Promise<Buffer> {
  const doc = <CoverLetterPdfDocument data={data} />;
  return await renderToBuffer(doc);
}

