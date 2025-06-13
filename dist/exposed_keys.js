// Regex derived from TruffleHog https://github.com/trufflesecurity/trufflehog
const key_regex = ['\\b(aio\\_[a-zA-Z0-9]{28})\\b', '\\b(sk-ant-(?:admin01|api03)-[\\w\\-]{93}AA)\\b', '\\b(apify\\_api\\_[a-zA-Z-0-9]{36})\\b', '\\b(v1\\.0-[A-Za-z0-9-]{171})\\b', '\\b(CFPAT-[a-zA-Z0-9_\\-]{43})\\b', '\\b([a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(cloud\\.databricks\\.com|gcp\\.databricks\\.com|azuredatabricks\\.net))\\b', '\\b(web\\_[0-9a-z]{32})\\b', '\\b((?:dop|doo|dor)_v1_[a-f0-9]{64})\\b', '(https:\\/\\/discord\\.com\\/api\\/webhooks\\/[0-9]{18,19}\\/[0-9a-zA-Z-]{68})', '\\b(ey[a-zA-Z0-9]{34}.ey[a-zA-Z0-9]{154}.[a-zA-Z0-9_-]{43})\\b', '\\b(dp\\.pt\\.[a-zA-Z0-9]{43})\\b', '\\b(API_KEY[0-9A-Z]{32})\\b', '\\b(flb_live_[0-9a-zA-Z]{20})\\b', '\\b(shltm_[0-9a-zA-Z-_]{40})', '\\b(FLWSECK-[0-9a-z]{32}-X)\\b', '\\b(fio-u-[0-9a-zA-Z_-]{64})\\b', '\\bftp://[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b', '\\{[^{]+auth_provider_x509_cert_url[^}]+\\}', '\\{[^{]+client_secret[^}]+\\}', '\\b((?:master-|account-)[0-9A-Za-z]{20})\\b', '\\b(live_[0-9A-Za-z\\_\\-]{40}[ "\'\\r\\n]{1})', '\\b(glc_eyJ[A-Za-z0-9+\\/=]{60,160})', '\\b(glsa_[0-9a-zA-Z_]{41})\\b', '\\b(gsk_[a-zA-Z0-9]{52})\\b', '\\b(?:hf_|api_org_)[a-zA-Z0-9]{34}\\b', '\\b(s-s4t2(?:ud|af)-[a-f0-9]{64})\\b', 'jdbc:[\\w]{3,10}:[^\\s"\'<>,(){}[\\]&]{10,512}', '\\b(pk_[a-zA-Z0-9]{34})\\b', '\\b((?:api|sdk)-[a-z0-9]{8}-[a-z0-9]{4}-4[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{12})\\b', '\\b(lin_api_[0-9A-Za-z]{40})\\b', '\\b(pk\\.[a-zA-Z-0-9]{32})\\b', '[0-9a-f]{32}-us[0-9]{1,2}', '(https:\\/\\/[a-zA-Z-0-9]+\\.webhook\\.office\\.com\\/webhookb2\\/[a-zA-Z-0-9]{8}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{12}\\@[a-zA-Z-0-9]{8}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{12}\\/IncomingWebhook\\/[a-zA-Z-0-9]{32}\\/[a-zA-Z-0-9]{8}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{4}-[a-zA-Z-0-9]{12})', '\\b(NF\\-[a-zA-Z0-9]{32})\\b', '\\b(secret_[A-Za-z0-9]{43})\\b', '(npm_[0-9a-zA-Z]{36})', '\\b(nvapi-[a-zA-Z0-9_-]{64})\\b', '\\b(sk-[a-zA-Z0-9_-]+T3BlbkFJ[a-zA-Z0-9_-]+)\\b', '\\b(ak_live_[a-zA-Z0-9]{30})\\b', '\\b(sk\\_[a-z]{1,}\\_[A-Za-z0-9]{40})\\b', '\\b(phx_[a-zA-Z0-9_]{43})\\b', '\\b(PMAK-[a-zA-Z-0-9]{59})\\b', '\\b(pnu_[a-zA-Z0-9]{36})\\b', '-----\\s*?BEGIN[ A-Z0-9_-]*?PRIVATE KEY\\s*?-----[\\s\\S]*?----\\s*?END[ A-Z0-9_-]*? PRIVATE KEY\\s*?-----', '\\b(sub-c-[0-9a-z]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})\\b', '\\b(pul-[a-z0-9]{40})\\b', '\\b(?:amqps?):\\/\\/[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b', '\\b(ramp_id_[a-zA-Z0-9]{40})\\b', '\\brzp_live_[A-Za-z0-9]{14}\\b', '(rdme_[a-z0-9]{70})', '\\b(ey[a-zA-Z0-9-._]{153}.ey[a-zA-Z0-9-._]{916,1000})\\b', '\\bredi[s]{1,2}://[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b', '\\b(r8_[0-9A-Za-z-_]{37})\\b', '\\b(rh-api-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\b', '\\b(rubygems_[a-zA0-9]{48})\\b', '\\bSG\\.[\\w\\-]{20,24}\\.[\\w\\-]{39,50}\\b', '\\b(xkeysib\\-[A-Za-z0-9_-]{81})\\b', '\\b(shppa_|shpat_)([0-9A-Fa-f]{32})\\b', '\\b(slk_[a-f0-9]{64})\\b', '(?:sandbox-)?sq0i[a-z]{2}-[0-9A-Za-z_-]{22,43}', '\\b(sq0idp-[0-9A-Za-z]{22})\\b', '\\b(sbp_[a-z0-9]{40})\\b', '\\btskey-[a-z]+-[0-9A-Za-z_]+-[0-9A-Za-z_]+\\b', '\\b([A-Za-z0-9]{14}.atlasv1.[A-Za-z0-9]{67})\\b', '(https://[\\w-]+\\.tines\\.com/webhook/[a-z0-9]{32}/[a-z0-9]{32})', '\\bthog-key-[0-9a-f]{16}\\b', '\\bAC[0-9a-f]{32}\\b', '\\b(BBFF-[0-9a-zA-Z]{30})\\b', '\\bhttps?:\\/\\/[\\w!#$%&()*+,\\-./;<=>?@[\\\\\\]^_{|}~]{0,50}:([\\w!#$%&()*+,\\-./:;<=>?[\\\\\\]^_{|}~]{3,50})@[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})?(?::\\d{1,5})?[\\w/]+\\b', '\\b(VF\\.(?:(?:DM|WS)\\.)?[a-fA-F0-9]{24}\\.[a-zA-Z0-9]{16})\\b', '\\b(xai-[0-9a-zA-Z_]{80})\\b', '(https:\\/\\/hooks\\.zapier\\.com\\/hooks\\/catch\\/[A-Za-z0-9\\/]{16})', '\\b(1000\\.[a-f0-9]{32}\\.[a-f0-9]{32})\\b']
const key_providers = ['adafruitio', 'anthropic', 'apify', 'cloudflarecakey', 'contentfulpersonalaccesstoken', 'databrickstoken', 'dfuse', 'digitaloceanv2', 'discordwebhook', 'documo', 'doppler', 'finage', 'fleetbase', 'flexport', 'flutterwave', 'frameio', 'ftp', 'gcp', 'gcpapplicationdefaultcredentials', 'gemini', 'gocardless', 'grafana', 'grafanaserviceaccount', 'groq', 'huggingface', 'intra42', 'jdbc', 'klaviyo', 'launchdarkly', 'linearapi', 'locationiq', 'mailchimp', 'microsoftteamswebhook', 'nightfall', 'notion', 'npmtokenv2', 'nvapi', 'openai', 'pagarme', 'paystack', 'posthog', 'postman', 'prefect', 'privatekey', 'pubnubsubscriptionkey', 'pulumi', 'rabbitmq', 'ramp', 'razorpay', 'readme', 'reallysimplesystems', 'redis', 'replicate', 'robinhoodcrypto', 'rubygems', 'sendgrid', 'sendinbluev2', 'shopify', 'sourcegraphcody', 'squareapp', 'squareup', 'supabasetoken', 'tailscale', 'terraformcloudpersonaltoken', 'tineswebhook', 'trufflehogenterprise', 'twilio', 'ubidots', 'uri', 'voiceflow', 'xai', 'zapierwebhook', 'zohocrm']

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
  let combinedScripts = all_data.reduce((acc, data) => {
    if (Array.isArray(data)) {
      return acc + data[1].data + '\n'; 
    } else {
      return acc + data ;
    }
  }, '');
  console.log(combinedScripts)
  let matched_keys = [];
  for (let i = 0; i < key_providers.length; i++) {
  const regex = new RegExp(key_regex[i], 'g');
  const matches = combinedScripts.match(regex);
  if (matches) {
    matched_keys.push(key_providers[i]);
  }
}
  return matched_keys;
}).catch(error => {
  return JSON.stringify({message: error.message, error: error});
});

