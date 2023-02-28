import React, { Component } from 'react';
import { Container } from 'reactstrap';
//import axios from 'axios';
import { getGPT3ParseExtractInfo, getGPT3CustomPromptCompletion, getGPT3Summarize, getKeyPhrases, getTokenOrRefresh } from './token_util.js';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import './App.css';
//import { Input } from '@material-ui/core';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')
var recognizer;

export default class App extends Component {
  constructor(props) {
      super(props);

      this.state = {value: '' };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);

      this.state = {     
        displayText: 'READY to start call simulation',
        displayNLPOutput: '',
        gptSummaryText: '',
        gptExtractedInfo: '',
        gptCustomPrompt: '',
        gptCustomPrompt2: ''
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
      recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

      this.setState({
          displayText: 'Speak to your microphone or copy/paste conversation transcript here' 
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
            
            //Display continuous transcript in the text area
           document.getElementById("transcriptTextarea").value = resultText;
            
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
    var transcriptInputForPmt = document.getElementById("transcriptTextarea").value;
    //const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
    const gptObj = await getGPT3CustomPromptCompletion(transcriptInputForPmt, customPromptText);
    const gptText = gptObj.data.text;
    this.setState({ gptCustomPrompt: gptText.replace("\n\n", "") });
  }

  async gptCustomPromptCompetion2(inputText){
    var customPromptText = document.getElementById("customPromptTextarea2").value;
    var transcriptInputForPmt2 = document.getElementById("transcriptTextarea").value;
    //const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
    const gptObj = await getGPT3CustomPromptCompletion(transcriptInputForPmt2, customPromptText);
    const gptText = gptObj.data.text;
    this.setState({ gptCustomPrompt2: gptText.replace("\n\n", "") });
  }

  async gptSummarizeText(inputText){    
    var transcriptInputForSumr = document.getElementById("transcriptTextarea").value;
    //const gptObj = await getGPT3Summarize(inputText); 
    const gptObj = await getGPT3Summarize(transcriptInputForSumr); 
    const gptText = gptObj.data.text;
    //recognizer.stopContinuousRecognitionAsync();
    this.setState({ gptSummaryText: gptText.replace("\n\n", "") });
  }

  async stopRecording(){        
    recognizer.stopContinuousRecognitionAsync();    
  }

  async gptParseExtractInfo(inputText){    
    var selectConvScenario = document.getElementById("formSelectConvScenario");
    var convScenario = selectConvScenario.options[selectConvScenario.selectedIndex].text;
    var transcriptInputToExtract = document.getElementById("transcriptTextarea").value;
    const gptObj = await getGPT3ParseExtractInfo(transcriptInputToExtract, convScenario); 
    //const gptObj = await getGPT3ParseExtractInfo(inputText, convScenario); 
    const gptText = gptObj.data.text;
    this.setState({ gptExtractedInfo: gptText.replace("\n\n", "") });
  }

  render() {
      return (
          <Container className="app-container">
             <div class="card text-white bg-dark mb-3 text-center" >
                <h3 class="card-header">Azure AI + Azure OpenAI - powered Conversation Intelligence</h3>
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
                        <button type="button" class="btn btn-success btn-sm" onClick={() => this.sttFromMic()}>START Conversation</button> &emsp; &ensp;
                        <button type="button" class="btn btn-outline-danger btn-sm" onClick={() => this.stopRecording()}>END Conversation</button>
                    </div>   
                    <div style={{ color: 'white', fontSize: 13, display: 'flex', justifyContent:'center', alignItems:'center' }}>This conversation will be recorded in YOUR Azure subscription if you enable it.</div>     
                </form>
                <p> </p>
            </div>
            
            <div className="row"> 
                <div class="col-6">
                <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent:'left', alignItems:'left' }}>Real-time Transcription with Azure Speech Cognitive Service</div>    
                </div>
                <div class="col-6">
                <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent:'left', alignItems:'left' }}>Call Insights Extraction with Azure Language Cognitive Service</div>    
                </div>
              
            </div> 


            <div className="row"> 
                <div class="col-6">
                    <textarea class="form-control" id="transcriptTextarea" rows="10" style={{"background-color":"white", "color":"black", "borderWidth":"2px", 'borderColor':"white", 'borderStyle':'groove', overflowY: 'scroll', height: 360}}>
                    Speak to your microphone or copy/paste your conversation transcript here
                    </textarea>
                </div>

                <div className="col-6 nlpoutput-display rounded" style={{ height: 360}}>                      
                    <code style={{"color":"black"}}>{this.state.displayNLPOutput}</code>
                </div>
            </div>    
              
              <div style={{ color: 'black', fontSize: 8, display: 'flex', justifyContent:'center' }}>.</div>
              <div style={{ color: 'black', fontSize: 22, display: 'flex', justifyContent:'center' }}>Use Azure OpenAI GPT models to gain valuable business insights from conversations</div>
              <div style={{ color: 'black', fontSize: 5, display: 'flex', justifyContent:'center' }}>.</div>
              <div class="row text-white">
                <div class="col-sm-6">
                    <div class="card text-center text-dark bg-light">
                    <div class="card-body">
                        <h5 class="card-title">Conversation Summary using GPT-3 (Azure OpenAI)</h5>                     
                        <button type="button" class="btn btn-info btn-sm" onClick={() => this.gptSummarizeText(this.state.displayText)}>Generate Conversation Summary</button>
                    </div>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="card text-center text-dark ">
                    <div class="card-body">
                        <h5 class="card-title">Conversation Details using GPT-3 (Azure OpenAI)</h5>
                        <button type="button" class="btn btn-info btn-sm" onClick={() => this.gptParseExtractInfo(this.state.displayText)}>Extract Conversation Details</button>
                    </div>
                    </div>
                </div>
              </div>
              
              <div className="row"> 
                  <div className="col-6 nlpoutput-display rounded" style={{ height: 300}}>
                        <code style={{"color":"black"}}>{this.state.gptSummaryText}</code>
                  </div>
                  <div className="col-6 nlpoutput-display rounded " style={{ height: 300}}>                      
                      <code style={{"color":"black"}}>{this.state.gptExtractedInfo}</code>
                  </div>
              </div>   
            
              <div style={{ color: 'black', fontSize: 10, display: 'flex', justifyContent:'center' }}>.</div>
              <div style={{ color: 'black', fontSize: 22, display: 'flex', justifyContent:'center' }}>Prompt Engineering to Guide GPT-3 extract custom Business Insights</div>
              <div style={{ color: 'black', fontSize: 5, display: 'flex', justifyContent:'center' }}>.</div>
              <div class="row text-dark">             
                <div class="col-6">
                    <label for="customPromptTextarea" class="form-label"style={{"color":"black"}}>Enter your custom prompt: </label>
                    <button type="button" class="btn btn-info btn-sm float-end" onClick={() => this.gptCustomPromptCompetion(this.state.displayText)}>Extract Insights</button>
                    <textarea class="form-control" id="customPromptTextarea" rows="10" style={{"background-color":"white", "color":"black", "borderWidth":"2px", 'borderColor':"white", 'borderStyle':'groove', overflowY: 'scroll'}}>
                    Enter a prompt here
                    </textarea>
                </div>
                <div className="col-6 nlpoutput-display rounded " style={{ height: 300}}>                      
                    <code style={{"color":"black"}}>{this.state.gptCustomPrompt}</code>
                </div>                     
              </div>
                <p> </p>
              <div class="row text-dark">             
                <div class="col-6">
                    <label for="customPromptTextarea" class="form-label" style={{"color":"black"}}>Enter your custom prompt:</label>
                    <button type="button" class="btn btn-info btn-sm float-end" onClick={() => this.gptCustomPromptCompetion2(this.state.displayText)}>Extract Insights</button>
                    <textarea class="form-control" id="customPromptTextarea2" rows="10" style={{"background-color":"white", "color":"black", "borderWidth":"2px", 'borderColor':"white", 'borderStyle':'groove', overflowY: 'scroll'}}>
                    Enter a prompt here
                    </textarea>
                </div>
                <div className="col-6 nlpoutput-display rounded " style={{ height: 300}}>                      
                    <code style={{"color":"black"}}>{this.state.gptCustomPrompt2}</code>
                </div>                     
              </div>

          </Container>     
      );
  }
}