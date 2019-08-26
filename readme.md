# readme

This is a simple example of accessing Xero's API via OAuth2 in node with a generic OpenId Connect (OIDC) client and http request client.

It demonstrates how to:
* retrieve a user authorized API access token,
* retrieve an ID token with the user's identity details
* fetch the Xero Organisations which the user authorized access to
* make a request to the Xero API using an Organisation ID as the tenantId required in the header for API calls made with OAuth 2 tokens,
* use the refresh token to collect a new active access token from the API.  

## Setup

**Install Node Modules**

In the project directory run

```bash
npm install
```

**Setup config.json**


Configure your OAuth 2 credentials in My Apps at developer.xero.com. In the credentials page set your callback URL to the callback URL you would like to test with (ex: localhost:3000/callback) and immediately save the generated clientId and client secret as the secret will only be viewable this one time upon generation. If you need to generate a new secret you can. 

Paste your clientId and client secret into the config.json file with the matching callback URL in the 'REDIRCT_URL' field.

_note: I wouldn't recommend using a config.json for storing sensitive credentials in a production app. In production as an industry best practice its better to use a .env file, this is just a proof of concept example._

**Scopes**

You can use the default scopes included in this example config.json, but to expirement with the full list of scopes and what they do please see this list - https://docs.google.com/spreadsheets/d/15yo_HcpmtglKHmqHH20YbKpcECaf1th3EUeGNl5oINk/edit?usp=sharing.

some explanations: 

"openid profile email" - access openid and user info (idtoken)

"offline_access" - receive a refresh token to enable "partner app" style refresh


## Run

```bash
npm start
```

## Stop

press control + c in bash to stop express server
