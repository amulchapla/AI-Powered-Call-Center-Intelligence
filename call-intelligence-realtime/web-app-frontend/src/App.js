import React, { Component } from 'react';
import { Container } from 'reactstrap';
//import axios from 'axios';
import { getGPT3ParseExtractInfo, getGPT3CustomPromptCompletion, getGPT3Summarize, getKeyPhrases, getTokenOrRefresh } from './token_util.js';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import './App.css';
//import { Input } from '@material-ui/core';
import BatchPage from './batchPage.js';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')
var recognizer;

export default class App extends Component {
  constructor(props) {
      super(props);

      this.state = {value: '' };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleWindowClick = this.handleWindowClick.bind(this);

      this.state = {     
        displayText: 'READY to start call simulation',
        displayNLPOutput: '',
        gptSummaryText: '',
        gptExtractedInfo: '',
        gptCustomPrompt: '',
        gptCustomPrompt2: '',
        showBatchPage: false,
        activeWindow: "Live"
      };
  }

  handleToggle = () => {
    this.setState(prevState => ({
      showBatchPage: !prevState.showBatchPage,
    }));
  };
  handleWindowClick = (windowName) => {
    this.setState({ activeWindow: windowName });
  };

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
      const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
      //speechConfig.speechRecognitionLanguage = 'en-US';         

      var convLanguage = document.getElementById("formSelectConvLanguage").value;

      speechConfig.speechRecognitionLanguage = convLanguage;   
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
            /*const piiText = nlpObj.piiExtracted;
            if(piiText.length > 21){
                nlpText += "\n" + piiText; 
                this.setState({ displayNLPOutput: nlpText.replace('<br/>', '\n') }); 
            }      */              
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
    try{
        this.setState({ gptCustomPrompt: gptText.replace("\n\n", "") });
    }catch(error){
        this.setState({ gptCustomPrompt: gptObj.data });
    }
  }

  async gptCustomPromptCompetion2(inputText){
    var customPromptText = document.getElementById("customPromptTextarea2").value;
    var transcriptInputForPmt2 = document.getElementById("transcriptTextarea").value;
    //const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
    const gptObj = await getGPT3CustomPromptCompletion(transcriptInputForPmt2, customPromptText);
    const gptText = gptObj.data.text;
    try{
        this.setState({ gptCustomPrompt2: gptText.replace("\n\n", "") });
    }catch(error){
        this.setState({ gptCustomPrompt2: gptObj.data });
    }
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
      let pageComponent = null;

      if (this.state.showBatchPage) {
          pageComponent = <BatchPage />;
      } else {
          pageComponent = (
              <Container className="app-container">
                  <div class="card text-white bg-dark mb-3 text-center" >

                      <h3 class="card-header">Call-Center Analytics</h3>
                      <p> </p>

                      <form class="row row-cols-lg-auto g-3 align-items-center text-white">
                          <div class="col-2">
                              <select class="form-select" id="formSelectConvLanguage">
                                  <option value="en-US" selected>Select Language</option>
                                  <option value="en-US">English (USA)</option>
                                  <option value="en-GB">English (UK)</option>
                                  <option value="es-ES">Spanish (Spain)</option>
                                  <option value="es-MX">Spanish (Mexico)</option>
                                  <option value="fr-CA">French (Canada)</option>
                                  <option value="fr-FR">French (France)</option>
                                  <option value="it-IT">Italian (Italy)</option>
                                  <option value="ja-JP">Japanese (Japan)</option>
                                  <option value="da-DK">Danish (Denmark)</option>
                                  <option value="wuu-CN">Chinese (Wu, Simplified)</option>
                                  <option value="hi-IN">Hindi (India)</option>
                                  <option value="gu-IN">Gujarati (India)</option>
                                  <option value="te-IN">Telugu (India)</option>
                                  <option value="de-DE">German (Germany)</option>
                                  <option value="el-GR">Greek (Greece)</option>
                                  <option value="ar-EG">Arabic (Egypt)</option>
                                  <option value="el-GR">Greek (Greece)</option>
                                  <option value="ar-IL">Arabic (Israel)</option>
                                  <option value="ar-SA">Arabic (Saudi Arabia)</option>
                                  <option value="cs-CZ">Czech (Czechia)</option>
                                  <option value="ko-KR">Korean (Korea)</option>
                                  <option value="nl-NL">Dutch (Netherlands)</option>
                                  <option value="pt-BR">Portuguese (Brazil)</option>
                                  <option value="pt-PT">Portuguese (Portugal)</option>
                                  <option value="sv-SE">Swedish (Sweden)</option>
                                  <option value="he-IL">Hebrew (Israel)</option>
                                  <option value="th-TH">Thai (Thailand)</option>
                                  <option value="ta-IN">Tamil (India)</option>
                                  <option value="mr-IN">Marathi (India)</option>
                              </select>

                          </div>
                          <div class="col-8" style={{justifyContent: 'center', display:'flex'}}>
                              <button type="button" class="btn btn-success btn-sm" onClick={() => this.sttFromMic()}>START Conversation</button> &emsp; &ensp;
                              <button type="button" class="btn btn-outline-danger btn-sm" onClick={() => this.stopRecording()}>END Conversation</button>&emsp; &ensp;&emsp; &ensp;
                              <a href="https://azureopenaicallintel.z13.web.core.windows.net/" target="_blank" rel="noopener noreferrer">Additional Resources</a>
                              
                            </div>  
                              {/* <div style={{float: 'right', display:'flex'}}> */}
                              <button type="button" className={this.state.showBatchPage === false ? 'active' : ''} style={{ width: '60px', display: "inline-block", marginLeft: '58px', backgroundColor: '#808080', "border-radius": "0px", "box-sizing": "border-box", border: "1px", borderColor: 'black', color: "#FFFFFF", "font-size": "17px", justifycontent: "center", padding: "2px", marginRight: "1px" }}>Live</button>
                              <button type="button" onClick={this.handleToggle}  style={{ width: '60px', display: "inline-block", backgroundColor: '#808080', "border-radius": "2px", "box-sizing": " border-box", color: "#FFFFFF", border: "1px", borderColor: 'black', "font-size": "17px", justifycontent: "center", padding: "2px" }}>Batch</button>
                            {/* </div> */}
                          {/* </div> */}
                      </form>
                      <p> </p>
                  </div>

                  <div className="row">
                      <div class="col-6">
                          <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent: 'left', alignItems: 'left' }}>Real-time Transcription with Azure Speech Cognitive Service</div>
                      </div>
                      <div class="col-6">
                          <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent: 'left', alignItems: 'left' }}>Call Insights Extraction with Azure Language Cognitive Service</div>
                      </div>

                  </div>


                  <div className="row">
                      <div class="col-6">
                          <textarea class="form-control" id="transcriptTextarea" rows="10" style={{ "background-color": "white", "color": "black", "borderWidth": "2px", 'borderColor': "white", 'borderStyle': 'groove', overflowY: 'scroll', height: 360 }}>
                              Speak to your microphone or copy/paste your conversation transcript here
                          </textarea>
                      </div>

                      <div className="col-6 nlpoutput-display rounded" style={{ height: 360 }}>
                          <code style={{ "color": "black" }}>{this.state.displayNLPOutput}</code>
                      </div>
                  </div>

                  <div style={{ color: 'black', fontSize: 10, display: 'flex', justifyContent: 'center' }}>.</div>
                  <div style={{ color: 'black', fontSize: 22, display: 'flex', justifyContent: 'center' }}>Prompt Engineering to Guide Azure OpenAI GPT extract custom Business Insights</div>
                  <div style={{ color: 'black', fontSize: 5, display: 'flex', justifyContent: 'center' }}>.</div>
                  <div class="row text-dark">
                      <div class="col-6">
                          <label for="customPromptTextarea" class="form-label" style={{ "color": "black" }}>Enter your custom prompt: </label>
                          <button type="button" class="btn btn-info btn-sm float-end" onClick={() => this.gptCustomPromptCompetion(this.state.displayText)}>Extract Insights</button>
                          <textarea class="form-control" id="customPromptTextarea" rows="10" style={{ "background-color": "white", "color": "black", "borderWidth": "2px", 'borderColor': "white", 'borderStyle': 'groove', overflowY: 'scroll' }}>
                              Enter a prompt here
                          </textarea>
                      </div>
                      <div className="col-6 nlpoutput-display rounded " style={{ height: 300 }}>
                          <code style={{ "color": "black" }}>{this.state.gptCustomPrompt}</code>
                      </div>
                  </div>
                  <p> </p>
                  <div class="row text-dark">
                      <div class="col-6">
                          <label for="customPromptTextarea" class="form-label" style={{ "color": "black" }}>Enter your custom prompt:</label>
                          <button type="button" class="btn btn-info btn-sm float-end" onClick={() => this.gptCustomPromptCompetion2(this.state.displayText)}>Extract Insights</button>
                          <textarea class="form-control" id="customPromptTextarea2" rows="10" style={{ "background-color": "white", "color": "black", "borderWidth": "2px", 'borderColor': "white", 'borderStyle': 'groove', overflowY: 'scroll' }}>
                              Enter a prompt here
                          </textarea>
                      </div>
                      <div className="col-6 nlpoutput-display rounded " style={{ height: 300 }}>
                          <code style={{ "color": "black" }}>{this.state.gptCustomPrompt2}</code>
                      </div>
                  </div>

              </Container>
          );
      }
      return (<div>
          {pageComponent}
      </div>
      );
  }
}