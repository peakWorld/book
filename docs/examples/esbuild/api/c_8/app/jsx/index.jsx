import React from 'react'
import Server from 'react-dom/server'
import Bar from './bar'

let Greet = () => <h1><Bar /></h1>
Server.renderToString(<Greet />)