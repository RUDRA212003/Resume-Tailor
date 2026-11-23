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
import type { TailoredResume, Profile, ResumeTemplate } from '@/types';

/**
 * Scalable vector SVG icons for clean, professional PDF rendering.
 */
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

const GitHubIcon = () => (
  <Svg width="9" height="9" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
    <Path
      fill="#000000"
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
    />
  </Svg>
);

/**
 * Validates and normalizes URLs to safe, clickable formats.
 * Supports web URLs, mailto: for email, and tel: for phone numbers.
 */
export function normalizeUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  // Disallow unsafe protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  // Email mailto: link
  if (lower.startsWith('mailto:')) {
    return trimmed;
  }
  if (trimmed.includes('@') && !trimmed.includes('/') && !trimmed.startsWith('http')) {
    return `mailto:${trimmed}`;
  }

  // Telephone tel: link
  if (lower.startsWith('tel:')) {
    return trimmed;
  }
  if (/^\+?[0-9\s\-()]{7,20}$/.test(trimmed)) {
    const digits = trimmed.replace(/[^\d+]/g, '');
    return `tel:${digits}`;
  }

  // Already prefixed web URL
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  // Default web URL
  return `https://${trimmed}`;
}

export interface PdfGeneratorOptions {
  resume: TailoredResume;
  profile: Profile;
  template: ResumeTemplate;
}

/**
 * Renders the genuine vector-based ATS resume document with clickable link annotations.
 */
export const ResumePdfDocument: React.FC<PdfGeneratorOptions> = ({
  resume,
  profile,
  template,
}) => {
  const isCompact = template.layoutType === 'compact' || template.id === 'tmpl-single-page-ats';
  const isClassic = template.layoutType === 'classic' || isCompact;
  const accentColor = isCompact ? '#000000' : (template.accentColor || '#0066CC');
  const fontFamily = isClassic ? 'Times-Roman' : 'Helvetica';
  const fontBold = isClassic ? 'Times-Bold' : 'Helvetica-Bold';
  const fontItalic = isClassic ? 'Times-Italic' : 'Helvetica-Oblique';

  const styles = StyleSheet.create({
    page: {
      paddingTop: 16,
      paddingBottom: 14,
      paddingHorizontal: 26,
      fontFamily,
      fontSize: 9.0,
      color: '#1D1D1F',
      lineHeight: 1.22,
    },
    // Header Styles
    headerContainer: {
      marginBottom: 5,
      textAlign: 'center',
      alignItems: 'center',
      width: '100%',
    },
    candidateName: {
      fontSize: 21,
      fontFamily: fontBold,
      color: '#000000',
      letterSpacing: 0.5,
      marginBottom: 8, // Clear line space after candidate name
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
      width: '100%',
    },
    contactItemLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 8,
      textDecoration: 'none',
    },
    contactText: {
      fontSize: 9.2,
      color: '#000000',
      fontFamily: fontFamily,
    },
    // Section Styles
    section: {
      marginTop: 4.5,
      marginBottom: 1.5,
    },
    sectionHeadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isClassic ? 'center' : 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: isClassic ? '#000000' : accentColor,
      paddingBottom: 1.0,
      marginBottom: 2.2,
    },
    sectionTitle: {
      fontSize: 9.8,
      fontFamily: fontBold,
      color: isClassic ? '#000000' : accentColor,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    // Summary
    summaryText: {
      fontSize: 9.0,
      color: '#222222',
      lineHeight: 1.23,
      textAlign: isClassic ? 'justify' : 'left',
    },
    // Skills
    skillRow: {
      flexDirection: 'row',
      marginBottom: 1.1,
    },
    skillCategory: {
      fontFamily: fontBold,
      color: '#000000',
      fontSize: 9.0,
      width: '26%',
    },
    skillList: {
      color: '#222222',
      fontSize: 9.0,
      width: '74%',
      lineHeight: 1.20,
    },
    // Experience & Projects Item
    itemContainer: {
      marginBottom: 2.8,
    },
    itemHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 0.5,
    },
    itemTitle: {
      fontFamily: fontBold,
      fontSize: 9.2,
      color: '#000000',
    },
    itemDates: {
      fontSize: 8.4,
      fontFamily: fontBold,
      color: '#4B5563',
      textAlign: 'right',
    },
    itemSubRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 1.0,
    },
    itemRole: {
      fontFamily: fontItalic,
      fontSize: 8.8,
      color: '#374151',
    },
    itemLocation: {
      fontSize: 8.2,
      color: '#6B7280',
      textAlign: 'right',
    },
    itemDescription: {
      fontSize: 8.4,
      color: '#4B5563',
      marginBottom: 1.0,
      fontFamily: fontItalic,
    },
    itemLinksContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 6,
    },
    projectLink: {
      fontSize: 8.4,
      color: accentColor,
      fontFamily: fontBold,
      textDecoration: 'none',
      marginRight: 6,
    },
    // Bullet Points
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 1.0,
      paddingLeft: 2,
    },
    bulletSymbol: {
      fontSize: 8.6,
      color: '#4B5563',
      marginRight: 3.5,
      marginTop: -0.5,
    },
    bulletText: {
      flex: 1,
      fontSize: 8.9,
      color: '#222222',
      lineHeight: 1.22,
    },
    // Education Item
    eduRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 0.6,
    },
    eduDegree: {
      fontFamily: fontBold,
      fontSize: 9.0,
      color: '#000000',
    },
    eduInstitution: {
      fontSize: 8.8,
      color: '#222222',
    },
    eduDates: {
      fontSize: 8.4,
      color: '#6B7280',
      textAlign: 'right',
    },
  });

  const { personalInfo } = profile;
  const emailUrl = normalizeUrl(personalInfo.email);
  const phoneUrl = normalizeUrl(personalInfo.phone);
  const linkedinUrl = normalizeUrl(personalInfo.linkedinUrl);
  const githubUrl = normalizeUrl(personalInfo.githubUrl);
  const portfolioUrl = normalizeUrl(personalInfo.portfolioUrl);

  return (
    <Document
      title={`${personalInfo.fullName} – Resume`}
      author={personalInfo.fullName}
      subject="Tailored ATS Resume"
      creator="ResumeCraft Studio"
      producer="ResumeCraft ATS Engine"
    >
      <Page size="A4" style={styles.page}>
        {/* 1. Header: Full Name and Clickable Contact Details (Exact replica of Image 2) */}
        <View style={styles.headerContainer}>
          <Text style={styles.candidateName}>{personalInfo.fullName}</Text>

          <View style={styles.contactRow}>
            {personalInfo.phone && phoneUrl && (
              <Link src={phoneUrl} style={styles.contactItemLink}>
                <PhoneIcon />
                <Text style={styles.contactText}>{personalInfo.phone}</Text>
              </Link>
            )}

            {personalInfo.email && emailUrl && (
              <Link src={emailUrl} style={styles.contactItemLink}>
                <MailIcon />
                <Text style={styles.contactText}>{personalInfo.email}</Text>
              </Link>
            )}

            {personalInfo.linkedinUrl && linkedinUrl && (
              <Link src={linkedinUrl} style={styles.contactItemLink}>
                <LinkedInIcon />
                <Text style={styles.contactText}>LinkedIn</Text>
              </Link>
            )}

            {personalInfo.portfolioUrl && portfolioUrl && (
              <Link src={portfolioUrl} style={styles.contactItemLink}>
                <GlobeIcon />
                <Text style={styles.contactText}>Portfolio</Text>
              </Link>
            )}

            {!isCompact && personalInfo.githubUrl && githubUrl && (
              <Link src={githubUrl} style={styles.contactItemLink}>
                <GitHubIcon />
                <Text style={styles.contactText}>GitHub</Text>
              </Link>
            )}
          </View>
        </View>

        {/* 2. Professional Summary */}
        {resume.summary && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Professional Summary' : 'Professional Summary'}
              </Text>
            </View>
            <Text style={styles.summaryText}>{resume.summary}</Text>
          </View>
        )}

        {/* 3. Technical Skills */}
        {resume.selectedSkills && resume.selectedSkills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Technical Skills' : 'Technical Skills'}
              </Text>
            </View>
            {resume.selectedSkills.map((catGroup, idx) => (
              <View key={idx} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{catGroup.category}:</Text>
                <Text style={styles.skillList}>{catGroup.skills.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 4. Professional Experience */}
        {resume.selectedExperiences && resume.selectedExperiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Professional Experience' : 'Professional Experience'}
              </Text>
            </View>

            {resume.selectedExperiences.map((exp, idx) => (
              <View key={idx} style={styles.itemContainer} wrap={false}>
                {/* Company & Dates */}
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{exp.company}</Text>
                  <Text style={styles.itemDates}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>

                {/* Job Title & Location */}
                <View style={styles.itemSubRow}>
                  <Text style={styles.itemRole}>{exp.jobTitle}</Text>
                  {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                </View>

                {/* Bullet Points */}
                {exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>{bullet.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* 5. Key Projects with Clickable Links */}
        {resume.selectedProjects && resume.selectedProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Key Projects' : 'Key Projects'}
              </Text>
            </View>

            {resume.selectedProjects.map((proj, idx) => {
              const projGithubUrl = normalizeUrl(proj.githubUrl);
              const projLiveUrl = normalizeUrl(proj.liveUrl);

              return (
                <View key={idx} style={styles.itemContainer} wrap={false}>
                  {/* Title, Clickable Links & Duration */}
                  <View style={styles.itemHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={styles.itemTitle}>{proj.title}</Text>

                      {/* Clickable Hyperlinks for Repository and Live Demo (omitted in single-page clean ATS template) */}
                      {!isCompact && projGithubUrl && (
                        <View style={styles.itemLinksContainer}>
                          <Link src={projGithubUrl} style={styles.projectLink}>
                            [GitHub Repo]
                          </Link>
                        </View>
                      )}
                      {!isCompact && projLiveUrl && (
                        <View style={styles.itemLinksContainer}>
                          <Link src={projLiveUrl} style={styles.projectLink}>
                            [Live Demo]
                          </Link>
                        </View>
                      )}
                    </View>

                    {proj.duration && <Text style={styles.itemDates}>{proj.duration}</Text>}
                  </View>

                  {/* Technologies */}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <Text style={styles.itemDescription}>
                      Technologies: {proj.technologies.join(', ')}
                    </Text>
                  )}

                  {/* Description (omitted in single-page ATS to prevent duplicate text with bullets) */}
                  {!isCompact && proj.description && (
                    <Text style={[styles.summaryText, { marginBottom: 2 }]}>
                      {proj.description}
                    </Text>
                  )}

                  {/* Project Bullets */}
                  {proj.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* 6. Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Education' : 'Education'}
              </Text>
            </View>

            {resume.education.map((edu, idx) => (
              <View key={idx} style={styles.itemContainer}>
                <View style={styles.eduRow}>
                  <Text style={styles.eduDegree}>
                    {edu.degree} in {edu.branch}
                  </Text>
                  <Text style={styles.eduDates}>
                    {edu.startYear} – {edu.graduationYear}
                  </Text>
                </View>
                <View style={styles.eduRow}>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  {edu.cgpaOrPercentage && (
                    <Text style={styles.eduDates}>
                      Score: {edu.cgpaOrPercentage}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 7. Certifications (if present) */}
        {resume.certifications && resume.certifications.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Certifications' : 'Certifications'}
              </Text>
            </View>
            {resume.certifications.map((cert, idx) => {
              const certUrl = normalizeUrl(cert.credentialUrl);
              return (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletSymbol}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={{ fontFamily: fontBold }}>{cert.name}</Text> – {cert.issuingOrg} ({cert.issueDate})
                    {certUrl && (
                      <Link src={certUrl} style={styles.projectLink}>
                        {' '}[Verify]
                      </Link>
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 8. Achievements (omitted in single-page clean ATS template) */}
        {!isCompact && resume.achievements && resume.achievements.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>
                {isClassic ? 'Key Achievements' : 'Key Achievements'}
              </Text>
            </View>
            {resume.achievements.map((ach, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={{ fontFamily: fontBold }}>{ach.title}:</Text> {ach.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

/**
 * Generates an ATS-optimized, interactive vector PDF buffer from resume data.
 */
export async function generateResumePdf(
  resume: TailoredResume,
  profile: Profile,
  template: ResumeTemplate
): Promise<Buffer> {
  const docElement = React.createElement(ResumePdfDocument, {
    resume,
    profile,
    template,
  });

  return await renderToBuffer(docElement as any);
}
