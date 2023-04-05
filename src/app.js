// We'll use the OpenAI JavaScript module to send prompts to ChatGPT, see:
// https://www.npmjs.com/package/openai
// For this to work, we have to "bundle" our JavaScript code together
// with the OpenAI code, and any code it needs.  We'll do that using
// https://parceljs.org/
const { OpenAIApi, Configuration } = require('openai');


// You need an OpenAI account and Secret API Key for this to work, see:
// https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key
// Get the API Key from the .env file via `process.env.OPENAI_API_KEY` variable
// See https://parceljs.org/features/node-emulation/#.env-files
function configureOpenAI() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a client with our account config and return it
  const openai = new OpenAIApi(configuration);
  return openai;
}

// Translate our user's form input into a ChatGPT prompt format
function buildUserPrompt(topic, level, questionCount, questionType, includeAnswers) {
  const prompt = 
`I'm studying the following topic:

---begin-topic---
${topic}
---end-topic---

I need ${questionCount} ${questionType} questions${includeAnswers ? ', including answers.' : ', do NOT include answers.'}

In terms of my knowledge level as a student, on a scale from 1-10 (beginner to expert) I'm a ${level}. Take this into account in your response.

You must format your response using Bootstrap HTML in the following form, adding Bootstrap classes to make the response look nice:

<div class="container">...</div>
`;

  console.log({prompt});
  return prompt;
}

// NOTE: we use `async` here because we need to do a long-running call over
// the network, and wait (i.e., `await`) the response.  The `async` keyword
// is needed on any function that needs to run asynchronous calls and `await`.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
async function chat(topic, level, questionCount, questionType, includeAnswers) {
  // Setup the openai client
  const openai = configureOpenAI();

  // Define our list of messages to send in our "chat", see:
  // https://platform.openai.com/docs/guides/chat
  const messages = [
    // System prompt tells the AI how to function
    {
      role: "system",
      content: "You are a college-level educational assistant, helping students study topics."
    },
    // User prompt is what we want it to do
    {
      role: "user",
      // Build the prompt using our function and the user's data
      content: buildUserPrompt(topic, level, questionCount, questionType, includeAnswers)
    }
  ]
  
  // Any network request could fail, so we use try/catch
  try {
    // Send our messages to OpenAI, and `await` the response (it will take time)
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    // The response we get back will be a complex object, and we want to drill in
    // to get our data, see https://platform.openai.com/docs/guides/chat/response-format
    const answer = completion.data.choices[0].message.content;
    console.log({ answer });

    displayOutput(answer);
  } catch (error) {
    // If anything goes wrong, show an error in the console (we could improve this...)
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  } finally {
    // Re-enable the submit button so the user can try again
    toggleSubmitButton();
  }
}

// Toggle the Submit button to a Loading... button, or vice versa
function toggleSubmitButton() {
  const submitButton = document.querySelector('#input-form button[type=submit]');

  // Flip the value true->false or false->true
  submitButton.disabled = !submitButton.disabled;

  // Flip the button's text back to "Loading..."" or "Submit"
  const submitButtonText = submitButton.querySelector('.submit-button-text');
  debugger;
  if(submitButtonText.innerHTML === 'Loading...') {
    submitButtonText.innerHTML = 'Submit';
  } else {
    submitButtonText.innerHTML = 'Loading...';
  }

  // Show or Hide the loading spinner
  const submitButtonSpinner = submitButton.querySelector('.submit-button-spinner')
  submitButtonSpinner.hidden = !submitButtonSpinner.hidden;
}

// Update the output to use new HTML content
function displayOutput(html) {
  // Put the AI generated HTML into our output div.  Use `innerHTML` so it renders as HTML
  const output = document.querySelector('#output');
  output.innerHTML = html;
}

// Set the output to nothing (clear it)
function clearOutput() {
  displayOutput('');
}

// Process the user's form input and send to ChatGPT API
function processFormInput(form) {
  // Get values from the form
  const topic = form.topic.value.trim();
  const level = form.level.value;
  const questionCount = form['question-count'].value;
  const questionType = form['question-type'].value;
  const includeAnswers = form['include-answers'].checked;

  // Update the Submit button to indicate we're done loading
  toggleSubmitButton();

  // Clear the output of any existing content
  clearOutput();

  // Send the input values to OpenAI's ChatGPT API
  chat(topic, level, questionCount, questionType, includeAnswers);
}

function main() {
  // Wait for the user to submit the form
  document.querySelector('#input-form').onsubmit = function(e) {
    // Stop the form from submitting, we'll handle it in the browser with JS
    e.preventDefault();

    // Process the data in the form, passing the form to the function
    processFormInput(e.target)
  };

  // Update the character count when the user enters any text in the topic textarea
  document.querySelector('#topic').oninput = function(e) {
    // Get the current length
    const length = e.target.value.length;
    // Update the badge text
    document.querySelector('#topic-badge').innerText = `${length} characters`;
  }
}

// Wait for the DOM to be ready before we start
addEventListener('DOMContentLoaded', main);
