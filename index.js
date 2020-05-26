// arguments and env
var pguser = process.env['PGUSER'] || ''
var pgpassword = process.env['PGPASSWORD'] || ''
var pgdatabase = process.env['PGDATABASE'] || ''
var pghost = process.env['PGHOST'] ||  ''
var pgport = process.env['PGPORT'] || 5432
var testsql = process.env['TESTSQL'] || 'SELECT NOW()'

console.log ('pguser value:', pguser)
console.log ('pgpassword value:', pgpassword)
console.log ('pgdatabase value:', pgdatabase)
console.log ('pghost value:', pghost)
console.log ('pgport value:', pgport)
console.log ('testsql value:', testsql)


var am = require('appmetrics');
am.enable('postgresql')

const fs = require('fs')
const { Client } = require('pg')
const http = require('http');

const requestHandler = (request, response) => {  
    var client = new Client({
        user: pguser,
        host: pghost,
        database: pgdatabase,
        password: pgpassword,
        port: pgport,
        ssl:{
            ca: fs.readFileSync('BaltimoreCyberTrustRoot.crt.pem').toString()
        }
    })
    
    client.connect((connectErr) => {
        client.query(testsql, (err, result) => {
            // console.log(err, result)
            if (err === null) {
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.end(result.rowCount.toString());
                client.end()
            } else {
                response.writeHead(400, { 'Content-Type': 'text/plain' });
                response.end(err.toString());
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