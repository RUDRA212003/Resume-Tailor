import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getResolvedModel } from '@/lib/ai/geminiClient';

export const dynamic = 'force-dynamic';

function cleanHtmlToText(html: string): string {
  let cleaned = html;

  // Remove script, style, noscript, svg, nav, footer, header tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
  cleaned = cleaned.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');
  cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');

  // Convert block breaks to newlines
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Normalize whitespace and blank lines
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.length > 0);

  return lines.join('\n');
}

function extractFromDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const candidate = parts[0] === 'jobs' || parts[0] === 'careers' ? parts[1] : parts[0];
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  } catch {}
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid web URL starting with http:// or https://' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // Fetch the webpage with browser-like headers
    let html = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(trimmedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Webpage returned status ${res.status}`);
      }
      html = await res.text();
    } catch (fetchErr: any) {
      console.warn('Direct fetch failed, returning domain hint:', fetchErr.message);
      return NextResponse.json(
        {
          error: `Could not fetch job posting from URL (${fetchErr.message}). You can copy and paste the job description text manually.`,
          domainHint: extractFromDomain(trimmedUrl),
        },
        { status: 422 }
      );
    }

    // Try extracting JSON-LD JobPosting schema
    let jsonLdCompany = '';
    let jsonLdTitle = '';
    let jsonLdLocation = '';
    let jsonLdDescription = '';

    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        try {
          const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const parsed = JSON.parse(content);
          const item = parsed['@type'] === 'JobPosting' ? parsed : parsed['@graph']?.find((g: any) => g['@type'] === 'JobPosting');
          if (item) {
            jsonLdTitle = item.title || item.name || '';
            jsonLdCompany = item.hiringOrganization?.name || '';
            if (item.jobLocation?.address) {
              const a = item.jobLocation.address;
              jsonLdLocation = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
            }
            if (item.description) {
              jsonLdDescription = cleanHtmlToText(item.description);
            }
            break;
          }
        } catch {}
      }
    }

    // Extract Meta and Title tags
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawPageTitle = titleMatch ? titleMatch[1].trim() : '';

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';

    const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
    const ogSiteName = ogSiteNameMatch ? ogSiteNameMatch[1].trim() : '';

    const cleanText = cleanHtmlToText(html);

    // Limit text size for AI processing
    const sampleText = cleanText.slice(0, 14000);

    // Try Gemini AI extraction
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `
You are a precise job description parser.
Analyze this webpage content from: ${trimmedUrl}
Page Title: "${rawPageTitle || ogTitle}"
Site: "${ogSiteName}"

Scraped Text:
${sampleText}

Extract the exact:
1. companyName: The company or organization hiring (e.g. "Stripe", "Google", "Airbnb"). If not explicitly named, infer from title or domain.
2. jobTitle: The job position/role (e.g. "Senior Software Engineer", "Backend Developer").
3. location: The location (e.g. "Bangalore, India", "San Francisco, CA", "Remote").
4. jobDescription: The full job description text, including overview, responsibilities, requirements, and qualifications. Clean and readable, free of website navigation menus.

Respond ONLY with valid JSON matching this schema:
{
  "companyName": "string",
  "jobTitle": "string",
  "location": "string",
  "jobDescription": "string"
}
`;

        const response = await gemini.models.generateContent({
          model: getResolvedModel(),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const rawJson = response.text?.trim() || '';
        const parsed = JSON.parse(rawJson);

        if (parsed.companyName || parsed.jobTitle || parsed.jobDescription) {
          return NextResponse.json({
            success: true,
            companyName: parsed.companyName || jsonLdCompany || ogSiteName || extractFromDomain(trimmedUrl),
            jobTitle: parsed.jobTitle || jsonLdTitle || ogTitle || rawPageTitle,
            location: parsed.location || jsonLdLocation || 'Remote / Hybrid',
            jobDescription: parsed.jobDescription || jsonLdDescription || sampleText.slice(0, 5000),
            url: trimmedUrl,
          });
        }
      } catch (aiErr) {
        console.warn('Gemini JD parsing failed, falling back to heuristic parsing:', aiErr);
      }
    }

    // Heuristic Fallback
    const domainCompany = extractFromDomain(trimmedUrl);
    const company = jsonLdCompany || ogSiteName || domainCompany || 'Target Company';
    let title = jsonLdTitle || ogTitle || rawPageTitle;
    if (title.includes('|')) title = title.split('|')[0].trim();
    if (title.includes('-')) title = title.split('-')[0].trim();

    return NextResponse.json({
      success: true,
      companyName: company,
      jobTitle: title || 'Software Engineer',
      location: jsonLdLocation || 'Remote / Hybrid',
      jobDescription: jsonLdDescription || sampleText.slice(0, 5000),
      url: trimmedUrl,
    });
  } catch (error: any) {
    console.error('Error fetching JD URL:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching the job posting URL.' },
      { status: 500 }
    );
  }
}

