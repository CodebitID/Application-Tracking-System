import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../config';

export const aiRouter = Router();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return aiClient;
}

aiRouter.post('/api/gemini/assist', async (req, res) => {
  try {
    const {
      action,
      job,
      companyDescription,
      userHighlights,
      tone,
      candidateName,
      candidateRole,
    } = req.body;

    if (!job || !action) {
      return res.status(400).json({ error: 'Missing action or job information' });
    }

    const ai = getGeminiClient();
    const candidateDisplayName = candidateName || 'Candidate';
    const selectedTone = tone || 'Professional & Impactful';

    if (!ai) {
      // Graceful fallback templates when GEMINI_API_KEY is not set
      if (action === 'cover_letter') {
        return res.json({
          result: `Dear Hiring Team at ${job.companyName},

I am writing to express my strong interest in the ${job.jobTitle} position at ${job.companyName}. With extensive background as a ${candidateRole || job.jobTitle}, I have dedicated my career to driving high-impact initiatives and building scalable solutions.

${userHighlights ? `Throughout my career:\n${userHighlights}\n` : `At ${job.companyName}, I look forward to bringing deep experience in technical excellence, cross-functional collaboration, and strategic execution to your team.`}

${companyDescription ? `I have closely followed ${job.companyName}'s mission (${companyDescription}) and am inspired by your team's dedication to innovation.\n` : `I am deeply inspired by ${job.companyName}'s growth and product direction.`}

I would welcome the opportunity to discuss how my experience and passion can support ${job.companyName}'s upcoming goals. Thank you for your time and consideration.

Sincerely,
${candidateDisplayName}`,
          isFallback: true,
        });
      } else if (action === 'checklist_suggest') {
        return res.json({
          tasks: [
            {
              id: `prep-gen-1`,
              task: `Deep dive into ${job.companyName}'s product line, recent updates, and tech stack`,
              category: 'Research',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-2`,
              task: `Prepare 2 technical architecture stories relevant to ${job.jobTitle}`,
              category: 'STAR Stories',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-3`,
              task: `Draft questions regarding ${job.companyName}'s engineering culture and roadmap`,
              category: 'Questions',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-4`,
              task: `Review compensation benchmarks and remote contract structures`,
              category: 'Research',
              isCompleted: false,
              isCustom: true,
            },
          ],
          isFallback: true,
        });
      } else if (action === 'followup') {
        return res.json({
          result: `Subject: Following Up: ${job.jobTitle} Application - [Your Name]\n\nHi Hiring Team,\n\nI hope you're having a wonderful week. I wanted to follow up on my application for the ${job.jobTitle} position at ${job.companyName} submitted on ${job.dateApplied || 'recent date'}.\n\nI remain very enthusiastic about the opportunity to contribute to ${job.companyName}'s growth and would love to discuss how my skill set aligns with your team's goals.\n\nThank you for your time and consideration,\n[Your Name]`,
          isFallback: true,
        });
      } else if (action === 'interview_prep') {
        return res.json({
          result: `### Interview Preparation Guide for ${job.jobTitle} at ${job.companyName}\n\n` +
            `**Key Focus Areas:**\n` +
            `- **Company Context**: Research ${job.companyName}'s latest products, market competitors, and remote workflows.\n` +
            `- **Role Expertise**: Prepare 2-3 STAR method stories demonstrating accomplishments in ${job.jobTitle} functions.\n` +
            `- **Strategic Questions to Ask:**\n` +
            `  1. "What are the biggest milestones expected for this ${job.jobTitle} role in the first 90 days?"\n` +
            `  2. "How does the team collaborate cross-functionally across remote locations?"\n` +
            `  3. "What does success look like for the upcoming quarter?"`,
          isFallback: true,
        });
      } else {
        return res.json({
          result: `### Strategic Insights for ${job.companyName}\n\nRole: ${job.jobTitle}\nLocation: ${job.location}\nTarget Salary: ${job.salary || 'Market Rate'}\n\nTip: Highlight measurable outcomes and specific portfolio case studies during conversations.`,
          isFallback: true,
        });
      }
    }

    let prompt = '';
    if (action === 'cover_letter') {
      prompt = `You are a world-class executive career coach and expert resume/cover-letter writer.
Write a standout, highly compelling, tailored cover letter for a candidate applying to this position.

Position Information:
- Target Company: ${job.companyName}
- Job Title: ${job.jobTitle}
- Job Location / Work Mode: ${job.location} (${job.isRemote ? 'Remote' : 'Onsite/Hybrid'})
- Job Type: ${job.jobType}
- Listed Salary / Level: ${job.salary || 'Competitive'}
- Job Context / Company Notes: ${companyDescription || job.notes || 'Growing industry leader'}

Candidate Profile:
- Candidate Name: ${candidateDisplayName}
- Target Role / Discipline: ${candidateRole || job.jobTitle}
- Candidate Highlights & Key Achievements:
${userHighlights || 'Experienced practitioner with track record of high ownership, technical competence, and collaborative team delivery.'}

Desired Tone: ${selectedTone}

Instructions:
1. Write in a modern, persuasive style that avoids generic clichés.
2. Include a compelling hook, 2 substantive body paragraphs highlighting measurable outcomes and relevant expertise matching ${job.companyName}, and a confident call to action.
3. Ready to send immediately.`;
    } else if (action === 'checklist_suggest') {
      prompt = `You are a senior interview coach. Generate 4 to 6 specific, actionable interview preparation checklist tasks for:
- Role: ${job.jobTitle}
- Company: ${job.companyName}
- Location: ${job.location}

Return ONLY a valid JSON array of objects with the schema:
[
  {
    "task": "Specific actionable preparation task",
    "category": "Research" | "STAR Stories" | "Questions" | "Technical" | "Logistics"
  }
]`;
    } else if (action === 'followup') {
      prompt = `You are an expert career coach. Write a polite, high-converting professional follow-up email for:
- Company: ${job.companyName}
- Job Title: ${job.jobTitle}
- Date Applied: ${job.dateApplied || 'Recently'}
- Location: ${job.location}
- Status: ${job.status}`;
    } else if (action === 'interview_prep') {
      prompt = `Generate an interview preparation dossier for:
- Company: ${job.companyName}
- Role: ${job.jobTitle}
- Job Type: ${job.jobType}
- Target Salary: ${job.salary || 'Competitive'}`;
    } else if (action === 'salary_negotiation') {
      prompt = `Provide a tailored salary negotiation strategy for:
- Role: ${job.jobTitle} at ${job.companyName}
- Listed / Current Salary: ${job.salary}
- Location: ${job.location}`;
    } else {
      prompt = `Provide 3 actionable tips to strengthen an application for ${job.jobTitle} at ${job.companyName}.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';

    if (action === 'checklist_suggest') {
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const tasks = parsed.map((t: any, i: number) => ({
            id: `prep-gen-${Date.now()}-${i}`,
            task: t.task || 'Review role details',
            category: t.category || 'Research',
            isCompleted: false,
            isCustom: true,
          }));
          return res.json({ tasks });
        }
      } catch (err) {
        console.warn('Failed to parse AI checklist JSON:', err);
      }
    }

    return res.json({ result: responseText || 'No response generated.' });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
