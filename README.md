An Express server that does the following:

Expose an endpoint (/login/:username/:password) that takes in username and password and authenticates user. This endpoint should return a JWT for future use. Have a fake user in the db and send me the details so we can test.
For every authenticated request, using the above JWT as a Bearer token, expose the following endpoints.
/parse/:url - This endpoint returns a parsed version of the html content of the url, and returns back in the following format. The idea is to create a response that can then be shown to the user as a card to the user for what the url does. This is also known as site previews / link unfurling.
Response: { “title”: “”, “favicon”: “”, “large-image”: “”, “snippet”: “” }
/translate/:url - This endpoint should use google translate or any other api to translate the contents of the page, and return back html (not json).
/upload - Endpoint that takes in a file as a form-data param (I’ll be using postman) and uploads it to storage for access later. Returns an identifier for later retrieval.
/download/:identifier - Streams the file corresponding to the identifier to the client requesting it.
Please host your server in google cloud, app engine standard environment. Also, upload the code to bitbucket / github and send over a link to review.
