// Express routes for Azure AI Language API
//
const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config.json');

// get config
const textAnalyticsKey = config[0].text_analytics_key;
const textAnalyticsEndpoint = config[0].text_analytics_endpoint;    

//"use strict";
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const { json } = require('express');

router.get('/ta/sayhello', async (req, res) => {
    const currentDateTime = new Date();
    res.send('Hello World from the Azure Language TA backend! ' + currentDateTime)
});

router.post('/ta-key-phrases', async (req, res) => { 
    const requestJSON = JSON.stringify(req.body);
    //console.log('JSON string request body ' + requestJSON);

    const requestText = JSON.stringify(req.body.transcript);
    //console.log('Received transcription text : ' + requestText);

    try {
        const keyPhrasesInput = [
            requestText,
        ];
        const textAnalyticsClient = new TextAnalyticsClient(textAnalyticsEndpoint,  new AzureKeyCredential(textAnalyticsKey));

        let keyPhrasesText = "KEY PHRASES: ";
        const keyPhraseResult =  await textAnalyticsClient.extractKeyPhrases(keyPhrasesInput);             
        keyPhraseResult.forEach(document => {            
            keyPhraseResponse = document.keyPhrases;    
            keyPhrasesText += document.keyPhrases;                   
        });   

        //let entityText = "ENTITIES: ";
        let entityText = "  ";
        const entityResults = await textAnalyticsClient.recognizeEntities(keyPhrasesInput);        
        entityResults.forEach(document => {
            //console.log(`Document ID: ${document.id}`);
            document.entities.forEach(entity => {
                if(entity.confidenceScore > 0.5){
                    //console.log(`\tName: ${entity.text} \tCategory: ${entity.category} \tSubcategory: ${entity.subCategory ? entity.subCategory : "N/A"}`);
                    const currentEntity = entity.category + ": " + entity.text;
                    entityText += " " + currentEntity;
                    //console.log(`\tScore: ${entity.confidenceScore}`);                    
                }
            });
        });          

        let piiText = "PII:";
        const piiResults = await textAnalyticsClient.recognizePiiEntities(keyPhrasesInput, "en");
        for (const result of piiResults) {
            if (result.error === undefined) {
                if(result.redactedText.indexOf('*') > -1){
                    //console.log("Redacted Text: ", result.redactedText);
                    piiText += result.redactedText;
                    //console.log(" -- Recognized PII entities for input", result.id, "--");
                }

                for (const entity of result.entities) {
                    //console.log(entity.text, ":", entity.category, "(Score:", entity.confidenceScore, ")");
                    const currentEntity = entity.category + ": " + entity.text;
                    //piiText += currentEntity;
                }
            } else {
                console.error("Encountered an error:", result.error);
            }
        }

        const headers = { 'Content-Type': 'application/json' };  
        res.headers = headers;                  
        //res.send({ keyPhrasesExtracted: keyPhraseResponse, entityExtracted: entityResults, piiExtracted: piiResults });
        res.send({ keyPhrasesExtracted: keyPhrasesText, entityExtracted: entityText, piiExtracted: piiText });
    } catch (err) {
        console.log(err);
        res.status(401).send('There was an error authorizing your text analytics key. Check your text analytics service key or endpoint to the .env file.');
    }        
});

module.exports = router;