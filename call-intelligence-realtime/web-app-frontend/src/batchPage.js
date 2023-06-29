import React, { Component } from 'react';
import { Container } from 'reactstrap';
//import axios from 'axios';
import { getGPT3ParseExtractInfo, getGPT3CustomPromptCompletion, getGPT3Summarize, getKeyPhrases, getTokenOrRefresh } from './token_util.js';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import './App.css';
//import { Input } from '@material-ui/core';
import { parse } from "iso8601-duration";
import App from './App.js';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')
var recognizer;

// const BatchPage  = () => {
    export default class BatchPage extends Component {

    constructor(props) {
        super(props);
  
        this.state = { value: '' };
    this.audioRef = React.createRef();

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFileInputChange = this.handleFileInputChange.bind(this);
    this.handleTranscribeButtonClick = this.handleTranscribeButtonClick.bind(this);
    this.handleSentenceClick = this.handleSentenceClick.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);

        this.state = {
            displayText: "READY to start call simulation",
            displayNLPOutput: "",
            gptSummaryText: "",
            gptExtractedInfo: "",
            gptCustomPrompt: "",
            gptCustomPrompt2: "",
            gptPrompt: "",
            gptPrompt2: "",
            timeText: "",
            activeWindow: "window2",
            modifiedConversation1: [],
            timestamps: [],
            currentTime: 0,
            objectURL: "",
          };
      
        }
      
        state = {
          // Initially, no file is selected
          selectedFile: null,
          selectedFileName: null,
          formSelectBatchLanguage: 'en-IN',
          masterTextareaRef: null,
          slaveTextareaRef: null,
          numberingElements: null,
          sentenceElements: null,
          hoveredButton: '',
          isLoading: false,
          isPlaying: false,
          currentSentenceIndex: -1, 
          showBatchPage:true
        };
      
      
        handleFileInputChange = (event) => {
      
          this.setState({ selectedFile: event.target.files[0] });
          // this.setState({selectedFileName: event.target.files[0].name});
        };
      
      
        handleTranscribeButtonClick = async () => {
      
          if (this.state.selectedFile == null) {
            alert('Choose a file before clicking TRANSCRIBE BUTTON!')
          }
          const formData = new FormData();
          formData.append('audio', this.state.selectedFile);
          formData.append('language', document.getElementById('formSelectBatchLanguage').value); // Get the selected value of the select element
      
      
          try {
      
            this.setState({ isLoading: true });
      
            fetch('/upload', {
              method: "POST",
              body: formData
            })
      
              // console.log(response.data);
      
              .then(response => response.json()) // Parse the response as JSON
              .then(data => {
      
                this.setState({ isLoading: false });
                const ttext = document.getElementById("transcriptTextarea");
      
                ttext.value = '';
                var res = '';
                var result = [];
                var timestamp = [];
                var dic = {};
      
                for (let i = 0; i < data["recognizedPhrases"].length; i++) {
      
                  if (data["recognizedPhrases"][i]["channel"] === 1) {
                    data["recognizedPhrases"][i]["speaker"] = 1;
                  }
      
                  //TimeStamps 
                  dic[i] = data["recognizedPhrases"][i]["offsetInTicks"] / 10000000;
                }
      
                var element = [];
                      
                //sorted dic values
                const sortedEntries = Object.entries(dic).sort((a, b) => a[1] - b[1]);
      
      
                for (let i = 0; i < sortedEntries.length; i++) {
                  const innerList = sortedEntries[i];
                  element.push(innerList[0]);
      
                }
                // console.log(element);
      
      
                for (let i = 0; i < element.length; i++) {
                  var k = null;
                  k = element[i];
      
                  // Find the index of the nBest object with the largest confidence value
                  // const maxConfidenceIndex = data["recognizedPhrases"][k].nBest.reduce((maxIndex, currentNBest, currentIndex, nBestArray) => {
                  //   if (currentNBest.confidence > nBestArray[maxIndex].confidence) {
                  //     return currentIndex;
                  //   } else {
                  //     return maxIndex;
                  //   }
                  // }, 0);
                  // console.log(maxConfidenceIndex);
      
                  //Sentiment Analysis
      
                  const { negative, positive, neutral } = data.recognizedPhrases[k].nBest[0].sentiment;
      
                  let largestElement = '';
                  if (negative > positive && negative > neutral) {
                    largestElement = 'negative';
                  } else if (positive > negative && positive > neutral) {
                    largestElement = 'positive';
                  } else {
                    largestElement = 'neutral';
                  }
      
                  timestamp.push(data["recognizedPhrases"][k]["offsetInTicks"] / 10000000);
                  this.setState({ timestamps: timestamp });
      
      
                  res = ' Speaker ' + data["recognizedPhrases"][k]["speaker"] + ": " + data["recognizedPhrases"][k]["nBest"][0]["display"] + ' {' + largestElement + '}';
                  //res= ' Speaker '+ data["recognizedPhrases"][k]["speaker"] + ": " + data["recognizedPhrases"][k]["nBest"][0]["display"];
      
                  result.push(res);
                  ttext.value += res + '\n\n';
                }
      
                //Replacing 'Speaker 0 and 1 with Agent or Customer'
                const getProfileInfos = async () => {
                  var PersonObj = await this.gptPersonInfo();
      
                  ttext.value = '';
      
                  const replacements = JSON.parse(PersonObj);
      
                  const modifiedConversation = result.map(line => {
                    return line.replace(/Speaker \d/g, match => replacements[match]);
                  });
      
                  for (let i = 0; i < modifiedConversation.length; i++) {
      
                    ttext.value += modifiedConversation[i];
      
                  }
                  
      
                  this.setState({ modifiedConversation1: modifiedConversation })
                  console.log(this.state.modifiedConversation1);
      
                }
      
      
                getProfileInfos();
      
      
                //display duration of the audio file
      
                const timevalue = document.getElementById("durationtextarea");
      
                var t = [];
                t.push(parse(data["duration"])['hours']);
                t.push(parse(data["duration"])['minutes']);
                t.push(parse(data["duration"])['seconds']);
                timevalue.value = t[0] + " " + "hours" + "  " + t[1] + " " + "minutes" + "  " + t[2] + " " + "seconds";
                this.setState({ timeText: timevalue });
              })
      
          } catch (error) {
            console.error(error);
            this.setState({ isLoading: false });
          }
      
        };
      
      
        playAudio = () => {
          const { selectedFile } = this.state;
          const { objectURL, currentTime } = this.state;
          if (selectedFile) {
            if (objectURL !== '') {
              this.audioRef.current.src = objectURL;
              this.audioRef.current.currentTime = currentTime;
              this.audioRef.current.play();
            } else {
              const newObjectURL = URL.createObjectURL(selectedFile);
              this.setState({ objectURL: newObjectURL }, () => {
                this.audioRef.current.src = newObjectURL;
                this.audioRef.current.currentTime = currentTime;
                this.audioRef.current.play();
              });
            }
            this.setState({ isPlaying: true });
      
          }
        };
      
        pauseAudio = () => {
          this.audioRef.current.pause();
          this.setState({ isPlaying: false });
        };
      
        handleTimeUpdate = (event) => {
          const currentTime = event.target.currentTime;
          this.setState({ currentTime: currentTime });
      
          if (this.state.isPlaying) {
            // Find the index of the sentence based on the current time
            const currentIndex = this.state.timestamps.findIndex((timestamp) => timestamp >= currentTime);
            if (currentIndex !== -1) {
              this.setState({ currentSentenceIndex: currentIndex - 1 });
            }
          }
      
        };
      
        handleSentenceClick = (index) => {
          var key = index["index"];
          console.log("index of sentence clicked:", key);
          var clickedTimestamp = this.state.timestamps;
          console.log(clickedTimestamp[key]);
      
          this.setState({ currentTime: clickedTimestamp[key] }, () => {
            this.audioRef.current.currentTime = clickedTimestamp[key];
            if (!this.audioRef.current.paused) {
              this.audioRef.current.play();
            }
          });
        };
  
    handleToggle = () => {
      this.setState(prevState => ({
        showBatchPage: !prevState.showBatchPage,
      }));
    };

    handleWindowClick = (windowName) => {
        this.setState({ showBatchPage: windowName });
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
  

    async gptPersonInfo(inputText) {
      // var customPromptText = "This is a call centre conversation between two people (Speaker 0 and Speaker 1) , one of which is Agent and another is Customer. Can you categorize Speaker 0 and Speaker 1 into either one of agent and customer ?  Store the result in a dictionary { key:value } where key-value pair is the speaker and his/her category respectively. Make sure to use double quotes for keys and string values.";
      var customPromptText = "In the given call center conversation, categorize Speaker 0 and Speaker 1 into 'Agent' or 'Customer' after analysing their behavior. Store the result in a dictionary { key:value } where key-value pair is the speaker and his/her category respectively. Make sure to use double quotes for keys and string values";
      var transcriptInputForCA = document.getElementById("transcriptTextarea").value;
      //const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
      const gptObj = await getGPT3DiarizationPromptCompletion(transcriptInputForCA, customPromptText);
      const gptText = gptObj.data.text;
      console.log(gptObj);
      console.log(gptText);
      try{
      this.setState({ gptPrompt: gptText.replace(".\n\n", "") });
      return gptText.replace(".\n\n", "");
      }
      catch{
      this.setState({ gptPrompt: gptObj.data });
      }
    }
  
    async gptKeyTopics(inputText) {
      var customPromptText = "List down the key topics discussed in this call center call.";
      var transcriptInputForCA = document.getElementById("transcriptTextarea").value;
      //const gptObj = await getGPT3CustomPromptCompletion(inputText, customPromptText);
      const gptObj = await getGPT3CustomPromptCompletion(transcriptInputForCA, customPromptText);
      const gptText = gptObj.data.text;
      try{
      this.setState({ gptPrompt2: gptText.replace("\n\n", "") });
      }
      catch{
      this.setState({ gptPrompt2: gptObj.data });
      }
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
            pageComponent = <App />;
        } else {
            pageComponent = (
                <Container className="app-container2">
                    <div class="card text-white bg-dark mb-3 text-center" >
  
                        <h3 class="card-header">Call-Center Analytics</h3>
                        <p> </p>

                        <form class="row row-cols-lg-auto g-3 align-items-center text-white">
                            <div class="col-2">


                                <select class="form-select" id="formSelectBatchLanguage" style={{ width: "200px" }}>
                                  <option value="en-IN" selected>English (India)</option>
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
                                  <option value="ar-EG">Arabic (Egypt)</option>
                                  <option value="ar-IL">Arabic (Israel)</option>
                                  <option value="ar-SA">Arabic (Saudi Arabia)</option>
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

                            <div class="col-8" style={{display:'flex', justifyContent: 'center'}}>

                                <input type="file" name='audio' onChange={this.handleFileInputChange} />
                                <button type="button" class="button-85" onClick={this.handleTranscribeButtonClick}>Transcribe</button>
                                {/* <button type='button' onClick={this.handleToggle} style={{float: 'right'}}>Live Page</button> */}

                            </div>

                            {/* <div style={{float: 'right', display:'flex'}}> */}
                            <button type="button" onClick={this.handleToggle}  style={{ width: '60px', display: "inline-block", marginLeft: '58px', backgroundColor: '#808080', "border-radius": "0px", "box-sizing": "border-box", border: "1px", borderColor: 'black', color: "#FFFFFF", "font-size": "17px", justifycontent: "center", padding: "2px", marginRight: "1px" }}>Live</button>
                            <button type="button" className={this.state.showBatchPage === true ? 'active' : 'active'} style={{ width: '60px', display: "inline-block", backgroundColor: '#808080', "border-radius": "2px", "box-sizing": " border-box", color: "#FFFFFF", border: "1px", borderColor: 'black', "font-size": "17px", justifycontent: "center", padding: "2px" }}>Batch</button>
                            {/* </div> */}

                        </form>
                        <p> </p>
                        <div><p></p></div>

          <div style={{ fontSize: 18, display: 'flex', justifyContent: 'center' }} >
            {(this.state.isLoading) ? (
              <div>

                <p>Please wait while the transcript gets generated!</p>
                <h6>Loading...</h6>
              </div>
            ) : (
              <div> </div>)}

          </div>

          <div>
            <audio ref={this.audioRef} className="audio-player" onTimeUpdate={this.handleTimeUpdate} controls />
            {/* <p>Current Time: {this.state.currentTime}</p> */}
            {this.state.selectedFile && (
              <div>
                {this.state.isPlaying ? (
                  <button
                    type="button"
                    onClick={this.pauseAudio}
                    style={{ marginLeft: 0, marginBottom: 12, marginTop: 10, background: "#fffafa", borderRadius: 6, color: "black", width: 60 }}
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={this.playAudio}
                    style={{ marginLeft: 0, marginBottom: 12, marginTop: 10, background: "#fffafa", borderRadius: 6, color: "black", width: 60 }}
                  >
                    Play
                  </button>
                )}
              </div>
            )}
          </div>
                    </div>
  
                    <div className="row">
                        <div class="col-6">
                            <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent: 'left', alignItems: 'left' }}>Transcription with Azure Speech Cognitive Service</div>
                        </div>
                        <div class="col-6">
                            <div style={{ color: 'black', fontSize: 18, display: 'flex', justifyContent: 'left', alignItems: 'left' }}>Call Insights Extraction with Azure OpenAI</div>
                        </div>
  
                    </div>
  
  
        <div className="row">

          <div >
            <span style={{ color: 'black' }}>Sentiment Index: </span>
            <span style={{ color: '#006400' }}>&nbsp;&nbsp;&#x2022;&nbsp;Positive</span>
            <span style={{ color: '#ff8c00' }}>&nbsp;&nbsp;&#x2022;&nbsp;Neutral</span>
            <span style={{ color: '#ff0000' }}>&nbsp;&nbsp;&#x2022;&nbsp;Negative</span>
          </div>
          <div class="col-6" id='transcriptTextarea' style={{  height: 360, background: "white", border: "0.5px", borderColor: 'black', "box-shadow": "0 0 2px #000 ", borderStyle: 'outset', overflowY: "auto" }}>


                {this.state.modifiedConversation1.map((sentence, index) => {
                  let sentimentColor;
                  if (sentence.includes('{positive}')) {
                    sentimentColor = '#006400 '; //green
                  } else if (sentence.includes('{negative}')) {
                    sentimentColor = '#ff0000'; //red
                  } else {
                    sentimentColor = '#ff8c00'; //orange
                  }
                  const sentenceText = sentence.replace(/{(positive|negative|neutral)}/g, '');
                  const [tag, text] = sentenceText.split(':');

                  return (

                    <div onClick={() => this.handleSentenceClick({ index })} key={index} style={{ height: "auto", color: 'black'}}>
                      <span style={{ color: sentimentColor, fontWeight: 'bold' }}>{tag}:</span><span style={{ background: this.state.currentSentenceIndex === index ? "yellow" : "transparent" }} contentEditable={true}> {text}</span>
                      <div style={{ height: "12px" }} ></div>
                    </div>

                  );

                })}

              </div>

          <div  className="col-6 " style={{ height: 360 }}>
            {/* <code style={{"color":"black"}}>{this.state.displayNLPOutput}</code> */}
            {/* <div className="col-6 nlpoutput-display rounded" id="infotextarea" style={{ height: 80 , width: 557}}>                      
            <button type="button" class="btn btn-info btn-sm float-end" onClick={() => this.gptPersonInfo(this.state.displayText)}>Extract Names</button>
            <code style={{"color":"black"}}>{this.state.gptPrompt}</code>
                </div> */}
           
                <div  style={{ height: 60, width: '100%' }} >
                  <textarea  id="durationtextarea" style={{ height: 58, width: '100%'}}>
                    Duration of the audio is...
                  </textarea>
                </div>

                <div className="col-6 nlpoutput-display rounded" id="infotextarea" style={{ height: 300, width: '100%', position: 'relative'}}>
                  <button type="button" class="button" style={{ position: 'absolute', top: 0, right: 0}} onClick={() => this.gptKeyTopics(this.state.displayText)}>Extract Key Topics</button>
                  <code style={{ "color": "black" }}>{this.state.gptPrompt2}</code>
                </div>
              </div>
            
          </div>

  
                    <div style={{ color: 'black', fontSize: 10, display: 'flex', justifyContent: 'center' }}>.</div>
                    <div style={{ color: 'black', fontSize: 22, display: 'flex', justifyContent: 'center' }}>Prompt Engineering to Guide Azure OpenAI GPT extract custom Business Insights</div>
                    <div style={{ color: 'black', fontSize: 5, display: 'flex', justifyContent: 'center' }}>.</div>
                    <div class="row text-dark">
                        <div class="col-6" style={{ position: 'relative'}}>
                            <label for="customPromptTextarea" class="form-label" style={{ "color": "black" }}>Enter your custom prompt: </label>
                            <button type="button" class="button" style={{position: 'absolute', top: 0, right: 12}} onClick={() => this.gptCustomPromptCompetion(this.state.displayText)}>Extract Insights</button>
                            <textarea class="form-control" id="customPromptTextarea" rows="10" style={{ "background-color": "white", "color": "black", "borderWidth": "2px", 'borderColor': "white", 'borderStyle': 'groove', overflowY: 'auto' }}>
                                Enter a prompt here
                            </textarea>
                        </div>
                        <div className="col-6 nlpoutput-display rounded " style={{ height: 300 }}>
                            <code style={{ "color": "black" }}>{this.state.gptCustomPrompt}</code>
                        </div>
                    </div>
                    <p> </p>
                    {/* <div class="row text-dark">
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
                    </div> */}
  
                </Container>
            );
        }
        return (<div>
            {pageComponent}
        </div>
        );
    }
};
