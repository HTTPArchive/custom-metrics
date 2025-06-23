// Regex derived from TruffleHog https://github.com/trufflesecurity/trufflehog
const keyMap = {
  adafruitio: '\\b(aio\\_[a-zA-Z0-9]{28})\\b',
  anthropic: '\\b(sk-ant-(?:admin01|api03)-[\\w\\-]{93}AA)\\b',
  apify: '\\b(apify\\_api\\_[a-zA-Z-0-9]{36})\\b',
  cloudflarecakey: '\\b(v1\\.0-[A-Za-z0-9-]{171})\\b',
  contentfulpersonalaccesstoken: '\\b(CFPAT-[a-zA-Z0-9_\\-]{43})\\b',
  databrickstoken: '\\b([a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(cloud\\.databricks\\.com|gcp\\.databricks\\.com|azuredatabricks\\.net))\\b',
  dfuse: '\\b(web\\_[0-9a-z]{32})\\b',
  digitaloceanv2: '\\b((?:dop|doo|dor)_v1_[a-f0-9]{64})\\b',
  discordwebhook: '(https:\\/\\/discord\\.com\\/api\\/webhooks\\/[0-9]{18,19}\\/[0-9a-zA-Z-]{68})',
  documo: '\\b(ey[a-zA-Z0-9]{34}.ey[a-zA-Z0-9]{154}.[a-zA-Z0-9_-]{43})\\b',
  doppler: '\\b(dp\\.pt\\.[a-zA-Z0-9]{43})\\b',
  finage: '\\b(API_KEY[0-9A-Z]{32})\\b',
  fleetbase: '\\b(flb_live_[0-9a-zA-Z]{20})\\b',
  flexport: '\\b(shltm_[0-9a-zA-Z-_]{40})',
  flutterwave: '\\b(FLWSECK-[0-9a-z]{32}-X)\\b',
  frameio: '\\b(fio-u-[0-9a-zA-Z_-]{64})\\b',
  ftp: '\\bftp://[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b',
  gcp: '\\{[^{]+auth_provider_x509_cert_url[^}]+\\}',
  gcpapplicationdefaultcredentials: '\\{[^{]+client_secret[^}]+\\}',
  gemini: '\\b((?:master-|account-)[0-9A-Za-z]{20})\\b',
  gocardless: '\\b(live_[0-9A-Za-z\\_\\-]{40}[ "\'\\r\\n]{1})',
  grafana: '\\b(glc_eyJ[A-Za-z0-9+\\/=]{60,160})',
  grafanaserviceaccount: '\\b(glsa_[0-9a-zA-Z_]{41})\\b',
  groq: '\\b(gsk_[a-zA-Z0-9]{52})\\b',
  huggingface: '\\b(?:hf_|api_org_)[a-zA-Z0-9]{34}\\b',
  intra42: '\\b(s-s4t2(?:ud|af)-[a-f0-9]{64})\\b',
  jdbc: 'jdbc:[\\w]{3,10}:[^\\s"\'<>,(){}[\\]&]{10,512}',
  klaviyo: '\\b(pk_[a-zA-Z0-9]{34})\\b',
  launchdarkly: '\\b((?:api|sdk)-[a-z0-9]{8}-[a-z0-9]{4}-4[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{12})\\b',
  linearapi: '\\b(lin_api_[0-9A-Za-z]{40})\\b',
  locationiq: '\\b(pk\\.[a-zA-Z-0-9]{32})\\b',
  mailchimp: '[0-9a-f]{32}-us[0-9]{1,2}',
  microsoftteamswebhook: '(https:\\/\\/[a-zA-Z-0-9]+\\.webhook\\.office\\.com\\/webhookb2\\/[a-zA-Z0-9-@\\/]{136,}/IncomingWebhook\\/[a-zA-Z0-9]{32}\\/[a-zA-Z0-9-]{36})',
  nightfall: '\\b(NF\\-[a-zA-Z0-9]{32})\\b',
  notion: '\\b(secret_[A-Za-z0-9]{43})\\b',
  npmtokenv2: '(npm_[0-9a-zA-Z]{36})',
  nvapi: '\\b(nvapi-[a-zA-Z0-9_-]{64})\\b',
  openai: '\\b(sk-[a-zA-Z0-9_-]+T3BlbkFJ[a-zA-Z0-9_-]+)\\b',
  pagarme: '\\b(ak_live_[a-zA-Z0-9]{30})\\b',
  paystack: '\\b(sk\\_[a-z]{1,}\\_[A-Za-z0-9]{40})\\b',
  posthog: '\\b(phx_[a-zA-Z0-9_]{43})\\b',
  postman: '\\b(PMAK-[a-zA-Z-0-9]{59})\\b',
  prefect: '\\b(pnu_[a-zA-Z0-9]{36})\\b',
  privatekey: '-----\\s*?BEGIN[ A-Z0-9_-]*?PRIVATE KEY\\s*?-----[\\s\\S]*?----\\s*?END[ A-Z0-9_-]*? PRIVATE KEY\\s*?-----',
  pubnubsubscriptionkey: '\\b(sub-c-[0-9a-z]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})\\b',
  pulumi: '\\b(pul-[a-z0-9]{40})\\b',
  rabbitmq: '\\b(?:amqps?):\\/\\/[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b',
  ramp: '\\b(ramp_id_[a-zA-Z0-9]{40})\\b',
  razorpay: '\\brzp_live_[A-Za-z0-9]{14}\\b',
  readme: '(rdme_[a-z0-9]{70})',
  reallysimplesystems: '\\b(ey[a-zA-Z0-9-._]{153}.ey[a-zA-Z0-9-._]{916,1000})\\b',
  redis: '\\bredi[s]{1,2}://[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b',
  replicate: '\\b(r8_[0-9A-Za-z-_]{37})\\b',
  robinhoodcrypto: '\\b(rh-api-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\b',
  rubygems: '\\b(rubygems_[a-zA0-9]{48})\\b',
  sendgrid: '\\bSG\\.[\\w\\-]{20,24}\\.[\\w\\-]{39,50}\\b',
  sendinbluev2: '\\b(xkeysib\\-[A-Za-z0-9_-]{81})\\b',
  shopify: '\\b(shppa_|shpat_)([0-9A-Fa-f]{32})\\b',
  sourcegraphcody: '\\b(slk_[a-f0-9]{64})\\b',
  squareapp: '(?:sandbox-)?sq0i[a-z]{2}-[0-9A-Za-z_-]{22,43}',
  squareup: '\\b(sq0idp-[0-9A-Za-z]{22})\\b',
  supabasetoken: '\\b(sbp_[a-z0-9]{40})\\b',
  tailscale: '\\btskey-[a-z]+-[0-9A-Za-z_]+-[0-9A-Za-z_]+\\b',
  terraformcloudpersonaltoken: '\\b([A-Za-z0-9]{14}.atlasv1.[A-Za-z0-9]{67})\\b',
  tineswebhook: '(https://[\\w-]+\\.tines\\.com/webhook/[a-z0-9]{32}/[a-z0-9]{32})',
  trufflehogenterprise: '\\bthog-key-[0-9a-f]{16}\\b',
  twilio: '\\bAC[0-9a-f]{32}\\b',
  ubidots: '\\b(BBFF-[0-9a-zA-Z]{30})\\b',
  uri: '\\bhttps?:\\/\\/[\\w!#$%&()*+,\\-./;<=>?@[\\\\\\]^_{|}~]{0,50}:([\\w!#$%&()*+,\\-./:;<=>?[\\\\\\]^_{|}~]{3,50})@[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})?(?::\\d{1,5})?[\\w/]+\\b',
  voiceflow: '\\b(VF\\.(?:(?:DM|WS)\\.)?[a-fA-F0-9]{24}\\.[a-zA-Z0-9]{16})\\b',
  xai: '\\b(xai-[0-9a-zA-Z_]{80})\\b',
  zapierwebhook: '(https:\\/\\/hooks\\.zapier\\.com\\/hooks\\/catch\\/[A-Za-z0-9\\/]{16})',
  zohocrm: '\\b(1000\\.[a-f0-9]{32}\\.[a-f0-9]{32})\\b'
};
const scripts = Array.from(document.scripts);
function fetchWithTimeout(url) {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

function parseResponse(url, parser) {
  return fetchWithTimeout(url)
  .then(request => {
    let resultObj = {};
    if(!request.redirected && request.status === 200) {
      resultObj['found'] = true;
      if(parser) {
        let promise = parser(request);
        if (promise) {
          return promise
          .then(data => {
            resultObj['data'] = data;
            return [url, resultObj];
          })
          .catch(error => {
            return [url, {'error': error.message}];
          });
        } else {
          resultObj['error'] = 'parser did not return a promise';
          return [url, resultObj];
        }
      } else {
        return [url, resultObj];
      }
    } else {
      resultObj['found'] = false;
      return [url, resultObj];
    }
  })
  .catch(error => {
    return [url, {'error': error.message}];
  });
}

return Promise.all(
  scripts.map(script => {
    if (script.src) {
      return parseResponse(script.src, response => response.text());
    } else {
      return Promise.resolve(script.textContent.trim());
    }
  })
).then((all_data) => {
  const combinedScripts = all_data.reduce((acc, data) => {
    if (Array.isArray(data)) {
      return acc + data[1].data + '\n';
    } else {
      return acc + data;
    }
  }, '');

  const matched_keys = [];
  for (const [provider, pattern] of Object.entries(keyMap)) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(combinedScripts)) {
      matched_keys.push(provider);
    }
  }

  return matched_keys;
}).catch(error => {
  return JSON.stringify({ message: error.message, error });
});

