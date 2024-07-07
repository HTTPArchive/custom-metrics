const WebPageTest = require('webpagetest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setGithubActionOutput(name, value) {
  const githubOutputFile = process.env.GITHUB_OUTPUT;
  if (githubOutputFile) {
    const outputString = `${name}=${value}\n`;
    fs.appendFile(githubOutputFile, outputString);
  }
}

class WPTTestRunner {
  constructor(prBody, wptServer, wptApiKey) {
    this.prBody = prBody || '';
    this.wpt = new WebPageTest(wptServer, wptApiKey);
    this.testResultsFile = 'comment.md';
    this.uploadArtifact = false;
  }

  getCustomMetrics() {
    return fs.readdirSync('dist/', { withFileTypes: true })
      .filter(file => path.extname(file.name) === '.js')
      .map(file => path.basename(file.name, '.js'));
  }

  getChangedCustomMetrics() {
    const stdout = execSync('git diff --name-only --diff-filter=ACMRT origin/main', { encoding: 'utf-8' });
    return Array.from(new Set(stdout.split('\n')
      .filter(file => /^dist\/.*\.js$/.test(file))
      .map(file => path.basename(file, '.js'))))
      .sort();
  }

  checkCommentSize(stringLength) {
    let commentSize = 0;
    try {
      commentSize = fs.statSync(testResultsFile).size;
    } catch (err) { }

    if (commentSize + stringLength > 65536) {
      const artifactFile = 'artifact.md';
      this.uploadArtifact = true;
      if (commentSize > 0) {
        fs.renameSync(this.testResultsFile, artifactFile);
      }
      fs.appendFileSync(this.testResultsFile, `Test results are too big for a comment, and are available in the action artifact.`);
      this.testResultsFile = artifactFile;
    }
  }

  async runWPTTest(url) {
    console.log(`::group::WPT test run for ${url} started`);
    const customMetrics = this.getCustomMetrics();
    const metricsToLog = this.getChangedCustomMetrics();
    const options = { key: this.wpt.apiKey, http_method: 'POST', custom: '' };

    customMetrics.forEach(metricName => {
      options.custom += `[_${metricName}]\n${fs.readFileSync(`./dist/${metricName}.js`, 'utf-8')}\n`;
    });

    try {
      const response = await this.runTestAndWait(url, options);

      if (response.statusCode !== 200) {
        throw new Error(`WPT test run for ${url} failed: ${response.statusText}`);
      }

      const metricsToLogString = JSON.stringify(
        this.extractMetrics(response.data.runs['1'].firstView, customMetrics, metricsToLog), null, 2
      );

      if (!this.uploadArtifact) {
        this.checkCommentSize(metricsToLogString.length);
      }

      fs.appendFileSync(this.testResultsFile, `<details>
<summary><strong>Custom metrics for ${url}</strong></summary>

WPT test run results: ${response.data.summary}
Changed custom metrics values:
\`\`\`json
${metricsToLogString}
\`\`\`
</details>\n\n`);

      console.log('::endgroup::');
    } catch (error) {
      console.error(`WPT test run for ${url} failed:`, error);
    }
  }

  runTestAndWait(url, options) {
    return new Promise((resolve, reject) => {
      this.wpt.runTestAndWait(url, options, (error, response) => {
        if (error || response.statusCode !== 200) {
          reject(error || response);
        } else {
          resolve(response);
        }
      });
    });
  }

  extractMetrics(firstViewData, customMetrics, metricsToLog) {
    const wptCustomMetrics = {};
    const wptCustomMetricsToLog = {};

    customMetrics.forEach(metricName => {
      let wptCustomMetric = firstViewData[`_${metricName}`];
      try {
        if (typeof wptCustomMetric === 'string') {
          wptCustomMetric = JSON.parse(wptCustomMetric);
        }
      } catch (e) { }

      wptCustomMetrics[`_${metricName}`] = wptCustomMetric;
      if (metricsToLog.includes(metricName)) {
        wptCustomMetricsToLog[`_${metricName}`] = wptCustomMetric;
      }
    });

    return wptCustomMetricsToLog;
  }

  getTestWebsites() {
    const urlPattern = /((http|https):\/\/[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,4})(\/[a-zA-Z0-9_.-]+)*(\/?)(\?[a-zA-Z0-9_.-]+=[a-zA-Z0-9%_.-]+)*(\#?)([a-zA-Z0-9%_.-=]+)*)/;
    if (!this.prBody) {
      console.log('No PR description body found.');
      return [];
    }
    return this.prBody.split(/\r?\n/).reduce((urls, line, index, lines) => {
      if (line.includes('**Test websites**:')) {
        for (let i = index + 1; i < lines.length; i++) {
          const match = lines[i].match(urlPattern);
          if (match) {
            urls.push(match[1]);
          }
        }
      }
      if (urls.length = 0) {
        console.log('No test websites found in PR description body.');
      }
      return urls;
    }, []);
  }

  async runTests() {
    const urls = this.getTestWebsites();
    if (urls.length > 0) {
      for (const url of urls) {
        await this.runWPTTest(url);
      }
    }
  }
}

function main() {
  const prBody = process.env.PR_BODY || '';
  const wptServer = process.env.WPT_SERVER;
  const wptApiKey = process.env.WPT_API_KEY;

  const runner = new WPTTestRunner(prBody, wptServer, wptApiKey);
  runner.runTests();

  const url = process.argv[2];
  if (url) {
    runner.runWPTTest(url);
  }
}

if (require.main === module) {
  main();
}

module.exports = { WPTTestRunner };
