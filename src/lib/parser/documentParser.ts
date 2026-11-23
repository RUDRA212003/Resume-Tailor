import mammoth from 'mammoth';

export interface DocumentParseResult {
  text: string;
  wordCount: number;
  characterCount: number;
  isScannedOrUnreadable: boolean;
  warning?: string;
}

/**
 * Extracts raw text from DOCX buffer using mammoth.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (text.length === 0 || wordCount < 10) {
      return {
        text: '',
        wordCount: 0,
        characterCount: 0,
        isScannedOrUnreadable: true,
        warning: 'The uploaded DOCX file appears to be empty or contains no selectable text.',
      };
    }

    return {
      text,
      wordCount,
      characterCount: text.length,
      isScannedOrUnreadable: false,
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return {
      text: '',
      wordCount: 0,
      characterCount: 0,
      isScannedOrUnreadable: true,
      warning: 'Failed to read the DOCX file. Please verify it is a valid, uncorrupted Microsoft Word document.',
    };
  }
}

/**
 * Extracts text from PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    // Dynamically require pdf-parse to avoid bundling issues in certain environments
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Check if scanned/unreadable
    if (text.length === 0 || wordCount < 15) {
      return {
        text: '',
        wordCount: 0,
        characterCount: 0,
        isScannedOrUnreadable: true,
        warning:
          'This PDF appears to be a scanned image or contains non-selectable text. ResumeCraft requires selectable text to ensure factual accuracy. Please upload a digital text-based PDF or paste the text directly.',
      };
    }

    return {
      text,
      wordCount,
      characterCount: text.length,
      isScannedOrUnreadable: false,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      text: '',
      wordCount: 0,
      characterCount: 0,
      isScannedOrUnreadable: true,
      warning:
        'Could not parse the PDF document. It may be password-protected or contain image-only scans. Please upload a standard text PDF or paste the text directly.',
    };
  }
}

/**
 * Parser for importing existing resume text into structured profile candidate fields.
 */
export function parseResumeTextToProfile(rawText: string) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract email, phone, links via regex
  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/github\.com\/[\w-]+/i);

  // Simple heuristic for name: first non-empty line without common headers
  let detectedName = 'Candidate Name';
  if (lines.length > 0 && !lines[0].includes('@') && lines[0].length < 40) {
    detectedName = lines[0];
  }

  // Detect skills keywords commonly in resumes
  const commonTech = [
    'Java', 'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js', 'Node.js',
    'Express', 'Spring Boot', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'Docker', 'AWS', 'Git', 'HTML5', 'CSS3', 'Tailwind CSS', 'JUnit', 'Jest',
    'C++', 'C#', 'Go', 'Kubernetes', 'GraphQL', 'REST APIs',
  ];

  const detectedSkills = commonTech.filter((tech) => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(rawText);
  });

  return {
    fullName: detectedName,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    linkedinUrl: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
    githubUrl: githubMatch ? `https://${githubMatch[0]}` : '',
    detectedSkills,
  };
}
