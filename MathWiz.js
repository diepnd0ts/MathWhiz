/*
  Polynomial Solver
*/

'use strict';

var Alexa = require('alexa-sdk');

var GAME_STATES = {
  SETUP: "_SETUPMODE", //Prompts user to setup the game
  QUIZ: "_QUIZMODE", // Asking math problems
};

var numOfProblems;
var mathLevel;
var maxAddSubtractNum = 21;  // Add and subtract numbers are 0-20
var maxMultiplyNum = 13; //Multiplication and division numbers are 0-12

//const APP_ID = undefined; //OPTIONAL
var speechConsCorrect = ["Booya", "All righty", "Bam", "Bazinga", "Bingo", "Boom", "Bravo", "Cha Ching", "Cheers", "Dynomite",
"Hip hip hooray", "Hurrah", "Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap", "Phew",
"Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa"];

var speechConsWrong = ["Argh", "Aw man", "Blarg", "Blast", "Boo", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk", "Le sigh",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Wah wah", "Whoops a daisy", "Yikes"];

var languageString = {
  "en": {
    "translation" : {
      "WELCOME_MESSAGE": "Welcome to Math Wiz! ",
      "LEVEL_CONFIG_PROMPT": "What level do you want for your quiz? ",
      "LEVEL_CONFIG_ERROR" : "Sorry, there are only levels 1 through 3. Please choose another level. ",
      "QUIZ_LENGTH_PROMPT": "How many math problems do you want to do? ",
      "QUIZ_LENGTH_ERROR": "Sorry, there can only be 1 to a max of 20 math problems. Please give another quantity. ",
      "CONFIRMATION_MESSAGE": "Okay, the math quiz will be level %s and will have %s problems. Is that correct? ",
      "READY_PROMPT": "Are you ready? ",
      "COUNTDOWN_START": "Three, two, one. ",
      "HALFWAY_MESSAGE": "You're half way there! ",
      "ANSWER_RESPONSE": "<say-as interpret-as='interjection'>%s!</say-as> ",
      "GAME_OVER_MESSAGE": "You got %s out of %s questions correct. ",
      "PLAY_AGAIN_PROMPT": "Would you like to do another math quiz? ",
      "GOODBYE_MESSAGE": "Okay, we'll play another time. Goodbye! ",
    },
  },
};

function resetGameSetup() {
  numOfProblems = undefined;
  mathLevel = undefined;
}

function checkNumProblemsResponse(numProblems) {
  if (numProblems < 1 || numProblems > 20) {
    this.emit(":ask", this.t("QUIZ_LENGTH_ERROR"));
  }
  else {
    numOfProblems = numProblems;
    this.emit(":ask", this.t("LEVEL_CONFIG_PROMPT"));
  }
}

function checkLevelResponse(level) {
  if (level < 1 || level > 3) {
    this.emit(":ask", this.t("LEVEL_CONFIG_ERROR"));
  }
  else {
    mathLevel = level;
  }
}

function generateOperand(level) {
  var operand;
  if (level == 1)
    operand = Math.floor(Math.random() * 2);
  else if (level == 2)
    operand = Math.floor(Math.random() * 2) + 2;
  else if (level == 3)
    operand = Math.floor(Math.random() * 4);
  return operand;
}

function generateNumbers(operand) {
  var firstNum, secondNum;
  if (operand === 0) {
    firstNum = Math.floor(Math.random() * maxAddSubtractNum);
    secondNum = Math.floor(Math.random() * maxAddSubtractNum);
  }
  else if (operand == 1) { //second number must not be greater than the first number
    firstNum = Math.floor(Math.random() * maxAddSubtractNum);
    secondNum = Math.floor(Math.random() * (firstNum+1));
  }
  else if (operand == 2) {
    firstNum = Math.floor(Math.random() * maxMultiplyNum);
    secondNum = Math.floor(Math.random() * maxMultiplyNum);
  }
  else if (operand == 3) { //first number must not be 0
    firstNum = Math.floor(Math.random() * maxMultiplyNum) + 1
    secondNum = Math.floor(Math.random() * maxMultiplyNum);
    firstNum *= secondNum;
  }
  return [firstNum, secondNum];
}

function generateMathProblems(level) {
  var mathProblems = [];
  for (var i = 0; i < numOfProblems; i++) {
    var operand = generateOperand(level);
    var numbers = generateNumbers(operand);
    mathProblems.push({"firstNum" : numbers[0], "operand": operand, "secondNum": numbers[1]});
  }
  return mathProblems;
}

function translateToSpeech(mathProblems) {
  var verbalMathProblems = [];
  for (var i = 0; i < mathProblems.length; i++) {
    var operand = "";
    if (mathProblems[i].operand === 0)
        operand = "plus";
    else if (mathProblems[i].operand === 1)
        operand = "minus";
    else if (mathProblems[i].operand == 2)
      operand = "times";
    else if (mathProblems[i].operand == 3)
      operand = "divided by";
    verbalMathProblems.push(mathProblems[i].firstNum + " " + operand + " " + mathProblems[i].secondNum);
  }
  return verbalMathProblems;
}

function generateAnswers(mathProblems) {
  var mathAnswers = [];
  for (var i = 0; i < mathProblems.length; i++) {
    var operand = mathProblems[i].operand;
    var answer;
    if (operand === 0)
        answer = mathProblems[i].firstNum + mathProblems[i].secondNum;
    else if (operand === 1)
        answer = mathProblems[i].firstNum - mathProblems[i].secondNum;
    else if (operand == 2)
      answer = mathProblems[i].firstNum * mathProblems[i].secondNum;
    else if (operand == 3)
      answer = mathProblems[i].firstNum / mathProblems[i].secondNum;
    mathAnswers.push(answer);
  }
  return mathAnswers;
}

function checkUserAnswer(userAnswer) {
  var response = "";

  //Checks user answer. Responds to correct or wrong answer
  if (userAnswer == this.attributes["mathAnswers"][this.attributes["currentMathProblem"]]) {
    var correctSpeech = Math.floor(Math.random() * speechConsCorrect.length);
    this.attributes["userScore"]++;
    response = this.t("ANSWER_RESPONSE", speechConsCorrect[correctSpeech]);
  }
  else {
    var wrongSpeech = Math.floor(Math.random() * speechConsWrong.length);
    response = this.t("ANSWER_RESPONSE", speechConsWrong[wrongSpeech]);
  }

  //Proceeds with asking the next math problem. Ends game when quiz is finished.
  this.attributes["currentMathProblem"]++;
  if ((numOfProblems % 2 == 0 && this.attributes["currentMathProblem"] == numOfProblems/2) ||
    (numOfProblems % 2 == 1 && this.attributes["currentMathProblem"] == numOfProblems/2 + 0.5))
    response += this.t("HALFWAY_MESSAGE");

  if (this.attributes["currentMathProblem"] < numOfProblems) {
    response += this.attributes["mathProblemsToSpeech"][this.attributes["currentMathProblem"]];
    this.emit(":ask", response);
  }
  else {
    response +=  this.t("GAME_OVER_MESSAGE", this.attributes["userScore"].toString(), numOfProblems.toString()) + this.t("PLAY_AGAIN_PROMPT");
    this.emit(":ask", response);
  }
}

/*
 **********************HANDLERS******************************
*/
var handlers = {
  "LaunchRequest": function() {
    this.handler.state = GAME_STATES.SETUP;
    this.emitWithState("SetupState");
  },
  "Unhandled": function() {
    this.handler.state = GAME_STATES.SETUP;
    this.emitWithState("SetupState");
  }
};

var setupStateHandlers = Alexa.CreateStateHandler(GAME_STATES.SETUP, {
  "SetupState": function () {
    var welcomeMessage = this.t("WELCOME_MESSAGE") + this.t("QUIZ_LENGTH_PROMPT");
    var repromptMessage = this.t("QUIZ_LENGTH_PROMPT");
    this.emit(":ask", welcomeMessage, repromptMessage);
  },
  "ResponseIntent": function() {
    var response = this.event.request.intent.slots.response.value;
    if (!numOfProblems) {
      checkNumProblemsResponse.call(this, response);
    }
    else if (!mathLevel) {
      checkLevelResponse.call(this, response);
    }
    if (numOfProblems && mathLevel) {
      this.emit(":ask", this.t("CONFIRMATION_MESSAGE", mathLevel.toString(), numOfProblems.toString()));
    }
  },
  "AMAZON.YesIntent": function () {
    this.attributes["mathProblems"] = generateMathProblems(mathLevel);
    this.attributes["mathProblemsToSpeech"] = translateToSpeech(this.attributes["mathProblems"]);
    this.attributes["mathAnswers"] = generateAnswers(this.attributes["mathProblems"]);
    this.attributes["currentMathProblem"] = 0;
    this.attributes["userScore"] = 0;
    this.handler.state = GAME_STATES.QUIZ;
    this.emitWithState("QuizState");
  },
  "AMAZON.NoIntent": function() {
    resetGameSetup();
    this.emitWithState("SetupState");
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
  "AMAZON.StopIntent": function() {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
  "AMAZON.SessionEndedRequest": function () {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
});

var quizStateHandlers = Alexa.CreateStateHandler(GAME_STATES.QUIZ, {
  "QuizState": function () {
    var response = "";
    if (this.attributes["currentMathProblem"] === 0) {
      response = this.t("COUNTDOWN_START") + "What is " + this.attributes["mathProblemsToSpeech"][this.attributes["currentMathProblem"]] + "?";
      this.emit(":ask", response);
    }
    else {
      this.emit(":ask", "There is something wrong with the Quiz State function. Current math problem is at " + this.attributes["currentMathProblem"] + ".");
    }
  },
  "ResponseIntent": function() {
    var userAnswer = parseInt(this.event.request.intent.slots.response.value);
    checkUserAnswer.call(this, userAnswer);
  },
  "AMAZON.RepeatIntent": function() {
    var response = "What is " + this.attributes["mathProblemsToSpeech"][this.attributes["currentMathProblem"]] + "?";
    this.emit(":ask", response);
  },
  "AMAZON.YesIntent": function() {
    resetGameSetup();
    this.handler.state = GAME_STATES.SETUP;
    this.emitWithState("SetupState");
  },
  "AMAZON.NoIntent": function() {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
  "AMAZON.StopIntent": function() {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
  "AMAZON.SessionEndedRequest": function () {
    this.emit(":tell", this.t("GOODBYE_MESSAGE"));
  },
});

exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.resources = languageString;
  alexa.registerHandlers(handlers, setupStateHandlers,quizStateHandlers);
  alexa.execute();
};
