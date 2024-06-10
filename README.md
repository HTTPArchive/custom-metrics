# Custom metrics

## Adding a new custom metric

HTTP Archive uses WebPageTest (WPT) to collect information about how web pages are built. WPT is able to run arbitrary JavaScript at the end of a test to collect specific data, known as custom metrics. See the [WPT custom metrics documentation](https://docs.webpagetest.org/custom-metrics/) for more info.

To add a new custom metric to HTTP Archive:

0. Select the appropriate `js` file. Some custom metrics are small and single-purpose while others return many metrics for a given topic, like [`media.js`](./dist/media.js) and [`almanac.js`](./dist/almanac.js). Create a new file if you're not sure where your script belongs.

1. For scripts that return a JSON object, the key should be named according to what it's measuring, for example `meta-nodes` returns an array of all `<meta>` nodes and their attributes:

    ```js
    return JSON.stringify({
      'meta-nodes': (() => {
        // Returns a JSON array of meta nodes and their key/value attributes.
        var nodes = document.querySelectorAll('head meta');
        var metaNodes = parseNodes(nodes);

        return metaNodes;
      })(),

      //  check if there is any picture tag containing an img tag
      'has_picture_img': document.querySelectorAll('picture img').length > 0
    });
    ```

2. Test your changes on WPT using the workflow below.

3. Submit a pull request. Include one or more links to test results in your PR description to verify that the script is working.

## Custom WPT data objects

The following objects are available for use in custom metrics:

- `$WPT_REQUESTS` - All request data except for bodies (significantly smaller)
- `$WPT_BODIES` - All request data including bodies in the "response_body" entry
- `$WPT_ACCESSIBILITY_TREE` - Array of the nodes of the Chromium Accessibility tree (with the DOM node info recorded in node_info for each node in the array)
- `$WPT_COOKIES` - Array of cookies set by the page
- `$WPT_DNS` - Array of DNS records for the page

More details can be found in the [WPT custom metrics documentation](https://docs.webpagetest.org/custom-metrics/).

You can explore them by running WPT with the following custom metric:

```js
[custom_wpt_objects]
return {
  requests: $WPT_REQUESTS,
  bodies: $WPT_BODIES,
  accessibility: $WPT_ACCESSIBILITY_TREE,
  cookies: $WPT_COOKIES,
  dns: $WPT_DNS
};
```

## Testing

### Manual testing using webpagetest.org website

To test a custom metric, for example [`doctype.js`](https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/doctype.js), you can enter the script directly on [webpagetest.org](https://webpagetest.org?debug=1) under the "Custom" tab.

![image](https://user-images.githubusercontent.com/1120896/59539351-e3ecdd80-8eca-11e9-8b43-76bbd7a12029.png)

Note that all WPT custom metrics must have `[metricName]` at the start of the script. This is excluded in the HTTP Archive code and generated automatically based on the file name, so you will need to manually ensure that it's set.

If you include the `debug=1` parameter on the WPT home page, for example [https://webpagetest.org?debug=1](https://webpagetest.org?debug=1), the test results will include a raw debug log from the agent including the devtools commands to run the custom metrics (and any handled exceptions).
The log ouput can be found in the main results page to the left of the waterfall. For each run there will be a link for the "debug log" (next to the timeline and trace links).

To see the custom metric results, select a run, first click on "Details", and then on the "Custom Metrics" link in the top right corner:

![image](https://user-images.githubusercontent.com/1120896/88727164-0e185380-d0fd-11ea-973e-81a50cd24013.png)

![image](https://user-images.githubusercontent.com/1120896/88727208-24beaa80-d0fd-11ea-8ae1-57df2c8505e4.png)

For complex metrics like [almanac.js](./dist/almanac.js) you can more easily explore the results by copy/pasting the JSON into your browser console.

### Automated WPT test runs

1. WPT tests are running using [WPT API wrapper](https://github.com/webpagetest/webpagetest-api).
2. Test runs are using a private WPT instance, set by the `WPT_HOST` environment variable.
3. By default, WebAlmanac website is used for testing in every PR.
4. PR author can define a list of websites to test additionally, by using a markdown list as shown in [PR template](https://github.com/HTTPArchive/custom-metrics/blob/main/.github/PULL_REQUEST_TEMPLATE/custom_metrics_pr_template.md).

### Unit tests

1. Unit tests are using [Jest Testing Framework](https://jestjs.io/).
2. Open [`unit-tests.test.js`](./tests/unit-tests.test.js) file and add test cases for the custom metrics.
3. `wpt_data` variable contains is an object with custom metrics values parsed from WPT response.

## Linting

On opening a Pull Request we will do some basic linting of JavaScript using [ESLint](https://eslint.org/) through the [GitHub Super-Linter](https://github.com/github/super-linter).

You can run this locally with the following commands:

```sh
docker pull github/super-linter:slim-latest
docker run -e RUN_LOCAL=true -e VALIDATE_JAVASCRIPT_ES=true -e VALIDATE_MARKDOWN=true -e USE_FIND_ALGORITHM=true -v $PWD/custom_metrics:/tmp/lint github/super-linter:slim-latest
```
