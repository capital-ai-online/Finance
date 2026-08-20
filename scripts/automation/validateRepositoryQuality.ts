import { createRepositoryQualityReport } from './repositoryQualityReport';

const report = createRepositoryQualityReport(process.cwd());
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.repositoryObservation.blocking || report.chapter12Validation.blocking || report.gateReport.blocking) {
  process.exitCode = 1;
}
