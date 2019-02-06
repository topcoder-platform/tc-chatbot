const http = require('https')

const buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: 'PlainText',
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }
}

const generateResponse = (speechletResponse) => {
  return {
    version: '1.0',
    response: speechletResponse
  }
}

exports.handler = (event, context, callback) => {
  if (event.request.type === 'LaunchRequest') {
    context.succeed(generateResponse(buildSpeechletResponse('Hi, you’ve got Topcoder here, are you looking to report and fix a bug OR get a task done?', false)))
  } else {
    // It is a IntentRequest
    if (event.request.intent.name === 'BugReport') {
      context.succeed(generateResponse(buildSpeechletResponse('Great, we’re good at that. Please tell us about the bug now and we’ll create a Topcoder project automatically for you. Please go ahead…', false)))
    } else if (event.request.intent.name === 'CreateProject') {
      const token = process.env.TOPCODER_BEARER_TOKEN
      const hostname = process.env.TOPCODER_HOSTNAME
      const path = process.env.TOPCODER_PATH
      const port = process.env.TOPCODER_PORT
      const method = process.env.TOPCODER_METHOD

      const application = event.request.intent.slots.Application.value
      const problem = event.request.intent.slots.Problem.value

      const postData = {
        param: {
          'name': 'Bug Discovery',
          'description': application + ' ' + problem,
          'type': 'website'
        }
      }

      // An object of options to indicate where to post to
      const postOptions = {
        host: hostname,
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      }

      // Set up the request
      const postReq = http.request(postOptions, function (res) {
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
          console.log('Response: ' + res.statusCode)

          if (res.statusCode === 201) {
            context.succeed(generateResponse(buildSpeechletResponse('OK, your Topcoder project is created on our platform, as requested. A Topcoder copilot will pick up your work and contact you shortly. Goodbye', true)))
          } else if (res.statusCode === 403) {
            context.succeed(generateResponse(buildSpeechletResponse('Invalid authorization token. Please provide valid credentials', false)))
          } else {
            context.succeed(generateResponse(buildSpeechletResponse('There was a problem while saving your project, please try again ', false))
            )
          }
        })
      })

      postReq.on('error', function (e) {
        context.succeed(generateResponse(buildSpeechletResponse('The service is temporarily unavailable, please try later', false)))
      })

      // post the data
      postReq.write(JSON.stringify(postData))
      postReq.end()
    } else if (event.request.intent.name === 'AMAZON.StopIntent' || event.request.intent.name === 'AMAZON.CancelIntent') {
      context.succeed(generateResponse(buildSpeechletResponse('Have a nice day! If you need to submit a bug, please remember to start the Topcoder Bot again.', true)))
    } else if (event.request.intent.name === 'AMAZON.NavigateHomeIntent' || event.request.intent.name === 'AMAZON.FallbackIntent') {
      context.succeed(generateResponse(buildSpeechletResponse('Please tell us which kind of application you have and describe the bug. We’ll create a Topcoder project automatically for you.', false)))
    } else if (event.request.intent.name === 'AMAZON.HelpIntent') {
      context.succeed(generateResponse(buildSpeechletResponse('Please check the user guide or visit www.topcoder.com for more information', true)))
    }
  }
}
