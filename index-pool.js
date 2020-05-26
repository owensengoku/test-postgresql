// arguments and env
var pguser = process.env['PGUSER'] || ''
var pgpassword = process.env['PGPASSWORD'] || ''
var pgdatabase = process.env['PGDATABASE'] || ''
var pghost = process.env['PGHOST'] ||  ''
var pgport = process.env['PGPORT'] || 5432
var testsql = process.env['TESTSQL'] || 'SELECT NOW()'
var pgpoolmax =  process.env['PGPOOLMAX'] || 10
var pgpoolidle = process.env['PGPOOLIDLE'] || 30000 //= 30 secs (Unit is Millisecond)
var pgpooltimout = process.env['PGPOOLTIMEOUT'] || 30000 //= 30 secs (Unit is Millisecond)
var pgpoolmaxuses = process.env['PGPOOLMaxUses'] || 7500 //= 30 secs (Unit is Millisecond)

console.log ('pguser value:', pguser)
console.log ('pgpassword value:', pgpassword)
console.log ('pgdatabase value:', pgdatabase)
console.log ('pghost value:', pghost)
console.log ('pgport value:', pgport)
console.log ('testsql value:', testsql)
console.log ('pgpoolmax value:', pgpoolmax)
console.log ('pgpoolidle value:', pgpoolidle)
console.log ('pgpooltimout value:', pgpooltimout)
console.log ('pgpoolmaxuses value:', pgpoolmaxuses)

var am = require('appmetrics');
am.enable('postgresql')

const fs = require('fs')
const { Pool } = require('pg')
const pool = new Pool({
    user: pguser,
    host: pghost,
    database: pgdatabase,
    password: pgpassword,
    port: pgport,
    ssl:{
        ca: fs.readFileSync('BaltimoreCyberTrustRoot.crt.pem').toString()
    },
    max: pgpoolmax, // set pool max size to 20
    idleTimeoutMillis: pgpoolidle, // close idle clients after 30 second
    connectionTimeoutMillis: pgpooltimout, // return an error after 30 second if connection could not be established
    maxUses: pgpoolmaxuses, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

const http = require('http');

const requestHandler = (request, response) => {  
    pool.connect((err, client, done) => {
        if (err) throw err
        client.query(testsql, (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
                response.writeHead(400, { 'Content-Type': 'text/plain' });
                response.end(err.toString());
            } else {
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.end(res.rowCount.toString());
            }
        })
    })
}
   
const s = http.createServer(requestHandler);
var dash = require('appmetrics-dash').monitor(
    {
        server: s,
        appmetrics : am
    }
);
module.exports = s.listen(3000, () => console.log("Node.js HTTP server listening on port 3000"));