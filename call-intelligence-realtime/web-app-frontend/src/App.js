import React, { Component } from 'react';
import { Container } from 'reactstrap';
//import axios from 'axios';
import { getGPT3ParseExtractInfo, getGPT3CustomPromptCompletion, getGPT3Summarize, getKeyPhrases, getTokenOrRefresh } from './token_util.js';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import './App.css';
//import { Input } from '@material-ui/core';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

export default class App extends Component {
  constructor(props) {
      super(props);

      this.state = {value: '' };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);

      this.state = {     
        displayText: 'READY to start call simulation',
        displayNLPOutput: 'NLP & PII Output...',
        gptSummaryText: 'GPT-3 Generated Summary:...',
        gptExtractedInfo: 'GPT-3 Extracted Custom Business Information...',
        gptCustomPrompt: 'GPT-3 Custom Prompt Output...'
      };
  }

  handleChange(event) {
    this.setState({value: event.target.value});
    alert('You have selected conversation category : ' + this.state.value );
  }

  handleSubmit(event) {
    alert('Your conversation will be saved with name : ' + this.state.value + ' Submit a different name to change it.');
    event.preventDefault();
  }

  async componentDidMount() {
      // check for valid speech key/region
      const tokenRes = await getTokenOrRefresh();
      if (tokenRes.authToken === null) {
          this.setState({
              displayText: 'FATAL_ERROR amc: ' + tokenRes.error
          });
      }
  }

  async sttFromMic() {
      const tokenObj = await getTokenOrRefresh();
      //const customSpeechEndpoint = process.env.CUSTOM_SPEECH_ENDPOINT_ID;
      const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      //Setting below specifies custom speech model ID that is created using Speech Studio
      //speechConfig.endpointId = 'd26026b7-aaa0-40bf-84e7-35054451a3f4';

      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

      this.setState({
          displayText: 'Speak into your microphone to start conversation...' 
      });      

      let resultText = "";
      let nlpText = " ";
      recognizer.sessionStarted = (s, e) => {
          //this.setState({displayText: resultText});
      };

      recognizer.recognized = async (s, e) => {
        if(e.result.reason === ResultReason.RecognizedSpeech){
          
            //Display continuous transcript
            resultText += `\n${e.result.text}`;    
            this.setState({
                displayText: resultText
            });      
            
            //Perform continuous NLP
            const nlpObj = await getKeyPhrases(e.result.text);              
                
            //Display extracted Key Phrases      
            const keyPhraseText = JSON.stringify(nlpObj.keyPhrasesExtracted); 
            if(keyPhraseText.length > 15){
                //nlpText += "\n" + keyPhraseText;
                //this.setState({ displayNLPOutput: nlpText }); 
            }        

            //Display extracted entities
            const entityText = nlpObj.entityExtracted; 
            if(entityText.length > 12){
                nlpText += "\n" + entityText;
                this.setState({ displayNLPOutput: nlpText.replace('<br/>', '\n') });
            }         

            //Display PII Detected               
            const piiText = nlpObj.piiExtracted;
            if(piiText.length > 21){
                nlpText += "\n" + piiText; 
                this.setState({ displayNLPOutput: nlpText.replace('<br/>', '\n') }); 
            }                    
        }
        else if (e.result.reason === ResultReason.NoMatch) {
            //resultText += `\nNo Match`
            resultText += `\n`
        }
    };
      recognizer.startContinuousRecognitionAsync();
  }

  async gptCustomPromptCompetion(inputText){
    var customPromptText = document.getElementById("customPromptTextarea").value;
    const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
    const gptText = gptObj.data.text;
    this.setState({ gptCustomPrompt: gptText.replace("\n\n", "") });
  }

  async gptSummarizeText(inputText){    
    const gptObj = await getGPT3Summarize(inputText); 
    const gptText = gptObj.data.text;
    this.setState({ gptSummaryText: gptText.replace("\n\n", "") });
  }

  async gptParseExtractInfo(inputText){    
    var selectConvScenario = document.getElementById("formSelectConvScenario");
    var convScenario = selectConvScenario.options[selectConvScenario.selectedIndex].text;
    const gptObj = await getGPT3ParseExtractInfo(inputText, convScenario); 
    const gptText = gptObj.data.text;
    this.setState({ gptExtractedInfo: gptText.replace("\n\n", "") });
  }

  render() {
      return (
          <Container className="app-container">
             <div class="card text-white bg-primary mb-3 text-center" >
                <h3 class="card-header">Azure AI-powered Call Center Intelligence</h3>
                <p> </p>
                <form class="row row-cols-lg-auto g-3 align-items-center text-white">     
                    <div class="col-3">
                        <select class="form-select" id="formSelectConvScenario">
                            <option selected>Choose Conversation Scenario</option>
                            <option value="1">Insurance</option>
                            <option value="2">Banking</option>
                            <option value="3">CapitalMarkets</option>
                            <option value="4">Healthcare</option>
                            <option value="5">General</option>
                        </select>
                    </div>
                    <div class="col-4">
                        <button type="button" class="btn btn-dark" onClick={() => this.sttFromMic()}>Click HERE and START Talking</button>
                    </div>{'Note: This conversation will be recorded for demo purpose.'}           
                </form>
                <p> </p>
            </div>

            <div style={{ color: 'white', fontSize: 18, display: 'flex', justifyContent:'center', alignItems:'center' }}>-      Real-time Transcription (Azure Speech) -------------------------------------------------  AI-powered Call Insights ------</div>
            
            <div className="row"> 
                <div className="col-6 output-display" style={{ fontSize: 18, "borderWidth":"5px", 'borderColor':"green", 'borderStyle':'solid', overflowY: 'scroll', height: 360}}>
                    <code>{this.state.displayText}</code>
                </div>
                <div className="col-6 nlpoutput-display rounded" style={{ fontSize: 18, "borderWidth":"5px", 'borderColor':"blue", 'borderStyle':'solid', overflowY: 'scroll', height: 360}}>                      
                    <code>{this.state.displayNLPOutput}</code>
                </div>
            </div>    
              
              <div style={{ color: 'white', fontSize: 18, display: 'flex', justifyContent:'center' }}>Use the power of Azure OpenAI GPT-3 models to gain valuable insights from conversations in near real-time</div>
              <div class="row text-white">
                <div class="col-sm-6">
                    <div class="card text-center text-dark bg-info">
                    <div class="card-body">
                        <h5 class="card-title">Conversation Summary using GPT-3 (Azure OpenAI)</h5>                     
                        <button type="button" class="btn btn-dark btn-sm" onClick={() => this.gptSummarizeText(this.state.displayText)}>Generate Conversation Summary</button>
                    </div>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="card text-center text-dark bg-info">
                    <div class="card-body">
                        <h5 class="card-title">Conversation Details using GPT-3 (Azure OpenAI)</h5>
                        <button type="button" class="btn btn-dark btn-sm" onClick={() => this.gptParseExtractInfo(this.state.displayText)}>Extract Conversation Details</button>
                    </div>
                    </div>
                </div>
              </div>
              
              <div className="row"> 
                  <div className="col-6 output-display rounded" style={{ fontSize: 18, "borderWidth":"5px", 'borderColor':"green", 'borderStyle':'solid', overflowY: 'scroll', height: 300}}>
                        <code>{this.state.gptSummaryText}</code>
                  </div>
                  <div className="col-6 nlpoutput-display rounded " style={{ fontSize: 18, "borderWidth":"5px", 'borderColor':"blue", 'borderStyle':'solid', overflowY: 'scroll', height: 300}}>                      
                      <code>{this.state.gptExtractedInfo}</code>
                  </div>
              </div>   

              <div style={{ color: 'white', fontSize: 20, display: 'flex', justifyContent:'center' }}>Prompt Engineering with Azure OpenAI GPT-3 models</div>
              <div class="row text-dark">             
                <div class="col-6">
                    <label for="customPromptTextarea" class="form-label"style={{"color":"white"}}>Enter custom text prompt in below text area:       - </label>
                    <button type="button" class="btn btn-dark btn-sm" onClick={() => this.gptCustomPromptCompetion(this.state.displayText)}>Try Custom Prompt</button>
                    <textarea class="form-control" id="customPromptTextarea" rows="10" style={{"background-color":"black", "color":"white", "borderWidth":"5px", 'borderColor':"green", 'borderStyle':'solid', overflowY: 'scroll'}}>
                    Extract the following from the conversation:        
                    1. What is customer's name?
                    2. Which car was involved in the accident?
                    3. What are the action items and follow-ups?
                    </textarea>
                </div>
                <div className="col-6 nlpoutput-display rounded " style={{ fontSize: 18, "borderWidth":"5px", 'borderColor':"blue", 'borderStyle':'solid', overflowY: 'scroll', height: 300}}>                      
                    <code>{this.state.gptCustomPrompt}</code>
                </div>                     
              </div>

          </Container>     
      );
  }
}