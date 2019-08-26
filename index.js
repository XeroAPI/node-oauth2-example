
'use strict';

const express = require('express')
const session = require('express-session')
const request = require('request')
const { Issuer } = require('openid-client');

const config = require('./config.json')

const client_id = config.CLIENT_ID;
const client_secret = config.CLIENT_SECRET;
const redirectUrl = config.REDIRECT_URL
const scopes = config.SCOPES;

(async () => {
    var inMemoryToken;

    let app = express()

    app.set('port', (5000))
    app.use(express.static(__dirname + '/public'))
    app.use(session({
        secret: 'something crazy',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));

    const issuer = await Issuer.discover('https://identity.xero.com');  //The one URL which allows the app to discover all the other URLs for OAuth  

    const client = new issuer.Client({
        client_id: client_id,
        client_secret: client_secret
    }); 

    app.get('/', function (req, res) {
        // builds URL to send request to accessTokenUri with query params:
        //      response_type=code  (see below, using the code object's method .getUri -> oauth2.code.getUri() defines the requested grant type as a code grant type)
        //      client_id
        //      redirect_uri
        //      scopes
        //      state 
        // All of these parameters will be validated by the authorization server.
        let consentUrl = client.authorizationUrl({
            redirect_uri: redirectUrl,
            scope: scopes,
        }); 
        res.send(`Sign in and connect with Xero using OAuth2! <br><a href="${consentUrl}">Connect to Xero</a>`)
    })


    app.get('/callback', async function (req, res) {
        // If the user approves they will be redirected from the 
        // authorisation server back to the redirect URI with these query params:
        //     code - the authorization code
        //     state - the state parameter sent in the original request.

        try {
            client.CLOCK_TOLERANCE = 5; // to allow a 5 second skew, this helps prevent errors thrown by openid-client server clock validations
            Issuer.defaultHttpOptions = {timeout: 20000};
            //POST request to the authorization server with the following parameters:
            //     grant_type - 'authorization_code' 
            //     client_id
            //     client_secret
            //     redirect_uri
            //     code - the authorization code from the query string in req.url
            const token = await client.authorizationCallback(redirectUrl, req.query) 
            // The authorization server will respond with a JSON object containing:
            //     token_type  “Bearer”
            //     expires_in 
            //     id_token
            //     access_token
            //     refresh_token - can be used to acquire a new access token when the original expires
            inMemoryToken = token                   //this is an in memory object holding the actual tokens            
            let accessToken = token.access_token     //this is a JWT (JSON Web Token)
            req.session.accessToken = accessToken
            console.log('\nOAuth successful...\n\naccess token: \n' + accessToken + '\n')
            let idToken = token.id_token
            console.log('\id token: \n' + idToken + '\n')
            console.log('\nid token claims: \n' + JSON.stringify(token.claims, null, 2));
            let refreshToken = token.refresh_token
            console.log('\nrefresh token: \n' + refreshToken)
            req.session.save()

            //GET CONNECTED TENANTS

            var connectionsRequestOptions = {
                url: 'https://api.xero.com/connections',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                auth: {
                    'bearer': req.session.accessToken
                },
                timeout: 10000
            }

            //get list of authorized tenant connections
            request.get(connectionsRequestOptions, function (error, response, body) {
                if (error) {
                    console.log('error from conenctionsRequest: ' + error)
                }
                let data = JSON.parse(body)
                let tenant = data[0]    //grab the first connection 
                let tenantId = tenant['tenantId']
                req.session.xeroTenantId = tenantId
                console.log('\nRetrieving connections...\n\ntenantId: \n' + tenantId)
                req.session.save()
            })
        } catch (e) {
            console.log('ERROR: ' + e)
        } finally {
            res.redirect('/home')
        }

    })

    app.get('/home', function (req, res) {
        res.send(`<br><a href="/getOrganisation">Get Xero Organisation</a><br><br><a href="/getInvoices">Get Xero Invoices</a><br><br><a href="/refreshToken">Refresh Xero Access Token</a>`)
    })

    app.get('/getOrganisation', async function (req, res) {
        var organisationRequestOptions = {
            url: 'https://api.xero.com/api.xro/2.0/organisation',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': req.session.xeroTenantId
            },
            auth: {
                'bearer': req.session.accessToken
            }
        }

        request.get(organisationRequestOptions, function (error, response, body) {
            if (error) {
                console.log('error from organisationRequest: ' + error)
            }
            console.log('body: ' + body)
            res.redirect('/home')
        })
    })

    app.get('/getInvoices', async function (req, res) {
        var invoicesRequestOptions = {
            url: 'https://api.xero.com/api.xro/2.0/invoices',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'xero-tenant-id': req.session.xeroTenantId
            },
            auth: {
                'bearer': req.session.accessToken
            }
        }

        request.get(invoicesRequestOptions, function (error, response, body) {
            if (error) {
                console.log('error from invoicesRequest: ' + error)
            }

            console.log('body: ' + body)
            res.redirect('/home')
        })
    })

    app.get('/refreshToken', async function (req, res) {
        try {
            client.CLOCK_TOLERANCE = 5; // to allow a 5 second skew
            Issuer.defaultHttpOptions = {timeout: 20000};
            let newToken = await client.refresh(inMemoryToken.refresh_token);       //use in memory client object to refresh token
            req.session.accessToken = newToken.access_token      //this makes request to accessTokenUri
            req.session.save()                                  //with header -> grant_type: refresh_token
            inMemoryToken = newToken
            console.log('\nRefresh successful...\n\nnew access token: \n' + newToken.access_token + '\n')
            console.log('new refresh token: \n' + newToken.refresh_token)
        } catch (e) {
            console.log('refreshToken error: ' + e)
        } finally {
            res.redirect('/home')
        }
    })

    app.listen(app.get('port'), function () {
        console.log("Your Xero OAuth2 app is running at http://localhost:" + app.get('port'))
    });
})();