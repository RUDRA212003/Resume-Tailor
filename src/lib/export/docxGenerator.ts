import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ExternalHyperlink,
} from 'docx';
import type { TailoredResume, Profile, ResumeTemplate } from '@/types';

/**
 * Builds a professional, ATS-optimized Microsoft Word (.docx) document
 * from the tailored resume data and profile.
 */
export async function generateResumeDocx(
  resume: TailoredResume,
  profile: Profile,
  template: ResumeTemplate
): Promise<Buffer> {
  const accentHex = template.accentColor ? template.accentColor.replace('#', '') : '0066CC';
  const textDarkHex = '1D1D1F';
  const textMutedHex = '555555';
  const fontFamily = template.layoutType === 'classic' ? 'Georgia' : 'Arial';

  const docChildren: (Paragraph | Table)[] = [];

  // Helper for section headings
  function createSectionHeading(title: string): Paragraph {
    if (template.layoutType === 'classic') {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        border: {
          bottom: {
            color: textMutedHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22,
            font: fontFamily,
            color: textDarkHex,
          }),
        ],
      });
    }

    // Modern / Tech / Compact styling
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: {
        bottom: {
          color: accentHex,
          space: 4,
          style: BorderStyle.SINGLE,
          size: 10,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: fontFamily,
          color: accentHex,
        }),
      ],
    });
  }

  // 1. Header (Exact replica matching Image 2: Name + clear line space + Phone, Email, LinkedIn, Portfolio)
  const isCompactDocx = template.layoutType === 'compact' || template.id === 'tmpl-single-page-ats';
  const contactRuns: (TextRun | ExternalHyperlink)[] = [];

  if (profile.personalInfo.phone) {
    contactRuns.push(
      new TextRun({
        text: profile.personalInfo.phone,
        size: 18,
        font: fontFamily,
        color: textDarkHex,
      })
    );
  }

  if (profile.personalInfo.email) {
    if (contactRuns.length > 0) {
      contactRuns.push(new TextRun({ text: '   •   ', size: 18, font: fontFamily, color: textMutedHex }));
    }
    contactRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: profile.personalInfo.email,
            size: 18,
            font: fontFamily,
            color: textDarkHex,
          }),
        ],
        link: `mailto:${profile.personalInfo.email}`,
      })
    );
  }

  if (profile.personalInfo.linkedinUrl) {
    if (contactRuns.length > 0) {
      contactRuns.push(new TextRun({ text: '   •   ', size: 18, font: fontFamily, color: textMutedHex }));
    }
    contactRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: 'LinkedIn',
            size: 18,
            font: fontFamily,
            color: '0066CC',
            underline: {},
          }),
        ],
        link: profile.personalInfo.linkedinUrl,
      })
    );
  }

  if (profile.personalInfo.portfolioUrl) {
    if (contactRuns.length > 0) {
      contactRuns.push(new TextRun({ text: '   •   ', size: 18, font: fontFamily, color: textMutedHex }));
    }
    contactRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: 'Portfolio',
            size: 18,
            font: fontFamily,
            color: '0066CC',
            underline: {},
          }),
        ],
        link: profile.personalInfo.portfolioUrl,
      })
    );
  }

  if (!isCompactDocx && profile.personalInfo.githubUrl) {
    if (contactRuns.length > 0) {
      contactRuns.push(new TextRun({ text: '   •   ', size: 18, font: fontFamily, color: textMutedHex }));
    }
    contactRuns.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: 'GitHub',
            size: 18,
            font: fontFamily,
            color: '0066CC',
            underline: {},
          }),
        ],
        link: profile.personalInfo.githubUrl,
      })
    );
  }

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }, // Generous line space after candidate name
      children: [
        new TextRun({
          text: profile.personalInfo.fullName,
          bold: true,
          size: 32,
          font: fontFamily,
          color: textDarkHex,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: contactRuns,
    })
  );

  // 2. Summary
  if (resume.summary) {
    docChildren.push(createSectionHeading('Professional Summary'));
    docChildren.push(
      new Paragraph({
        spacing: { after: 140, line: 260 },
        children: [
          new TextRun({
            text: resume.summary,
            size: 20,
            font: fontFamily,
            color: textDarkHex,
          }),
        ],
      })
    );
  }

  // 3. Technical Skills
  if (resume.selectedSkills && resume.selectedSkills.length > 0) {
    docChildren.push(
      createSectionHeading(
        template.layoutType === 'classic' ? 'TECHNICAL SKILLS' : 'Technical Skills'
      )
    );

    resume.selectedSkills.forEach((catGroup) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${catGroup.category}: `,
              bold: true,
              size: 19,
              font: fontFamily,
              color: textDarkHex,
            }),
            new TextRun({
              text: Array.isArray(catGroup.skills)
                ? catGroup.skills
                    .map((s: any) => (typeof s === 'string' ? s : s?.name || ''))
                    .filter(Boolean)
                    .join(', ')
                : typeof (catGroup as any).name === 'string'
                ? (catGroup as any).name
                : '',
              size: 19,
              font: fontFamily,
              color: textDarkHex,
            }),
          ],
        })
      );
    });
  }

  // 4. Work Experience
  if (resume.selectedExperiences && resume.selectedExperiences.length > 0) {
    docChildren.push(
      createSectionHeading(
        template.layoutType === 'classic' ? 'EXPERIENCE' : 'Professional Experience'
      )
    );

    resume.selectedExperiences.forEach((exp) => {
      // Job title, Company, Dates
      docChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `${exp.company}`,
              bold: true,
              size: 20,
              font: fontFamily,
              color: textDarkHex,
            }),
            new TextRun({
              text: `  (${exp.startDate} – ${exp.endDate})`,
              size: 18,
              font: fontFamily,
              color: textMutedHex,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: exp.jobTitle,
              italics: true,
              size: 19,
              font: fontFamily,
              color: accentHex,
            }),
            new TextRun({
              text: `  — ${exp.location}`,
              size: 18,
              font: fontFamily,
              color: textMutedHex,
            }),
          ],
        })
      );

      // Bullets
      exp.bullets.forEach((b) => {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50, line: 240 },
            children: [
              new TextRun({
                text: b.text,
                size: 19,
                font: fontFamily,
                color: textDarkHex,
              }),
            ],
          })
        );
      });
    });
  }

  // 5. Projects
  if (resume.selectedProjects && resume.selectedProjects.length > 0) {
    docChildren.push(
      createSectionHeading(
        template.layoutType === 'classic' ? 'PROJECTS' : 'Key Projects'
      )
    );

    resume.selectedProjects.forEach((proj) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 30 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: 20,
              font: fontFamily,
              color: textDarkHex,
            }),
            ...(Array.isArray(proj.technologies) && proj.technologies.length > 0
              ? [
                  new TextRun({
                    text: ` | ${proj.technologies.join(', ')}`,
                    size: 18,
                    font: fontFamily,
                    color: textMutedHex,
                  }),
                ]
              : []),
            ...(proj.duration
              ? [
                  new TextRun({
                    text: `  (${proj.duration})`,
                    size: 18,
                    font: fontFamily,
                    color: textMutedHex,
                  }),
                ]
              : []),
          ],
        })
      );

      if (proj.description) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: proj.description,
                italics: true,
                size: 18,
                font: fontFamily,
                color: textMutedHex,
              }),
            ],
          })
        );
      }

      proj.bullets.forEach((b) => {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50, line: 240 },
            children: [
              new TextRun({
                text: b.text,
                size: 19,
                font: fontFamily,
                color: textDarkHex,
              }),
            ],
          })
        );
      });
    });
  }

  // 6. Education
  if (resume.education && resume.education.length > 0) {
    docChildren.push(
      createSectionHeading(template.layoutType === 'classic' ? 'EDUCATION' : 'Education')
    );

    resume.education.forEach((edu) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 30 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.branch}`,
              bold: true,
              size: 20,
              font: fontFamily,
              color: textDarkHex,
            }),
            new TextRun({
              text: ` — ${edu.institution}`,
              size: 19,
              font: fontFamily,
              color: textDarkHex,
            }),
            new TextRun({
              text: `  (${edu.startYear} – ${edu.graduationYear})`,
              italics: true,
              size: 18,
              font: fontFamily,
              color: textMutedHex,
            }),
          ],
        })
      );

      if (edu.cgpaOrPercentage || edu.additionalInfo) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: [
                  edu.cgpaOrPercentage ? `GPA: ${edu.cgpaOrPercentage}` : '',
                  edu.additionalInfo || '',
                ]
                  .filter(Boolean)
                  .join('  •  '),
                size: 18,
                font: fontFamily,
                color: textMutedHex,
              }),
            ],
          })
        );
      }
    });
  }

  // 7. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    docChildren.push(createSectionHeading('Certifications & Credentials'));

    resume.certifications.forEach((cert) => {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${cert.name} `,
              bold: true,
              size: 19,
              font: fontFamily,
              color: textDarkHex,
            }),
            new TextRun({
              text: `— ${cert.issuingOrg} (${cert.issueDate})`,
              size: 18,
              font: fontFamily,
              color: textMutedHex,
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
