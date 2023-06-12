// Express routes for the OpenAI GPT-3 API
const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config.json');
const openaiconfig = require('./openai-config.json');
const { writeData, updateData } = require('../data/data-logging.js')

//Set up OpenAI API key and endpoint
const openaiKey = config[0].openai_key;
const openaiEndpoint = config[0].openai_endpoint;
const openaiDeploymentName = config[0].openai_deployment_name;

//Set up OpenAI GPT-3 parameters
const openaiMaxTokens = openaiconfig[0].openai_max_tokens;
const openaiTemperature = openaiconfig[0].openai_temperature;
const openaiTopP = openaiconfig[0].openai_top_p;
const openaiFrequencyPenalty = openaiconfig[0].openai_frequency_penalty;
const openaiPresencePenalty = openaiconfig[0].openai_presence_penalty;
const openaiApiVersion = openaiconfig[0].openai_api_version;

//Set up OpenAI GPT-3 prompts by business domain
const insurancePrompt = openaiconfig[0].insurance_prompt;
const healthcarePrompt = openaiconfig[0].healthcare_prompt;
const bankingPrompt = openaiconfig[0].banking_prompt;
const capitalMarketsPrompt = openaiconfig[0].capitalmarkets_prompt;
const generalPrompt = openaiconfig[0].general_prompt;

router.get('/gpt/sayhello', async (req, res) => {
    const currentDateTime = new Date();    
    res.send('Hello World from the OpenAI GPT backend! ' + currentDateTime)
});

router.post('/gpt/customPrompt', async (req, res) => {
    // const requestText = JSON.stringify(req.body.transcript);
    // const requestCustomPrompt = req.body.customPrompt;
    // const customParsePrompt = requestText + "\n\n" + requestCustomPrompt;
    // const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;        

    const requestText = JSON.stringify(req.body.transcript);
    const requestCustomPrompt = req.body.customPrompt;
  
    // Calculate the maximum number of tokens allowed
    const maxTokenLimit = 2047; // Replace with the appropriate token limit for your model
  
    // Truncate or reduce the length of the transcript
    const truncatedTranscript = truncateText(requestText, maxTokenLimit);
  
    const customParsePrompt = truncatedTranscript + "\n\n" + requestCustomPrompt;
    const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;

    const headers = {'Content-Type': 'application/json', 'api-key': openaiKey};
    const params = {
        "prompt": customParsePrompt,
        "max_tokens": 1000,
        "temperature": openaiTemperature,
        "top_p": openaiTopP,
        "frequency_penalty": openaiFrequencyPenalty,
        "presence_penalty": openaiPresencePenalty
    }
    try{
        const completionResponse = await axios.post(url, params, {headers: headers});
        res.send(completionResponse.data.choices[0]);         
        writeData(req.body.transcript, requestCustomPrompt, completionResponse.data.choices[0], req.ip)
    }catch(error){
        console.error('ERROR WITH AZURE OPENAI API:', error.message);
        res.send(error.message)
        writeData(req.body.transcript, requestCustomPrompt, error, req.ip)
    }   
    
});

router.post('/gpt/summarize', async (req, res) => {
    const requestText = JSON.stringify(req.body.transcript);
    const summaryPrompt = requestText + "\n\nTl;dr";   
    const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;        

    //console.log('Prompt for summary ' + summaryPrompt);    
    const headers = {'Content-Type': 'application/json', 'api-key': openaiKey};
    const params = {
        "prompt": summaryPrompt,
        "max_tokens": openaiMaxTokens,
        "temperature": openaiTemperature,
        "top_p": openaiTopP,
        "frequency_penalty": openaiFrequencyPenalty,
        "presence_penalty": openaiPresencePenalty
    }

    const summaryResponse = await axios.post(url, params, {headers: headers});
    res.send(summaryResponse.data.choices[0]);    
});

router.post('/gpt/parseExtractInfo', async (req, res) => {
    const requestText = JSON.stringify(req.body.transcript);
    const requestPromptCategory = req.body.parsePromptCategory;
    let requestPrompt = "";
    console.log('Request prompt category: ' + requestPromptCategory);

    if(requestPromptCategory == "Insurance") {
        requestPrompt = insurancePrompt;        
    } else if(requestPromptCategory == "Healthcare") {
        requestPrompt = healthcarePrompt;
    } else if(requestPromptCategory == "Banking") {
        requestPrompt = bankingPrompt;
    } else if(requestPromptCategory == "CapitalMarkets") {
        requestPrompt = capitalMarketsPrompt;
    } else {
        requestPrompt = generalPrompt;
    }

    //console.log('Using Request prompt: ' + requestPrompt);
    // const parsePrompt = requestText + "\n\n" + requestPrompt;
    
    // const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;        

  // Calculate the maximum number of tokens allowed
  const maxTokenLimit = 2040; // Replace with the appropriate token limit for your model

  // Truncate or reduce the length of the transcript
  const truncatedTranscript = truncateText(req.body.transcript, maxTokenLimit);

  // Construct the parsePrompt by combining the truncated transcript and requestPrompt
  const parsePrompt = truncatedTranscript + "\n\n" + requestPrompt;

  const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;

    //console.log('Prompt for parseExtractInfo ' + parsePrompt);    
    const headers = {'Content-Type': 'application/json', 'api-key': openaiKey};
    const params = {
        "prompt": parsePrompt,
        "max_tokens": 1000,
        "temperature": 0.1,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }

    const parseResponse = await axios.post(url, params, {headers: headers});
    //console.log('Parse response: ' + parseResponse.data);
    res.send(parseResponse.data.choices[0]);    
});

// Function to truncate text while preserving complete sentences
function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
  
    const truncatedText = text.slice(0, maxLength);
    const lastSentenceEnd = truncatedText.lastIndexOf(".");
  
    if (lastSentenceEnd !== -1) {
      return truncatedText.slice(0, lastSentenceEnd + 1);
    }
  
    return truncatedText;
  }

module.exports = router;

