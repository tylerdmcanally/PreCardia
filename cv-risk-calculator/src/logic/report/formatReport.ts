import { ClinicalReport } from '../../types';
import { GUIDELINE_REFERENCES } from '../../data/guidelines';

export function formatReportAsText(report: ClinicalReport): string {
  let output = '';

  // Header
  output += '═'.repeat(60) + '\n';
  output += 'CARDIOVASCULAR RISK OPTIMIZATION SUMMARY\n';
  output += '═'.repeat(60) + '\n';
  output += report.header + '\n\n';

  // Clinical Summary
  output += 'CLINICAL SUMMARY\n';
  output += report.riskProfile + '\n\n';

  // Recommendations by Domain
  output += '─'.repeat(60) + '\n';
  output += 'RECOMMENDATIONS BY CLINICAL DOMAIN\n';
  output += '─'.repeat(60) + '\n\n';

  report.domains.forEach((domain) => {
    if (domain.recommendations.length === 0) return;

    output += `${domain.displayName}`;
    if (domain.currentStatus) {
      output += ` [${domain.currentStatus}]`;
    }
    output += '\n\n';

    domain.recommendations.forEach((rec) => {
      output += `[${rec.priority} PRIORITY]\n`;
      output += `• ${rec.action} ${rec.medication}`;

      if (rec.currentDose) {
        output += ` ${rec.currentDose} to ${rec.recommendedDose}`;
      } else if (rec.recommendedDose) {
        output += ` ${rec.recommendedDose}`;
      }

      // Add indicator for complex medication changes requiring careful attention
      const hasComplexGuidance =
        (rec.monitoring && (rec.monitoring.includes('DISCONTINUE') || rec.monitoring.includes('CRITICAL') || rec.monitoring.includes('HOLD'))) ||
        (rec.additionalNotes && (rec.additionalNotes.includes('CRITICAL') || rec.additionalNotes.includes('medication error') || rec.additionalNotes.includes('wait 36 hours'))) ||
        (rec.rationale && (rec.rationale.includes('CONTRAINDICATED') || rec.rationale.includes('TRIPLE THERAPY')));

      if (hasComplexGuidance) {
        output += ' *** SEE CRITICAL GUIDANCE BELOW ***';
      }

      output += '\n';

      if (rec.rationale) {
        output += `  Rationale: ${rec.rationale}\n`;
      }

      if (rec.evidence) {
        output += `  Evidence: ${rec.evidence}\n`;
      }

      if (rec.monitoring) {
        output += `  Monitor: ${rec.monitoring}\n`;
      }

      if (rec.additionalNotes) {
        output += `  Note: ${rec.additionalNotes}\n`;
      }

      output += '\n';
    });
  });

  // Monitoring Plan
  output += '─'.repeat(60) + '\n';
  output += 'MONITORING PLAN\n';
  output += '─'.repeat(60) + '\n\n';

  if (report.monitoringPlan.shortTerm.length > 0) {
    report.monitoringPlan.shortTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      if (item.action) {
        output += `  Action: ${item.action}\n`;
      }
      output += '\n';
    });
  }

  if (report.monitoringPlan.mediumTerm.length > 0) {
    report.monitoringPlan.mediumTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      if (item.action) {
        output += `  Action: ${item.action}\n`;
      }
      output += '\n';
    });
  }

  if (report.monitoringPlan.longTerm.length > 0) {
    report.monitoringPlan.longTerm.forEach((item) => {
      output += `${item.timing}:\n`;
      item.tests.forEach((test) => {
        output += `• ${test}\n`;
      });
      if (item.purpose) {
        output += `  Purpose: ${item.purpose}\n`;
      }
      output += '\n';
    });
  }

  // Follow-up Plan
  output += '─'.repeat(60) + '\n';
  output += 'FOLLOW-UP PLAN\n';
  output += '─'.repeat(60) + '\n';
  output += report.followUpPlan + '\n\n';

  // References
  output += '─'.repeat(60) + '\n';
  output += 'EVIDENCE REFERENCES\n';
  output += '─'.repeat(60) + '\n\n';
  output += report.references;
  output += '\nNOTE: URLs above are clickable links when viewed digitally.\n';
  output += 'Copy report text to access full guideline documents.\n\n';

  // Disclaimer
  output += '─'.repeat(60) + '\n';
  output += 'DISCLAIMER\n';
  output += '─'.repeat(60) + '\n';
  output += `This report represents clinical decision support based on current evidence-based guidelines. All recommendations should be verified and individualized based on clinical judgment, patient preferences, complete medication history, and contraindications not captured in this assessment. This tool does not replace comprehensive clinical evaluation.\n`;

  return output;
}
