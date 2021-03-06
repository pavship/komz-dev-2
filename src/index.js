import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.min.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

import ApolloClient from 'apollo-boost'
import { ApolloProvider } from 'react-apollo'

import { AUTH_TOKEN } from './constants'

// @ts-ignore
const client = new ApolloClient({
	uri: 'http://localhost:4000',
	// uri: 'https://now-advanced.now.sh',
	// uri: 'https://env-1542080.mircloud.ru',
	request: (operation) => {
		const token = localStorage.getItem(AUTH_TOKEN)
		operation.setContext({
			headers: {
				Authorization: token ? `Bearer ${token}` : '',
			}
		})
	}
})

const token = localStorage.getItem(AUTH_TOKEN)

ReactDOM.render(
	<ApolloProvider client={client}>
		<App
      token={token}
      client={client}
    />
	</ApolloProvider>
, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register()  below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
