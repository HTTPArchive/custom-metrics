//[genAI-Service-Detection]
// uncomment for webpagetest

// not sure if the list is exhaustive
console.log("Running genAI-Service-Detection metric");
try{
const patterns = {
    // GenAI Services
    'Azure AI Services': {
      regEx: /https:\/\/[^\/]+\.services\.ai\.azure\.com\/models/,
    },
    'AWS SageMaker': {
      regEx: /https:\/\/runtime\.sagemaker\.[^\/]+\.amazonaws\.com/,
    },
    'IBM Watson ML': {
      regEx: /https:\/\/[^\/]+\.ml\.cloud\.ibm\.com/,
    },
    'Alibaba Cloud ML': {
      regEx: /https:\/\/[^\/]+\.fc\.[^\/]+\.aliyuncs\.com/,
    },
    'Huawei Cloud AI': {
      regEx: /https:\/\/iam\.[^\/]+\.myhuaweicloud\.com\/v3/,
    },
    'Google Vertex AI': {
      regEx: /https:\/\/[^\/]+\/v1\/[^\/]+:predict/,
    },
    'Amazon Bedrock': {
      regEx: /https:\/\/bedrock\.[^\/]+\.amazonaws\.com/,
    },
    'Azure OpenAI': {
      regEx: /https:\/\/[^\/]+\.openai\.azure\.com\/openai\/deployments\/[^\/]+/,
    },
  
    // Common GenAI APIs
    'OpenAI': {
      regEx: /api\.openai\.com/,
    },
    'ChatGPT':{
        regEx: /chatgpt\.com/,
    },
    'Anthropic': {
      regEx: /api\.anthropic\.com/,
    },
    'Google PaLM': {
      regEx: /generativelanguage\.googleapis\.com/,
    },
    'Cohere': {
      regEx: /api\.cohere\.ai/,
    },
    'Hugging Face': {
      regEx: /(.*\.)?huggingface\.co/,
    },
    'Mistral': {
      regEx: /(.*\.)?mistral\.ai/,
    },
    'Perplexity': {
      regEx: /(.*\.)?perplexity\.ai/,
    },
    'Bard': {
      regEx: /(.*\.)?bard\.google\.com/,
    },
    'Groq': {
      regEx: /api\.groq\.com/,
    },
    'Cerebras': {
      regEx: /api\.cerebras\.ai/,
    },
  
    // Proxy Services
    'OpenRouter (Proxy)': {
      regEx: /https:\/\/openrouter\.ai\/api\/v1/,
    },
    'LangChain (Proxy)': {
      regEx: /\/langserve\/|\/agent\/|\/llm(-invoke)?\/|\/chain\/|\/tools?\/|\/predict\/|\/invoke\//i,
    },
    'Flowise (Proxy)': {
      regEx: /\/api\/v1\/prediction|\/flowise-api/i,
    },
    'Poe': {
        regEx: /(.*\.)?poe\.com/,
      },
      'Replicate': {
        regEx: /(.*\.)?replicate\.com/,
      },
    }

const requestBodies = $WPT_REQUESTS;

// Iterate over all response bodies and over all patterns and populate the
// result object.
const result = {};


requestBodies.forEach((har) => {
    const url = har.url
    if (!url){
        return
    }
  for (const [key, value] of Object.entries(patterns)) { 
    if (value.regEx.test(har.url)) {
      if (result[key] && !result[key].includes(url)) {
       result[key].push(url.trim().replace(/\/$/, ""));
      } else {
        result[key] = [url.trim().replace(/\/$/, "")];
        }
      }
    }
  });

return result
}
catch(e){
    return{error: e.message}
}