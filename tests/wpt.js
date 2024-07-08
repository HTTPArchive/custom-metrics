const WebPageTest = require('webpagetest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


class WPTTestRunner {
  constructor() {
    this.prBody = process.env.PR_BODY || '';
    this.wptServer = process.env.WPT_SERVER || 'webpagetest.httparchive.org';
    const wptApiKey = process.env.WPT_API_KEY;
    this.wpt = new WebPageTest(this.wptServer, wptApiKey);
    this.testResultsFile = 'comment.md';
    this.uploadArtifact = false;
  }

  /**
   * Get custom metrics from the dist folder
   * @returns {string[]} Custom metrics filenames
   */
  getCustomMetrics() {
    return fs.readdirSync('dist/', { withFileTypes: true })
      .filter(file => path.extname(file.name) === '.js')
      .map(file => path.basename(file.name, '.js'));
  }

  /**
   * Get changed custom metrics from the git diff
   * @returns {string[]} Changed custom metrics filenames
   */
  getChangedCustomMetrics() {
    const stdout = execSync('git diff --name-only --diff-filter=ACMRT origin/main', { encoding: 'utf-8' });
    return Array.from(new Set(stdout.split('\n')
      .filter(file => /^dist\/.*\.js$/.test(file))
      .map(file => path.basename(file, '.js'))))
      .sort();
  }

  /**
   * Check if the test results are too big for a comment
   * @param {number} stringLength Length of the test results string
   */
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
      fs.appendFileSync(this.testResultsFile, `Webpage test results are too big for a comment, and are available as [the action's artifact]({artifact-url}).`);
      this.testResultsFile = artifactFile;
    }
  }

  /**
   * Run a WebPageTest test and wait for the results
   * @param {string} url URL to test
   * @param {object} options WebPageTest options
   * @returns {Promise<object>} Test results
   */
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


  /**
   * Run a WebPageTest test for a given URL
   * @param {string} url URL to test
   * @returns {Promise<object>} Custom metrics
   */
  async runWPTTest(url) {
    console.log(`::group::WPT test run for ${url} started`);
    const customMetrics = this.getCustomMetrics();
    const metricsToLog = this.getChangedCustomMetrics();
    const options = { http_method: 'POST', custom: '' };

    customMetrics.forEach(metricName => {
      options.custom += `[_${metricName}]\n${fs.readFileSync(`./dist/${metricName}.js`, 'utf-8')}\n`;
    });

    try {
      const response = await this.runTestAndWait(url, options);

      if (response.statusCode !== 200) {
        throw new Error(`WPT test run for ${url} failed: ${response.statusText}`);
      }

      const metricsObject = this.extractMetrics(response.data.runs['1'].firstView, customMetrics);
      const metricsToLogObject = this.extractLogMetrics(metricsObject, metricsToLog);
      const metricsToLogString = JSON.stringify(metricsToLogObject, null, 2);

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
      return metricsObject;
    } catch (error) {
      console.error(`WPT test run for ${url} failed:`, error);
      console.log('::endgroup::');
      return null;
    }
  }

  /**
   * Extract custom metrics from the test results
   * @param {object} firstViewData First view data
   * @param {string[]} customMetrics Custom metrics filenames
   * @returns {object} Custom metrics
   */
  extractMetrics(firstViewData, customMetrics) {
    const wptCustomMetrics = {};

    customMetrics.forEach(metricName => {
      let wptCustomMetric = firstViewData[`_${metricName}`];
      try {
        if (typeof wptCustomMetric === 'string') {
          wptCustomMetric = JSON.parse(wptCustomMetric);
        }
      } catch (e) { }
      wptCustomMetrics[`_${metricName}`] = wptCustomMetric;
    });

    return wptCustomMetrics;
  }

  /**
   * Extract custom metrics to log from the test results
   * @param {object} wptCustomMetrics Custom metrics
   * @param {string[]} metricsToLog Changed custom metrics filenames
   * @returns {object} Custom metrics to log
   */
  extractLogMetrics(wptCustomMetrics, metricsToLog) {
    const wptCustomMetricsToLog = {};

    metricsToLog.forEach(metricName => {
      wptCustomMetricsToLog[`_${metricName}`] = wptCustomMetrics[`_${metricName}`];
    });

    return wptCustomMetricsToLog;
  }

  /**
   * Get test websites from the PR description body
   * @returns {string[]} Test websites
   */
  getTestWebsites() {
    const urlPattern = /\b((http|https):\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(\/[a-zA-Z0-9_.-]*)*(\?[a-zA-Z0-9_.-]+=[a-zA-Z0-9%_.-]*)?(\#?[a-zA-Z0-9%_.=-]*)?)\b/;
    return this.prBody.split(/\r?\n/).reduce((urls, line, index, lines) => {
      if (line.includes('**Test websites**:')) {
        for (let i = index + 1; i < lines.length; i++) {
          const match = lines[i].match(urlPattern);
          if (match) {
            urls.push(match[1]);
          }
        }
      }
      return urls;
    }, []);
  }

  /**
   * Run all test websites from the PR description body
   */
  async runTests() {
    if (!this.prBody) {
      console.log('No PR description body found.');
    }

    const urls = this.getTestWebsites();
    if (urls.length > 0) {
      for (const url of urls) {
        await this.runWPTTest(url);
      }
    } else {
      console.log('No test websites found.');
    }
  }
}


// Run the tests from the command line
if (require.main === module) {
  const runner = new WPTTestRunner();
  runner.runTests();

  // Run a single test from the command line
  const url = process.argv[2]
  if (url) {
    runner.runWPTTest(url);
  }
}

module.exports = { WPTTestRunner };
