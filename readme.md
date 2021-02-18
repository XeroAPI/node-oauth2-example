# Node OAuth2 Example

NOTE * This app demonstrates how to make raw API calls with the use of Xero's node SDK.

If you are looking for xero-node sample app & example SDK API usage please visit: https://github.com/XeroAPI/xero-node-oauth2-app.

This App simply shows how to connect to Xero's api without an SDK in javascript

---------


This is a simple example of accessing Xero's API via OAuth2 in node with a generic OpenId Connect (OIDC) client and http request client.

It demonstrates how to:
* retrieve a user authorized API access token,
* retrieve an ID token with the user's identity details
* fetch the Xero Organisations which the user authorized access to
* make a request to the Xero API using an Organisation ID as the tenantId required in the header for API calls made with OAuth 2 tokens
* use the refresh token to collect a new active access token from the API.  

## Setup

**Install Node Modules**

In the project directory run

```bash
npm install
```

**Setup config.json**


Configure your OAuth 2 credentials in My Apps at developer.xero.com. In the credentials page set your callback URL to the callback URL you would like to test with (ex: 'http://localhost:5000/callback') and immediately save the generated clientId and client secret as the secret will only be viewable this one time upon generation. If you need to generate a new secret you can. 

Paste your clientId and client secret into the config.json file with the matching callback URL in the 'REDIRCT_URL' field.

_note: I wouldn't recommend using a config.json for storing sensitive credentials in a production app. In production as an industry best practice its better to use a .env file, this is just a proof of concept example._

**Scopes**

You can use the default scopes included in this example config.json, but to expirement with the full list of scopes and what they do please see [this list](https://developer.xero.com/documentation/oauth2/scopes).

some explanations: 

"openid profile email" - access openid and user info (idtoken)

"offline_access" - receive a refresh token to enable "partner app" style refresh


## Run

```bash
npm start
```
From the app root page click through the OAuth flow and return to the console to see the results from the API printed. The accessToken and idToken are encoded JSON web tokens (JWT), so the idToken 'claims' are decoded and printed as well to show the details inside. Once the OAuth flow is complete try getting API data back or refreshing the token with the buttons on the /home page. 

## Stop

press control + c in bash to stop express server
