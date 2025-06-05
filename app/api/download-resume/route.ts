import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { resumeData, format, fileName } = await request.json();

    if (format !== 'docx') {
      return NextResponse.json(
        { error: 'Only DOCX format is currently supported' },
        { status: 400 }
      );
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Create DOCX document that matches the preview exactly
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header with name and contact info
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: resumeData.personalInfo.name,
                  bold: true,
                  size: 32, // 16pt * 2 (docx uses half-points)
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Contact information
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${resumeData.personalInfo.email} • ${resumeData.personalInfo.phone}`,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: [
                    resumeData.personalInfo.location,
                    resumeData.personalInfo.linkedin,
                    resumeData.personalInfo.website
                  ].filter(Boolean).join(' • '),
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Professional Summary
            new Paragraph({
              children: [
                new TextRun({
                  text: 'PROFESSIONAL SUMMARY',
                  bold: true,
                  size: 22,
                  allCaps: true,
                }),
              ],
              spacing: { after: 200 },
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.professionalSummary,
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Professional Experience
            new Paragraph({
              children: [
                new TextRun({
                  text: 'PROFESSIONAL EXPERIENCE',
                  bold: true,
                  size: 22,
                  allCaps: true,
                }),
              ],
              spacing: { after: 200 },
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),

            // Experience entries
            ...resumeData.experience.flatMap((exp: any, index: number) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.title,
                    bold: true,
                    size: 22,
                  }),
                  new TextRun({
                    text: `\t\t${exp.startDate} - ${exp.endDate}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
                tabStops: [
                  {
                    type: "right",
                    position: 9000,
                  },
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.company} • ${exp.location}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),
              
              // Achievement bullets
              ...exp.achievements.map((achievement: string) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${achievement}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 100 },
                  indent: { left: 200 },
                })
              ),
              
              // Add space after each experience entry except the last
              ...(index < resumeData.experience.length - 1 ? [
                new Paragraph({
                  children: [new TextRun({ text: '' })],
                  spacing: { after: 200 },
                })
              ] : [])
            ]),

            // Education section
            new Paragraph({
              children: [
                new TextRun({
                  text: 'EDUCATION',
                  bold: true,
                  size: 22,
                  allCaps: true,
                }),
              ],
              spacing: { before: 400, after: 200 },
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),

            // Education entries
            ...resumeData.education.flatMap((edu: any) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: edu.degree,
                    bold: true,
                    size: 22,
                  }),
                  new TextRun({
                    text: `\t\t${edu.year}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
                tabStops: [
                  {
                    type: "right",
                    position: 9000,
                  },
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: edu.institution,
                    size: 20,
                  }),
                ],
                spacing: { after: edu.details ? 100 : 200 },
              }),
              
              ...(edu.details ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: edu.details,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 200 },
                })
              ] : [])
            ]),

            // Skills section
            new Paragraph({
              children: [
                new TextRun({
                  text: 'SKILLS',
                  bold: true,
                  size: 22,
                  allCaps: true,
                }),
              ],
              spacing: { before: 400, after: 200 },
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),

            // Technical Skills
            ...(resumeData.skills.technical?.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Technical Skills',
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resumeData.skills.technical.join(' • '),
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ] : []),

            // Certifications
            ...(resumeData.skills.certifications?.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Certifications',
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resumeData.skills.certifications.join(' • '),
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ] : []),

            // Additional Skills
            ...(resumeData.skills.otherRelevantSkills?.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Additional Skills',
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resumeData.skills.otherRelevantSkills.join(' • '),
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ] : []),
          ],
        },
      ],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the DOCX file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}.docx"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate download',
        details: error.message
      },
      { status: 500 }
    );
  }
} 